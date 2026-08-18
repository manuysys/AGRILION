'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Points, PointMaterial, Html, ContactShadows, Line } from '@react-three/drei';
import { useRef, useState, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { random } from 'maath';

// ─── Procedural plastic normal map ──────────────────────────────────
function createPlasticNormalMap(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Base neutral normal
  ctx.fillStyle = 'rgb(128,128,255)';
  ctx.fillRect(0, 0, size, size);

  // Horizontal wrinkles (longitudinal creases)
  for (let i = 0; i < 150; i++) {
    const y = Math.random() * size;
    const x = Math.random() * size;
    const w = 40 + Math.random() * 100;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y + (Math.random() - 0.5) * 8);
    const shade = 110 + Math.floor(Math.random() * 36);
    ctx.strokeStyle = `rgba(${shade},${shade},255,0.5)`;
    ctx.lineWidth = 0.5 + Math.random() * 1.5;
    ctx.stroke();
  }

  // Grain bumps underneath
  for (let i = 0; i < 600; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 2 + Math.random() * 5;
    const shade = 118 + Math.floor(Math.random() * 20);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${shade},${shade},255,0.2)`;
    ctx.fill();
  }

  // Large creases
  for (let i = 0; i < 20; i++) {
    const x1 = Math.random() * size;
    const y1 = Math.random() * size;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo(
      x1 + (Math.random() - 0.5) * 150,
      y1 + (Math.random() - 0.5) * 30,
      x1 + (Math.random() - 0.5) * 300,
      y1 + (Math.random() - 0.5) * 20
    );
    ctx.strokeStyle = `rgba(${105 + Math.random() * 46},128,255,0.35)`;
    ctx.lineWidth = 1 + Math.random() * 2;
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 1);
  return tex;
}

// ─── Procedural roughness map ───────────────────────────────────────
function createRoughnessMap(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = 'rgb(150,150,150)';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 600; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 3 + Math.random() * 15;
    const v = 110 + Math.floor(Math.random() * 90);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${v},${v},${v},0.25)`;
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 1);
  return tex;
}

// ─── Silobolsa Geometry ─────────────────────────────────────────────
// Fully sealed tube with integrated wrinkle detail at ends
function createSilobolsaGeometry(
  length: number,
  radius: number,
  radialSegments: number,
  lengthSegments: number,
  seed: number = 42
): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const seededRandom = (n: number) => {
    const x = Math.sin(n * 127.1 + seed * 311.7) * 43758.5453;
    return x - Math.floor(x);
  };

  const halfLen = length / 2;

  for (let j = 0; j <= lengthSegments; j++) {
    const t = j / lengthSegments;
    const z = -halfLen + t * length;

    for (let i = 0; i <= radialSegments; i++) {
      const theta = (i / radialSegments) * Math.PI * 2;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);

      let r = radius;

      // 1. End taper — smooth close to zero at tips
      const endFalloff = 0.13;
      let endFactor = 1.0;
      if (t < endFalloff) {
        const et = t / endFalloff;
        endFactor = et * et * (3 - 2 * et); // smoothstep to 0
      } else if (t > 1 - endFalloff) {
        const et = (1 - t) / endFalloff;
        endFactor = et * et * (3 - 2 * et);
      }
      r *= endFactor;

      // 2. End wrinkles — radial folds near tips (integrated, no separate mesh)
      if (endFactor < 0.9 && endFactor > 0.01) {
        const wrinkle = Math.sin(theta * 7) * 0.015 * (1 - endFactor);
        r += wrinkle;
        // Slight twist
        const twist = (1 - endFactor) * 0.5;
        const twistedR = Math.sin((theta + twist) * 5) * 0.008 * (1 - endFactor);
        r += twistedR;
      }

      // 3. Gravity sag
      if (sinT < 0) {
        r *= 1.0 - 0.15 * Math.abs(sinT);
      } else {
        r *= 1.0 + 0.05 * sinT;
      }

      // 4. Grain bumps
      const b1 = seededRandom(j * 17 + i * 7);
      const b2 = seededRandom(j * 31 + i * 13);
      const bump = Math.sin(t * Math.PI * 8 + theta * 3) * 0.025 * b1
        + Math.sin(t * Math.PI * 14 + theta * 5) * 0.015 * b2
        + Math.sin(t * Math.PI * 4) * Math.cos(theta * 2) * 0.02;
      r += bump * endFactor;

      // 5. Belly sag
      r += Math.sin(t * Math.PI) * 0.05;

      // Clamp to avoid negative radius
      r = Math.max(r, 0);

      positions.push(cosT * r, sinT * r, z);
      normals.push(cosT, sinT, 0);
      uvs.push(i / radialSegments, t);
    }
  }

  // Index buffer
  for (let j = 0; j < lengthSegments; j++) {
    for (let i = 0; i < radialSegments; i++) {
      const a = j * (radialSegments + 1) + i;
      const b = a + radialSegments + 1;
      const c = a + 1;
      const d = b + 1;
      indices.push(a, b, c);
      indices.push(c, b, d);
    }
  }

  // Front cap
  const fc = positions.length / 3;
  positions.push(0, 0, -halfLen);
  normals.push(0, 0, -1);
  uvs.push(0.5, 0);
  for (let i = 0; i < radialSegments; i++) {
    indices.push(fc, i + 1, i);
  }

  // Back cap
  const bc = positions.length / 3;
  positions.push(0, 0, halfLen);
  normals.push(0, 0, 1);
  uvs.push(0.5, 1);
  const lastRow = lengthSegments * (radialSegments + 1);
  for (let i = 0; i < radialSegments; i++) {
    indices.push(bc, lastRow + i, lastRow + i + 1);
  }

  geo.setIndex(indices);
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.computeVertexNormals();

  return geo;
}

