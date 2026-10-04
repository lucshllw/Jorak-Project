'use client';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
export default function ProjectEnvironment({ projectId }: { projectId: string }) {
  const root = useRef<HTMLDivElement>(null);
  const direction = Array.from(projectId).reduce((n, c) => n + c.charCodeAt(0), 0) % 2 ? 1 : -1;
  useEffect(() => {
    if (!root.current) return;
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const layers = root.current!.querySelectorAll('.environment-layer');
      layers.forEach((layer, index) => gsap.fromTo(layer, { y: -14 * index, x: -10 * direction * index }, { y: 25 * index, x: 10 * direction * index, ease: 'none', scrollTrigger: { trigger: root.current!.parentElement, scroller: root.current!.closest('.dialog') || undefined, start: 'top top', end: 'bottom bottom', scrub: .7 } }));
    });
    return () => media.revert();
  }, [direction]);
  return <div ref={root} className="project-environment" aria-hidden="true"><div className="environment-layer environment-glow"/><div className="environment-layer environment-grid"/><div className="environment-layer environment-lines"/></div>;
}
