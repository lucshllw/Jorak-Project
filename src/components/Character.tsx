'use client';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import type { SiteSettings } from '@/lib/types';
import FaqPanel from './FaqPanel';

export default function Character({ place, hidden = false }: { place: 'home' | 'index' | 'about' | 'contact'; settings?: SiteSettings; hidden?: boolean }) {
  const root = useRef<HTMLDivElement>(null), trigger = useRef<HTMLButtonElement>(null), [open, setOpen] = useState(false);
  useEffect(() => { if (hidden) setOpen(false); }, [hidden]);
  useEffect(() => {
    if (hidden || !root.current) return;
    const node = root.current, preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const ctx = gsap.context(() => {}, node);
    let breathe: gsap.core.Tween | undefined;
    const setup = () => {
      ctx.revert();
      if (preference.matches) return;
      ctx.add(() => {
        gsap.fromTo(node, { y: place === 'home' ? -32 : -65, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .55, ease: 'power3.out' });
        breathe = gsap.to(node.querySelector('.character-art'), { y: -2, duration: 2.7, yoyo: true, repeat: -1, ease: 'sine.inOut' });
      });
    };
    let inView = false;
    const visibility = () => inView && !document.hidden ? breathe?.resume() : breathe?.pause();
    const observer = new IntersectionObserver(entries => { inView = entries[0].isIntersecting; visibility(); }); observer.observe(node);
    setup(); preference.addEventListener('change', setup); document.addEventListener('visibilitychange', visibility);
    return () => { observer.disconnect(); preference.removeEventListener('change', setup); document.removeEventListener('visibilitychange', visibility); ctx.revert(); };
  }, [place, hidden]);
  const close = () => { setOpen(false); trigger.current?.focus({ preventScroll: true }); };
  if (hidden) return null;
  const art = <Image className="character-art" src="/media/character/jorak-standing.png" alt={place === 'home' ? 'Personagem de Jorak. Toque para conversar.' : 'Personagem ilustrado de Jorak'} width={363} height={1018} unoptimized/>;
  return <div ref={root} className={`character-anchor character-${place}`} data-character-pose="standing">
    {place === 'home' ? <><button ref={trigger} className="character-trigger" aria-label="Conversar com Jorak" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(!open)}>{art}<span>Vamos conversar?</span></button>{open && createPortal(<FaqPanel onClose={close}/>, document.body)}</> : art}
  </div>;
}
