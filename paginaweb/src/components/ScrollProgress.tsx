"use client";

import { useRef, useEffect } from "react";
import { gsap, ScrollTrigger } from "@/lib/animations";

export default function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    gsap.to(bar, {
      scaleX: 1,
      ease: "none",
      scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: 0.3 },
    });
  }, []);

  return (
    <div ref={barRef} className="fixed top-0 left-0 right-0 h-[3px] z-[60] origin-left" style={{ transform: "scaleX(0)", background: "linear-gradient(90deg, #15803d, #2563eb)" }} />
  );
}
