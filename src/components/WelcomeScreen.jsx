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
                <div className={styles.iconWrap}>
                    <div className={styles.pulseRing} />
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4.5 16.5c-1.5 1.5-1.5 4 1.5 4s4-2 4-2l8-8c0 0 2-2 0-4s-4 0-4 0L5.5 15" />
                        <path d="m14.5 6.5 3 3" />
                    </svg>
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
