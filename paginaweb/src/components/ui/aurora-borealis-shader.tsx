"use client"
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const AuroraBorealisShader = ({ className = "" }: { className?: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1) Renderer + Scene + Camera + Clock
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const clock = new THREE.Clock();

    // 2) GLSL Shaders
    const vertexShader = `
      void main() {
        gl_Position = vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      precision highp float;
      uniform vec2 iResolution;
      uniform float iTime;
      uniform vec2 iMouse;

      float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(random(i), random(i + vec2(1.0,0.0)), u.x),
          mix(random(i + vec2(0.0,1.0)), random(i + vec2(1.0,1.0)), u.x),
          u.y
        );
      }

      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        for (int i = 0; i < 5; i++) {
          v += a * noise(p);
          p *= 2.0;
          a *= 0.5;
        }
        return v;
      }

      void main() {
        // normalized coords (−1..1 on short side)
        vec2 uv    = (gl_FragCoord.xy - 0.5 * iResolution.xy) / iResolution.y;
        vec2 mouse = (iMouse      - 0.5 * iResolution.xy) / iResolution.y;

        float t = iTime * 0.2;

        // base FBM curtain
        vec2 p = uv; 
        // p.y += 0.5; // (removed offset to center it)
        float f = fbm(vec2(p.x * 2.0, p.y * 2.0 + t));
        float curtain = smoothstep(0.1, 0.6, f); // removed bottom fade

        // mouse flare
        float d     = length(uv - mouse);
        float flare = smoothstep(0.3, 0.0, d);

        // Adjust aurora colors to Agrilion brand
        vec3 c1 = vec3(0.05, 0.6, 0.4); // Emerald/Teal
        vec3 c2 = vec3(0.02, 0.2, 0.6); // Deep blueish
        vec3 fc = vec3(1.0);

        vec3 color = mix(c1, c2, p.y) * curtain;
        color += fc * flare * curtain * 2.0;
        
        gl_FragColor = vec4(color, 1.0);
      }
    `;

    // 3) Build mesh
    const uniforms = {
      iTime:       { value: 0 },
      iResolution: { value: new THREE.Vector2() },
      iMouse:      { value: new THREE.Vector2(-100, -100) }
    };

    const material = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms });
    const mesh     = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(mesh);

    // 4) Resize logic
    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);
      uniforms.iResolution.value.set(w, h);
    };
    window.addEventListener('resize', onResize);
    onResize(); // initial sizing

    // 5) Mouse tracking
    const onMouseMove = (e: MouseEvent) => {
      // Find mouse coords relative to the container
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = container.clientHeight - (e.clientY - rect.top); // flip Y for shader coords
      uniforms.iMouse.value.set(x, y);
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', onMouseMove);

    // 6) Animation loop
    renderer.setAnimationLoop(() => {
      uniforms.iTime.value = clock.getElapsedTime();
      renderer.render(scene, camera);
    });

    // 7) Cleanup
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMouseMove);
      renderer.setAnimationLoop(null);

      const canvas = renderer.domElement;
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);

      material.dispose();
      mesh.geometry.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <>
      <div
        ref={containerRef}
        className={`shader-container ${className}`}
        style={{
          position:      'absolute',
          top:           0,
          left:          0,
          width:         '100%',
          height:        '100%',
          zIndex:        -1,
          pointerEvents: 'none'
        }}
        aria-label="Aurora Borealis animated background"
      />
      {/* Optional cursor light */}
      <div
        className="cursor-light"
        style={{
          position:      'fixed',
          top:           0,
          left:          0,
          width:         '20px',
          height:        '20px',
          borderRadius:  '50%',
          background:    'rgba(255,255,255,0.1)',
          transform:     `translate(calc(${mousePos.x}px - 10px), calc(${mousePos.y}px - 10px))`,
          pointerEvents: 'none',
          zIndex: 50,
        }}
      />
    </>
  );
};

export default AuroraBorealisShader;
