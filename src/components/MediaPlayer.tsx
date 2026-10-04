'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import type { Project, Segment } from '@/lib/types';
import Icon from './Icon';
const stamp = (value: number) => `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, '0')}`;
export function youtubeId(url: string | null) { if (!url) return null; try { const parsed = new URL(url); return parsed.hostname === 'youtu.be' ? parsed.pathname.slice(1) : parsed.searchParams.get('v') || parsed.pathname.split('/').at(-1); } catch { return null; } }
export default function MediaPlayer({ project }: { project: Project }) {
  const [selected, setSelected] = useState(0), [playing, setPlaying] = useState(false), [error, setError] = useState(false), [loop, setLoop] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const segment: Segment | undefined = project.segments[selected];
  const hasClip = Boolean(segment?.clipUrl), confirmed = segment?.start != null && segment?.end != null;
  const id = youtubeId(project.youtubeUrl);
  const label = hasClip || confirmed ? 'Assistir meu trecho' : 'Ver vídeo oficial';
  useEffect(() => { const node = video.current; const visibility = () => { if (document.hidden) { node?.pause(); if (!hasClip) setPlaying(false); } }; document.addEventListener('visibilitychange', visibility); return () => { node?.pause(); document.removeEventListener('visibilitychange', visibility); }; }, [selected, playing, hasClip]);
  return <section className="player-section" aria-label="Vídeo do projeto">
    {project.segments.length > 1 && <div className="segment-selector" aria-label="Selecionar trecho">{project.segments.map((item, index) => <button key={item.id} className={`pill ${index === selected ? 'is-active' : ''}`} aria-pressed={index === selected} onClick={() => { setSelected(index); setPlaying(false); setError(false); }}>{item.name || `Trecho ${index + 1}`} {item.start != null && item.end != null ? <span>{stamp(item.start)}–{stamp(item.end)}</span> : null}</button>)}</div>}
    <div className="video-stage">
      {playing && !error ? hasClip ? <video ref={video} key={segment?.id} src={segment?.clipUrl || undefined} controls autoPlay playsInline loop={loop} preload="metadata" poster={project.coverUrl || undefined} onError={() => { setError(true); setPlaying(false); }}><p>Seu navegador não reproduziu este arquivo.</p></video> : id ? <iframe key={`${id}-${selected}`} src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1${confirmed ? `&start=${Math.floor(segment!.start!)}&end=${Math.floor(segment!.end!)}` : ''}`} title={`${project.title} — ${confirmed ? 'trecho de Jorak' : 'vídeo oficial'}`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"/> : null : <div className="video-poster" style={{ '--project-accent': project.accent } as React.CSSProperties}>
        {project.coverUrl && <Image src={project.coverUrl} alt="" fill sizes="(max-width: 700px) 100vw, 900px" unoptimized/>}
        <div className="poster-shade"/><div className="poster-copy"><span>{project.character || project.title}</span><strong>{project.title}</strong></div>
        {(hasClip || id) && <button className="play-button" onClick={() => { setError(false); setPlaying(true); }} aria-label={label}><Icon name="play-bold" size={26}/><span>{error ? 'Tentar novamente' : label}</span></button>}
      </div>}
    </div>
    <div className="player-caption"><span>{hasClip ? 'Trecho exportado por Jorak' : confirmed ? `Minha participação · ${stamp(segment!.start!)}–${stamp(segment!.end!)}` : 'Vídeo oficial · trechos individuais em revisão'}</span>{hasClip && <label><input type="checkbox" checked={loop} onChange={event => setLoop(event.target.checked)}/> Repetir trecho</label>}</div>
    {error && <p role="alert" className="inline-error">O vídeo não carregou. Tente novamente ou abra a música no canal oficial.</p>}
    {!hasClip && !confirmed && <p className="media-note">A participação está catalogada. O trecho exato será adicionado após a revisão do editor.</p>}
  </section>;
}
