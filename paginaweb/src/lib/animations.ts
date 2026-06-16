import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };

/* ── Reduced motion check ── */
export const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

/* ── Hero entrance timeline (enhanced) ── */
export function heroEntrance(refs: {
  badge?: Element | null;
  headlineWords?: Element[] | null;
  subtext?: Element | null;
  ctas?: Element | null;
  pills?: Element | null;
  card?: Element | null;
}) {
  if (prefersReducedMotion()) {
    Object.values(refs).forEach((el) => {
      if (el && el instanceof Element) gsap.set(el, { opacity: 1, y: 0, filter: "blur(0px)" });
    });
    if (refs.headlineWords) refs.headlineWords.forEach((w) => gsap.set(w, { opacity: 1, y: 0, clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)" }));
    return;
  }

  const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

  // Badge
  if (refs.badge) {
    tl.fromTo(refs.badge, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, 0);
  }

  // Headline words — word-by-word clip reveal
  if (refs.headlineWords && refs.headlineWords.length > 0) {
    gsap.set(refs.headlineWords, {
      clipPath: "polygon(0 0, 100% 0, 100% 0, 0 0)",
      y: 24,
      opacity: 0,
    });
    tl.to(refs.headlineWords, {
      clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
      y: 0,
      opacity: 1,
      duration: 0.7,
      stagger: 0.06,
      ease: "power3.out",
    }, 0.2);
  }

  // Subtitle — blur to clear
  if (refs.subtext) {
    gsap.set(refs.subtext, { filter: "blur(6px)", opacity: 0.6 });
    tl.to(refs.subtext, { filter: "blur(0px)", opacity: 1, duration: 0.8, ease: "power2.out" }, 0.5);
  }

  // Pills
  if (refs.pills) {
    tl.fromTo(refs.pills, { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, 0.6);
  }

  // CTAs — spring scale-up
  if (refs.ctas) {
    gsap.set(refs.ctas, { scale: 0.92, opacity: 0 });
    tl.to(refs.ctas, { scale: 1, opacity: 1, duration: 0.7, ease: "back.out(1.7)" }, 0.7);
  }

  // Card — scale in from 0.96
  if (refs.card) {
    tl.fromTo(refs.card, { y: 30, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 0.9, ease: "power3.out" }, 0.4);
  }

  return tl;
}

/* ── Magnetic pull for buttons ── */
export function magneticPull(
  element: HTMLElement | null,
  options: { strength?: number } = {}
) {
  if (!element || prefersReducedMotion()) return () => {};
  const { strength = 12 } = options;

  const handleMouseMove = (e: MouseEvent) => {
    const rect = element.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    gsap.to(element, {
      x: (x / rect.width) * strength,
      y: (y / rect.height) * strength,
      ease: "power2.out",
      duration: 0.3,
      overwrite: "auto",
    });
  };

  const handleMouseLeave = () => {
    gsap.to(element, {
      x: 0, y: 0,
      ease: "elastic.out(1.1, 0.4)",
      duration: 0.8,
      overwrite: "auto",
    });
  };

  element.addEventListener("mousemove", handleMouseMove);
  element.addEventListener("mouseleave", handleMouseLeave);
  return () => {
    element.removeEventListener("mousemove", handleMouseMove);
    element.removeEventListener("mouseleave", handleMouseLeave);
  };
}

/* ── Glare effect for cards ── */
export function glareEffect(card: HTMLElement | null, glare: HTMLElement | null) {
  if (!card || !glare || prefersReducedMotion()) return () => {};
  const handleMove = (e: MouseEvent) => {
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    gsap.to(glare, {
      background: `radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,0.12) 0%, transparent 60%)`,
      duration: 0.2,
      overwrite: "auto",
    });
  };
  const handleLeave = () => {
    gsap.to(glare, {
      background: "transparent",
      duration: 0.3,
    });
  };
  card.addEventListener("mousemove", handleMove);
  card.addEventListener("mouseleave", handleLeave);
  return () => {
    card.removeEventListener("mousemove", handleMove);
    card.removeEventListener("mouseleave", handleLeave);
  };
}

/* ── Subtle parallax for backgrounds ── */
export function parallaxY(element: string | Element, speed = 0.1) {
  if (prefersReducedMotion()) return;
  return gsap.to(element, {
    y: () => -(window.innerHeight * speed),
    ease: "none",
    scrollTrigger: {
      trigger: element as HTMLElement,
      start: "top bottom",
      end: "bottom top",
      scrub: true,
    },
  });
}

/* ── Text clip mask reveal ── */
export function clipTextReveal(
  elements: Element | Element[] | null,
  options: { delay?: number; duration?: number; stagger?: number; trigger?: Element | null } = {}
) {
  if (!elements || prefersReducedMotion()) return;
  const { delay = 0, duration = 0.8, stagger = 0.12, trigger } = options;
  gsap.set(elements, { clipPath: "polygon(0 0, 100% 0, 100% 0, 0 0)", y: 24, opacity: 0 });
  return gsap.to(elements, {
    clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
    y: 0, opacity: 1, duration, stagger, delay, ease: "power3.out",
    scrollTrigger: trigger ? { trigger, start: "top 80%", once: true } : undefined,
  });
}

/* ── 3D Mouse Tilt ── */
export function mouseTilt(
  cardElement: HTMLElement | null,
  options: { maxTilt?: number; perspective?: number } = {}
) {
  if (!cardElement || prefersReducedMotion()) return () => {};
  const { maxTilt = 8, perspective = 1000 } = options;
  const parent = cardElement.parentElement;
  if (parent) gsap.set(parent, { perspective });
  const handleMouseMove = (e: MouseEvent) => {
    const rect = cardElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const tiltX = ((y / rect.height) - 0.5) * -maxTilt;
    const tiltY = ((x / rect.width) - 0.5) * maxTilt;
    gsap.to(cardElement, { rotateX: tiltX, rotateY: tiltY, transformPerspective: perspective, ease: "power2.out", duration: 0.3, overwrite: "auto" });
  };
  const handleMouseLeave = () => {
    gsap.to(cardElement, { rotateX: 0, rotateY: 0, ease: "power2.out", duration: 0.5, overwrite: "auto" });
  };
  cardElement.addEventListener("mousemove", handleMouseMove);
  cardElement.addEventListener("mouseleave", handleMouseLeave);
  return () => {
    cardElement.removeEventListener("mousemove", handleMouseMove);
    cardElement.removeEventListener("mouseleave", handleMouseLeave);
  };
}

/* ── Scroll Path Drawing ── */
export function scrollDrawPath(
  pathElement: SVGPathElement | null,
  trigger: Element | null,
  options: { start?: string; end?: string; scrub?: boolean | number } = {}
) {
  if (!pathElement || !trigger || prefersReducedMotion()) return;
  const { start = "top 75%", end = "bottom 25%", scrub = 0.5 } = options;
  const length = pathElement.getTotalLength();
  gsap.set(pathElement, { strokeDasharray: length, strokeDashoffset: length });
  return gsap.to(pathElement, {
    strokeDashoffset: 0, ease: "none",
    scrollTrigger: { trigger, start, end, scrub },
  });
}

/* ── Pipeline line draw with progress (for HowItWorks) ── */
export function pipelineDraw(
  linePath: SVGPathElement | null,
  trigger: Element | null,
  onProgress?: (p: number) => void,
  options: { start?: string; end?: string; scrub?: number } = {}
) {
  if (!linePath || !trigger || prefersReducedMotion()) return () => {};
  const { start = "top 75%", end = "bottom 25%", scrub = 0.5 } = options;
  const length = linePath.getTotalLength();
  gsap.set(linePath, { strokeDasharray: length, strokeDashoffset: length });

  const update = () => {
    if (!onProgress) return;
    const current = parseFloat(linePath.style.strokeDashoffset || String(length));
    const p = Math.max(0, Math.min(1, 1 - current / length));
    onProgress(p);
  };

  ScrollTrigger.create({
    trigger,
    start, end, scrub,
    onUpdate: () => update(),
  });

  return gsap.to(linePath, {
    strokeDashoffset: 0, ease: "none",
    scrollTrigger: { trigger, start, end, scrub },
  });
}