// ─── Sensor HUD Card ────────────────────────────────────────────────
function SensorHUD({
  position,
  anchorPos,
  label,
  value,
  unit,
  color,
  icon,
  scrollProgress,
}: {
  position: [number, number, number];
  anchorPos: [number, number, number];
  label: string;
  value: number | string;
  unit: string;
  color: string;
  icon: string;
  scrollProgress: number;
}) {
  const dotRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (dotRef.current) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.4;
      dotRef.current.scale.setScalar(s);
    }
  });

  // Midpoint arc
  const mid: [number, number, number] = [
    (anchorPos[0] + position[0]) / 2,
    Math.max(anchorPos[1], position[1]) + 0.2,
    (anchorPos[2] + position[2]) / 2,
  ];

  const visible = scrollProgress < 0.35;

  return (
    <group>
      {/* Connector line */}
      <Line
        points={[anchorPos, mid, position]}
        color={color}
        lineWidth={1.5}
        transparent
        opacity={visible ? 0.5 : 0}
        dashed
        dashSize={0.04}
        gapSize={0.025}
      />

      {/* Pulsing dot on silo surface */}
      <mesh ref={dotRef} position={anchorPos}>
        <sphereGeometry args={[0.018, 8, 8]} />
        <meshBasicMaterial color={color} transparent opacity={visible ? 1 : 0} />
      </mesh>

      {/* HUD card */}
      <Html
        position={position}
        className="pointer-events-none"
        style={{
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.8s ease',
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div
          style={{
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(16px)',
            border: `1px solid ${color}40`,
            borderRadius: '14px',
            boxShadow: `0 0 24px ${color}18, inset 0 1px 0 rgba(255,255,255,0.06)`,
            minWidth: '130px',
            overflow: 'hidden',
          }}
        >
          {/* Top accent line */}
          <div style={{
            height: '2px',
            background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          }} />
          <div style={{ padding: '10px 14px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '4px',
            }}>
              <span style={{ fontSize: '13px' }}>{icon}</span>
              <span style={{
                fontSize: '9px',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase' as const,
                color: `${color}cc`,
              }}>
                {label}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
              <span style={{
                fontSize: '22px',
                fontWeight: 900,
                color: color,
                textShadow: `0 0 14px ${color}50`,
                fontFamily: 'monospace',
              }}>
                {value}
              </span>
              <span style={{
                fontSize: '11px',
                color: 'rgba(255,255,255,0.4)',
                fontWeight: 500,
              }}>
                {unit}
              </span>
            </div>
          </div>
        </div>
      </Html>
    </group>
  );
}

// ─── Realistic Silobolsa ────────────────────────────────────────────
function RealisticSilobolsa() {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const originalPositions = useRef<Float32Array | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.body.scrollHeight - window.innerHeight;
      setScrollProgress(totalScroll > 0 ? window.scrollY / totalScroll : 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [liveData, setLiveData] = useState({ hum: 18.2, co2: 1200, temp: 22.1 });

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

  // Textures
  const normalMap = useMemo(() => {
    if (typeof document === 'undefined') return null;
    return createPlasticNormalMap();
  }, []);

  const roughnessMap = useMemo(() => {
    if (typeof document === 'undefined') return null;
    return createRoughnessMap();
  }, []);

  // Geometry
  const geometry = useMemo(() => {
    return createSilobolsaGeometry(5.0, 0.55, 32, 64, 42);
  }, []);

  useEffect(() => {
    if (geometry) {
      const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
      originalPositions.current = new Float32Array(posAttr.array);
    }
  }, [geometry]);

  // Animation
  useFrame((state) => {
    if (!groupRef.current || !meshRef.current) return;
    const t = state.clock.elapsedTime;

    // Scroll rotation
    const targetRotY = scrollProgress * Math.PI * 2;
    const targetRotX = Math.sin(scrollProgress * Math.PI) * 0.3;
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, 0.04);
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX, 0.04);
    groupRef.current.position.y = Math.sin(t * 0.5) * 0.08;

    // Vertex breathing + wind
    if (originalPositions.current && meshRef.current.geometry) {
      const posAttr = meshRef.current.geometry.getAttribute('position') as THREE.BufferAttribute;
      const orig = originalPositions.current;

      for (let i = 0; i < posAttr.count; i++) {
        const ox = orig[i * 3];
        const oy = orig[i * 3 + 1];
        const oz = orig[i * 3 + 2];

        const breathe = Math.sin(t * 1.2 + oz * 0.8) * 0.005;
        const wind = Math.sin(t * 2.5 + oz * 3.0 + ox * 2.0) * 0.003;

        const r = Math.sqrt(ox * ox + oy * oy);
        if (r > 0.02) {
          const s = 1 + (breathe + wind) / r;
          posAttr.setX(i, ox * s);
          posAttr.setY(i, oy * s);
        }
        posAttr.setZ(i, oz);
      }
      posAttr.needsUpdate = true;
    }
  });

  const scale = scrollProgress > 0.1 ? 1.8 + scrollProgress * 0.5 : 1.5;
  const zPos = scrollProgress > 0.1 ? 1.5 : 0;

  return (
    <group ref={groupRef} scale={scale} position={[0, 0, zPos]} rotation={[0, Math.PI / 6, 0]}>
      {/* Main body with textures */}
      <mesh ref={meshRef} geometry={geometry} castShadow receiveShadow>
        <meshPhysicalMaterial
          color="#d5d0c8"
          roughness={0.72}
          metalness={0.0}
          clearcoat={0.06}
          clearcoatRoughness={0.9}
          envMapIntensity={0.4}
          emissive="#6b9880"
          emissiveIntensity={0.12}
          side={THREE.DoubleSide}
          normalMap={normalMap}
          normalScale={new THREE.Vector2(0.5, 0.5)}
          roughnessMap={roughnessMap}
        />
      </mesh>

      {/* Inner grain glow */}
      <mesh geometry={geometry} scale={0.93}>
        <meshStandardMaterial
          color="#b8922e"
          roughness={1}
          metalness={0}
          transparent
          opacity={0.1}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Top seam */}
      <SeamLine length={5.0} />

      {/* Sensor HUDs with connector lines */}
      <SensorHUD
        anchorPos={[0.3, 0.45, -0.8]}
        position={[1.1, 1.0, -1.0]}
        label="Humedad"
        value={liveData.hum}
        unit="%"
        color="#ef4444"
        icon="💧"
        scrollProgress={scrollProgress}
      />
      <SensorHUD
        anchorPos={[-0.35, 0.3, 0.2]}
        position={[-1.2, 0.85, 0.2]}
        label="CO₂"
        value={liveData.co2}
        unit="ppm"
        color="#f59e0b"
        icon="🌫️"
        scrollProgress={scrollProgress}
      />
      <SensorHUD
        anchorPos={[0.25, 0.4, 1.3]}
        position={[1.1, 0.95, 1.5]}
        label="Temp"
        value={liveData.temp}
        unit="°C"
        color="#10b981"
        icon="🌡️"
        scrollProgress={scrollProgress}
      />
    </group>
  );
}

