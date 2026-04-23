import React, { useState, useEffect } from 'react';
import './SolarSystem.css';

const SolarSystem = () => {
    const [view3D, setView3D] = useState(true);
    const [zoomClose, setZoomClose] = useState(false);
    const [activePlanet, setActivePlanet] = useState('earth');
    const [opening, setOpening] = useState(true);
    const [hideUI, setHideUI] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setOpening(false);
            setHideUI(false);
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    const planets = [
        { id: 'mercury', name: 'Lexical', info: 'Tokenizing code' },
        { id: 'venus', name: 'Syntax', info: 'Building AST' },
        { id: 'earth', name: 'Semantic', info: 'Type checking' },
        { id: 'mars', name: 'ICG', info: 'Intermediate code' },
        { id: 'jupiter', name: 'Optimization', info: 'Code refinement' },
        { id: 'saturn', name: 'Target Code', info: 'Intel 8085 Assembly' },
        { id: 'uranus', name: 'Assembly', info: 'Mnemonic mapping' },
        { id: 'neptune', name: 'Binary', info: 'Machine code' },
    ];

    const bodyClasses = [
        view3D ? 'view-3D' : 'view-2D',
        zoomClose ? 'zoom-close' : 'zoom-large',
        opening ? 'opening' : '',
        hideUI ? 'hide-UI' : '',
    ].join(' ');

    return (
        <div className={`solar-system-container ${bodyClasses}`}>
            <div id="navbar" className="navbar">
                <h1>CompileFlow 3D Pipeline</h1>
            </div>

            <div id="data" className="data">
                <a 
                    className={`sun ${activePlanet === 'sun' ? 'active' : ''}`} 
                    href="#sun" 
                    onClick={(e) => { e.preventDefault(); setActivePlanet('sun'); }}
                >
                    Compiler
                </a>
                {planets.map(p => (
                    <a 
                        key={p.id} 
                        className={`${p.id} ${activePlanet === p.id ? 'active' : ''}`} 
                        href={`#${p.id}`}
                        onClick={(e) => { e.preventDefault(); setActivePlanet(p.id); }}
                    >
                        {p.name}
                    </a>
                ))}
            </div>

            <div id="controls" className="controls">
                <label className="set-view">
                    <input type="checkbox" checked={view3D} onChange={() => setView3D(!view3D)} />
                    <span>3D View</span>
                </label>
                <label className="set-zoom">
                    <input type="checkbox" checked={zoomClose} onChange={() => setZoomClose(!zoomClose)} />
                    <span>Zoom</span>
                </label>
            </div>

            <div id="universe" className="scale-stretched">
                <div id="galaxy">
                    <div id="solar-system" className={activePlanet}>
                        {planets.map(p => (
                            <div key={p.id} id={p.id} className="orbit">
                                <div className="pos">
                                    <div className="planet">
                                        {p.id === 'saturn' && <div className="ring"></div>}
                                        <dl className="infos">
                                            <dt>{p.name}</dt>
                                            <dd><span>{p.info}</span></dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <div id="sun">
                            <dl className="infos">
                                <dt>Compiler Core</dt>
                                <dd><span>The Central Engine</span></dd>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SolarSystem;
