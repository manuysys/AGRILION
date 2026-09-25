"use client";

import React, { useRef, useEffect } from "react";

export default function ParticleSphereAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    const particles: { x: number; y: number; z: number }[] = [];
    const numParticles = 600;
    const radius = 0.4;

    // Distribute particles on a sphere (Fibonacci sphere)
    for (let i = 0; i < numParticles; i++) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / numParticles);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      particles.push({
        x: radius * Math.sin(phi) * Math.cos(theta),
        y: radius * Math.sin(phi) * Math.sin(theta),
        z: radius * Math.cos(phi),
      });
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener("resize", resize);

    let angle = 0;

    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const cx = w / 2;
      const cy = h / 2;
      const scale = Math.min(w, h);

      ctx.clearRect(0, 0, w, h);

      angle += 0.004;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      // Tilt rotation
      const tilt = 0.3;
      const cosT = Math.cos(tilt);
      const sinT = Math.sin(tilt);

      const projected: { sx: number; sy: number; depth: number }[] = [];

      for (const p of particles) {
        // Rotate around Y axis
        const x1 = p.x * cosA - p.z * sinA;
        const z1 = p.x * sinA + p.z * cosA;
        const y1 = p.y;

        // Tilt around X axis
        const y2 = y1 * cosT - z1 * sinT;
        const z2 = y1 * sinT + z1 * cosT;

        const depth = (z2 + radius) / (2 * radius); // 0 to 1

        projected.push({
          sx: cx + x1 * scale,
          sy: cy + y2 * scale,
          depth,
        });
      }

      // Sort by depth (back to front)
      projected.sort((a, b) => a.depth - b.depth);

      for (const pt of projected) {
        const r = 1 + pt.depth * 2;
        const alpha = 0.1 + pt.depth * 0.7;
        // Emerald green with depth-based brightness
        const g = Math.floor(120 + pt.depth * 65);
        ctx.beginPath();
        ctx.arc(pt.sx, pt.sy, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(16, ${g}, 129, ${alpha})`;
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ display: "block" }}
    />
  );
}
