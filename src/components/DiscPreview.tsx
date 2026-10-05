'use client';
import { useEffect, useId, useRef, useState } from 'react';
import gsap from 'gsap';
import Image from 'next/image';
import type { Project } from '@/lib/types';
import { announcePlayback, confirmedRange, fileMediaUrl } from '@/lib/media';
import Icon from './Icon';
import './disc-preview.css';

export type PreviewAnchor = { left: number; top: number; width: number; height: number };
export type PreviewInteraction = 'pointer' | 'focus' | 'touch' | 'keyboard';
export type PreviewRequest = { project: Project; anchor: PreviewAnchor; interaction: PreviewInteraction; trigger?: HTMLElement };
type Props = PreviewRequest & { artist: string; onOpen: () => void; onClose: () => void; onKeepOpen: () => void; onLeave: () => void };
export function confirmedPreview(project: Project) {
  for (const segment of [...project.segments].sort((a, b) => a.order - b.order)) {
    if (!confirmedRange(segment)) continue;
    const lightSource = fileMediaUrl(segment.previewUrl), source = lightSource || fileMediaUrl(segment.clipUrl);
    if (source) return { source, poster: fileMediaUrl(segment.posterUrl), aspectRatio: segment.videoWidth && segment.videoHeight ? `${segment.videoWidth} / ${segment.videoHeight}` : '16 / 9', kind: segment.kind, start: lightSource && Number.isFinite(segment.previewStart) ? Math.max(0, segment.previewStart || 0) : 0, length: Math.min(8, segment.end - segment.start) };
  }
  return null;
}

