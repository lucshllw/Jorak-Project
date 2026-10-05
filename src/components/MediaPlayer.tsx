'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import type {Project} from '@/lib/types';
import {fileMediaUrl,formatTime,youtubeId} from '@/lib/media';
import {editionPlaylist} from '@/lib/project-presentation';
import {endingTransition,type EndingPhase} from '@/lib/playback-ending';
import Icon from './Icon';
import './media-player.css';
import './playback-ending.css';
const CustomVideoPlayer=dynamic(()=>import('./CustomVideoPlayer'),{loading:()=> <div className="video-loading" role="status">Preparando player…</div>});
const Ending=dynamic(()=>import('./PlaybackEnding'),{loading:()=>null});
const YouTubePlayer=dynamic(()=>import('./YouTubePlayer'),{loading:()=> <div className="video-loading" role="status">Preparando YouTube…</div>});
export {youtubeId} from '@/lib/media';
export default function MediaPlayer({project}:{project:Project}){
  const parts=editionPlaylist(project),ownEdition=parts.length>0;
  const [part,setPart]=useState(0),[playing,setPlaying]=useState(false),[compact,setCompact]=useState(false),[phase,setPhase]=useState<EndingPhase>('ready'),[restart,setRestart]=useState(0);
  const loop=false,phaseRef=useRef<EndingPhase>('ready'),loopRef=useRef(false);
  const timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
  const go=useCallback((event:'play'|'ended'|'present'|'repeat')=>{const next=endingTransition(phaseRef.current,event,loopRef.current);phaseRef.current=next;setPhase(next);return next;},[]);
  useEffect(()=>{
    const preference=window.matchMedia('(max-width: 700px)'),update=()=>setCompact(preference.matches);update();preference.addEventListener('change',update);
    return()=>{preference.removeEventListener('change',update);if(timer.current)clearTimeout(timer.current);};
  },[]);
  const segment=parts[part]||parts[0],clip=segment&&((compact&&fileMediaUrl(segment.mobileClipUrl))||fileMediaUrl(segment.clipUrl)),poster=fileMediaUrl(segment?.posterUrl)||undefined;
  const ratio=segment?.videoWidth&&segment.videoHeight?segment.videoWidth/segment.videoHeight:16/9;
  const originalId=youtubeId(project.youtubeUrl),canEmbed=!ownEdition&&originalId&&!['unavailable','members-only'].includes(project.videoAvailability||'');
  const finish=()=>{
    if(phaseRef.current!=='playing')return;
    if(ownEdition&&part+1<parts.length){setPart(part+1);return;}
    if(loopRef.current){if(parts.length>1)setPart(0);return;}
    if(document.fullscreenElement)void document.exitFullscreen().catch(()=>{});
    if(go('ended')==='finishing')timer.current=setTimeout(()=>go('present'),window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:380);
  };
  const repeat=()=>{
    if(phaseRef.current!=='celestial')return;
    if(go('repeat')!=='returning')return;
    if(timer.current)clearTimeout(timer.current);
    timer.current=setTimeout(()=>{setPart(0);setRestart(value=>value+1);go('play');},window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:300);
  };
  const start=()=>{setPlaying(true);go('play');};
  const completed=phase==='celestial'||phase==='returning';
  const coEditors=Array.from(new Set(project.segments.flatMap(item=>item.coEditors||[])));
  return <section className="player-section" aria-label="Minha Edição ao Projeto">
    <h2 className="edition-heading">Minha Edição ao Projeto</h2>
    {(clip||canEmbed&&playing)?<div className="ending-reservation" data-phase={phase} data-own-edition={ownEdition}>
      <div className="native-space" style={{aspectRatio:String(ratio),minHeight:!ownEdition?200:undefined}}/>
      <div className="video-stage" inert={completed} style={{aspectRatio:String(ratio)}}>
        {clip?(playing?<CustomVideoPlayer key={segment.id} src={clip} title={project.title} poster={poster} loop={loop&&parts.length===1} replayToken={restart} active={!completed} onStarted={()=>go('play')} onEnded={finish}/>:<div className="video-poster">{poster&&<Image src={poster} alt="Quadro da edição de Jorak" fill sizes="(max-width: 700px) 100vw, 1200px" loading="eager" unoptimized/>}<button className="play-button" onClick={start} aria-label="Assistir minha edição"><Icon name="play-bold" size={32}/></button></div>):
        canEmbed&&playing&&!completed&&<YouTubePlayer id={originalId!} title={project.title} loop={loop} restart={restart} onPlaying={()=>go('play')} onEnded={finish}/>}
      </div>
      {completed&&<Ending project={project} ownEdition={ownEdition} exiting={phase==='returning'} onRepeat={repeat}/>}
    </div>:<div className="edition-pending"><Icon name="disk-linear" size={28}/><p>Minha edição será adicionada aqui.</p>{canEmbed&&<button className="pill" onClick={start}>Assistir vídeo original</button>}{project.youtubeUrl&&<a className="pill" href={project.youtubeUrl} target="_blank" rel="noreferrer">Conheça o lançamento completo <Icon name="arrow-right-up-linear" size={17}/></a>}</div>}
    {!ownEdition&&<p className="original-notice">O vídeo original é o lançamento completo. Ele não representa um recorte delimitado da participação de Jorak.</p>}
    <div className="player-caption"><span>{ownEdition?<>{segment?.kind==='trailer'?'Trailer · ':''}Edição: Jorak{segment?.timeline!=='showcase'&&segment?` · ${formatTime(segment.start!)}–${formatTime(segment.end!)}`:''}{parts.length>1?` · Parte ${part+1} de ${parts.length}`:''}</>:'Vídeo original completo · participação sem recorte disponível'}</span>{project.youtubeUrl&&<a href={project.youtubeUrl} className="player-original-link" target="_blank" rel="noreferrer">Vídeo original completo <Icon name="arrow-right-up-linear" size={16}/></a>}</div>
    {coEditors.length>0&&<p className="player-source-note">Coedição com {coEditors.join(', ')}.</p>}
    {segment?.timeline==='showcase'&&segment.sourceUrl&&<p className="player-source-note"><a href={segment.sourceUrl} target="_blank" rel="noreferrer">Publicado por Jorak <Icon name="arrow-right-up-linear" size={13}/></a></p>}
  </section>;
}
