import { useState, useEffect } from 'react';
import styles from './WelcomeScreen.module.css';

const FEATURES = [
    { icon: '⬡', label: 'DFA-based Lexer' },
    { icon: '⬡', label: 'Recursive Descent Parser' },
    { icon: '⬡', label: 'Scope Stack Semantics' },
    { icon: '⬡', label: 'Quadruples & TAC' },
    { icon: '⬡', label: 'Constant Folding' },
    { icon: '⬡', label: 'Intel 8085 Target Code' },
];

export default function WelcomeScreen() {
    return (
        <div className={styles.wrap}>
            {/* Live background elements */}
            <div className={styles.bgGlow} />
            <div className={styles.floatingParticles}>
                <div className={styles.particle} style={{ '--d': '0s', '--x': '10%', '--y': '20%' }}></div>
                <div className={styles.particle} style={{ '--d': '2s', '--x': '80%', '--y': '40%' }}></div>
                <div className={styles.particle} style={{ '--d': '4s', '--x': '30%', '--y': '70%' }}></div>
                <div className={styles.particle} style={{ '--d': '1s', '--x': '70%', '--y': '80%' }}></div>
            </div>

            <div className={styles.content}>
                <div className={styles.solarSystem}>
                    {/* Glowing background rings */}
                    <div className={styles.ambientRing} style={{ width: '400px', height: '400px', opacity: 0.03 }} />
                    <div className={styles.ambientRing} style={{ width: '600px', height: '600px', opacity: 0.02 }} />

                    {/* Orbits & Planets */}
                    <div className={styles.orbit} style={{ '--d': '12s', '--r': '160px', '--color': '#8b5cf6' }}>
                        <div className={styles.planet} style={{ '--bg': '#8b5cf6', '--glow': 'rgba(139, 92, 246, 0.5)' }}>C</div>
                    </div>
                    <div className={styles.orbit} style={{ '--d': '22s', '--r': '240px', '--color': '#3b82f6' }}>
                        <div className={styles.planet} style={{ '--bg': '#3b82f6', '--glow': 'rgba(59, 130, 246, 0.5)' }}>C++</div>
                    </div>
                    <div className={styles.orbit} style={{ '--d': '32s', '--r': '320px', '--color': '#f59e0b' }}>
                        <div className={styles.planet} style={{ '--bg': '#f59e0b', '--glow': 'rgba(245, 158, 11, 0.5)' }}>Python</div>
                    </div>
                    
                    {/* Central Core (The Compiler) */}
                    <div className={styles.sun}>
                        <div className={styles.sunCore} />
                        <div className={styles.sunGlow} />
                        <div className={styles.sunRing} />
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.sunIcon}>
                            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                            <circle cx="12" cy="12" r="4" />
                        </svg>
                    </div>
                </div>
                
                <h2 className={styles.title}>Compiler Pipeline Ready</h2>
                <p className={styles.sub}>
                    Enter your source code and click <strong>Compile &amp; Analyze</strong> to visualize<br />
                    the entire pipeline — from tokens to 8085 assembly.
                </p>

                <div className={styles.featureGrid}>
                    {FEATURES.map((f, idx) => (
                        <div 
                            key={f.label} 
                            className={styles.featureChip} 
                            style={{ animationDelay: `${idx * 0.1}s` }}
                        >
                            <span className={styles.featureDot}>✓</span>
                            {f.label}
                        </div>
                    ))}
                </div>
                
                <div className={styles.arrow}>↑ Paste code on the left, then hit Compile</div>
            </div>
        </div>
    );
}
