'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import type { Project } from '@/lib/types';
import { fileMediaUrl, formatTime } from '@/lib/media';
import { editionPlaylist } from '@/lib/project-presentation';
import Icon from './Icon';
import './media-player.css';
const CustomVideoPlayer = dynamic(() => import('./CustomVideoPlayer'), { loading: () => <div className="video-loading" role="status">Preparando player…</div> });
export { youtubeId } from '@/lib/media';

export default function MediaPlayer({ project }: { project: Project }) {
  const parts = editionPlaylist(project);
  const [part, setPart] = useState(0), [playing, setPlaying] = useState(false), [loop, setLoop] = useState(false), [compact, setCompact] = useState(false);
  useEffect(() => {
    const preference = window.matchMedia('(max-width: 700px)'), update = () => setCompact(preference.matches);
    update(); preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);
  const segment = parts[part] || parts[0];
  const clip = segment && ((compact && fileMediaUrl(segment.mobileClipUrl)) || fileMediaUrl(segment.clipUrl));
  const poster = fileMediaUrl(segment?.posterUrl) || undefined;
  const aspectRatio = segment?.videoWidth && segment.videoHeight ? `${segment.videoWidth} / ${segment.videoHeight}` : '16 / 9';
  const finishPart = () => { if (part + 1 < parts.length) setPart(part + 1); else if (loop && parts.length > 1) setPart(0); };
  const coEditors = Array.from(new Set(project.segments.flatMap(item => item.coEditors || [])));
  return <section className="player-section" aria-label="Minha Edição ao Projeto">
    <h2 className="edition-heading">Minha Edição ao Projeto</h2>
    {clip ? <div className="video-stage" style={{ aspectRatio }}>
      {playing ? <CustomVideoPlayer key={segment.id} src={clip} title={project.title} poster={poster} loop={loop && parts.length === 1} onEnded={finishPart}/>
        : <div className="video-poster">{poster && <Image src={poster} alt="Quadro da edição de Jorak" fill sizes="(max-width: 700px) 100vw, 1200px" loading="eager" unoptimized/>}<button className="play-button" onClick={() => setPlaying(true)} aria-label="Assistir minha edição"><Icon name="play-bold" size={32}/></button></div>}
    </div> : <div className="edition-pending"><Icon name="disk-linear" size={28}/><p>Minha edição será adicionada aqui.</p>{project.youtubeUrl && <a className="pill" href={project.youtubeUrl} target="_blank" rel="noreferrer">Conheça o lançamento completo <Icon name="arrow-right-up-linear" size={17}/></a>}</div>}
    <div className="player-caption"><span>{segment?.kind === 'trailer' ? 'Trailer · ' : ''}Edição: Jorak{segment?.timeline !== 'showcase' && segment ? ` · ${formatTime(segment.start!)}–${formatTime(segment.end!)}` : ''}{parts.length > 1 ? ` · Parte ${part + 1} de ${parts.length}` : ''}</span>{clip && <label><input type="checkbox" checked={loop} onChange={event => setLoop(event.target.checked)}/> Repetir edição</label>}{project.youtubeUrl && <a href={project.youtubeUrl} className="player-original-link" target="_blank" rel="noreferrer">Vídeo original completo <Icon name="arrow-right-up-linear" size={16}/></a>}</div>
    {coEditors.length > 0 && <p className="player-source-note">Coedição com {coEditors.join(', ')}.</p>}
    {segment?.timeline === 'showcase' && segment.sourceUrl && <p className="player-source-note"><a href={segment.sourceUrl} target="_blank" rel="noreferrer">Publicado por Jorak <Icon name="arrow-right-up-linear" size={13}/></a></p>}
  </section>;
}
