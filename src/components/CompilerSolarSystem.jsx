import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
    Float, Stars, Text, MeshDistortMaterial, MeshWobbleMaterial, 
    OrbitControls, PerspectiveCamera
} from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import * as THREE from 'three';

const Planet = ({ radius, speed, color, label, size, textureType, offset = 0 }) => {
    const ref = useRef();

    useEffect(() => {
        console.log(`Planet ${label} mounted`);
        return () => console.log(`Planet ${label} unmounted`);
    }, [label]);

    useFrame(({ clock }) => {
        const t = clock.getElapsedTime() * speed + offset;
        const x = Math.cos(t) * radius;
        const z = Math.sin(t) * radius;
        if (ref.current) {
            ref.current.position.set(x, 0, z);
            ref.current.rotation.y += 0.01;
            ref.current.rotation.z += 0.005;
        }
    });

    const renderMaterial = () => {
        switch (textureType) {
            case 'grid':
                return <meshStandardMaterial color={color} wireframe emissive={color} emissiveIntensity={6} />;
            case 'binary':
                return <MeshWobbleMaterial color={color} factor={0.6} speed={3} emissive={color} emissiveIntensity={4} />;
            case 'circuit':
                return <MeshDistortMaterial color={color} speed={5} distort={0.4} emissive={color} emissiveIntensity={5} />;
            default:
                return <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3} />;
        }
    };

    return (
        <group>
            {/* Elegant Orbital Path */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[radius - 0.05, radius + 0.05, 128]} />
                <meshBasicMaterial color={color} transparent opacity={0.3} />
            </mesh>

            <Float speed={3} rotationIntensity={1.5} floatIntensity={2}>
                <group ref={ref}>
                    <mesh>
                        <sphereGeometry args={[size, 32, 32]} />
                        {renderMaterial()}
                    </mesh>
                    
                    {/* Glow Aura */}
                    <mesh scale={[1.4, 1.4, 1.4]}>
                        <sphereGeometry args={[size, 16, 16]} />
                        <meshBasicMaterial color={color} transparent opacity={0.15} />
                    </mesh>

                    {/* Holographic Label */}
                    <Text
                        position={[0, size + 0.8, 0]}
                        fontSize={0.5}
                        color="white"
                        anchorX="center"
                        anchorY="middle"
                        font="https://fonts.gstatic.com/s/orbitron/v25/yYqxRneDgc0b7_97C_vYBA.woff"
                    >
                        {label}
                    </Text>
                </group>
            </Float>
        </group>
    );
};

const Sun = () => {
    const sunRef = useRef();
    const glowRef = useRef();

    useEffect(() => {
        console.log("Sun component mounted");
    }, []);

    useFrame(({ clock }) => {
        if (sunRef.current) {
            sunRef.current.rotation.y = clock.getElapsedTime() * 0.1;
            sunRef.current.rotation.z = clock.getElapsedTime() * 0.05;
        }
        if (glowRef.current) {
            const s = 1 + Math.sin(clock.getElapsedTime() * 2) * 0.05;
            glowRef.current.scale.set(s, s, s);
        }
    });

    return (
        <group>
            <mesh ref={sunRef}>
                <sphereGeometry args={[3.2, 64, 64]} />
                <MeshDistortMaterial
                    color="#f59e0b"
                    speed={2}
                    distort={0.6}
                    radius={1}
                    emissive="#ec4899"
                    emissiveIntensity={8}
                />
            </mesh>
            
            {/* Radiant Data Rings */}
            <mesh rotation={[Math.PI / 2.5, 0, 0]}>
                <torusGeometry args={[4.2, 0.03, 16, 100]} />
                <meshBasicMaterial color="#ec4899" transparent opacity={0.6} />
            </mesh>
            <mesh rotation={[-Math.PI / 3, Math.PI / 4, 0]}>
                <torusGeometry args={[4.5, 0.02, 16, 100]} />
                <meshBasicMaterial color="#06b6d4" transparent opacity={0.4} />
            </mesh>

            <pointLight intensity={25} distance={100} color="#f59e0b" />
            <mesh ref={glowRef} scale={[1.3, 1.3, 1.3]}>
                <sphereGeometry args={[3.2, 32, 32]} />
                <meshBasicMaterial color="#ec4899" transparent opacity={0.2} />
            </mesh>
            
            <Text
                position={[0, 0, 4]}
                fontSize={0.8}
                color="white"
                font="https://fonts.gstatic.com/s/orbitron/v25/yYqxRneDgc0b7_97C_vYBA.woff"
            >
                COMPILER
            </Text>
        </group>
    );
};

const Scene = () => {
    return (
        <>
            <Stars radius={150} depth={50} count={8000} factor={7} saturation={1} fade speed={2} />
            <ambientLight intensity={0.2} />
            <Sun />

            <Planet radius={8} speed={0.5} color="#06b6d4" label="LEXER" size={0.7} textureType="grid" offset={0} />
            <Planet radius={12} speed={0.4} color="#3b82f6" label="PARSER" size={0.9} textureType="binary" offset={1.5} />
            <Planet radius={16} speed={0.3} color="#a855f7" label="SEMANTIC" size={1.1} textureType="circuit" offset={3} />
            <Planet radius={20} speed={0.2} color="#ec4899" label="CODEGEN" size={0.8} textureType="grid" offset={4.5} />
            <Planet radius={24} speed={0.15} color="#10b981" label="OPTIMIZER" size={1.0} textureType="circuit" offset={6} />

            <OrbitControls 
                enableZoom={false} 
                enablePan={false} 
                autoRotate 
                autoRotateSpeed={1.2} 
                maxPolarAngle={Math.PI / 1.7}
                minPolarAngle={Math.PI / 2.3}
            />
            
            <EffectComposer disableNormalPass>
                <Bloom luminanceThreshold={0.5} mipmapBlur intensity={2} radius={0.5} />
                <Noise opacity={0.15} />
                <Vignette darkness={1.2} />
            </EffectComposer>

            <PerspectiveCamera makeDefault position={[0, 15, 40]} fov={45} />
        </>
    );
};

export default function CompilerSolarSystem() {
    useEffect(() => {
        console.log("3D Compiler Solar System Initialized 🚀");
    }, []);

    return (
        <div style={{ width: '100%', height: '100%', minHeight: '650px', cursor: 'grab', position: 'relative' }}>
            <Canvas 
                gl={{ antialias: false, stencil: false, depth: true, alpha: true }}
                dpr={[1, 2]} 
                camera={{ position: [0, 15, 40], fov: 45 }}
            >
                <Scene />
            </Canvas>
        </div>
    );
}
