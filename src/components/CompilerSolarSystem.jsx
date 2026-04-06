import { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
    Float, Stars, Text, MeshDistortMaterial, MeshWobbleMaterial, 
    OrbitControls, PerspectiveCamera, Points, Point, 
    Environment, ContactShadows
} from '@react-three/drei';
import { EffectComposer, Bloom, Scanline, Noise, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';

const Planet = ({ radius, speed, color, label, size, textureType, offset = 0 }) => {
    const ref = useRef();

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
                return <meshStandardMaterial color={color} wireframe emissive={color} emissiveIntensity={4} />;
            case 'binary':
                return <MeshWobbleMaterial color={color} factor={0.6} speed={3} emissive={color} emissiveIntensity={2} />;
            case 'circuit':
                return <MeshDistortMaterial color={color} speed={5} distort={0.4} emissive={color} emissiveIntensity={3} />;
            default:
                return <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />;
        }
    };

    return (
        <group>
            {/* Elegant Orbital Path */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[radius - 0.02, radius + 0.02, 128]} />
                <meshBasicMaterial color={color} transparent opacity={0.2} />
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
                        <meshBasicMaterial color={color} transparent opacity={0.1} />
                    </mesh>

                    {/* Holographic Label */}
                    <Text
                        position={[0, size + 0.8, 0]}
                        fontSize={0.45}
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
                <sphereGeometry args={[2.8, 64, 64]} />
                <MeshDistortMaterial
                    color="#f59e0b"
                    speed={3}
                    distort={0.5}
                    radius={1}
                    emissive="#ec4899"
                    emissiveIntensity={5}
                />
            </mesh>
            
            {/* Radiant Data Streams (simplified as glowing rings) */}
            <group rotation={[Math.PI / 4, 0, 0]}>
                <mesh>
                    <torusGeometry args={[3.5, 0.02, 16, 100]} />
                    <meshBasicMaterial color="#ec4899" transparent opacity={0.5} />
                </mesh>
            </group>
            <group rotation={[-Math.PI / 4, Math.PI / 4, 0]}>
                <mesh>
                    <torusGeometry args={[3.8, 0.01, 16, 100]} />
                    <meshBasicMaterial color="#06b6d4" transparent opacity={0.3} />
                </mesh>
            </group>

            {/* Core Glow */}
            <pointLight intensity={15} distance={60} color="#f59e0b" />
            <mesh ref={glowRef} scale={[1.3, 1.3, 1.3]}>
                <sphereGeometry args={[2.8, 32, 32]} />
                <meshBasicMaterial color="#ec4899" transparent opacity={0.15} />
            </mesh>
            
            {/* COMPILER text in the center of the sun */}
            <Text
                position={[0, 0, 3]}
                fontSize={0.6}
                color="white"
                font="https://fonts.gstatic.com/s/orbitron/v25/yYqxRneDgc0b7_97C_vYBA.woff"
            >
                COMPILER
            </Text>
        </group>
    );
};

const DigitalDust = () => {
    const count = 200;
    const positions = useMemo(() => {
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 40;
            pos[i * 3 + 1] = (Math.random() - 0.5) * 40;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 40;
        }
        return pos;
    }, []);

    const ref = useRef();
    useFrame(({ clock }) => {
        if (ref.current) {
            ref.current.rotation.y = clock.getElapsedTime() * 0.05;
            ref.current.rotation.x = clock.getElapsedTime() * 0.02;
        }
    });

    return (
        <points ref={ref}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={positions.length / 3}
                    array={positions}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial size={0.08} color="#a855f7" transparent opacity={0.4} sizeAttenuation />
        </points>
    );
};

const Scene = () => {
    return (
        <>
            <color attach="background" args={['#020617']} />
            <Stars radius={100} depth={50} count={7000} factor={6} saturation={0.5} fade speed={1.5} />
            <DigitalDust />
            
            <ambientLight intensity={0.1} />
            <Sun />

            <Planet radius={7} speed={0.45} color="#06b6d4" label="LEXER" size={0.65} textureType="grid" offset={0} />
            <Planet radius={10.5} speed={0.35} color="#3b82f6" label="PARSER" size={0.85} textureType="binary" offset={1.5} />
            <Planet radius={14} speed={0.25} color="#a855f7" label="SEMANTIC" size={1.0} textureType="circuit" offset={3} />
            <Planet radius={17.5} speed={0.18} color="#ec4899" label="CODEGEN" size={0.75} textureType="grid" offset={4.5} />
            <Planet radius={21} speed={0.12} color="#10b981" label="OPTIMIZER" size={0.9} textureType="circuit" offset={6} />

            <OrbitControls 
                enableZoom={false} 
                enablePan={false} 
                autoRotate 
                autoRotateSpeed={0.8} 
                maxPolarAngle={Math.PI / 1.8}
                minPolarAngle={Math.PI / 2.5}
            />
            
            <EffectComposer disableNormalPass>
                <Bloom luminanceThreshold={0.2} mipmapBlur intensity={1.5} radius={0.4} />
                <Scanline density={1.5} opacity={0.1} />
                <Noise opacity={0.05} />
                <Vignette eskil={false} offset={0.1} darkness={1.1} />
            </EffectComposer>

            <PerspectiveCamera makeDefault position={[0, 12, 32]} fov={40} />
        </>
    );
};

export default function CompilerSolarSystem() {
    return (
        <div style={{ width: '100%', height: '100%', minHeight: '600px', cursor: 'grab' }}>
            <Canvas 
                gl={{ antialias: false, stencil: false, depth: true }}
                dpr={[1, 2]} 
                camera={{ position: [0, 15, 35], fov: 40 }}
            >
                <Scene />
            </Canvas>
        </div>
    );
}
