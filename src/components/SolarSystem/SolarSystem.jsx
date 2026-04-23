import React, { useState, useEffect } from 'react';
import styles from './SolarSystem.module.css';

const SolarSystem = () => {
    const [view3D, setView3D] = useState(true);
    const [zoomClose, setZoomClose] = useState(false);
    const [scaleMode, setScaleMode] = useState('stretched'); // 'stretched', 'size', 'distance'
    const [activePlanet, setActivePlanet] = useState('earth');
    const [opening, setOpening] = useState(true);
    const [hideUI, setHideUI] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setOpening(false);
            setHideUI(false);
        }, 2000);
        return () => clearTimeout(timer);
    }, []);

    const containerClasses = [
        styles.universeContainer,
        view3D ? styles.view3D : styles.view2D,
        zoomClose ? styles.zoomClose : styles.zoomLarge,
        opening ? styles.opening : '',
        hideUI ? styles.hideUI : '',
        styles[`scale-${scaleMode}`],
        styles[activePlanet]
    ].join(' ');

    const planets = [
        { id: 'mercury', name: 'Lexical', info: 'Tokenizing code into symbols' },
        { id: 'venus', name: 'Syntax', info: 'Building the Abstract Syntax Tree' },
        { id: 'earth', name: 'Semantic', info: 'Type checking & scope analysis' },
        { id: 'mars', name: 'ICG', info: 'Generating Three-Address Code' },
        { id: 'jupiter', name: 'Optimization', info: 'Refining code for performance' },
        { id: 'saturn', name: 'Target Code', info: 'Generating Intel 8085 Assembly' },
    ];

    return (
        <div className={containerClasses}>
            <div id="navbar" className={styles.navbar}>
                <h1>CompileFlow 3D Pipeline</h1>
            </div>

            <div id="data" className={styles.data}>
                {planets.map(p => (
                    <a 
                        key={p.id} 
                        className={`${styles[p.id]} ${activePlanet === p.id ? styles.active : ''}`} 
                        href={`#${p.id}`}
                        onClick={(e) => { e.preventDefault(); setActivePlanet(p.id); }}
                    >
                        {p.name}
                    </a>
                ))}
            </div>

            <div id="controls" className={styles.controls}>
                <label className={styles.setView}>
                    <input type="checkbox" checked={view3D} onChange={() => setView3D(!view3D)} />
                    <span>3D View</span>
                </label>
                <label className={styles.setZoom}>
                    <input type="checkbox" checked={zoomClose} onChange={() => setZoomClose(!zoomClose)} />
                    <span>Zoom</span>
                </label>
            </div>

            <div id="universe" className={styles.universe}>
                <div id="galaxy" className={styles.galaxy}>
                    <div id="solar-system" className={styles.solarSystem}>
                        
                        {planets.map(p => (
                            <div key={p.id} id={p.id} className={styles.orbit}>
                                <div className={styles.pos}>
                                    <div className={styles.planet}>
                                        {p.id === 'saturn' && <div className={styles.ring}></div>}
                                        <dl className={styles.infos}>
                                            <dt>{p.name}</dt>
                                            <dd><span>{p.info}</span></dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <div id="sun" className={styles.sun}>
                            <dl className={styles.infos}>
                                <dt>Compiler Core</dt>
                                <dd><span>Central Processing Engine</span></dd>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SolarSystem;
