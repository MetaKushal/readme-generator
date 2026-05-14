import { callGemini } from './providers/gemini.js';
import { callGroq } from './providers/groq.js';
import { callCohere } from './providers/cohere.js';

const providers = [
    { name: 'Gemini', model: 'gemini-2.5-flash',      execute: callGemini },
    { name: 'Groq',   model: 'llama-3.1-8b-instant',  execute: callGroq   },
    { name: 'Cohere', model: 'command-r-plus-08-2024', execute: callCohere },
];

/**
 * Tries each provider in order, racing against a per-provider timeout.
 *
 * @param {string}   prompt       - The prompt to send to the AI.
 * @param {number}   timeoutMs    - Per-provider timeout in milliseconds.
 * @param {Function} onStatus     - Optional callback: (event) => void
 *                                  event shape: { type, provider, model, message }
 *                                  types: 'trying' | 'success' | 'fallback' | 'error'
 */
export async function generateContentWithFallback(prompt, timeoutMs = 20000, onStatus = null) {
    let lastError = null;

    const emit = (event) => {
        if (typeof onStatus === 'function') onStatus(event);
    };

    for (const provider of providers) {
        emit({ type: 'trying', provider: provider.name, model: provider.model, message: `Connecting to ${provider.name}…` });

        console.log(`[AI Router] Attempting generation with ${provider.name} (Timeout: ${timeoutMs / 1000}s)...`);

        try {
            const result = await Promise.race([
                provider.execute(prompt),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error(`Timeout after ${timeoutMs / 1000}s`)), timeoutMs)
                )
            ]);

            if (result) {
                emit({ type: 'success', provider: provider.name, model: provider.model, message: `Generated with ${provider.name}` });
                console.log(`[AI Router] Success using ${provider.name}!`);
                return result;
            }

        } catch (error) {
            console.warn(`[AI Router] ${provider.name} failed: ${error.message}. Switching to backup...`);
            emit({ type: 'fallback', provider: provider.name, model: provider.model, message: `${provider.name} unavailable — switching to next…` });
            lastError = error;
        }
    }

    emit({ type: 'error', message: 'All AI providers failed.' });
    console.error(`[AI Router] ALL providers failed. Last error:`, lastError);
    throw new Error("Unable to generate README. All AI services are currently unavailable.");
}