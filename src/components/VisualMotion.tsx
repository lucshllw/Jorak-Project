'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import gsap from 'gsap';
export default function VisualMotion() {
  const pathname = usePathname();
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const seen = new WeakSet<Element>(), tweens = new Set<gsap.core.Tween>();
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const element = entry.target as HTMLElement; observer.unobserve(element);
      const tween = gsap.fromTo(element, { y: 19, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out', clearProps: 'transform,opacity', onComplete: () => tweens.delete(tween) }); tweens.add(tween);
    }), { threshold: 0.08 });
    const scan = () => document.querySelectorAll('.hero-introduction, .gallery-topline, .gallery-selection, .about-top, .about-story, .about-ending, .contact-heading, .briefing-section, .project-heading, .player-section, .project-information, .credit-section, .full-track, .project-bottom').forEach(element => { if (!seen.has(element)) { seen.add(element); observer.observe(element); } });
    scan(); const mutations = new MutationObserver(scan); mutations.observe(document.body, { childList: true, subtree: true });
    return () => { observer.disconnect(); mutations.disconnect(); tweens.forEach(tween => { const targets = tween.targets() as HTMLElement[]; tween.kill(); gsap.set(targets, {clearProps:'transform,opacity'}); }); };
  }, [pathname]);
  return <div className="brand-atmosphere" aria-hidden="true"><span/><span/><span/><span/><span/></div>;
}
