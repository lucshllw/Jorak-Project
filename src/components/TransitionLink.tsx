'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export function navigateWithTransition(url: string) {
  window.dispatchEvent(new CustomEvent('jorak:navigate', { detail: url }));
}
export default function TransitionLink(props: React.ComponentProps<typeof Link>) {
  return <Link {...props} onNavigate={event => { let prevented = false; props.onNavigate?.({ preventDefault: () => { prevented = true; event.preventDefault(); } }); if (prevented) return; event.preventDefault(); navigateWithTransition(typeof props.href === 'string' ? props.href : String(props.href.pathname || '/')); }}/>;
}
export function TransitionController() {
  const router = useRouter(), pathname = usePathname(), layer = useRef<HTMLDivElement>(null);
  const tween = useRef<gsap.core.Tween | null>(null), timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousVariation = useRef(-1);
  useEffect(() => {
    const cancel = () => { tween.current?.kill(); if (timer.current) clearTimeout(timer.current); timer.current = null; };
    const navigate = (event: Event) => {
      const url = (event as CustomEvent<string>).detail;
      if (typeof url !== 'string' || !url.startsWith('/') || url.startsWith('//')) return;
      cancel();
      if (new URL(url, location.origin).pathname === location.pathname) { window.dispatchEvent(new Event('jorak:transition-cancel')); gsap.set(layer.current, { scaleY: 0 }); router.push(url); return; }
      const candidates = [0, 1, 2].filter(value => value !== previousVariation.current);
      const variation = candidates[Math.floor(Math.random() * candidates.length)]; previousVariation.current = variation;
      window.dispatchEvent(new CustomEvent('jorak:transition', { detail: url }));
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !layer.current) { router.push(url); return; }
      tween.current = gsap.to(layer.current, { scaleY: 1, duration: variation === 1 ? .15 : .18, transformOrigin: variation === 2 ? 'top' : 'bottom', ease: 'power2.in', onComplete: () => {
        router.push(url);
        timer.current = setTimeout(() => { tween.current = gsap.to(layer.current, { scaleY: 0, duration: .22, transformOrigin: 'top', ease: 'power3.out' }); }, 900);
      } });
    };
    const back = () => { cancel(); window.dispatchEvent(new Event('jorak:transition-cancel')); gsap.set(layer.current, { scaleY: 0 }); };
    window.addEventListener('jorak:navigate', navigate); window.addEventListener('popstate', back);
    return () => { cancel(); window.removeEventListener('jorak:navigate', navigate); window.removeEventListener('popstate', back); };
  }, [router]);
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current); tween.current?.kill();
    tween.current = gsap.to(layer.current, { scaleY: 0, duration: .22, transformOrigin: 'top', ease: 'power3.out' });
    return () => { tween.current?.kill(); };
  }, [pathname]);
  return <div ref={layer} className="route-wipe" aria-hidden="true"/>;
}
