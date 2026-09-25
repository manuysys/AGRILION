'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Points, PointMaterial, Html, ContactShadows, Line } from '@react-three/drei';
import { useRef, useState, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { random } from 'maath';

// Suppress THREE.Clock deprecation warning (Three.js v0.184 deprecated Clock
// in favor of Timer, but R3F still uses Clock internally — upstream issue)
if (typeof window !== 'undefined') {
  const _warn = console.warn;
  console.warn = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('THREE.Clock')) return;
    _warn.apply(console, args);
  };
}

// ═══════════════════════════════════════════════════════════════════════
// PROCEDURAL TEXTURES
// ═══════════════════════════════════════════════════════════════════════

function createNormalMap(): THREE.CanvasTexture {
  const S = 512;
  const c = document.createElement('canvas');
  c.width = S; c.height = S;
  const g = c.getContext('2d')!;

  g.fillStyle = 'rgb(128,128,255)';
  g.fillRect(0, 0, S, S);

  // Longitudinal wrinkles
  for (let i = 0; i < 120; i++) {
    const x = Math.random() * S;
    const y = Math.random() * S;
    const len = 50 + Math.random() * 150;
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(x + len * 0.5, y + (Math.random() - 0.5) * 12, x + len, y + (Math.random() - 0.5) * 6);
    const nv = 108 + Math.floor(Math.random() * 40);
    g.strokeStyle = `rgba(${nv},${nv},255,0.45)`;
    g.lineWidth = 0.5 + Math.random() * 2;
    g.stroke();
  }

  // Grain bumps underneath
  for (let i = 0; i < 800; i++) {
    const x = Math.random() * S;
    const y = Math.random() * S;
    const r = 1.5 + Math.random() * 4;
    const nx = 128 + Math.floor((Math.random() - 0.5) * 30);
    const ny = 128 + Math.floor((Math.random() - 0.5) * 30);
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fillStyle = `rgba(${nx},${ny},255,0.18)`;
    g.fill();
  }

  // Broad undulations
  for (let i = 0; i < 8; i++) {
    const cx = Math.random() * S;
    const cy = Math.random() * S;
    const rad = 30 + Math.random() * 80;
    const grad = g.createRadialGradient(cx, cy, 0, cx, cy, rad);
    const ns = Math.floor((Math.random() - 0.5) * 20);
    grad.addColorStop(0, `rgba(${128 + ns},${128 + ns},255,0.2)`);
    grad.addColorStop(1, 'rgba(128,128,255,0)');
    g.fillStyle = grad;
    g.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 1.5);
  return tex;
}

