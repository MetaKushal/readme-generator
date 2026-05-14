import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function History() {
    // Dummy state for history, in a real app this would fetch from backend
    const [historyItems] = useState([
        { id: 1, repo: 'facebook/react', time: '2 hours ago', status: 'Live', type: 'code' },
        { id: 2, repo: 'vercel/next.js', time: 'Oct 24, 2023', status: 'Draft', type: 'schema' },
        { id: 3, repo: 'tailwindlabs/tailwindcss', time: 'Oct 20, 2023', status: 'Live', type: 'design' }
    ]);

    return (
        <div className="font-body-md text-on-surface bg-surface min-h-screen flex relative">
            {/* SideNavBar (Web Only) */}
            <nav className="hidden md:flex bg-white/60 dark:bg-surface-container/60 backdrop-blur-xl h-screen w-64 rounded-r-xl sticky top-0 border-r border-white/20 dark:border-outline-variant shadow-sm shadow-primary/5 flex-col p-gutter gap-4 z-40">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-primary overflow-hidden">
                        <span className="material-symbols-outlined">smart_toy</span>
                    </div>
                    <div>
                        <h2 className="font-headline-md text-headline-md text-primary dark:text-primary-fixed">AI Studio</h2>
                        <p className="font-label-sm text-label-sm text-on-surface-variant">README Assistant</p>
                    </div>
                </div>
                
                <Link to="/" className="w-full py-3 px-4 bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-xl font-label-sm text-label-sm shadow-sm hover:scale-[1.02] hover:backdrop-blur-2xl transition-all duration-300 active:scale-95 mb-6 flex justify-center items-center gap-2">
                    <span className="material-symbols-outlined">add</span>
                    New Generation
                </Link>

                <div className="flex-1 flex flex-col gap-2">
                    <Link to="/" className="flex items-center gap-3 p-3 text-on-surface-variant hover:bg-surface-container-high transition-colors rounded-xl font-body-md text-body-md hover:scale-[1.02] duration-300">
                        <span className="material-symbols-outlined">auto_fix_high</span>
                        Generator
                    </Link>
                    <Link to="/history" className="flex items-center gap-3 p-3 bg-primary/10 dark:bg-primary-fixed/20 text-primary dark:text-primary-fixed rounded-xl font-body-md text-body-md hover:scale-[1.02] transition-all duration-300">
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>history</span>
                        History
                    </Link>
                </div>
            </nav>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
                {/* TopNavBar */}
                <header className="bg-white/60 dark:bg-surface-container/60 backdrop-blur-xl fixed top-0 w-full z-50 border-b border-white/20 dark:border-outline-variant shadow-sm shadow-primary/5 md:pl-64 transition-all">
                    <div className="flex justify-between items-center px-container-padding py-4 max-w-[1200px] mx-auto">
                        <div className="flex items-center gap-2">
                            <span className="md:hidden font-headline-md text-headline-md text-primary dark:text-primary-fixed">ReadmeAI</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <button className="text-on-surface-variant hover:text-primary hover:scale-[1.02] transition-all duration-300">
                                <span className="material-symbols-outlined">account_circle</span>
                            </button>
                            <button className="hidden md:block py-2 px-6 rounded-full border border-primary/20 text-primary hover:bg-primary hover:text-on-primary transition-colors font-label-sm text-label-sm">
                                Sign In
                            </button>
                        </div>
                    </div>
                </header>

                {/* Canvas */}
                <main className="flex-1 pt-24 px-container-padding pb-section-gap max-w-[1200px] w-full mx-auto md:pl-10">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                        <div>
                            <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">Generation History</h1>
                            <p className="font-body-md text-body-md text-on-surface-variant">Review and manage your previously generated READMEs.</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative group">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">search</span>
                                <input
                                    className="w-full sm:w-64 pl-12 pr-4 py-3 rounded-full bg-white/40 border-white/40 border focus:border-primary focus:bg-white/60 focus:ring-0 transition-all backdrop-blur-md font-body-md text-body-md placeholder:text-on-surface-variant/70 text-on-surface shadow-[0_4px_20px_-10px_rgba(92,91,126,0.05)] outline-none"
                                    placeholder="Search repositories..."
                                    type="text"
                                />
                            </div>
                            <button className="flex items-center gap-2 px-5 py-3 rounded-full bg-white/60 border border-white/40 hover:border-primary/30 backdrop-blur-md text-on-surface-variant font-label-sm text-label-sm hover:scale-[1.02] transition-all shadow-[0_4px_20px_-10px_rgba(92,91,126,0.05)]">
                                <span className="material-symbols-outlined text-lg">filter_list</span>
                                Filter
                                <span className="material-symbols-outlined text-sm ml-1">expand_more</span>
                            </button>
                        </div>
                    </div>

                    {/* Bento Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {historyItems.map((item) => (
                            <div key={item.id} className="group relative bg-white/60 backdrop-blur-md rounded-xl border border-white/20 p-5 flex flex-col gap-4 shadow-[0_8px_30px_-12px_rgba(92,91,126,0.08)] hover:shadow-[0_12px_40px_-12px_rgba(92,91,126,0.15)] transition-all duration-300 hover:scale-[1.01] hover:bg-white/70 overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
                                            <span className="material-symbols-outlined">
                                                {item.type === 'code' ? 'terminal' : item.type === 'schema' ? 'api' : 'code_blocks'}
                                            </span>
                                        </div>
                                        <div>
                                            <h3 className="font-label-sm text-label-sm text-on-surface">{item.repo}</h3>
                                            <p className="text-[12px] text-on-surface-variant mt-0.5">{item.time}</p>
                                        </div>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase border ${item.status === 'Live' ? 'bg-secondary-container/50 text-secondary border-secondary/10' : 'bg-primary-container/50 text-primary border-primary/10'}`}>
                                        {item.status}
                                    </span>
                                </div>
                                
                                <div className={`h-32 rounded-lg bg-surface-container-low border border-white/30 overflow-hidden relative ${item.type === 'schema' ? 'p-4 flex items-center justify-center' : ''}`}>
                                    {item.type === 'schema' ? (
                                        <div className="w-full h-full border border-dashed border-outline-variant/50 rounded flex items-center justify-center text-on-surface-variant/50">
                                            <span className="material-symbols-outlined text-4xl">schema</span>
                                        </div>
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-primary-container/40 to-surface-container-high flex items-center justify-center text-primary/30">
                                            <span className="material-symbols-outlined text-6xl">
                                                {item.type === 'code' ? 'terminal' : 'web'}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 mt-auto pt-2">
                                    <Link to="/" className="flex-1 text-center py-2 bg-primary text-on-primary rounded-lg font-label-sm text-label-sm hover:scale-[1.02] transition-transform shadow-sm shadow-primary/20">Open</Link>
                                    <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/50 hover:bg-white border border-white/50 text-on-surface-variant hover:text-primary transition-all">
                                        <span className="material-symbols-outlined text-lg">content_copy</span>
                                    </button>
                                    <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/50 hover:bg-error-container/50 border border-white/50 text-on-surface-variant hover:text-error transition-all">
                                        <span className="material-symbols-outlined text-lg">delete</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </main>
            </div>
        </div>
    );
}