// ─── Seam line ──────────────────────────────────────────────────────
function SeamLine({ length }: { length: number }) {
  const points = useMemo(() => {
    const pts: [number, number, number][] = [];
    const segments = 60;
    const halfLen = length / 2;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const z = -halfLen + t * length;
      // Only draw seam in the non-tapered section
      const endT = 0.13;
      if (t < endT || t > 1 - endT) continue;
      const y = 0.56 + Math.sin(t * Math.PI * 6) * 0.004;
      const x = Math.sin(t * Math.PI * 10) * 0.002;
      pts.push([x, y, z]);
    }
    return pts;
  }, [length]);

  if (points.length < 2) return null;

  return (
    <Line
      points={points}
      color="#aaaaaa"
      transparent
      opacity={0.35}
      lineWidth={1.5}
    />
  );
}

// ─── Ground ─────────────────────────────────────────────────────────
function GroundPlane() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.65, 0]} receiveShadow>
      <planeGeometry args={[20, 20]} />
      <meshStandardMaterial color="#1a1a1a" roughness={1} metalness={0} transparent opacity={0.3} />
    </mesh>
  );
}

// ─── Data Particles ─────────────────────────────────────────────────
function DataParticles() {
  const ref = useRef<THREE.Points>(null);
  const [sphere] = useState(
    () => random.inSphere(new Float32Array(5000), { radius: 10 }) as Float32Array
  );

  useFrame((_state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 15;
      ref.current.rotation.y -= delta / 20;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false}>
        <PointMaterial transparent color="#34d399" size={0.05} sizeAttenuation depthWrite={false} opacity={0.4} />
      </Points>
    </group>
  );
}

