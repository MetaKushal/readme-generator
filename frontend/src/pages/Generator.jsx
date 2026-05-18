import React, { useState, useRef, useMemo, memo, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import MermaidRenderer from '../components/MermaidRenderer';
import { Link } from 'react-router-dom';
import { saveSession, loadSession, saveToHistory } from '../utils/storage';

const PROVIDER_META = {
    Gemini: { icon: '✦', color: '#4f8ef7', bg: 'rgba(79,142,247,0.12)' },
    Groq: { icon: '⚡', color: '#a259ff', bg: 'rgba(162,89,255,0.12)' },
    Cohere: { icon: '◈', color: '#19c37d', bg: 'rgba(25,195,125,0.12)' },
};

const Backdrop = memo(function Backdrop() {
    return <div className="overlay-backdrop" />;
});

const StatusCard = memo(function StatusCard({ statusEvents }) {
    const latest = statusEvents[statusEvents.length - 1] || {};
    const providerMeta = PROVIDER_META[latest.provider] || {};

    const badgeStyle = useMemo(() => ({
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        background: providerMeta.bg, color: providerMeta.color,
        borderRadius: '999px', padding: '0.3rem 1rem',
        fontWeight: 600, fontSize: '0.85rem',
        border: `1px solid ${(providerMeta.color || '#a259ff')}33`,
    }), [providerMeta.bg, providerMeta.color]);

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'inherit',
            pointerEvents: 'none',
        }}>
            <div className="bg-white dark:bg-gray-900 border border-white/70 dark:border-gray-800" style={{
                borderRadius: '2rem', padding: '2.5rem 3rem',
                minWidth: '380px', maxWidth: '480px',
                boxShadow: '0 24px 64px rgba(0,0,0,0.16)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem',
                pointerEvents: 'auto',
            }}>
                <div style={{ position: 'relative', width: 80, height: 80 }}>
                    <svg className="animate-spin-svg" style={{ position: 'absolute', inset: 0 }} width="80" height="80" viewBox="0 0 80 80">
                        <circle cx="40" cy="40" r="35" fill="none" stroke={providerMeta.color || '#a259ff'} strokeWidth="3.5" strokeDasharray="90 120" strokeLinecap="round" />
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

                {latest.provider && (
                    <div style={badgeStyle}>
                        <span>{providerMeta.icon}</span>
                        <span>{latest.provider}</span>
                        {latest.model && <span style={{ opacity: 0.6, fontWeight: 400 }}>· {latest.model}</span>}
                    </div>
                )}

                <p className="text-gray-800 dark:text-gray-200" style={{ margin: 0, textAlign: 'center', fontSize: '1rem', fontWeight: 500, lineHeight: 1.5 }}>
                    {latest.message || 'Initializing…'}
                </p>

                {statusEvents.length > 0 && (
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {statusEvents.map((ev, i) => {
                            const meta = PROVIDER_META[ev.provider] || {};
                            const isLast = i === statusEvents.length - 1;
                            return (
                                <div key={i} style={{
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
                                    <span className="text-gray-600 dark:text-gray-400" style={{ fontSize: '0.78rem', lineHeight: 1.4 }}>
                                        {ev.message}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
});

const LoadingOverlay = memo(function LoadingOverlay({ statusEvents }) {
    return (
        <>
            <Backdrop />
            <StatusCard statusEvents={statusEvents} />
        </>
    );
});

const MarkdownPreview = memo(function MarkdownPreview({ readme, isDark }) {
    return (
        <div className={`prose ${isDark ? 'prose-invert' : 'prose-slate'} max-w-4xl mx-auto font-body-md w-full`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    // FIX: Extract 'node' and 'inline' so they don't break the HTML <code> element
                    code(props) {
                        const { children, className, node, inline, ...rest } = props;
                        const match = /language-(\w+)/.exec(className || '');

                        if (match && match[1] === 'mermaid') {
                            return <MermaidRenderer chart={String(children).replace(/\n$/, '')} isDark={isDark} />;
                        }

                        // Pass ONLY valid HTML attributes (...rest) to the code tag
                        return <code className={className} {...rest}>{children}</code>;
                    }
                }}
            >
                {readme}
            </ReactMarkdown>
        </div>
    );
});

export default function Generator() {
    const saved = useMemo(() => loadSession(), []);
    const [isDark, setIsDark] = useState(() => {
        const stored = localStorage.getItem('theme');
        return stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches);
    });

    const [url, setUrl] = useState(saved?.url || '');
    const [readme, setReadme] = useState(saved?.readme || '');
    const [chatHistory, setChatHistory] = useState(saved?.chatHistory || []);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isRefining, setIsRefining] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const [error, setError] = useState('');
    const [statusEvents, setStatusEvents] = useState([]);
    const [exportMsg, setExportMsg] = useState('');

    const esRef = useRef(null);

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDark]);

    useEffect(() => {
        if (readme) {
            saveSession({ url, readme, chatHistory });
        }
    }, [url, readme, chatHistory]);

    const generateReadme = useCallback(() => {
        if (!url) { setError('Please enter a GitHub repository URL'); return; }
        setError('');
        setIsGenerating(true);
        setStatusEvents([]);
        if (esRef.current) esRef.current.close();

        const params = new URLSearchParams({ repoUrl: url });
        const es = new EventSource(`http://localhost:5000/api/generate-stream?${params}`);
        esRef.current = es;

        es.onmessage = (e) => {
            const event = JSON.parse(e.data);
            if (event.type === 'complete') {
                const newReadme = event.data;
                const newHistory = [{ role: 'assistant', content: newReadme }];
                setReadme(newReadme);
                setChatHistory(newHistory);
                setIsGenerating(false);
                setStatusEvents([]);
                es.close();
                saveSession({ url, readme: newReadme, chatHistory: newHistory });
                saveToHistory(url, newReadme);
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
            setIsGenerating(false);
            setStatusEvents([]);
            es.close();
        };
    }, [url]);

    const refineReadme = useCallback(async () => {
        if (!chatInput.trim() || !readme) return;
        const userMessage = chatInput.trim();
        setError('');
        setIsRefining(true);
        const optimisticHistory = [...chatHistory, { role: 'user', content: userMessage }];
        setChatHistory(optimisticHistory);
        setChatInput('');
        try {
            const res = await fetch('http://localhost:5000/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ repoUrl: url, userPrompt: userMessage, chatHistory }),
            });
            const json = await res.json();
            if (!res.ok || !json.success) throw new Error(json.error || 'Refinement failed');
            const newReadme = json.data;
            const newHistory = [...optimisticHistory, { role: 'assistant', content: newReadme }];
            setReadme(newReadme);
            setChatHistory(newHistory);
            saveSession({ url, readme: newReadme, chatHistory: newHistory });
            saveToHistory(url, newReadme);
        } catch (err) {
            setError(err.message || 'Failed to refine README. Please try again.');
            setChatHistory(prev => prev.slice(0, -1));
            setChatInput(userMessage);
        } finally {
            setIsRefining(false);
        }
    }, [chatInput, readme, chatHistory, url]);

    const exportReadme = useCallback(() => {
        if (!readme) return;
        const blob = new Blob([readme], { type: 'text/markdown;charset=utf-8' });
        const link = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = link; a.download = 'README.md'; a.click();
        URL.revokeObjectURL(link);
        setExportMsg('Downloaded!');
        setTimeout(() => setExportMsg(''), 2500);
    }, [readme]);

    const clearAll = useCallback(() => {
        setUrl('');
        setReadme('');
        setChatHistory([]);
        setError('');
        setStatusEvents([]);
        sessionStorage.removeItem('readmeai_session');
    }, []);


    const isBusy = isGenerating || isRefining;

    return (
        <div className="h-screen w-screen overflow-hidden flex relative bg-transparent text-on-surface transition-colors duration-300">
            {isGenerating && <LoadingOverlay statusEvents={statusEvents} />}

            <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-gutter py-unit h-16 max-w-[1200px] mx-auto bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-full mt-4 border border-white/20 dark:border-gray-800 shadow-sm shadow-primary/5 transition-colors">
                <div className="flex items-center gap-8">
                    <h1 className="font-headline-md text-headline-md font-bold text-primary dark:text-blue-400">ReadmeAI</h1>
                </div>
                <div className="flex items-center gap-4">
                    <Link to="/history" className="text-on-surface-variant dark:text-gray-400 hover:text-primary dark:hover:text-blue-400 transition-colors font-label-sm px-4 py-2 bg-white/50 dark:bg-gray-800/50 rounded-full border border-white/40 dark:border-gray-700">
                        View History
                    </Link>
                    <button
                        onClick={() => setIsDark(!isDark)}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-on-surface-variant dark:text-gray-400"
                    >
                        <span className="material-symbols-outlined">{isDark ? 'light_mode' : 'dark_mode'}</span>
                    </button>
                    <div className="flex items-center gap-2">
                        <button className="text-on-surface-variant dark:text-gray-400 hover:text-primary dark:hover:text-blue-400 transition-transform duration-200 hover:scale-105">
                            <span className="material-symbols-outlined">account_circle</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="w-[70%] h-full pt-28 pb-8 pl-8 pr-12 flex flex-col gap-6 relative z-10">
                <div className="flex items-center gap-4 bg-white/70 dark:bg-gray-900/70 border border-white/40 dark:border-gray-800 p-2 rounded-full shadow-[0_4px_24px_rgba(0,0,0,0.05)] transition-colors">
                    <div className="pl-4 text-on-surface-variant dark:text-gray-500">
                        <span className="material-symbols-outlined">code</span>
                    </div>
                    <input
                        className="flex-1 bg-transparent border-none focus:ring-0 text-body-md font-body-md text-on-surface dark:text-gray-200 placeholder:text-on-surface-variant/50 outline-none"
                        placeholder="https://github.com/username/repository..."
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !isBusy && generateReadme()}
                    />
                    <button
                        onClick={generateReadme}
                        disabled={isBusy}
                        className="bg-primary dark:bg-blue-600 text-white font-label-sm text-label-sm px-6 py-3 rounded-full hover:scale-[1.02] transition-transform flex items-center gap-2 shadow-sm disabled:opacity-70 disabled:scale-100"
                    >
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                            {isGenerating ? 'hourglass_empty' : 'auto_fix_high'}
                        </span>
                        {isGenerating ? 'Generating…' : 'Generate'}
                    </button>
                </div>

                <section className="flex-1 min-h-0 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-white/40 dark:border-gray-800 rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.04)] flex flex-col text-left p-12 overflow-y-auto custom-scrollbar readme-scroll-container transition-colors">
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-4 rounded-xl mb-6 font-body-md flex items-start gap-3">
                            <span className="material-symbols-outlined text-[18px] mt-0.5 flex-shrink-0">error</span>
                            <span>{error}</span>
                        </div>
                    )}

                    {!readme && !isGenerating && !error ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center">
                            <div className="w-24 h-24 mb-6 rounded-full bg-primary-container/30 dark:bg-blue-900/20 flex items-center justify-center border border-white/60 dark:border-gray-800">
                                <span className="material-symbols-outlined text-[48px] text-primary/40 dark:text-blue-400/40" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
                            </div>
                            <h2 className="font-headline-md text-headline-md text-on-surface dark:text-gray-100 mb-2">Ready to Document</h2>
                            <p className="font-body-md text-body-md text-on-surface-variant dark:text-gray-400 max-w-md">Enter a repository URL above to generate a professional README.</p>
                        </div>
                    ) : (
                        <MarkdownPreview readme={readme} isDark={isDark} />
                    )}
                </section>
            </main>

            <aside className="flex flex-col p-gutter border-l border-white/20 dark:border-gray-800 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl h-full w-[30%] fixed right-0 top-0 z-40 pt-28 transition-colors">
                <div className="mb-8 px-2">
                    <h2 className="font-headline-md text-headline-md text-primary dark:text-blue-400 mb-1">AI Refinement</h2>
                    <p className="font-body-md text-body-md text-on-surface-variant dark:text-gray-400 text-sm">
                        {readme ? 'Refine your README.' : 'Generate a README to start chatting.'}
                    </p>
                </div>

                <div className="flex items-center gap-2 mb-6 bg-white/40 dark:bg-gray-800/40 p-1 rounded-2xl border border-white/20 dark:border-gray-700">
                    <button className="flex-1 bg-white/60 dark:bg-gray-700 shadow-sm text-primary dark:text-blue-400 p-3 rounded-xl flex flex-col items-center gap-1 border border-white/40 dark:border-gray-600">
                        <span className="material-symbols-outlined text-[20px]">auto_fix_high</span>
                        <span className="font-label-sm text-label-sm text-[11px]">Refine</span>
                    </button>
                    <Link to="/history" className="flex-1 text-on-surface-variant dark:text-gray-400 hover:bg-white/20 dark:hover:bg-gray-800 p-3 rounded-xl flex flex-col items-center gap-1 transition-colors">
                        <span className="material-symbols-outlined text-[20px]">history</span>
                        <span className="font-label-sm text-label-sm text-[11px]">History</span>
                    </Link>
                    <button
                        onClick={exportReadme}
                        disabled={!readme}
                        className="flex-1 text-on-surface-variant dark:text-gray-400 hover:bg-white/20 dark:hover:bg-gray-800 p-3 rounded-xl flex flex-col items-center gap-1 transition-colors disabled:opacity-40"
                    >
                        <span className="material-symbols-outlined text-[20px]">ios_share</span>
                        <span className="font-label-sm text-label-sm text-[11px]">{exportMsg || 'Export'}</span>
                    </button>
                    <button
                        onClick={clearAll}
                        disabled={!readme && !url && chatHistory.length === 0}
                        className="flex-1 text-on-surface-variant dark:text-gray-400 hover:bg-red-500/10 hover:text-red-500 p-3 rounded-xl flex flex-col items-center gap-1 transition-colors disabled:opacity-40"
                    >
                        <span className="material-symbols-outlined text-[20px]">delete_sweep</span>
                        <span className="font-label-sm text-label-sm text-[11px]">Clear</span>
                    </button>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto pr-2 flex flex-col gap-6 custom-scrollbar mb-4">
                    <div className="flex gap-3 max-w-[90%]">
                        <div className="w-8 h-8 rounded-full bg-white/80 dark:bg-gray-800 border border-white/40 dark:border-gray-700 flex items-center justify-center flex-shrink-0">
                            <span className="material-symbols-outlined text-[18px] text-primary dark:text-blue-400">robot_2</span>
                        </div>
                        <div className="bg-white/60 dark:bg-gray-800 border border-white/30 dark:border-gray-700 rounded-2xl rounded-tl-sm p-4 text-sm leading-relaxed shadow-sm text-on-surface dark:text-gray-200">
                            {readme ? 'README loaded! How can I help refine it?' : 'Enter a repository URL on the left to get started.'}
                        </div>
                    </div>

                    {chatHistory.map((msg, idx) => (
                        <div key={idx} className={`flex gap-3 max-w-[90%] ${msg.role === 'user' ? 'self-end flex-row-reverse' : ''}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border border-white/40 dark:border-gray-700 ${msg.role === 'user' ? 'bg-primary dark:bg-blue-600' : 'bg-white/80 dark:bg-gray-800'}`}>
                                <span className={`material-symbols-outlined text-[18px] ${msg.role === 'user' ? 'text-white' : 'text-primary dark:text-blue-400'}`}>
                                    {msg.role === 'user' ? 'person' : 'robot_2'}
                                </span>
                            </div>
                            <div className={`rounded-2xl p-4 text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-primary/10 dark:bg-blue-900/30 border-primary/20 dark:border-blue-800/50 rounded-tr-sm' : 'bg-white/60 dark:bg-gray-800 border-white/30 dark:border-gray-700 rounded-tl-sm'} text-on-surface dark:text-gray-200`}>
                                {msg.role === 'assistant' ? (
                                    idx === 0 ? (
                                        <div className="flex flex-col gap-1 text-left">
                                            <span className="font-semibold text-primary dark:text-blue-400">README generated!</span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">The initial draft is ready in the preview panel.</span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-1 text-left">
                                            <span className="font-semibold text-primary dark:text-blue-400">README updated!</span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">Applied changes based on: "{chatHistory[idx - 1]?.content || 'your request'}"</span>
                                        </div>
                                    )
                                ) : (
                                    msg.content
                                )}
                            </div>
                        </div>
                    ))}
                    {isRefining && (
                        <div className="flex gap-3 max-w-[90%]">
                            <div className="w-8 h-8 rounded-full bg-white/80 dark:bg-gray-800 border border-white/40 flex items-center justify-center flex-shrink-0">
                                <span className="material-symbols-outlined text-[18px] text-primary animate-spin">progress_activity</span>
                            </div>
                            <div className="bg-white/60 dark:bg-gray-800 rounded-2xl rounded-tl-sm p-4 text-sm italic flex items-center gap-2 text-gray-500">
                                Refining...
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-auto bg-white/50 dark:bg-gray-800/50 border border-white/50 dark:border-gray-700 rounded-[2rem] p-2 flex items-center gap-2 focus-within:bg-white/70 dark:focus-within:bg-gray-800 focus-within:border-primary transition-colors shadow-sm">
                    <input
                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm dark:text-gray-200 placeholder:text-gray-400 pl-3 outline-none"
                        placeholder="Ask for changes..."
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !isBusy && refineReadme()}
                        disabled={!readme || isBusy}
                    />
                    <button
                        onClick={refineReadme}
                        disabled={!readme || isBusy || !chatInput.trim()}
                        className="w-10 h-10 rounded-full bg-primary dark:bg-blue-600 text-white flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50"
                    >
                        <span className="material-symbols-outlined text-[18px]">send</span>
                    </button>
                </div>
            </aside>
        </div>
    );
}
