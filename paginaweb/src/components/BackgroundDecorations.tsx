"use client";

import { useRef, useEffect } from "react";
import { gsap, ScrollTrigger } from "@/lib/animations";

export default function BackgroundDecorations() {
  const lineRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (lineRef.current) {
        gsap.to(lineRef.current, {
          scaleY: 1,
          ease: "none",
          scrollTrigger: { trigger: document.documentElement, start: "top top", end: "bottom bottom", scrub: 0.3 },
        });
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none z-20 overflow-hidden" aria-hidden="true">
      {/* Scroll progress line — clean vertical line */}
      <div
        ref={lineRef}
        className="absolute left-[8%] top-0 bottom-0 w-px origin-top"
        style={{
          transform: "scaleY(0)",
          background: "linear-gradient(180deg, transparent 0%, #15803d 15%, #2563eb 50%, #15803d 85%, transparent 100%)",
        }}
      />
    </div>
  );
}
