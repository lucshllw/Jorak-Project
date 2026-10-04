'use client';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import BrandArt from './BrandArt';
export default function Intro({ avatarUrl }: { avatarUrl: string }) {
  const root = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false), [logoReady, setLogoReady] = useState(false);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const ready = useCallback(() => setLogoReady(true), []);
  const finish = () => { timeline.current?.kill(); sessionStorage.setItem('jorak-intro', 'seen'); setShow(false); setLogoReady(false); };
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!preference.matches && (!sessionStorage.getItem('jorak-intro') || new URLSearchParams(location.search).has('intro'))) setShow(true);
    const replay = () => { if (!preference.matches) setShow(true); };
    const changed = () => { if (preference.matches) finish(); };
    window.addEventListener('jorak:intro', replay); preference.addEventListener('change', changed);
    return () => { window.removeEventListener('jorak:intro', replay); preference.removeEventListener('change', changed); };
  // Session and replay events own the presentation lifetime.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!show || !logoReady || !root.current) return;
    const element = root.current;
    let cancelled = false;
    const ctx = gsap.context(() => {}, element);
    const images = Array.from(element.querySelectorAll('img'));
    void Promise.all(images.map(image => image.decode().catch(() => {}))).then(() => {
      if (cancelled) return;
      ctx.add(() => {
        timeline.current = gsap.timeline({ onComplete: finish })
          .from('.intro-avatar', { scale: .7, autoAlpha: 0, duration: .6, ease: 'power3.out' })
          .from('.intro-name', { y: 25, autoAlpha: 0, duration: .7, ease: 'power3.out' }, .2)
          .to('.intro-avatar', { scale: .32, x: () => -window.innerWidth / 2 + 79, y: () => -window.innerHeight / 2 + 117, duration: .75, ease: 'power3.inOut' }, 2.15)
          .to('.intro-name', { y: -20, autoAlpha: 0, duration: .45 }, 2.25)
          .to(element, { autoAlpha: 0, duration: .5 }, 2.75);
      });
    });
    return () => { cancelled = true; ctx.revert(); timeline.current = null; };
  // Completion is controlled by the timeline and explicit replay state.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, logoReady]);
  if (!show) return null;
  return <div className="intro" ref={root} aria-label="Apresentação de Jorak"><div className="intro-avatar"><Image src={avatarUrl} alt="Novo ícone de Jorak com dois personagens ilustrados e chapéu verde" width={148} height={148} priority unoptimized/></div><div className="intro-name" aria-hidden="true"><BrandArt onReady={ready}/></div><button className="intro-skip" onClick={finish}>Pular introdução <span>↗</span></button></div>;
}