export default function DiscPreview({ project, artist, anchor, interaction, trigger, onOpen, onClose, onKeepOpen, onLeave }: Props) {
  const root = useRef<HTMLDivElement>(null), piece = useRef<HTMLDivElement>(null), video = useRef<HTMLVideoElement>(null);
  const close = useRef(onClose); close.current = onClose;
  const preview = confirmedPreview(project), owner = useId(), titleId = useId();
  const [position, setPosition] = useState({ left: 16, top: 16, width: 340, below: false });
  const [mobile, setMobile] = useState(interaction === 'touch');
  const [loading, setLoading] = useState(Boolean(preview)), [failed, setFailed] = useState(false), [playing, setPlaying] = useState(false), [manual, setManual] = useState(false);
  const [reduced, setReduced] = useState(false);
  const automaticallyPlay = useRef(true), inView = useRef(true);
  const savedFocus = useRef<HTMLElement | null>(null);
  const restoreFocus = () => {
    const target = savedFocus.current;
    requestAnimationFrame(() => { if (target?.isConnected && !target.closest('[inert]')) target.focus({ preventScroll: true }); });
  };

  useEffect(() => {
    const shell = root.current!, node = piece.current!;
    const preference = matchMedia('(prefers-reduced-motion: reduce)'), fine = matchMedia('(hover: hover) and (pointer: fine)');
    const x = gsap.quickTo(node, 'rotationX', { duration: .35, ease: 'power2.out' });
    const y = gsap.quickTo(node, 'rotationY', { duration: .35, ease: 'power2.out' });
    const reset = () => { x(0); y(0); };
    const move = (event: PointerEvent) => {
      if (mobile || preference.matches || !fine.matches || event.pointerType !== 'mouse') return;
      const rect = shell.getBoundingClientRect();
      x(Math.max(-4, Math.min(4, (.5 - (event.clientY - rect.top) / rect.height) * 8)));
      y(Math.max(-4, Math.min(4, ((event.clientX - rect.left) / rect.width - .5) * 8)));
    };
    const change = () => { if (preference.matches) { x.tween.kill(); y.tween.kill(); gsap.set(node, { rotationX: 0, rotationY: 0 }); } };
    shell.addEventListener('pointermove', move, { passive: true }); shell.addEventListener('pointerleave', reset);
    preference.addEventListener('change', change);
    return () => { shell.removeEventListener('pointermove', move); shell.removeEventListener('pointerleave', reset); preference.removeEventListener('change', change); gsap.killTweensOf(node); };
  }, [mobile, reduced]);

  useEffect(() => {
    const element = root.current!;
    const initialTrigger = trigger?.getBoundingClientRect();
    const place = () => {
      const compact = interaction === 'touch' || window.innerWidth <= 700; setMobile(compact);
      const currentTrigger = trigger?.isConnected ? trigger.getBoundingClientRect() : null;
      const offsetX = currentTrigger && initialTrigger ? currentTrigger.left - initialTrigger.left : 0;
      const offsetY = currentTrigger && initialTrigger ? currentTrigger.top - initialTrigger.top : 0;
      const viewport = window.visualViewport;
      const viewWidth = viewport?.width || window.innerWidth, viewHeight = viewport?.height || window.innerHeight;
      let width = Math.min(340, viewWidth - 40);
      const height = element.offsetHeight || 300;
      const center = anchor.left + offsetX + anchor.width / 2;
      let left = Math.max(20, Math.min(center - width / 2, viewWidth - width - 20));
      const above = anchor.top + offsetY - height - 16, below = above < 16;
      let top = Math.max(20, Math.min(below ? anchor.top + offsetY + anchor.height + 16 : above, viewHeight - height - 20));
      if (compact) { left = 20; top = 20; }
      const character = Array.from(document.querySelectorAll<HTMLElement>('.character-trigger')).map(node => node.getBoundingClientRect()).find(rect => rect.width && rect.height && rect.bottom > 0 && rect.top < viewHeight);
      if (character && left < character.right + 16 && left + width > character.left - 16 && top < character.bottom + 32 && top + height > character.top - 16) {
        if (character.top - height - 32 >= 20) top = character.top - height - 32;
        else if (character.left - width - 32 >= 20) left = character.left - width - 32;
        else if (character.left > 180) { width = Math.min(width, character.left - 40); left = 20; top = 20; }
      }
      setPosition({ left, top, width, below });
    };
    const observer = new ResizeObserver(place); observer.observe(element); place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    window.visualViewport?.addEventListener('resize', place);
    return () => { observer.disconnect(); window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true); window.visualViewport?.removeEventListener('resize', place); };
  }, [anchor, interaction, trigger]);

  useEffect(() => {
    const element = root.current!;
    savedFocus.current = trigger || document.activeElement as HTMLElement | null;
    const focusable = () => Array.from(element.querySelectorAll<HTMLButtonElement>('button:not([disabled])'));
    if (mobile || interaction === 'keyboard' || interaction === 'touch') focusable()[0]?.focus({ preventScroll: true });
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); close.current(); restoreFocus(); }
    };
    document.addEventListener('keydown', key, true);
    return () => document.removeEventListener('keydown', key, true);
  }, [interaction, mobile, trigger]);

  useEffect(() => {
    const node = video.current, element = root.current, preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => { setReduced(preference.matches); automaticallyPlay.current = !preference.matches; if (preference.matches) node?.pause(); };
    updatePreference(); preference.addEventListener('change', updatePreference);
    if (!node || !preview || !element) return () => preference.removeEventListener('change', updatePreference);
    const announce = () => announcePlayback(`preview-${owner}`);
    const start = () => {
      if (document.hidden || !inView.current || !automaticallyPlay.current) return;
      announce(); node.play().catch(() => { setManual(true); setPlaying(false); });
    };
    const loaded = () => {
      if (!Number.isFinite(node.duration) || node.duration <= 0 || preview.start >= node.duration) { node.pause(); setFailed(true); setLoading(false); return; }
      node.currentTime = preview.start; setLoading(false); start();
    };
    const visibility = () => { if (document.hidden) node.pause(); else if (node.readyState >= 2) start(); };
    const otherMedia = (event: Event) => { if ((event as CustomEvent<{ owner: string }>).detail?.owner !== `preview-${owner}`) { automaticallyPlay.current = false; node.pause(); } };
    const observer = new IntersectionObserver(entries => { inView.current = Boolean(entries[0]?.isIntersecting); if (!inView.current) node.pause(); else if (node.readyState >= 2) start(); }); observer.observe(element);
    node.addEventListener('loadedmetadata', loaded); document.addEventListener('visibilitychange', visibility); window.addEventListener('jorak:media-play', otherMedia);
    node.src = preview.source; node.load();
    return () => {
      node.pause(); node.removeAttribute('src'); node.load(); observer.disconnect();
      node.removeEventListener('loadedmetadata', loaded); document.removeEventListener('visibilitychange', visibility); window.removeEventListener('jorak:media-play', otherMedia); preference.removeEventListener('change', updatePreference);
    };
  }, [project.id, owner, preview?.source, preview?.start, failed]);

  const toggle = () => {
    const node = video.current; if (!node) return;
    if (!node.paused) { automaticallyPlay.current = false; node.pause(); }
    else { automaticallyPlay.current = !reduced; announcePlayback(`preview-${owner}`); node.play().catch(() => setManual(true)); }
  };
  const dismiss = () => { const returnFocus = mobile || interaction === 'keyboard' || interaction === 'touch' || root.current?.contains(document.activeElement); onClose(); if (returnFocus) restoreFocus(); };
  return <>
    <div ref={root} className={`disc-preview ${mobile ? 'disc-preview-sheet' : ''}`} style={{ left: position.left, top: position.top, width: position.width }} role="dialog" aria-modal={false} aria-labelledby={titleId} data-lenis-prevent onPointerEnter={onKeepOpen} onPointerLeave={() => { if (!mobile && !root.current?.contains(document.activeElement)) onLeave(); }} onFocusCapture={onKeepOpen} onBlurCapture={event => { if (!mobile && !event.currentTarget.contains(event.relatedTarget)) onLeave(); }}>
      <div ref={piece} className="disc-preview-piece">
      <button className="disc-preview-close" aria-label="Fechar prévia" onClick={dismiss}><Icon name="close-circle-linear" size={20}/></button>
      <div className="disc-preview-media" style={{ aspectRatio: preview?.aspectRatio }}>
        {(preview?.poster || project.coverUrl) && <Image src={preview?.poster || project.coverUrl!} alt="" fill sizes="340px" unoptimized/>}
        {preview && !failed && <video ref={video} poster={preview.poster || project.coverUrl || undefined} muted playsInline preload="metadata" onPlay={() => { setPlaying(true); setManual(false); announcePlayback(`preview-${owner}`); }} onPause={() => setPlaying(false)} onTimeUpdate={event => { const node = event.currentTarget; if (node.currentTime >= Math.min(preview.start + preview.length, node.duration)) node.currentTime = preview.start; }} onEnded={event => { event.currentTarget.currentTime = preview.start; if (automaticallyPlay.current && !document.hidden) event.currentTarget.play().catch(() => setManual(true)); }} onError={() => { setFailed(true); setLoading(false); setPlaying(false); }}/>}
        {loading && !failed && <span className="disc-preview-status" role="status">Carregando prévia…</span>}
        {(!preview || failed) && <span className="disc-preview-status">{failed ? 'Prévia indisponível' : 'Trecho em preparação'}</span>}
        {preview && !failed && !loading && <button className="disc-preview-toggle" onClick={toggle} aria-label={playing ? 'Pausar prévia sem som' : 'Reproduzir prévia sem som'}><Icon name={playing ? 'pause-bold' : 'play-bold'} size={18}/><span>{playing ? 'Sem som' : reduced || manual ? 'Reproduzir' : 'Pausado'}</span></button>}
      </div>
      <div className="disc-preview-copy"><span>{artist}</span><h3 id={titleId}>{project.title}</h3><button className="disc-preview-open" onClick={onOpen}>Abrir projeto completo <Icon name="arrow-right-up-linear" size={18}/></button></div>
      </div>
    </div>
  </>;
}
