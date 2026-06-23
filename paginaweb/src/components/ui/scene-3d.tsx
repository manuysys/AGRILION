'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Points, PointMaterial, Html, Float } from '@react-three/drei';
import { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { random } from 'maath';

// --- Cyber Holographic Silobag & Sensor Lanza ---
function SilobagWithSensor() {
  const groupRef = useRef<THREE.Group>(null);
  const bagRef = useRef<THREE.Mesh>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  
  // Track scroll manually for R3F
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.body.scrollHeight - window.innerHeight;
      const currentProgress = window.scrollY / Math.max(totalScroll, 1);
      setScrollProgress(currentProgress);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // init
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
    if (groupRef.current) {
      // Smooth interpolation for rotation based on scroll
      const targetRotationX = Math.PI / 12 + (scrollProgress * Math.PI / 4);
      const targetRotationY = scrollProgress * Math.PI;
      
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotationX, 0.05);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotationY, 0.05);
      
      // Gentle floating effect independent of scroll
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  // Solo mostrar la silobolsa después del hero (scrollProgress > 0.15)
  const isVisible = scrollProgress > 0.15;
  const opacityVal = isVisible ? Math.min((scrollProgress - 0.15) * 5, 1) : 0;

  return (
    <group ref={groupRef} scale={scrollProgress > 0.15 ? 1.5 + scrollProgress : 1.2} position={[0, -1, scrollProgress > 0.15 ? 1 : 0]}>
      {/* SILOBAG BODY (Realistic Plastic Capsule) */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]} ref={bagRef}>
        <capsuleGeometry args={[1.5, 6, 32, 64]} />
        <meshPhysicalMaterial 
          color="#d1d5db"
          roughness={0.6}
          metalness={0.1}
          clearcoat={0.3}
          clearcoatRoughness={0.4}
          transparent={true}
          opacity={opacityVal}
        />
      </mesh>

      {/* SENSOR LANZA (Poked into the silobag) */}
      <group position={[0, 1.3, 0]}>
        {/* The sharp pole/lanza */}
        <mesh position={[0, -0.5, 0]}>
          <cylinderGeometry args={[0.03, 0.01, 1.5, 16]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} transparent opacity={opacityVal} />
        </mesh>
        
        {/* The top device box (CubeCell) */}
        <mesh position={[0, 0.4, 0]}>
          <boxGeometry args={[0.3, 0.5, 0.3]} />
          <meshStandardMaterial color="#18181b" metalness={0.5} roughness={0.5} transparent opacity={opacityVal} />
        </mesh>

        {/* The Antenna (LoRa) */}
        <mesh position={[0.1, 0.8, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.6, 8]} />
          <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.5} transparent opacity={opacityVal} />
        </mesh>

        {/* Glowing LED indicator */}
        <mesh position={[0, 0.55, 0.16]}>
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshBasicMaterial color="#10b981" transparent opacity={opacityVal} />
        </mesh>

        {/* Connected UI Labels (Only visible when model is visible) */}
        <Html position={[1.2, 1.0, 0]} className={`pointer-events-none transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
          <div className="relative">
            {/* SVG Connector Line */}
            <svg className="absolute w-24 h-24 -left-24 top-1/2 -translate-y-1/2 pointer-events-none" style={{ overflow: 'visible' }}>
              <line x1="100%" y1="50%" x2="0" y2="100%" stroke="#10b981" strokeWidth="1" strokeDasharray="4 2" className="animate-pulse" />
              <circle cx="0" cy="100%" r="3" fill="#10b981" />
            </svg>
            <div className="glass-dark px-4 py-3 rounded-2xl border border-white/10 flex flex-col gap-1 shadow-2xl backdrop-blur-md">
              <span className="text-[10px] uppercase tracking-widest text-zinc-500">Humedad Interna</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                <span className="text-white font-bold text-xl font-data">{liveData.hum}%</span>
              </div>
            </div>
          </div>
        </Html>

        <Html position={[-2.5, 0.5, 0]} className={`pointer-events-none transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
          <div className="relative">
            <svg className="absolute w-24 h-24 -right-24 top-1/2 -translate-y-1/2 pointer-events-none" style={{ overflow: 'visible' }}>
              <line x1="0" y1="50%" x2="100%" y2="100%" stroke="#f59e0b" strokeWidth="1" strokeDasharray="4 2" className="animate-pulse" />
              <circle cx="100%" cy="100%" r="3" fill="#f59e0b" />
            </svg>
            <div className="glass-dark px-4 py-3 rounded-2xl border border-white/10 flex flex-col gap-1 shadow-2xl backdrop-blur-md">
              <span className="text-[10px] uppercase tracking-widest text-zinc-500">Nivel CO2</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.8)]" />
                <span className="text-white font-bold text-xl font-data">{liveData.co2} ppm</span>
              </div>
            </div>
          </div>
        </Html>

        <Html position={[1.5, -0.5, 0]} className={`pointer-events-none transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
          <div className="relative">
            <svg className="absolute w-24 h-24 -left-24 bottom-1/2 translate-y-1/2 pointer-events-none" style={{ overflow: 'visible' }}>
              <line x1="100%" y1="50%" x2="0" y2="0" stroke="#ef4444" strokeWidth="1" strokeDasharray="4 2" className="animate-pulse" />
              <circle cx="0" cy="0" r="3" fill="#ef4444" />
            </svg>
            <div className="glass-dark px-4 py-3 rounded-2xl border border-white/10 flex flex-col gap-1 shadow-2xl backdrop-blur-md">
              <span className="text-[10px] uppercase tracking-widest text-zinc-500">Temperatura</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                <span className="text-white font-bold text-xl font-data">{liveData.temp}°C</span>
              </div>
            </div>
          </div>
        </Html>
      </group>

      {/* Cyber scanning effect - only visible when scrolled */}
      {isVisible && (
        <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[1.52, 6, 16, 32]} />
          <meshBasicMaterial 
            color="#10b981" 
            wireframe 
            transparent
            opacity={opacityVal * 0.05}
          />
        </mesh>
      )}
    </group>
  );
}

// --- Floating Data Particles ---
function DataParticles() {
  const ref = useRef<THREE.Points>(null);
  const [sphere] = useState(() => random.inSphere(new Float32Array(5000), { radius: 10 }) as Float32Array);
  const [scrollProgress, setScrollProgress] = useState(0);
  
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.body.scrollHeight - window.innerHeight;
      const currentProgress = window.scrollY / Math.max(totalScroll, 1);
      setScrollProgress(currentProgress);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 15;
      ref.current.rotation.y -= delta / 20;
    }
  });

  const opacityVal = scrollProgress > 0.1 ? 0.4 : 0;

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false}>
        <PointMaterial transparent color="#34d399" size={0.05} sizeAttenuation={true} depthWrite={false} opacity={opacityVal} />
      </Points>
    </group>
  );
}

export function Scene3D() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none mix-blend-screen bg-transparent transition-opacity duration-1000">
      <Canvas camera={{ position: [0, 2, 10], fov: 45 }}>
        <fog attach="fog" args={['#000', 5, 20]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 10]} intensity={2} color="#ffffff" />
        <pointLight position={[-10, -10, -10]} intensity={1} color="#059669" />
        
        <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
          <SilobagWithSensor />
        </Float>
        
        <DataParticles />
        
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
