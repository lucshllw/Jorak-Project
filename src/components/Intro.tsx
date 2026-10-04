'use client';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import BrandArt from './BrandArt';

export default function Intro({ avatarUrl, onComplete }: { avatarUrl: string; onComplete: () => void }) {
  const root = useRef<HTMLDivElement>(null), skip = useRef<HTMLButtonElement>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null), completed = useRef(false), callback = useRef(onComplete);
  callback.current = onComplete;
  const [ready, setReady] = useState(false);
  const logoReady = useCallback(() => setReady(true), []);
  const finish = useCallback(() => { if (completed.current) return; completed.current = true; timeline.current?.kill(); callback.current(); }, []);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null, overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; skip.current?.focus({ preventScroll: true });
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape') finish(); if (event.key === 'Tab') { event.preventDefault(); skip.current?.focus(); } };
    const changed = () => { if (preference.matches) finish(); };
    // A failed WebGL renderer or image decode must never leave the page locked.
    const watchdog = setTimeout(logoReady, 1800);
    document.addEventListener('keydown', key); preference.addEventListener('change', changed);
    return () => { clearTimeout(watchdog); document.removeEventListener('keydown', key); preference.removeEventListener('change', changed); document.body.style.overflow = overflow; if (previous?.isConnected) previous.focus({ preventScroll: true }); };
  }, [finish, logoReady]);
  useEffect(() => {
    if (!ready || !root.current || completed.current) return;
    const element = root.current;
    const ctx = gsap.context(() => {
      timeline.current = gsap.timeline({ onComplete: finish })
        .from('.intro-avatar', { scale: .78, autoAlpha: 0, duration: .55, ease: 'power3.out' })
        .from('.intro-name', { y: 20, autoAlpha: 0, duration: .65, ease: 'power3.out' }, .15)
        .to('.intro-avatar', { scale: .32, x: () => -window.innerWidth / 2 + 79, y: () => -window.innerHeight / 2 + 117, duration: .65, ease: 'power3.inOut' }, 1.65)
        .to('.intro-name', { y: -15, autoAlpha: 0, duration: .4 }, 1.8)
        .to(element, { autoAlpha: 0, duration: .4 }, 2.15);
    }, element);
    return () => { ctx.revert(); timeline.current = null; };
  }, [ready, finish]);
  return <div className="intro" ref={root} role="dialog" aria-modal="true" aria-label="Apresentação de Jorak"><div className="intro-avatar"><Image src={avatarUrl} alt="Ilustração de Jorak" width={148} height={148} priority unoptimized/></div><div className="intro-name" aria-hidden="true"><BrandArt onReady={logoReady}/></div><button ref={skip} className="intro-skip" onClick={finish}>Pular introdução <span>↗</span></button></div>;
}
