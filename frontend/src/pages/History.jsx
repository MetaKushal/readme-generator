import React, { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { loadHistory, deleteFromHistory, saveSession } from '../utils/storage';

function timeAgo(timeStr) {
    try {
        const d = new Date(timeStr);
        const diff = (Date.now() - d) / 1000;
        if (diff < 60)   return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (_) {
        return timeStr;
    }
}

export default function History() {
    const [items, setItems] = useState(() => loadHistory());
    const [isDark, setIsDark] = useState(() => {
        const stored = localStorage.getItem('theme');
        return stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches);
    });

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDark]);

    const handleDelete = useCallback((id) => {
        deleteFromHistory(id);
        setItems(prev => prev.filter(h => h.id !== id));
    }, []);

    const handleOpen = useCallback((item) => {
        saveSession({ url: item.repoUrl, readme: item.readme, chatHistory: [{ role: 'assistant', content: item.readme }] });
    }, []);

    return (
        <div className="font-body-md text-on-surface dark:text-gray-200 bg-surface dark:bg-gray-950 min-h-screen flex relative transition-colors duration-300">
            {/* SideNavBar */}
            <nav className="hidden md:flex bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl h-screen w-64 rounded-r-xl sticky top-0 border-r border-white/20 dark:border-gray-800 shadow-sm flex-col p-gutter gap-4 z-40 transition-colors">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-full bg-primary-container dark:bg-blue-900/30 flex items-center justify-center text-primary dark:text-blue-400 overflow-hidden">
                        <span className="material-symbols-outlined">smart_toy</span>
                    </div>
                    <div>
                        <h2 className="font-headline-md text-headline-md text-primary dark:text-blue-400">AI Studio</h2>
                        <p className="font-label-sm text-label-sm text-on-surface-variant dark:text-gray-500">Assistant</p>
                    </div>
                </div>

                <Link
                    to="/"
                    className="w-full py-3 px-4 bg-primary dark:bg-blue-600 text-white rounded-xl font-label-sm text-label-sm shadow-sm hover:scale-[1.02] transition-transform duration-200 active:scale-95 mb-6 flex justify-center items-center gap-2"
                >
                    <span className="material-symbols-outlined">add</span>
                    New Generation
                </Link>

                <div className="flex-1 flex flex-col gap-2">
                    <Link to="/" className="flex items-center gap-3 p-3 text-on-surface-variant dark:text-gray-400 hover:bg-white/20 dark:hover:bg-gray-800 transition-colors rounded-xl font-body-md text-body-md">
                        <span className="material-symbols-outlined">auto_fix_high</span>
                        Generator
                    </Link>
                    <Link to="/history" className="flex items-center gap-3 p-3 bg-primary/10 dark:bg-blue-900/20 text-primary dark:text-blue-400 rounded-xl font-body-md text-body-md">
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>history</span>
                        History
                    </Link>
                </div>
            </nav>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
                {/* TopNavBar */}
                <header className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl fixed top-0 w-full z-50 border-b border-white/20 dark:border-gray-800 shadow-sm md:pl-64 transition-colors">
                    <div className="flex justify-between items-center px-container-padding py-4 max-w-[1200px] mx-auto">
                        <span className="md:hidden font-headline-md text-headline-md text-primary dark:text-blue-400">ReadmeAI</span>
                        <div className="flex items-center gap-4 ml-auto">
                            <button 
                                onClick={() => setIsDark(!isDark)}
                                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-on-surface-variant dark:text-gray-400"
                            >
                                <span className="material-symbols-outlined">{isDark ? 'light_mode' : 'dark_mode'}</span>
                            </button>
                            <button className="text-on-surface-variant dark:text-gray-400 hover:text-primary dark:hover:text-blue-400 transition-colors">
                                <span className="material-symbols-outlined">account_circle</span>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Canvas */}
                <main className="flex-1 pt-24 px-container-padding pb-section-gap max-w-[1200px] w-full mx-auto md:pl-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                        <div>
                            <h1 className="font-headline-lg text-headline-lg text-on-surface dark:text-gray-100 mb-2">History</h1>
                            <p className="font-body-md text-body-md text-on-surface-variant dark:text-gray-400">Manage your generated READMEs.</p>
                        </div>
                    </div>

                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 text-center">
                            <div className="w-28 h-28 mb-8 rounded-full bg-primary-container/20 dark:bg-blue-900/10 flex items-center justify-center border border-white/60 dark:border-gray-800">
                                <span className="material-symbols-outlined text-[56px] text-primary/30 dark:text-blue-400/30" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
                            </div>
                            <h2 className="font-headline-md text-headline-md text-on-surface dark:text-gray-100 mb-3">No files generated</h2>
                            <p className="font-body-md text-body-md text-on-surface-variant dark:text-gray-400 max-w-sm mb-8">
                                Start generating your first professional README.
                            </p>
                            <Link
                                to="/"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-primary dark:bg-blue-600 text-white rounded-full font-label-sm text-label-sm hover:scale-[1.02] transition-transform shadow-sm"
                            >
                                <span className="material-symbols-outlined">auto_fix_high</span>
                                Start Generating
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    className="group relative bg-white/60 dark:bg-gray-900/60 rounded-xl border border-white/20 dark:border-gray-800 p-5 flex flex-col gap-4 shadow-sm hover:shadow-md transition-all duration-300 hover:bg-white/70 dark:hover:bg-gray-800/80 overflow-hidden"
                                >
                                    <div className="flex justify-between items-start relative">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-primary-container/40 dark:bg-blue-900/20 flex items-center justify-center text-primary dark:text-blue-400 flex-shrink-0">
                                                <span className="material-symbols-outlined">terminal</span>
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-label-sm text-label-sm text-on-surface dark:text-gray-200 truncate max-w-[140px]">
                                                    {item.repo}
                                                </h3>
                                                <p className="text-[12px] text-on-surface-variant dark:text-gray-500 mt-0.5">{timeAgo(item.time)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="h-32 rounded-lg bg-white/40 dark:bg-gray-950 overflow-hidden relative border border-white/30 dark:border-gray-800">
                                        <div className="absolute inset-0 p-3 overflow-hidden">
                                            <pre className="text-[9px] text-on-surface-variant/60 dark:text-gray-500 leading-tight whitespace-pre-wrap font-mono select-none">
                                                {item.readme?.slice(0, 400) || ''}
                                            </pre>
                                        </div>
                                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/60 dark:to-gray-950/80" />
                                    </div>

                                    <div className="flex items-center gap-2 mt-auto pt-2 relative">
                                        <Link
                                            to="/"
                                            onClick={() => handleOpen(item)}
                                            className="flex-1 text-center py-2 bg-primary dark:bg-blue-600 text-white rounded-lg font-label-sm text-label-sm hover:scale-[1.02] transition-transform"
                                        >
                                            Open
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/50 dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 border border-white/50 dark:border-gray-700 text-on-surface-variant dark:text-gray-400 hover:text-red-600 transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-lg">delete</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
