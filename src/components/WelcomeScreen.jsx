import { useState, useEffect } from 'react';
import styles from './WelcomeScreen.module.css';
import SolarSystem from './SolarSystem/SolarSystem';

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
                <div className={styles.solarSystemWrapper}>
                    <SolarSystem />
                </div>
                
                <h2 className={styles.title}>Compiler Pipeline Ready</h2>
                <p className={styles.sub}>
                    Explore the 3D pipeline visualization above. Each planet represents a stage in the transformation 
                    from source code to Intel 8085 assembly.
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
                
                <div className={styles.arrow}>↑ Paste code on the left, then hit Compile & Analyze</div>
            </div>
        </div>
    );
}

