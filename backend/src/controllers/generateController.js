import { fetchRepoContext } from '../services/github/githubParser.js';
import { generateContentWithFallback } from '../services/ai/aiRouter.js';
import { buildReadmePrompt, buildRefinementPrompt } from '../services/ai/prompts.js';

/**
 * Calculates a generous per-provider timeout based on repo size.
 * Base: 30s + 100ms per file, capped at 2 minutes.
 */
function calcTimeout(fileCount) {
    return Math.min(120000, 30000 + (fileCount * 100));
}

/**
 * POST /api/generate
 *
 * Two modes:
 *  1. INITIAL  — repoUrl only           → fetches GitHub, builds full prompt
 *  2. REFINE   — repoUrl + userPrompt + chatHistory → NO GitHub call, uses existing README
 */
export async function handleGenerateReadme(req, res) {
    try {
        const { repoUrl, chatHistory = [], userPrompt } = req.body;

        if (!repoUrl) {
            return res.status(400).json({ success: false, error: "Repository URL is required" });
        }

        let prompt;
        let timeoutMs;

        const isRefinement = !!userPrompt && chatHistory.length > 0;

        if (isRefinement) {
            // ── Refinement: skip GitHub entirely ─────────────────────────────
            // The latest assistant message is the current README.
            const lastAssistant = [...chatHistory].reverse().find(m => m.role === 'assistant');
            const currentReadme = lastAssistant?.content || '';

            console.log('[Controller] Refinement request — skipping GitHub fetch.');
            prompt = buildRefinementPrompt(currentReadme, userPrompt);
            timeoutMs = 60000; // refinements are faster, 60s is plenty
        } else {
            // ── Initial generation: fetch repo from GitHub ────────────────────
            console.log('[Controller] Initial generation — fetching repo from GitHub.');
            const repoContext = await fetchRepoContext(repoUrl);
            const fileCount = repoContext.fileTree.length;
            timeoutMs = calcTimeout(fileCount);
            console.log(`[Controller] Repo has ${fileCount} files. Timeout: ${timeoutMs / 1000}s.`);
            prompt = buildReadmePrompt(repoContext);
        }

        const readmeContent = await generateContentWithFallback(prompt, timeoutMs);
        res.json({ success: true, data: readmeContent });

    } catch (error) {
        console.error("Generation Error:", error.message);
        res.status(500).json({ success: false, error: error.message || "Failed to generate README" });
    }
}

/**
 * GET /api/generate-stream?repoUrl=...
 * SSE endpoint — only used for INITIAL generation (streams provider status).
 * Refinements use the POST endpoint above.
 */
export async function handleGenerateReadmeStream(req, res) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    let closed = false;
    req.on('close', () => { closed = true; });

    const send = (data) => {
        if (closed || res.writableEnded) return;
        try {
            res.write(`data: ${JSON.stringify(data)}\n\n`);
        } catch (e) {
            console.warn('[Stream] Could not write to response:', e.message);
        }
    };

    try {
        const repoUrl = req.query.repoUrl;

        if (!repoUrl) {
            send({ type: 'error', message: 'Repository URL is required' });
            return res.end();
        }

        send({ type: 'status', message: 'Fetching repository data from GitHub…' });
        const repoContext = await fetchRepoContext(repoUrl);

        const fileCount = repoContext.fileTree.length;
        const dynamicTimeoutMs = calcTimeout(fileCount);

        console.log(`[Stream] Repo has ${fileCount} files. Per-provider timeout: ${dynamicTimeoutMs / 1000}s.`);
        send({ type: 'status', message: `Repository loaded (${fileCount} files). Building prompt…` });

        const prompt = buildReadmePrompt(repoContext);

        const readmeContent = await generateContentWithFallback(
            prompt,
            dynamicTimeoutMs,
            (event) => send(event)
        );

        send({ type: 'complete', data: readmeContent });

    } catch (error) {
        console.error('[Stream] Generation error:', error.message);
        send({ type: 'error', message: error.message || 'Failed to generate README' });
    } finally {
        if (!res.writableEnded) res.end();
    }
}