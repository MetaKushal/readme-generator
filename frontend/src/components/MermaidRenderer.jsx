import React, { useEffect, useRef, memo } from 'react';
import mermaid from 'mermaid';

const MermaidRenderer = memo(function MermaidRenderer({ chart, isDark }) {
    const containerRef = useRef(null);

    useEffect(() => {
        // Configure mermaid based on current theme
        const config = {
            startOnLoad: false,
            theme: isDark ? 'dark' : 'neutral',
            securityLevel: 'loose',
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            themeVariables: isDark ? {
                darkMode: true,
                background: '#161b22',
                primaryColor: '#21262d',
                primaryTextColor: '#c9d1d9',
                primaryBorderColor: '#30363d',
                lineColor: '#8b949e',
                secondaryColor: '#161b22',
                tertiaryColor: '#161b22',
            } : {
                darkMode: false,
                background: '#ffffff',
                primaryColor: '#f8f9ff',
                primaryTextColor: '#0d1c2e',
                primaryBorderColor: 'rgba(92,91,126,0.12)',
                lineColor: '#5c5c7b',
            },
            flowchart: { useMaxWidth: true, htmlLabels: true, curve: 'basis' },
            sequence: { useMaxWidth: true },
        };

        mermaid.initialize(config);
    }, [isDark]);

    useEffect(() => {
        if (!containerRef.current || !chart) return;

        let cancelled = false;

        const renderChart = async () => {
            try {
                // Clear previous content
                containerRef.current.innerHTML = '';
                
                // Unique ID for this render
                const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
                
                // Render the SVG
                const { svg } = await mermaid.render(id, chart);
                
                if (!cancelled) {
                    containerRef.current.innerHTML = svg;
                    const svgEl = containerRef.current.querySelector('svg');
                    if (svgEl) {
                        svgEl.style.maxWidth = '100%';
                        svgEl.style.height = 'auto';
                        svgEl.removeAttribute('width');
                        // Ensure text is visible in both themes
                        svgEl.style.color = isDark ? '#c9d1d9' : '#0d1c2e';
                    }
                }
            } catch (error) {
                console.error('Mermaid rendering failed:', error);
                if (!cancelled) {
                    containerRef.current.innerHTML = `
                        <div style="display:flex;align-items:center;gap:0.5rem;color:#ef4444;font-size:0.8rem;padding:1rem;background:${isDark ? '#161b22' : '#fff'};border-radius:0.5rem">
                            <span class="material-symbols-outlined" style="font-size:18px">error</span>
                            Mermaid syntax error. Check the code.
                        </div>`;
                }
            }
        };

        renderChart();
        return () => { cancelled = true; };
    }, [chart, isDark]);

    return (
        <div
            ref={containerRef}
            className="flex justify-center my-10 p-6 rounded-2xl border transition-all duration-300 overflow-x-auto"
            style={{
                background: isDark ? '#161b22' : 'rgba(255,255,255,0.7)',
                border: isDark ? '1px solid #30363d' : '1px solid rgba(92,91,126,0.12)',
                boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 24px rgba(92,91,126,0.06)',
            }}
        />
    );
});

export default MermaidRenderer;