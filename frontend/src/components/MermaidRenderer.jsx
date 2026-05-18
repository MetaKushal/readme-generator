import React, { useEffect, useRef, memo, useState } from 'react';
import mermaid from 'mermaid';
import { AlertCircle } from 'lucide-react';

const cleanChartCode = (code) => {
    if (!code) return '';
    let cleaned = code.replace(/```mermaid/gi, '').replace(/```/g, '').trim();
    cleaned = cleaned.replace(/\//g, '');

    const lines = cleaned.split(/\r?\n/);
    return lines.map(line => {
        let l = line.trim();
        if (!l) return '';
        if (/^(graph|flowchart|sequenceDiagram)/i.test(l)) return l;

        // If the AI disobeys and puts quotes on edge labels, this strips them out safely
        // e.g., A -->|"Label"| B  becomes  A -->|Label| B
        l = l.replace(/-->\s*\|"([^"]+)"\|/g, '-->|$1|');
        l = l.replace(/--\s*"([^"]+)"\s*-->/g, '-->|$1|');

        return l;
    }).join('\n');
};

const MermaidRenderer = memo(function MermaidRenderer({ chart, isDark }) {
    const [svgContent, setSvgContent] = useState(null);
    const [hasError, setHasError] = useState(false);
    const [cleanedCode, setCleanedCode] = useState('');

    useEffect(() => {
        mermaid.initialize({
            startOnLoad: false,
            theme: isDark ? 'dark' : 'neutral',
            securityLevel: 'loose',
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            suppressErrorRendering: true,
        });

        // OFFICIAL METHOD: Override global parse error to stop DOM leaks
        mermaid.parseError = () => { };
    }, [isDark]);

    useEffect(() => {
        if (!chart) return;
        let cancelled = false;

        const renderChart = async () => {
            const finalCode = cleanChartCode(chart);
            setCleanedCode(finalCode);

            try {
                // OFFICIAL METHOD: Parse syntax BEFORE rendering to guarantee no crashes
                await mermaid.parse(finalCode);

                if (!cancelled) {
                    const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
                    const { svg } = await mermaid.render(id, finalCode);

                    const responsiveSvg = svg.replace(/<svg /, '<svg style="max-width: 100%; height: auto;" ');
                    setSvgContent(responsiveSvg);
                    setHasError(false);
                }
            } catch (error) {
                console.warn('Caught Mermaid syntax error, showing fallback UI.');
                if (!cancelled) setHasError(true);
            } finally {
                // Final safety sweep for any ghost SVGs
                document.querySelectorAll('svg[id^="dmermaid-"]').forEach(svg => svg.remove());
            }
        };

        renderChart();
        return () => { cancelled = true; };
    }, [chart, isDark]);

    return (
        <div className={`flex justify-center my-8 p-6 rounded-2xl border transition-all duration-300 overflow-x-auto w-full ${isDark ? 'bg-gray-900 border-gray-700 shadow-lg' : 'bg-white border-gray-200 shadow-sm'
            }`}>
            {!hasError && svgContent && (
                <div
                    className={`w-full flex justify-center [&>svg]:!max-w-full [&>svg]:!h-auto ${isDark ? 'text-gray-200' : 'text-gray-800'}`}
                    dangerouslySetInnerHTML={{ __html: svgContent }}
                />
            )}

            {hasError && (
                <div className={`flex flex-col gap-3 p-6 rounded-xl border w-full text-left ${isDark ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-red-50 border-red-200 text-red-800'
                    }`}>
                    <div className={`flex items-center gap-2 font-semibold text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                        <AlertCircle className="w-5 h-5" />
                        Diagram Syntax Error
                    </div>
                    <p className="m-0 text-xs opacity-80">
                        Mermaid couldn't render this structure. Here is the raw diagram code:
                    </p>
                    <pre className={`mt-3 p-4 rounded-lg overflow-x-auto font-mono text-xs whitespace-pre-wrap border ${isDark ? 'bg-gray-950 border-gray-700' : 'bg-white border-red-100'
                        }`}>
                        {cleanedCode}
                    </pre>
                </div>
            )}
        </div>
    );
});

export default MermaidRenderer;