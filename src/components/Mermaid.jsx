import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
    startOnLoad: true,
    theme: 'dark',
    securityLevel: 'loose',
    fontFamily: 'Inter, system-ui, sans-serif',
});

export default function Mermaid({ chart }) {
    const ref = useRef(null);

    useEffect(() => {
        if (ref.current && chart) {
            ref.current.removeAttribute('data-processed');
            mermaid.contentLoaded();
            
            // For dynamic updates
            const render = async () => {
                const id = 'mermaid-' + Math.random().toString(36).substr(2, 9);
                try {
                   const { svg } = await mermaid.render(id, chart);
                   if (ref.current) ref.current.innerHTML = svg;
                } catch (e) {
                    console.error('Mermaid error:', e);
                }
            };
            render();
        }
    }, [chart]);

    return (
        <div 
            ref={ref} 
            className="mermaid-wrapper" 
            style={{ width: '100%', overflowX: 'auto', display: 'flex', justifyContent: 'center', padding: '1rem' }}
        />
    );
}
