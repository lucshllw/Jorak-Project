'use client';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import gsap from 'gsap';
import './comic-backdrop.css';

type Mood = 'home' | 'index' | 'project' | 'about' | 'contact' | 'catalog';
export default function ComicBackdrop({ mood, local = false }: { mood?: Mood; local?: boolean }) {
  const pathname = usePathname(), root = useRef<HTMLDivElement>(null);
  const context = mood || (pathname === '/' ? 'home' : pathname.startsWith('/projeto/') ? 'project' : pathname === '/sobre' ? 'about' : pathname.includes('contato') ? 'contact' : 'catalog');
  useEffect(() => {
    const element = root.current!;
    const layers = Array.from(element.querySelectorAll<HTMLElement>('.comic-layer'));
    const reduced = matchMedia('(prefers-reduced-motion: reduce)'), fine = matchMedia('(hover: hover) and (pointer: fine)');
    const animations = new Set<gsap.core.Tween>();
    let visible = true, locked = false, playing = false;
    element.dataset.playing = 'false';
    const scope = local ? element.closest<HTMLElement>('.dialog') || element.parentElement! : document.documentElement;
    const allowed = () => visible && !locked && !playing && !document.hidden && !reduced.matches;
    const stop = () => { animations.forEach(tween => tween.kill()); animations.clear(); gsap.set(layers, { clearProps: 'transform' }); };
    const animate = (node: HTMLElement, values: gsap.TweenVars) => {
      gsap.killTweensOf(node);
      animations.forEach(tween => { if (tween.targets().includes(node)) animations.delete(tween); });
      const tween = gsap.to(node, { ...values, overwrite: true, onComplete: () => animations.delete(tween) });
      animations.add(tween);
    };
    const pointer = (event: PointerEvent) => {
      if (!allowed() || !fine.matches || event.pointerType === 'touch') return;
      const x = event.clientX / innerWidth - .5, y = event.clientY / innerHeight - .5;
      layers.forEach((node, index) => animate(node, { x: x * (index + 1) * 7, y: y * (index + 1) * 5, duration: .65, ease: 'power2.out' }));
    };
    const rest = () => { if (allowed()) layers.forEach(node => animate(node, { x: 0, y: 0, duration: .7 })); };
    const scroll = () => {
      if (!allowed()) return;
      const position = scope.classList.contains('dialog') ? scope.scrollTop : window.scrollY;
      animate(layers[1], { y: -Math.min(position, 900) * .025, duration: .55 });
    };
    const select = () => {
      if (!allowed() || context !== 'home') return;
      animate(layers[1], { keyframes: [{ scale: 1.025, rotation: -.4, duration: .12 }, { scale: 1, rotation: 0, duration: .38 }], ease: 'power2.out' });
    };
    const media = (event: Event) => {
      // Gallery previews should never dim the collection's backdrop.
      if (context !== 'project') return;
      const detail = (event as CustomEvent<{ playing: boolean }>).detail;
      playing = detail?.playing ?? event.type === 'play';
      element.dataset.playing = String(playing);
      if (playing) stop();
    };
    const lock = (event: Event) => { if (!local) { locked = Boolean((event as CustomEvent<boolean>).detail); if (locked) stop(); else { playing = false; element.dataset.playing = 'false'; } } };
    const visibility = () => { if (document.hidden) stop(); };
    const preference = () => { if (reduced.matches) stop(); };
    const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; if (!visible) stop(); });
    observer.observe(element);
    scope.addEventListener('pointermove', pointer as EventListener, { passive: true });
    scope.addEventListener('pointerleave', rest);
    const scrollHost = scope.classList.contains('dialog') ? scope : window;
    scrollHost.addEventListener('scroll', scroll, { passive: true });
    window.addEventListener('jorak:disc-select', select);
    window.addEventListener('jorak:interaction-lock', lock);
    window.addEventListener('jorak:media-state', media);
    document.addEventListener('play', media, true);
    document.addEventListener('pause', media, true);
    document.addEventListener('ended', media, true);
    document.addEventListener('visibilitychange', visibility);
    reduced.addEventListener('change', preference);
    return () => {
      observer.disconnect(); stop();
      scope.removeEventListener('pointermove', pointer as EventListener); scope.removeEventListener('pointerleave', rest);
      scrollHost.removeEventListener('scroll', scroll);
      window.removeEventListener('jorak:disc-select', select); window.removeEventListener('jorak:interaction-lock', lock); window.removeEventListener('jorak:media-state', media);
      document.removeEventListener('play', media, true); document.removeEventListener('pause', media, true); document.removeEventListener('ended', media, true);
      document.removeEventListener('visibilitychange', visibility); reduced.removeEventListener('change', preference);
    };
  }, [context, local]);
  return <div ref={root} className={`comic-backdrop ${local ? 'comic-local' : ''}`} data-mood={context} aria-hidden="true"><div className="comic-layer comic-paper"/><div className="comic-layer comic-ink"/><div className="comic-layer comic-corners"/></div>;
}
