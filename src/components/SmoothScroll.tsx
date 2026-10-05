'use client';
import { useEffect } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
export default function SmoothScroll() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let lenis: Lenis | null = null, locked = false;
    const tick = (time: number) => lenis?.raf(time * 1000);
    const visibility = () => {
      gsap.ticker.remove(tick);
      if (document.hidden || locked || !lenis) lenis?.stop();
      else { lenis.start(); gsap.ticker.add(tick); }
    };
    const change = () => {
      lenis?.destroy(); lenis = null;
      if (!preference.matches) { lenis = new Lenis({ duration: .9, smoothWheel: true, anchors: true }); lenis.on('scroll', ScrollTrigger.update); }
      visibility();
    };
    const lock = (event: Event) => { locked = Boolean((event as CustomEvent<boolean>).detail); visibility(); };
    change();
    document.addEventListener('visibilitychange', visibility);
    preference.addEventListener('change', change); window.addEventListener('jorak:interaction-lock', lock);
    return () => { gsap.ticker.remove(tick); document.removeEventListener('visibilitychange', visibility); preference.removeEventListener('change', change); window.removeEventListener('jorak:interaction-lock', lock); lenis?.destroy(); };
  }, []);
  return null;
}
