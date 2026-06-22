'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Points, PointMaterial, Html } from '@react-three/drei';
import { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { random } from 'maath';

// --- Cyber Holographic Silobag ---
function CyberSilobag() {
  const meshRef = useRef<THREE.Mesh>(null);
  const wireframeRef = useRef<THREE.Mesh>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  
  // Track scroll manually for R3F
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.body.scrollHeight - window.innerHeight;
      const currentProgress = window.scrollY / totalScroll;
      setScrollProgress(currentProgress);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [liveData, setLiveData] = useState({ hum: 18.2, co2: 1200, temp: 22.1 });

  // Fluctuate data slightly every 2 seconds to simulate live sensors
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveData(prev => ({
        hum: Number((prev.hum + (Math.random() * 0.4 - 0.2)).toFixed(1)),
        co2: Math.floor(prev.co2 + (Math.random() * 10 - 5)),
        temp: Number((prev.temp + (Math.random() * 0.2 - 0.1)).toFixed(1)),
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useFrame((state, delta) => {
    if (meshRef.current && wireframeRef.current) {
      // Smooth interpolation for rotation based on scroll
      const targetRotationX = Math.PI / 2 + (scrollProgress * Math.PI * 2);
      const targetRotationZ = scrollProgress * Math.PI;
      
      meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, targetRotationX, 0.05);
      meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, targetRotationZ, 0.05);
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.2;
      
      wireframeRef.current.rotation.x = meshRef.current.rotation.x;
      wireframeRef.current.rotation.z = meshRef.current.rotation.z;
      wireframeRef.current.position.y = meshRef.current.position.y;
    }
  });

  return (
    <group scale={scrollProgress > 0.1 ? 2 + scrollProgress : 1.5} position={[0, 0, scrollProgress > 0.1 ? 2 : 0]}>
      {/* Inner glowing core */}
      <mesh ref={meshRef}>
        <capsuleGeometry args={[0.5, 4, 16, 32]} />
        <meshStandardMaterial 
          color="#059669" 
          emissive="#059669"
          emissiveIntensity={0.8}
          transparent
          opacity={0.6}
          roughness={0.1}
          metalness={0.8}
        />
        
        {/* Apple-style floating UI labels that appear immediately */}
        <Html position={[0.6, 1.5, 0]} className="pointer-events-none transition-opacity duration-1000" style={{ opacity: scrollProgress < 0.4 ? 1 : 0 }}>
          <div className="glass-dark px-4 py-2 rounded-xl border border-white/10 flex items-center gap-2 transform -translate-x-1/2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-white font-bold whitespace-nowrap text-sm font-data">Humedad: {liveData.hum}%</span>
          </div>
        </Html>
        <Html position={[-0.6, 0, 0]} className="pointer-events-none transition-opacity duration-1000" style={{ opacity: scrollProgress < 0.4 ? 1 : 0 }}>
          <div className="glass-dark px-4 py-2 rounded-xl border border-white/10 flex items-center gap-2 transform translate-x-1/2">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-white font-bold whitespace-nowrap text-sm font-data">CO2: {liveData.co2}ppm</span>
          </div>
        </Html>
        <Html position={[0.6, -1.5, 0]} className="pointer-events-none transition-opacity duration-1000" style={{ opacity: scrollProgress < 0.4 ? 1 : 0 }}>
          <div className="glass-dark px-4 py-2 rounded-xl border border-white/10 flex items-center gap-2 transform -translate-x-1/2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-white font-bold whitespace-nowrap text-sm font-data">Temp: {liveData.temp}°C</span>
          </div>
        </Html>
      </mesh>

      {/* Outer cyber wireframe */}
      <mesh ref={wireframeRef}>
        <capsuleGeometry args={[0.52, 4, 16, 32]} />
        <meshBasicMaterial 
          color="#10b981" 
          wireframe 
          transparent
          opacity={0.15}
        />
      </mesh>
    </group>
  );
}

// --- Floating Data Particles ---
function DataParticles() {
  const ref = useRef<THREE.Points>(null);
  const [sphere] = useState(() => random.inSphere(new Float32Array(5000), { radius: 10 }) as Float32Array);

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 15;
      ref.current.rotation.y -= delta / 20;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false}>
        <PointMaterial transparent color="#34d399" size={0.05} sizeAttenuation={true} depthWrite={false} opacity={0.4} />
      </Points>
    </group>
  );
}

export function Scene3D() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none mix-blend-screen bg-black">
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
        <fog attach="fog" args={['#000', 5, 15]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 10]} intensity={2} color="#10b981" />
        <pointLight position={[-10, -10, -10]} intensity={1} color="#059669" />
        
        <CyberSilobag />
        <DataParticles />
        
        <Environment preset="city" />
      </Canvas>
      {/* Dark vignette to blend with standard DOM */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000_100%)] pointer-events-none" />
    </div>
  );
}
