import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

// Initialize mermaid with a dark theme to match our UI
mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'loose',
});

export default function MermaidRenderer({ chart }) {
    const containerRef = useRef(null);

    useEffect(() => {
        const renderChart = async () => {
            if (containerRef.current && chart) {
                try {
                    // Clear previous render
                    containerRef.current.innerHTML = '';
                    // Generate a unique ID for the SVG
                    const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
                    const { svg } = await mermaid.render(id, chart);
                    containerRef.current.innerHTML = svg;
                } catch (error) {
                    console.error("Mermaid rendering failed:", error);
                    containerRef.current.innerHTML = `<p class="text-red-400 text-sm">Failed to render diagram. Syntax error in Mermaid code.</p>`;
                }
            }
        };
        renderChart();
    }, [chart]);

    return (
        <div
            ref={containerRef}
            className="flex justify-center my-8 p-4 bg-gray-800 rounded-lg border border-gray-700 overflow-x-auto"
        />
    );
}