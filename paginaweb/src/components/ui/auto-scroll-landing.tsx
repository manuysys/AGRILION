'use client';

import { useEffect } from 'react';

/**
 * Desplazamiento automático lento para la landing de demostración.
 *
 * - Avanza a velocidad constante y vuelve al inicio al llegar al final.
 * - Se pausa cuando el visitante interactúa y se reanuda a los segundos.
 * - Respeta prefers-reduced-motion.
 */
const SPEED_PX_PER_SECOND = 36;
const INITIAL_DELAY_MS = 1800;
const BOTTOM_PAUSE_MS = 2600;
const LOOP_PAUSE_MS = 1200;
const INTERACTION_PAUSE_MS = 12000;

export function AutoScrollLanding() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let frameId = 0;
    let lastTime = performance.now();
    let carry = 0;
    let pausedUntil = performance.now() + INITIAL_DELAY_MS;
    let bottomSince: number | null = null;

    const maxScroll = () => Math.max(
      0,
      document.documentElement.scrollHeight - window.innerHeight,
    );

    const pauseFor = (milliseconds: number) => {
      pausedUntil = performance.now() + milliseconds;
    };

    const pauseOnInteraction = () => pauseFor(INTERACTION_PAUSE_MS);

    const tick = (now: number) => {
      frameId = requestAnimationFrame(tick);

      const delta = Math.min(now - lastTime, 100);
      lastTime = now;

      if (document.hidden || now < pausedUntil) {
        bottomSince = null;
        return;
      }

      const max = maxScroll();
      if (max <= 0) return;

      const current = window.scrollY;

      if (current >= max - 1) {
        if (bottomSince === null) {
          bottomSince = now;
        } else if (now - bottomSince >= BOTTOM_PAUSE_MS) {
          window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
          bottomSince = null;
          carry = 0;
          pauseFor(LOOP_PAUSE_MS);
        }
        return;
      }

      bottomSince = null;
      carry += (delta / 1000) * SPEED_PX_PER_SECOND;

      if (carry >= 1) {
        const step = Math.floor(carry);
        carry -= step;
        window.scrollTo({
          top: Math.min(max, current + step),
          left: 0,
          behavior: 'auto',
        });
      }
    };

    frameId = requestAnimationFrame(tick);

    window.addEventListener('wheel', pauseOnInteraction, { passive: true });
    window.addEventListener('touchstart', pauseOnInteraction, { passive: true });
    window.addEventListener('keydown', pauseOnInteraction);
    window.addEventListener('pointerdown', pauseOnInteraction);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('wheel', pauseOnInteraction);
      window.removeEventListener('touchstart', pauseOnInteraction);
      window.removeEventListener('keydown', pauseOnInteraction);
      window.removeEventListener('pointerdown', pauseOnInteraction);
    };
  }, []);

  return null;
}
