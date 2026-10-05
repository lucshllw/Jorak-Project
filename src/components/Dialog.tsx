'use client';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import ComicBackdrop from './ComicBackdrop';
export default function Dialog({ children, onClose, label, className = '' }: { children: React.ReactNode; onClose: () => void; label: string; className?: string }) {
  const root = useRef<HTMLDivElement>(null);
  const close = useRef(onClose); close.current = onClose;
  useEffect(() => {
    const element = root.current!, previous = document.activeElement as HTMLElement | null, overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const targets = () => Array.from(element.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input, select, textarea, [tabindex="0"]')).filter(node => !node.hidden && node.getClientRects().length);
    const key = (event: KeyboardEvent) => {
      if((event.target as HTMLElement)?.closest('.faq-panel'))return;
      if (event.key === 'Escape') close.current();
      if (event.key === 'Tab') { const items = targets(), first = items[0], last = items.at(-1); if (!first) { event.preventDefault(); return; } if (event.shiftKey && (document.activeElement === first || !element.contains(document.activeElement))) { event.preventDefault(); last?.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); } }
    };
    document.addEventListener('keydown', key); targets()[0]?.focus();
    const context = gsap.context(() => { if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) gsap.fromTo(element, { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .3, ease: 'power3.out', clearProps: 'transform,opacity,visibility' }); }, element);
    return () => { context.revert(); document.body.style.overflow = overflow; document.removeEventListener('keydown', key); previous?.focus(); };
  }, []);
  return <div ref={root} role="dialog" aria-modal="true" aria-label={label} className={`dialog ${className}`} data-lenis-prevent>{!className.includes('project-dialog') && <ComicBackdrop mood="index" local/>}{children}</div>;
}
