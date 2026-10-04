'use client';
import { useEffect, useId, useRef, useState } from 'react';
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
  const root = useRef<HTMLDivElement>(null), video = useRef<HTMLVideoElement>(null);
  const close = useRef(onClose); close.current = onClose;
  const preview = confirmedPreview(project), owner = useId(), titleId = useId();
  const [position, setPosition] = useState({ left: 16, top: 16, tip: 50, below: false });
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
    if (!mobile) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [mobile]);

  useEffect(() => {
    const element = root.current!;
    const initialTrigger = trigger?.getBoundingClientRect();
    const place = () => {
      const compact = interaction === 'touch' || window.innerWidth <= 700; setMobile(compact);
      if (compact) return;
      const currentTrigger = trigger?.isConnected ? trigger.getBoundingClientRect() : null;
      const offsetX = currentTrigger && initialTrigger ? currentTrigger.left - initialTrigger.left : 0;
      const offsetY = currentTrigger && initialTrigger ? currentTrigger.top - initialTrigger.top : 0;
      const width = Math.min(340, window.innerWidth - 32), height = element.offsetHeight || 320;
      const center = anchor.left + offsetX + anchor.width / 2;
      const left = Math.max(16, Math.min(center - width / 2, window.innerWidth - width - 16));
      const above = anchor.top + offsetY - height - 16, below = above < 16;
      const top = Math.max(16, Math.min(below ? anchor.top + offsetY + anchor.height + 16 : above, window.innerHeight - height - 16));
      setPosition({ left, top, tip: Math.max(25, Math.min(width - 25, center - left)), below });
    };
    const observer = new ResizeObserver(place); observer.observe(element); place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => { observer.disconnect(); window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true); };
  }, [anchor, interaction, trigger]);

  useEffect(() => {
    const element = root.current!;
    savedFocus.current = trigger || document.activeElement as HTMLElement | null;
    const focusable = () => Array.from(element.querySelectorAll<HTMLButtonElement>('button:not([disabled])'));
    if (mobile || interaction === 'keyboard' || interaction === 'touch') focusable()[0]?.focus({ preventScroll: true });
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); close.current(); restoreFocus(); }
      if (event.key === 'Tab' && mobile) {
        const items = focusable(), first = items[0], last = items.at(-1);
        if (!element.contains(document.activeElement) || event.shiftKey && document.activeElement === first) { event.preventDefault(); event.stopImmediatePropagation(); (event.shiftKey ? last : first)?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); event.stopImmediatePropagation(); first?.focus(); }
      }
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
    {mobile && <button className="disc-preview-backdrop" aria-label="Fechar prévia" aria-hidden="true" onClick={dismiss} tabIndex={-1}/>}
    <div ref={root} className={`disc-preview ${mobile ? 'disc-preview-sheet' : ''} ${position.below ? 'disc-preview-below' : ''}`} style={mobile ? undefined : { left: position.left, top: position.top, '--preview-tip': `${position.tip}px` } as React.CSSProperties} role="dialog" aria-modal={mobile} aria-labelledby={titleId} data-lenis-prevent onPointerEnter={onKeepOpen} onPointerLeave={() => { if (!mobile && !root.current?.contains(document.activeElement)) onLeave(); }} onFocusCapture={onKeepOpen} onBlurCapture={event => { if (!mobile && !event.currentTarget.contains(event.relatedTarget)) onLeave(); }}>
      <div className="disc-preview-top"><span>{preview?.kind === 'trailer' ? 'Prévia do trailer' : 'Prévia da edição'}</span><button className="disc-preview-close" aria-label="Fechar prévia" onClick={dismiss}><Icon name="close-circle-linear" size={20}/></button></div>
      <div className="disc-preview-media" style={{ aspectRatio: preview?.aspectRatio }}>
        {(preview?.poster || project.coverUrl) && <Image src={preview?.poster || project.coverUrl!} alt="" fill sizes="340px" unoptimized/>}
        {preview && !failed && <video ref={video} poster={preview.poster || project.coverUrl || undefined} muted playsInline preload="metadata" onPlay={() => { setPlaying(true); setManual(false); announcePlayback(`preview-${owner}`); }} onPause={() => setPlaying(false)} onTimeUpdate={event => { const node = event.currentTarget; if (node.currentTime >= Math.min(preview.start + preview.length, node.duration)) node.currentTime = preview.start; }} onEnded={event => { event.currentTarget.currentTime = preview.start; if (automaticallyPlay.current && !document.hidden) event.currentTarget.play().catch(() => setManual(true)); }} onError={() => { setFailed(true); setLoading(false); setPlaying(false); }}/>}
        {loading && !failed && <span className="disc-preview-status" role="status">Carregando prévia…</span>}
        {(!preview || failed) && <span className="disc-preview-status">{failed ? 'Prévia indisponível' : 'Trecho em preparação'}</span>}
        {preview && !failed && !loading && <button className="disc-preview-toggle" onClick={toggle} aria-label={playing ? 'Pausar prévia sem som' : 'Reproduzir prévia sem som'}><Icon name={playing ? 'pause-bold' : 'play-bold'} size={18}/><span>{playing ? 'Sem som' : reduced || manual ? 'Reproduzir' : 'Pausado'}</span></button>}
      </div>
      <div className="disc-preview-copy"><span>{artist}</span><h3 id={titleId}>{project.title}</h3><button className="disc-preview-open" onClick={onOpen}>Abrir projeto completo <Icon name="arrow-right-up-linear" size={18}/></button></div>
    </div>
  </>;
}
