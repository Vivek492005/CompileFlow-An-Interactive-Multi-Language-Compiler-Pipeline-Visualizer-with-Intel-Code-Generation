import { useState, useEffect } from 'react';
import styles from './WelcomeScreen.module.css';
import CompilerSolarSystem from './CompilerSolarSystem';

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
            <div className={styles.content}>
                <div className={styles.solarSystemWrapper}>
                    <CompilerSolarSystem />
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
