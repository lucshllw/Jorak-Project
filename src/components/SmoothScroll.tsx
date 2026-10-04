'use client';
import { useEffect } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
export default function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const lenis = new Lenis({ duration: 0.9, smoothWheel: true, anchors: true });
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    const visibility = () => document.hidden ? lenis.stop() : lenis.start();
    document.addEventListener('visibilitychange', visibility);
    return () => { gsap.ticker.remove(tick); document.removeEventListener('visibilitychange', visibility); lenis.destroy(); };
  }, []);
  return null;
}
