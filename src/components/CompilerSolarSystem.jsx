import { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
    Float, Stars, Text, MeshDistortMaterial, MeshWobbleMaterial, 
    OrbitControls, PerspectiveCamera
} from '@react-three/drei';
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
        }
    });

    return (
        <group>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[radius - 0.05, radius + 0.05, 64]} />
                <meshBasicMaterial color={color} transparent opacity={0.2} />
            </mesh>

            <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                <group ref={ref}>
                    <mesh>
                        <sphereGeometry args={[size, 16, 16]} />
                        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
                    </mesh>
                    <Text
                        position={[0, size + 0.6, 0]}
                        fontSize={0.4}
                        color="white"
                        anchorX="center"
                        anchorY="middle"
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

    useFrame(({ clock }) => {
        if (sunRef.current) {
            sunRef.current.rotation.y = clock.getElapsedTime() * 0.1;
        }
    });

    return (
        <group>
            <mesh ref={sunRef}>
                <sphereGeometry args={[3, 32, 32]} />
                <meshStandardMaterial
                    color="#f59e0b"
                    emissive="#f59e0b"
                    emissiveIntensity={2}
                />
            </mesh>
            <pointLight intensity={10} distance={50} color="#f59e0b" />
            <Text
                position={[0, 0, 3.5]}
                fontSize={0.6}
                color="white"
            >
                COMPILER
            </Text>
        </group>
    );
};

const SafeScene = () => {
    return (
        <>
            <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
            <ambientLight intensity={0.5} />
            <Sun />
            <Planet radius={7} speed={0.5} color="#06b6d4" label="LEXER" size={0.6} textureType="grid" />
            <Planet radius={11} speed={0.4} color="#3b82f6" label="PARSER" size={0.8} textureType="binary" offset={2} />
            <Planet radius={15} speed={0.3} color="#a855f7" label="SEMANTIC" size={0.9} textureType="circuit" offset={4} />
            <Planet radius={19} speed={0.2} color="#ec4899" label="CODEGEN" size={0.7} textureType="grid" offset={6} />
            <Planet radius={23} speed={0.1} color="#10b981" label="OPTIMIZER" size={0.9} textureType="circuit" offset={8} />

            <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={1} />
            <PerspectiveCamera makeDefault position={[0, 15, 35]} fov={50} />
        </>
    );
};

export default function CompilerSolarSystem() {
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        console.log("3D Safe Mode Initialized 🛡️");
    }, []);

    if (hasError) {
        return (
            <div style={{ color: '#ef4444', padding: '2rem', border: '1px solid #ef4444', borderRadius: '1rem' }}>
                3D Engine Failed to Load. Your browser might not support WebGL.
            </div>
        );
    }

    return (
        <div style={{ width: '100%', height: '100%', minHeight: '600px', background: '#020617', borderRadius: '1rem' }}>
            <Canvas 
                gl={{ antialias: true, alpha: false }}
                onCreated={({ gl }) => {
                    console.log("WebGL Context Created Successfully ✅");
                }}
                onError={(e) => {
                    console.error("3D Canvas Error:", e);
                    setHasError(true);
                }}
            >
                <SafeScene />
            </Canvas>
        </div>
    );
}