function createDiffuseMap(): THREE.CanvasTexture {
  const S = 512;
  const c = document.createElement('canvas');
  c.width = S; c.height = S;
  const g = c.getContext('2d')!;

  // Off-white plastic base
  g.fillStyle = '#d8d4cc';
  g.fillRect(0, 0, S, S);

  // Dirt stains
  for (let i = 0; i < 15; i++) {
    const cx = Math.random() * S;
    const cy = Math.random() * S;
    const rad = 20 + Math.random() * 100;
    const grad = g.createRadialGradient(cx, cy, 0, cx, cy, rad);
    const colors = ['rgba(180,170,145,0.12)', 'rgba(165,155,130,0.1)', 'rgba(190,180,160,0.08)'];
    grad.addColorStop(0, colors[Math.floor(Math.random() * 3)]);
    grad.addColorStop(1, 'rgba(216,212,204,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, S, S);
  }

  // Fine dust
  for (let i = 0; i < 2000; i++) {
    const x = Math.random() * S;
    const y = Math.random() * S;
    const v = 170 + Math.floor(Math.random() * 50);
    g.fillStyle = `rgba(${v},${v - 5},${v - 15},0.06)`;
    g.fillRect(x, y, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }

  // Printed Branding Text
  g.save();
  g.translate(S / 2, S / 2);
  g.rotate(-Math.PI / 2); // Rotate text so it reads along the length
  g.fillStyle = 'rgba(20, 20, 20, 0.7)';
  g.font = 'bold 36px monospace';
  g.textAlign = 'center';
  g.fillText('SILO-BOLSA', 0, -40);
  g.font = '24px monospace';
  g.fillText('AGRICULTURA ARG.', 0, -10);
  g.font = '16px monospace';
  g.fillText('100% VIRGEN - 7 CAPAS', 0, 15);
  // Barcode simulation
  for (let i = 0; i < 40; i++) {
    const w = Math.random() > 0.5 ? 2 : 4;
    g.fillRect(-100 + i * 5, 30, w, 20);
  }
  g.restore();

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 1.5);
  return tex;
}

function createRoughnessMap(): THREE.CanvasTexture {
  const S = 256;
  const c = document.createElement('canvas');
  c.width = S; c.height = S;
  const g = c.getContext('2d')!;

  g.fillStyle = 'rgb(175,175,175)';
  g.fillRect(0, 0, S, S);

  for (let i = 0; i < 400; i++) {
    const x = Math.random() * S;
    const y = Math.random() * S;
    const r = 3 + Math.random() * 20;
    const v = 140 + Math.floor(Math.random() * 70);
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fillStyle = `rgba(${v},${v},${v},0.2)`;
    g.fill();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 1.5);
  return tex;
}

// ═══════════════════════════════════════════════════════════════════════
// SILOBOLSA GEOMETRY — Built on THREE.CylinderGeometry (guaranteed valid)
// ═══════════════════════════════════════════════════════════════════════
//
// Strategy: Start from a standard CylinderGeometry (which has correct
// normals, UVs, indices, and caps with NO NaN issues), then modify
// vertex positions to create the silobolsa shape.
//
function createSilobolsaGeometry(
  length: number,
  radius: number,
  radialSegs: number,
  lengthSegs: number,
  seed: number
): THREE.CylinderGeometry {
  const geo = new THREE.CylinderGeometry(radius, radius, length, radialSegs, lengthSegs, false);
  const pos = geo.getAttribute('position');
  const halfLen = length / 2;

  const hash = (n: number) => {
    const x = Math.sin(n * 127.1 + seed * 311.7) * 43758.5453;
    return x - Math.floor(x);
  };

  for (let i = 0; i < pos.count; i++) {
    const px = pos.getX(i);
    const py = pos.getY(i);
    const pz = pos.getZ(i);

    const dist = Math.sqrt(px * px + pz * pz);
    const angle = Math.atan2(pz, px);
    const t = (py + halfLen) / length;

    if (dist < 0.001) continue;

    let newR = dist;
    
    // 1. Scrunched ends like a tied plastic bag
    const endZone = 0.14; 
    let endScale = 1.0;
    
    const getShape = (p: number) => {
      if (p > 0.02) {
        // Dome part
        const pNorm = (p - 0.02) / 0.98;
        const x = 1.0 - pNorm;
        return 0.12 + 0.88 * Math.sqrt(Math.max(0, 1 - Math.pow(x, 2.2)));
      } else {
        // The tied knot
        return 0.03 + 0.09 * (p / 0.02);
      }
    };

    if (t < endZone) endScale = getShape(t / endZone);
    else if (t > 1 - endZone) endScale = getShape((1 - t) / endZone);
    
    newR *= endScale;

    // 2. Heavy longitudinal wrinkles (arrugas características)
    if (endScale < 0.98) {
      // Strong sharp folds at the ends
      const intensity = Math.pow(1 - endScale, 1.2) * 3.0; // Increased
      newR += Math.sin(angle * 18) * 0.03 * intensity * radius;
      newR += Math.sin(angle * 28 + 1.2) * 0.02 * intensity * radius;
      newR += Math.cos(angle * 10 - 0.5) * 0.025 * intensity * radius;
    }

    // Body longitudinal folds (the plastic stretching)
    if (endScale > 0.4) {
      newR += Math.sin(angle * 8 + t * 2) * 0.015 * endScale;
      newR += Math.cos(angle * 14 - t * 3) * 0.01 * endScale;
      newR += Math.sin(angle * 5) * 0.018 * endScale;
    }

    // 3. Gravity sag
    const sinAngle = Math.sin(angle);
    if (sinAngle < 0) {
      newR *= 1.0 - 0.15 * Math.abs(sinAngle) * endScale; // flatten bottom heavily
    } else {
      newR *= 1.0 + 0.02 * sinAngle * endScale; // round top slightly
    }

    // 4. Irregular bumps (grain inside)
    if (endScale > 0.7) {
      const idx = Math.floor(t * lengthSegs);
      const ai = Math.floor((angle / (Math.PI * 2) + 0.5) * radialSegs);
      const bump = hash(idx * 13 + ai * 7) * 0.004;
      newR += bump * endScale;
    }

    // 5. Belly sag
    newR += Math.sin(t * Math.PI) * 0.04 * endScale;

    // 6. Transversal plastic seams
    if (endScale > 0.9) {
      newR += Math.sin(t * Math.PI * 80) * 0.002;
    }

    newR = Math.max(newR, radius * 0.01);
    const scale = newR / dist;
    pos.setX(i, px * scale);
    pos.setZ(i, pz * scale);
  }

  geo.computeVertexNormals();
  return geo;
}

// ═══════════════════════════════════════════════════════════════════════
// SENSOR HUD
// ═══════════════════════════════════════════════════════════════════════

function SensorHUD({
  anchorPos, position, label, value, unit, color, icon, visible,
}: {
  anchorPos: [number, number, number];
  position: [number, number, number];
  label: string;
  value: number | string;
  unit: string;
  color: string;
  icon: string;
  visible: boolean;
}) {
  const dotRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (dotRef.current) {
      dotRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 3) * 0.35);
    }
  });

  const mid: [number, number, number] = [
    (anchorPos[0] + position[0]) / 2,
    Math.max(anchorPos[1], position[1]) + 0.15,
    (anchorPos[2] + position[2]) / 2,
  ];

  return (
    <group>
      <Line
        points={[anchorPos, mid, position]}
        color={color}
        lineWidth={1.5}
        transparent
        opacity={visible ? 0.45 : 0}
        dashed
        dashSize={0.04}
        gapSize={0.025}
      />
      <mesh ref={dotRef} position={anchorPos}>
        <sphereGeometry args={[0.018, 8, 8]} />
        <meshBasicMaterial color={color} transparent opacity={visible ? 1 : 0} />
      </mesh>
      <Html
        position={position}
        className="pointer-events-none"
        style={{
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.8s ease',
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div style={{
          background: 'rgba(0,0,0,0.78)',
          backdropFilter: 'blur(16px)',
          border: `1px solid ${color}40`,
          borderRadius: '14px',
          boxShadow: `0 0 24px ${color}18, inset 0 1px 0 rgba(255,255,255,0.06)`,
          minWidth: '130px',
          overflow: 'hidden',
        }}>
          <div style={{ height: '2px', background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
          <div style={{ padding: '10px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span style={{ fontSize: '13px' }}>{icon}</span>
              <span style={{
                fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em',
                textTransform: 'uppercase' as const, color: `${color}cc`,
              }}>{label}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
              <span style={{
                fontSize: '22px', fontWeight: 900, color,
                textShadow: `0 0 14px ${color}50`, fontFamily: 'monospace',
              }}>{value}</span>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>{unit}</span>
            </div>
          </div>
        </div>
      </Html>
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// SILOBOLSA COMPONENT
// ═══════════════════════════════════════════════════════════════════════

function RealisticSilobolsa() {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const origPositions = useRef<Float32Array | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const total = document.body.scrollHeight - window.innerHeight;
      setScrollProgress(total > 0 ? window.scrollY / total : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const [liveData, setLiveData] = useState({ hum: 18.2, co2: 1200, temp: 22.1 });
  useEffect(() => {
    const id = setInterval(() => {
      setLiveData(p => ({
        hum: Number((p.hum + (Math.random() * 0.4 - 0.2)).toFixed(1)),
        co2: Math.floor(p.co2 + (Math.random() * 10 - 5)),
        temp: Number((p.temp + (Math.random() * 0.2 - 0.1)).toFixed(1)),
      }));
    }, 2000);
    return () => clearInterval(id);
  }, []);

  // Textures
  const normalMap = useMemo(() => typeof document !== 'undefined' ? createNormalMap() : null, []);
  const diffuseMap = useMemo(() => typeof document !== 'undefined' ? createDiffuseMap() : null, []);
  const roughnessMap = useMemo(() => typeof document !== 'undefined' ? createRoughnessMap() : null, []);

  // Geometry: CylinderGeometry base, modified for silobolsa shape
  // CylinderGeometry is along Y-axis, we rotate the mesh to lay along Z
  const geometry = useMemo(() => createSilobolsaGeometry(5.0, 0.55, 64, 128, 42), []);

  // Store original positions for animation
  useEffect(() => {
    if (geometry) {
      const p = geometry.getAttribute('position') as THREE.BufferAttribute;
      origPositions.current = new Float32Array(p.array);
    }
  }, [geometry]);

  // Animation
  useFrame((state) => {
    if (!groupRef.current || !meshRef.current) return;
    const t = state.clock.elapsedTime;

    // Scroll Parallax and Subtle floating
    const parallaxY = Math.sin(scrollProgress * Math.PI) * 0.8 - 0.4;
    groupRef.current.position.y = Math.sin(t * 0.5) * 0.06 + parallaxY;
    groupRef.current.rotation.x = 0.1 + (scrollProgress - 0.5) * 0.2; // Slight tilt
    groupRef.current.rotation.z = (scrollProgress - 0.5) * 0.1;

    // Subtle vertex breathing + wind
    if (origPositions.current && meshRef.current.geometry) {
      const posAttr = meshRef.current.geometry.getAttribute('position') as THREE.BufferAttribute;
      const orig = origPositions.current;

      for (let i = 0; i < posAttr.count; i++) {
        const ox = orig[i * 3];
        const oy = orig[i * 3 + 1]; // Y = length axis
        const oz = orig[i * 3 + 2];

        // Radial distance in XZ plane (CylinderGeometry is Y-up)
        const dist = Math.sqrt(ox * ox + oz * oz);

        // Only animate body vertices, not caps or near-center
        if (dist > 0.08) {
          const breathe = Math.sin(t * 1.0 + oy * 0.6) * 0.004;
          const wind = Math.sin(t * 2.0 + oy * 2.5 + ox * 1.5) * 0.003;
          const s = 1 + (breathe + wind) / dist;
          posAttr.setX(i, ox * s);
          posAttr.setZ(i, oz * s);
        }
      }
      posAttr.needsUpdate = true;
    }
  });

  const scale = 1.6;
  const showHUD = true;

  return (
    <group
      ref={groupRef}
      scale={scale}
      position={[0, -0.2, 0]}
      rotation={[0.1, Math.PI / 5, 0]}
    >
      {/* Main silobolsa body — rotated to lay along Z axis */}
      <mesh ref={meshRef} geometry={geometry} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
        <meshPhysicalMaterial
          map={diffuseMap}
          normalMap={normalMap}
          normalScale={new THREE.Vector2(0.6, 0.6)}
          roughnessMap={roughnessMap}
          roughness={0.75}
          metalness={0.0}
          clearcoat={0.04}
          clearcoatRoughness={0.95}
          envMapIntensity={0.35}
          emissive="#7aa88a"
          emissiveIntensity={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Inner grain glow */}
      <mesh geometry={geometry} rotation={[0, 0, Math.PI / 2]} scale={0.94}>
        <meshStandardMaterial
          color="#b0882a"
          roughness={1}
          metalness={0}
          transparent
          opacity={0.08}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Ropes at ends */}
      <mesh position={[-2.45, 0, 0]} rotation={[0, Math.PI/2, 0]}>
        <torusGeometry args={[0.08, 0.015, 8, 24]} />
        <meshStandardMaterial color="#333" roughness={0.9} />
      </mesh>
      <mesh position={[2.45, 0, 0]} rotation={[0, Math.PI/2, 0]}>
        <torusGeometry args={[0.08, 0.015, 8, 24]} />
        <meshStandardMaterial color="#333" roughness={0.9} />
      </mesh>

      {/* Top seam */}
      <SeamLine length={5.0} />

      {/* Sensor HUDs */}
      <SensorHUD
        anchorPos={[-1.2, 0.5, 0.1]}
        position={[-1.5, 1.2, 0.5]}
        label="Humedad" value={liveData.hum} unit="%" color="#ef4444" icon="💧"
        visible={showHUD}
      />
      <SensorHUD
        anchorPos={[0.1, 0.55, -0.1]}
        position={[0.0, 1.3, -0.5]}
        label="CO₂" value={liveData.co2} unit="ppm" color="#f59e0b" icon="🌫️"
        visible={showHUD}
      />
      <SensorHUD
        anchorPos={[1.3, 0.45, 0.2]}
        position={[1.5, 1.1, 0.5]}
        label="Temp" value={liveData.temp} unit="°C" color="#10b981" icon="🌡️"
        visible={showHUD}
      />
    </group>
  );
}

// ─── Seam line ──────────────────────────────────────────────────────
function SeamLine({ length }: { length: number }) {
  const pts = useMemo(() => {
    const out: [number, number, number][] = [];
    const n = 50;
    const h = length / 2;
    const endT = 0.14;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      if (t < endT || t > 1 - endT) continue;
      const z = -h + t * length;
      out.push([
        Math.sin(t * Math.PI * 10) * 0.002,
        0.56 + Math.sin(t * Math.PI * 6) * 0.003,
        z,
      ]);
    }
    return out;
  }, [length]);

  if (pts.length < 2) return null;
  return <Line points={pts} color="#aaa" transparent opacity={0.3} lineWidth={1.5} />;
}

// ─── Data Particles ─────────────────────────────────────────────────
function DataParticles() {
  const ref = useRef<THREE.Points>(null);
  // Use count divisible by 3 to avoid partial point data
  const [sphere] = useState(
    () => random.inSphere(new Float32Array(4998), { radius: 10 }) as Float32Array
  );

  useFrame((_, dt) => {
    if (ref.current) {
      ref.current.rotation.x -= dt / 15;
      ref.current.rotation.y -= dt / 20;
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

// ═══════════════════════════════════════════════════════════════════════
// SCENE
// ═══════════════════════════════════════════════════════════════════════

export function Scene3D() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none mix-blend-screen bg-black">
      <Canvas
        camera={{ position: [0, 1.5, 7], fov: 40 }}
        shadows="basic"
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 1.5]}
      >
        <fog attach="fog" args={['#000', 6, 18]} />

        <directionalLight
          position={[8, 12, 6]} intensity={2.5} color="#fff5e6"
          castShadow
          shadow-mapSize-width={1024} shadow-mapSize-height={1024}
          shadow-camera-far={30}
          shadow-camera-left={-5} shadow-camera-right={5}
          shadow-camera-top={5} shadow-camera-bottom={-5}
          shadow-bias={-0.001}
        />
        <directionalLight position={[-6, 4, -4]} intensity={0.6} color="#b0c4de" />
        <ambientLight intensity={0.4} color="#c8d8e8" />
        <pointLight position={[0, -2, 0]} intensity={0.3} color="#4a7c59" />
        <pointLight position={[-4, 3, -6]} intensity={0.5} color="#10b981" />

        <RealisticSilobolsa />
        <DataParticles />

        <ContactShadows position={[0, -0.64, 0]} opacity={0.4} scale={12} blur={2.5} far={4} color="#000" />
        <Environment preset="sunset" environmentIntensity={0.3} />
      </Canvas>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000_100%)] pointer-events-none" />
    </div>
  );
}
