'use client';
import { useEffect, useId, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import type { Project, Segment } from '@/lib/types';
import { announcePlayback, confirmedRange, fileMediaUrl, formatTime, youtubeId } from '@/lib/media';
import Icon from './Icon';
import './media-player.css';
const CustomVideoPlayer = dynamic(() => import('./CustomVideoPlayer'), { loading: () => <div className="video-loading" role="status">Preparando player…</div> });
export { youtubeId } from '@/lib/media';

export default function MediaPlayer({ project }: { project: Project }) {
  const owner = useId();
  const [selected, setSelected] = useState(0), [playing, setPlaying] = useState(false), [loop, setLoop] = useState(false);
  const segment: Segment | undefined = project.segments[selected];
  const confirmed = confirmedRange(segment), clipUrl = confirmed ? fileMediaUrl(segment.clipUrl) : null;
  const showcaseId = youtubeId(project.editShowcaseUrl || null);
  const id = showcaseId || youtubeId(project.youtubeUrl), unavailable = !showcaseId && (project.videoAvailability === 'unavailable' || project.videoAvailability === 'members-only');
  const label = clipUrl ? 'Assistir meu trecho' : showcaseId ? 'Assistir trecho publicado por Jorak' : confirmed ? 'Assistir meu trecho' : 'Ver vídeo original';
  useEffect(() => {
    if (clipUrl) return;
    const visibility = () => { if (document.hidden) setPlaying(false); };
    const another = (event: Event) => { if ((event as CustomEvent<{ owner: string }>).detail?.owner !== owner) setPlaying(false); };
    document.addEventListener('visibilitychange', visibility); window.addEventListener('jorak:media-play', another);
    return () => { document.removeEventListener('visibilitychange', visibility); window.removeEventListener('jorak:media-play', another); };
  }, [clipUrl, owner]);
  const start = () => { if (!clipUrl) announcePlayback(owner); setPlaying(true); };
  const caption = clipUrl ? `Minha participação · ${formatTime(segment!.start!)}–${formatTime(segment!.end!)}`
    : showcaseId ? 'Trecho publicado por Jorak · vídeo externo' : confirmed ? `Trecho identificado · ${formatTime(segment.start)}–${formatTime(segment.end)}`
    : segment?.start != null ? `Início identificado · ${formatTime(segment.start)} · término pendente` : 'Vídeo original · intervalos individuais pendentes';
  return <section className="player-section" aria-label="Vídeo do projeto">
    {project.segments.length > 1 && <div className="segment-selector" aria-label="Selecionar trecho">{project.segments.map((item, index) => <button key={item.id} className={`pill ${index === selected ? 'is-active' : ''}`} aria-pressed={index === selected} onClick={() => { setSelected(index); setPlaying(false); }}>{item.name || `Trecho ${index + 1}`} {item.start != null ? <span>{formatTime(item.start)}{confirmedRange(item) ? `–${formatTime(item.end)}` : ' · fim pendente'}</span> : null}</button>)}</div>}
    <div className="video-stage">
      {playing ? clipUrl ? <CustomVideoPlayer key={segment!.id} src={clipUrl} title={project.title} poster={project.coverUrl || undefined} loop={loop}/>
        : id && !unavailable ? <iframe key={`${id}-${selected}`} src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1${confirmed && !showcaseId ? `&start=${Math.floor(segment.start)}&end=${Math.floor(segment.end)}` : ''}`} title={`${project.title} — ${showcaseId || confirmed ? 'trecho de Jorak' : 'vídeo original'}`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"/> : null
        : <div className="video-poster" style={{ '--project-accent': project.accent } as React.CSSProperties}>
          {project.coverUrl && <Image src={project.coverUrl} alt="" fill sizes="(max-width: 700px) 100vw, 900px" unoptimized/>}
          <div className="poster-shade"/><div className="poster-copy"><span>{project.character || project.title}</span><strong>{project.title}</strong></div>
          {(clipUrl || (id && !unavailable)) && <button className="play-button" onClick={start} aria-label={label}><Icon name="play-bold" size={26}/><span>{label}</span></button>}
        </div>}
    </div>
    <div className="player-caption"><span>{caption}</span>{clipUrl && <label><input type="checkbox" checked={loop} onChange={event => setLoop(event.target.checked)}/> Repetir trecho</label>}{project.youtubeUrl && <a href={project.youtubeUrl} className="player-original-link" target="_blank" rel="noreferrer">Vídeo original completo <Icon name="arrow-right-up-linear" size={16}/></a>}</div>
    {segment?.coEditors?.length ? <p className="player-source-note">Coedição com {segment.coEditors.join(', ')}.</p> : null}
    {showcaseId && !clipUrl && <p className="player-source-note"><a href={project.editShowcaseUrl} target="_blank" rel="noreferrer">Ver a comissão no canal de Jorak</a>. A reprodução usa o player oficial do YouTube, cuja interface permanece visível.</p>}
    {unavailable && !clipUrl ? <p className="media-note">{project.videoAvailability === 'members-only' ? 'Este vídeo é exclusivo para membros do canal. Consulte o lançamento no canal original.' : 'O vídeo original está indisponível. O recorte será adicionado quando o arquivo estiver disponível.'}</p>
      : !clipUrl && !showcaseId ? <p className="player-source-note">{confirmed ? 'O recorte próprio está em preparação. Por enquanto, a reprodução usa o player oficial do YouTube.' : 'A participação está creditada. O recorte será adicionado após confirmar os limites da edição.'} A interface do YouTube permanece visível nesta versão.</p> : null}
  </section>;
}
