"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type BeamTone = "ok" | "warn" | "critical";

interface BeamsBackgroundProps {
  className?: string;
  intensity?: "subtle" | "medium" | "strong";
  tone?: BeamTone;
  beamCount?: number;
}

interface Beam {
  x: number;
  y: number;
  width: number;
  length: number;
  angle: number;
  speed: number;
  opacity: number;
  hue: number;
  pulse: number;
  pulseSpeed: number;
}

const TONE_HUES: Record<BeamTone, [number, number]> = {
  ok: [150, 210], // verde / cian
  warn: [25, 45], // ámbar / naranja
  critical: [0, 18], // rojo
};

const OPACITY_MAP = {
  subtle: 0.7,
  medium: 0.85,
  strong: 1,
};

function createBeam(width: number, height: number, tone: BeamTone): Beam {
  const [hueBase, hueSpread] = TONE_HUES[tone];
  return {
    x: Math.random() * width * 1.5 - width * 0.25,
    y: Math.random() * height * 1.5 - height * 0.25,
    width: 30 + Math.random() * 60,
    length: height * 2.5,
    angle: -35 + Math.random() * 10,
    speed: 0.6 + Math.random() * 1.2,
    opacity: 0.12 + Math.random() * 0.16,
    hue: hueBase + Math.random() * hueSpread,
    pulse: Math.random() * Math.PI * 2,
    pulseSpeed: 0.02 + Math.random() * 0.03,
  };
}

export function BeamsBackground({
  className,
  intensity = "strong",
  tone = "ok",
  beamCount = 20,
}: BeamsBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const beamsRef = useRef<Beam[]>([]);
  const animationFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const [hueBase, hueSpread] = TONE_HUES[tone];

    const updateCanvasSize = () => {
      const parent = canvas.parentElement;
      const width = parent?.clientWidth || canvas.clientWidth || 1;
      const height = parent?.clientHeight || canvas.clientHeight || 1;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      // setTransform (no scale) para no acumular la escala en cada resize.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const totalBeams = Math.max(8, Math.round(beamCount * 1.5));
      beamsRef.current = Array.from({ length: totalBeams }, () =>
        createBeam(width, height, tone)
      );
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);

    function resetBeam(beam: Beam, index: number, totalBeams: number) {
      const width = canvas!.clientWidth || 1;
      const height = canvas!.clientHeight || 1;
      const column = index % 3;
      const spacing = width / 3;

      beam.y = height + 100;
      beam.x =
        column * spacing +
        spacing / 2 +
        (Math.random() - 0.5) * spacing * 0.5;
      beam.width = 100 + Math.random() * 100;
      beam.length = height * 2.5;
      beam.speed = 0.5 + Math.random() * 0.4;
      beam.hue = hueBase + (index / totalBeams) * hueSpread;
      beam.opacity = 0.2 + Math.random() * 0.1;
      return beam;
    }

    function drawBeam(context: CanvasRenderingContext2D, beam: Beam) {
      context.save();
      context.translate(beam.x, beam.y);
      context.rotate((beam.angle * Math.PI) / 180);

      const pulsingOpacity =
        beam.opacity *
        (0.8 + Math.sin(beam.pulse) * 0.2) *
        OPACITY_MAP[intensity];

      const gradient = context.createLinearGradient(0, 0, 0, beam.length);

      gradient.addColorStop(0, `hsla(${beam.hue}, 85%, 65%, 0)`);
      gradient.addColorStop(
        0.1,
        `hsla(${beam.hue}, 85%, 65%, ${pulsingOpacity * 0.5})`
      );
      gradient.addColorStop(
        0.4,
        `hsla(${beam.hue}, 85%, 65%, ${pulsingOpacity})`
      );
      gradient.addColorStop(
        0.6,
        `hsla(${beam.hue}, 85%, 65%, ${pulsingOpacity})`
      );
      gradient.addColorStop(
        0.9,
        `hsla(${beam.hue}, 85%, 65%, ${pulsingOpacity * 0.5})`
      );
      gradient.addColorStop(1, `hsla(${beam.hue}, 85%, 65%, 0)`);

      context.fillStyle = gradient;
      context.fillRect(-beam.width / 2, 0, beam.width, beam.length);
      context.restore();
    }

    function animate() {
      const width = canvas!.clientWidth || 1;
      const height = canvas!.clientHeight || 1;

      ctx!.clearRect(0, 0, width, height);
      ctx!.filter = "blur(35px)";

      const totalBeams = beamsRef.current.length;
      beamsRef.current.forEach((beam, index) => {
        beam.y -= beam.speed;
        beam.pulse += beam.pulseSpeed;

        if (beam.y + beam.length < -100) {
          resetBeam(beam, index, totalBeams);
        }

        drawBeam(ctx!, beam);
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      window.removeEventListener("resize", updateCanvasSize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [intensity, tone, beamCount]);

  return (
    <div className={cn("relative h-full w-full overflow-hidden", className)}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        style={{ filter: "blur(15px)" }}
      />
    </div>
  );
}