// ─── Main Scene ─────────────────────────────────────────────────────
export function Scene3D() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none mix-blend-screen bg-black">
      <Canvas
        camera={{ position: [0, 1.5, 7], fov: 40 }}
        shadows="basic"
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 1.5]}
      >
        <fog attach="fog" args={['#000', 6, 18]} />

        <directionalLight
          position={[8, 12, 6]}
          intensity={2.5}
          color="#fff5e6"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-far={30}
          shadow-camera-left={-5}
          shadow-camera-right={5}
          shadow-camera-top={5}
          shadow-camera-bottom={-5}
          shadow-bias={-0.001}
        />
        <directionalLight position={[-6, 4, -4]} intensity={0.6} color="#b0c4de" />
        <ambientLight intensity={0.4} color="#c8d8e8" />
        <pointLight position={[0, -2, 0]} intensity={0.3} color="#4a7c59" />
        <pointLight position={[-4, 3, -6]} intensity={0.5} color="#10b981" />

        <RealisticSilobolsa />
        <DataParticles />
        <GroundPlane />

        <ContactShadows position={[0, -0.64, 0]} opacity={0.4} scale={12} blur={2.5} far={4} color="#000000" />
        <Environment preset="sunset" environmentIntensity={0.3} />
      </Canvas>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000_100%)] pointer-events-none" />
    </div>
  );
}
