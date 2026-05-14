import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import MermaidRenderer from '../components/MermaidRenderer';
import { Link } from 'react-router-dom';

// ─── Provider icon map ───────────────────────────────────────────────────────
const PROVIDER_META = {
    Gemini: { icon: '✦', color: '#4f8ef7', bg: 'rgba(79,142,247,0.12)' },
    Groq:   { icon: '⚡', color: '#a259ff', bg: 'rgba(162,89,255,0.12)' },
    Cohere: { icon: '◈', color: '#19c37d', bg: 'rgba(25,195,125,0.12)' },
};

// ─── Loading Overlay (shown during initial generation) ────────────────────────
function LoadingOverlay({ statusEvents }) {
    const latest = statusEvents[statusEvents.length - 1] || {};
    const providerMeta = PROVIDER_META[latest.provider] || {};
    const timeline = statusEvents.map((e, i) => ({ ...e, key: i }));

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(255,255,255,0.55)',
            backdropFilter: 'blur(18px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'inherit',
        }}>
            <div style={{
                background: 'rgba(255,255,255,0.80)',
                border: '1px solid rgba(255,255,255,0.60)',
                borderRadius: '2rem',
                padding: '2.5rem 3rem',
                minWidth: '380px',
                maxWidth: '480px',
                boxShadow: '0 24px 64px rgba(92,91,126,0.14)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem',
            }}>
                {/* Animated orb */}
                <div style={{ position: 'relative', width: 80, height: 80 }}>
                    <svg style={{ position: 'absolute', inset: 0, animation: 'spin 1.4s linear infinite' }}
                        width="80" height="80" viewBox="0 0 80 80">
                        <circle cx="40" cy="40" r="35" fill="none"
                            stroke={providerMeta.color || '#a259ff'}
                            strokeWidth="3.5" strokeDasharray="90 120" strokeLinecap="round" />
                    </svg>
                    <div style={{
                        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: '2rem',
                        background: providerMeta.bg || 'rgba(162,89,255,0.12)',
                        borderRadius: '50%', margin: '12px',
                    }}>
                        {providerMeta.icon || '✦'}
                    </div>
                </div>

                {/* Provider badge */}
                {latest.provider && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        background: providerMeta.bg, color: providerMeta.color,
                        borderRadius: '999px', padding: '0.3rem 1rem',
                        fontWeight: 600, fontSize: '0.85rem',
                        border: `1px solid ${providerMeta.color}33`,
                    }}>
                        <span>{providerMeta.icon}</span>
                        <span>{latest.provider}</span>
                        {latest.model && <span style={{ opacity: 0.6, fontWeight: 400 }}>· {latest.model}</span>}
                    </div>
                )}

                <p style={{ margin: 0, textAlign: 'center', fontSize: '1rem', fontWeight: 500, color: '#3a3a50', lineHeight: 1.5 }}>
                    {latest.message || 'Initializing…'}
                </p>

                {/* Timeline */}
                {timeline.length > 0 && (
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {timeline.map((ev) => {
                            const meta = PROVIDER_META[ev.provider] || {};
                            const isLast = ev.key === timeline[timeline.length - 1].key;
                            return (
                                <div key={ev.key} style={{
                                    display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                                    opacity: isLast ? 1 : 0.45, transition: 'opacity 0.3s',
                                }}>
                                    <div style={{
                                        width: 8, height: 8, borderRadius: '50%', marginTop: 5, flexShrink: 0,
                                        background: ev.type === 'success' ? '#19c37d'
                                            : ev.type === 'fallback' ? '#f59e0b'
                                            : ev.type === 'error' ? '#ef4444'
                                            : (meta.color || '#a259ff'),
                                    }} />
                                    <span style={{ fontSize: '0.78rem', color: '#5c5c7b', lineHeight: 1.4 }}>
                                        {ev.message}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}

                <p style={{ margin: 0, fontSize: '0.72rem', color: '#9090b0' }}>
                    Large repos may take up to 2 minutes
                </p>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Generator() {
    const [url, setUrl]               = useState('');
    const [readme, setReadme]         = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isRefining, setIsRefining] = useState(false);   // separate flag for refinement
    const [chatInput, setChatInput]   = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    const [error, setError]           = useState('');
    const [statusEvents, setStatusEvents] = useState([]);
    const [exportMsg, setExportMsg]   = useState('');      // brief "Saved!" feedback

    const esRef = useRef(null);

    // ── Initial generation via SSE ────────────────────────────────────────────
    const generateReadme = () => {
        if (!url) {
            setError('Please enter a GitHub repository URL');
            return;
        }
        setError('');
        setIsGenerating(true);
        setStatusEvents([]);

        // Close any existing SSE connection
        if (esRef.current) esRef.current.close();

        const params = new URLSearchParams({ repoUrl: url });
        const es = new EventSource(`http://localhost:5000/api/generate-stream?${params}`);
        esRef.current = es;

        es.onmessage = (e) => {
            const event = JSON.parse(e.data);

            if (event.type === 'complete') {
                const newReadme = event.data;
                setReadme(newReadme);
                setChatHistory([{ role: 'assistant', content: newReadme }]);
                setIsGenerating(false);
                setStatusEvents([]);
                es.close();

            } else if (event.type === 'error') {
                setError(event.message || 'An error occurred while generating the README.');
                setIsGenerating(false);
                setStatusEvents([]);
                es.close();

            } else {
                setStatusEvents(prev => [...prev, event]);
            }
        };

        es.onerror = () => {
            // onerror fires on natural close too — only set error if still generating
            setIsGenerating(prev => {
                if (prev) setError('Connection to server lost. Please try again.');
                return false;
            });
            setStatusEvents([]);
            es.close();
        };
    };

    // ── Refinement via POST (avoids URL-length limit with large chatHistory) ──
    const refineReadme = async () => {
        if (!chatInput.trim() || !readme) return;

        const userMessage = chatInput.trim();
        setError('');
        setIsRefining(true);

        // Optimistically add the user message to chat
        setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);
        setChatInput('');

        try {
            const res = await fetch('http://localhost:5000/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    repoUrl: url,
                    userPrompt: userMessage,
                    chatHistory: chatHistory,
                }),
            });

            const json = await res.json();

            if (!res.ok || !json.success) {
                throw new Error(json.error || 'Refinement failed');
            }

            const newReadme = json.data;
            setReadme(newReadme);
            setChatHistory(prev => [...prev, { role: 'assistant', content: newReadme }]);

        } catch (err) {
            setError(err.message || 'Failed to refine README. Please try again.');
            // Remove the optimistically added user message on failure
            setChatHistory(prev => prev.slice(0, -1));
            setChatInput(userMessage); // restore input
        } finally {
            setIsRefining(false);
        }
    };

    // ── Export / Download ─────────────────────────────────────────────────────
    const exportReadme = () => {
        if (!readme) return;
        const blob = new Blob([readme], { type: 'text/markdown;charset=utf-8' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = 'README.md';
        a.click();
        URL.revokeObjectURL(url);

        setExportMsg('Downloaded!');
        setTimeout(() => setExportMsg(''), 2500);
    };

    const isBusy = isGenerating || isRefining;

    return (
        <div className="h-screen w-screen overflow-hidden flex relative bg-transparent text-on-surface">
            {/* Full-screen loading overlay — only during initial generation */}
            {isGenerating && <LoadingOverlay statusEvents={statusEvents} />}

            {/* TopAppBar */}
            <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-gutter py-unit h-16 max-w-[1200px] mx-auto bg-white/60 dark:bg-surface-container-low/60 backdrop-blur-xl rounded-full mt-4 mx-container-padding border border-white/20 dark:border-outline-variant/20 shadow-sm shadow-primary/5">
                <div className="flex items-center gap-8">
                    <h1 className="font-headline-md text-headline-md font-bold text-primary">ReadmeAI</h1>
                </div>
                <div className="flex items-center gap-4">
                    <Link to="/history" className="text-on-surface-variant hover:text-primary transition-colors font-label-sm px-4 py-2 bg-white/50 rounded-full border border-white/40">
                        View History
                    </Link>
                    <div className="flex items-center gap-2">
                        <button className="text-on-surface-variant hover:text-primary hover:scale-105 transition-transform duration-200">
                            <span className="material-symbols-outlined">account_circle</span>
                        </button>
                        <button className="text-on-surface-variant hover:text-primary hover:scale-105 transition-transform duration-200">
                            <span className="material-symbols-outlined">settings</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Left Section — Main Workspace */}
            <main className="w-[70%] h-full pt-28 pb-8 pl-8 pr-12 flex flex-col gap-6 relative z-10">
                {/* URL Bar */}
                <div className="flex items-center gap-4 bg-white/60 backdrop-blur-xl border border-white/40 p-2 rounded-full shadow-[0_4px_24px_rgba(92,91,126,0.05)] transition-all">
                    <div className="pl-4 text-on-surface-variant">
                        <span className="material-symbols-outlined">code</span>
                    </div>
                    <input
                        className="flex-1 bg-transparent border-none focus:ring-0 text-body-md font-body-md text-on-surface placeholder:text-on-surface-variant/50 outline-none"
                        placeholder="https://github.com/username/repository..."
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !isBusy && generateReadme()}
                    />
                    <button
                        onClick={generateReadme}
                        disabled={isBusy}
                        className="bg-gradient-to-r from-primary-container to-white text-primary font-label-sm text-label-sm px-6 py-3 rounded-full hover:scale-[1.02] transition-all flex items-center gap-2 border border-white/50 shadow-sm shadow-primary/10 disabled:opacity-70 disabled:scale-100"
                    >
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                            {isGenerating ? 'hourglass_empty' : 'auto_fix_high'}
                        </span>
                        {isGenerating ? 'Generating…' : 'Generate README'}
                    </button>
                </div>

                {/* Main Content Area */}
                <section className="flex-1 bg-white/60 backdrop-blur-xl border border-white/40 rounded-[2rem] shadow-[0_8px_32px_rgba(92,91,126,0.04)] flex flex-col text-left p-12 overflow-y-auto custom-scrollbar">
                    {error && (
                        <div className="bg-error-container/50 border border-error/30 text-error p-4 rounded-xl mb-6 font-body-md flex items-start gap-3">
                            <span className="material-symbols-outlined text-[18px] mt-0.5 flex-shrink-0">error</span>
                            <span>{error}</span>
                        </div>
                    )}

                    {!readme && !isGenerating && !error ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center">
                            <div className="w-24 h-24 mb-6 rounded-full bg-primary-container/30 flex items-center justify-center border border-white/60">
                                <span className="material-symbols-outlined text-[48px] text-primary/40" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
                            </div>
                            <h2 className="font-headline-md text-headline-md text-on-surface mb-2">Ready to Document</h2>
                            <p className="font-body-md text-body-md text-on-surface-variant max-w-md">Enter a repository URL in the bar above to generate a smart, comprehensive README using AI.</p>
                        </div>
                    ) : (
                        <div className="prose prose-slate max-w-4xl mx-auto font-body-md text-on-surface">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    code({ node, inline, className, children, ...props }) {
                                        const match = /language-(\w+)/.exec(className || '')
                                        if (!inline && match && match[1] === 'mermaid') {
                                            return <MermaidRenderer chart={String(children).replace(/\n$/, '')} />
                                        }
                                        return <code className={className} {...props}>{children}</code>
                                    }
                                }}
                            >
                                {readme}
                            </ReactMarkdown>
                        </div>
                    )}
                </section>
            </main>

            {/* Right Section — Sidebar */}
            <aside className="flex flex-col p-gutter border-l border-white/20 bg-white/60 dark:bg-surface-container/60 backdrop-blur-xl h-full w-[30%] fixed right-0 top-0 shadow-none z-40 pt-28">
                {/* Header */}
                <div className="mb-8 px-2">
                    <h2 className="font-headline-md text-headline-md text-primary mb-1">AI Refinement</h2>
                    <p className="font-body-md text-body-md text-on-surface-variant text-sm">
                        {readme ? 'Refine your generated README.' : 'Drafting your README...'}
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-2 mb-6 bg-white/40 p-1 rounded-2xl border border-white/20">
                    <button className="flex-1 bg-white/60 shadow-sm text-primary p-3 rounded-xl flex flex-col items-center gap-1 transition-all border border-white/40">
                        <span className="material-symbols-outlined text-[20px]">auto_fix_high</span>
                        <span className="font-label-sm text-label-sm text-[11px]">Refine</span>
                    </button>
                    <Link to="/history" className="flex-1 text-on-surface-variant hover:bg-white/20 p-3 rounded-xl flex flex-col items-center gap-1 hover:backdrop-blur-2xl transition-all">
                        <span className="material-symbols-outlined text-[20px]">history</span>
                        <span className="font-label-sm text-label-sm text-[11px]">History</span>
                    </Link>
                    {/* Export button — downloads README.md */}
                    <button
                        onClick={exportReadme}
                        disabled={!readme}
                        title={readme ? 'Download README.md' : 'Generate a README first'}
                        className="flex-1 text-on-surface-variant hover:bg-white/20 p-3 rounded-xl flex flex-col items-center gap-1 hover:backdrop-blur-2xl transition-all disabled:opacity-40 disabled:cursor-not-allowed relative"
                    >
                        <span className="material-symbols-outlined text-[20px]">ios_share</span>
                        <span className="font-label-sm text-label-sm text-[11px]">
                            {exportMsg || 'Export'}
                        </span>
                        {/* Green flash on download */}
                        {exportMsg && (
                            <span className="absolute inset-0 rounded-xl bg-green-400/10 border border-green-400/30 pointer-events-none" />
                        )}
                    </button>
                </div>

                {/* Scrollable Chat History */}
                <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-6 custom-scrollbar mb-4">
                    {/* Welcome bubble */}
                    <div className="flex gap-3 max-w-[90%]">
                        <div className="w-8 h-8 rounded-full bg-white/80 border border-white/40 flex items-center justify-center flex-shrink-0">
                            <span className="material-symbols-outlined text-[18px] text-primary">robot_2</span>
                        </div>
                        <div className="bg-white/50 backdrop-blur-md border border-white/30 rounded-2xl rounded-tl-sm p-4 text-body-md font-body-md text-on-surface text-sm leading-relaxed shadow-sm">
                            Hi there! I'm ready to help you draft your README. Please enter a repository URL on the left to get started.
                        </div>
                    </div>

                    {/* Chat messages */}
                    {chatHistory.map((msg, idx) => (
                        <div key={idx} className={`flex gap-3 max-w-[90%] ${msg.role === 'user' ? 'self-end flex-row-reverse' : ''}`}>
                            {msg.role === 'user' ? (
                                <>
                                    <div className="w-8 h-8 rounded-full bg-primary-container border border-white/40 flex items-center justify-center flex-shrink-0">
                                        <span className="material-symbols-outlined text-[18px] text-on-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                                    </div>
                                    <div className="bg-primary-container/50 backdrop-blur-md border border-white/40 rounded-2xl rounded-tr-sm p-4 text-body-md font-body-md text-on-surface text-sm leading-relaxed shadow-sm">
                                        {msg.content}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="w-8 h-8 rounded-full bg-white/80 border border-white/40 flex items-center justify-center flex-shrink-0">
                                        <span className="material-symbols-outlined text-[18px] text-primary">robot_2</span>
                                    </div>
                                    <div className="bg-white/50 backdrop-blur-md border border-white/30 rounded-2xl rounded-tl-sm p-4 text-body-md font-body-md text-on-surface text-sm leading-relaxed shadow-sm">
                                        {idx === 0 ? 'README generated! You can now refine it below.' : 'Updated! Take a look at the changes on the left.'}
                                    </div>
                                </>
                            )}
                        </div>
                    ))}

                    {/* Typing indicator during refinement */}
                    {isRefining && (
                        <div className="flex gap-3 max-w-[90%]">
                            <div className="w-8 h-8 rounded-full bg-white/80 border border-white/40 flex items-center justify-center flex-shrink-0">
                                <span className="material-symbols-outlined text-[18px] text-primary animate-spin">progress_activity</span>
                            </div>
                            <div className="bg-white/50 backdrop-blur-md border border-white/30 rounded-2xl rounded-tl-sm p-4 text-body-md font-body-md text-on-surface-variant text-sm leading-relaxed shadow-sm italic flex items-center gap-2">
                                <span>Refining your README</span>
                                <span className="flex gap-1">
                                    <span style={{ animation: 'bounce 1s infinite 0ms' }}>·</span>
                                    <span style={{ animation: 'bounce 1s infinite 150ms' }}>·</span>
                                    <span style={{ animation: 'bounce 1s infinite 300ms' }}>·</span>
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Bottom Chat Input */}
                <div className="mt-auto bg-white/40 backdrop-blur-xl border border-white/50 rounded-[2rem] p-2 flex items-center gap-2 focus-within:bg-white/60 focus-within:border-primary/30 transition-all shadow-sm">
                    <input
                        className="flex-1 bg-transparent border-none focus:ring-0 text-body-md font-body-md text-on-surface text-sm placeholder:text-on-surface-variant/60 pl-3 outline-none"
                        placeholder={readme ? 'Ask for changes...' : 'Generate a README first...'}
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !isBusy && refineReadme()}
                        disabled={!readme || isBusy}
                    />
                    <button
                        onClick={refineReadme}
                        disabled={!readme || isBusy || !chatInput.trim()}
                        className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center hover:scale-105 transition-transform shadow-sm shadow-primary/20 disabled:opacity-50 disabled:scale-100"
                    >
                        <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                            {isRefining ? 'hourglass_empty' : 'send'}
                        </span>
                    </button>
                </div>

                <style>{`
                    @keyframes bounce {
                        0%, 100% { transform: translateY(0); opacity: 0.4; }
                        50%       { transform: translateY(-4px); opacity: 1; }
                    }
                `}</style>
            </aside>
        </div>
    );
}
