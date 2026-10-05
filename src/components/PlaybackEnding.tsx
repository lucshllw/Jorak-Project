'use client';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import {useCallback,useEffect,useRef,useState} from 'react';
import gsap from 'gsap';
import {coverPlatform,endingLinks} from '@/lib/playback-ending';
import type {Project} from '@/lib/types';
import './playback-ending.css';
const Scene=dynamic(()=>import('./CelestialScene'),{ssr:false});
export default function PlaybackEnding({project,exiting,onRepeat,ownEdition}:{project:Project;exiting:boolean;onRepeat:()=>void;ownEdition:boolean}){
  const root=useRef<HTMLDivElement>(null),repeat=useRef<HTMLButtonElement>(null),menu=useRef<HTMLElement>(null);
  const closeLinks=()=>{setLinksOpen(false);root.current?.querySelector<HTMLElement>('.celestial-webgl')?.focus({preventScroll:true});};
  const [paused,setPaused]=useState(false),[reduced,setReduced]=useState(false),[failed,setFailed]=useState(false),[ready,setReady]=useState(false),[back,setBack]=useState(false),[preferencesReady,setPreferencesReady]=useState(false),[linksOpen,setLinksOpen]=useState(false);
  useEffect(()=>{if(linksOpen)menu.current?.querySelector<HTMLAnchorElement>('a')?.focus({preventScroll:true});},[linksOpen]);
  const platform=coverPlatform(project.coverSource),cover=project.coverUrl,links=endingLinks(project);
  const openLinks=useCallback(()=>{setPaused(true);setLinksOpen(true);},[]);
  const faceChanged=useCallback((isBack:boolean)=>{setBack(isBack);if(!isBack)setLinksOpen(false);},[]);
  const interact=useCallback(()=>{setPaused(true);setLinksOpen(false);},[]);
  const failure=useCallback(()=>setFailed(true),[]),sceneReady=useCallback(()=>setReady(true),[]);
  useEffect(()=>{
    const motion=window.matchMedia('(prefers-reduced-motion: reduce)'),change=()=>setReduced(motion.matches);change();setPreferencesReady(true);motion.addEventListener('change',change);
    const savedFocus=document.activeElement;
    if(root.current?.parentElement?.contains(savedFocus))repeat.current?.focus({preventScroll:true});
    return()=>motion.removeEventListener('change',change);
  },[]);
  useEffect(()=>{
    const node=root.current;if(!node)return;
    const ctx=gsap.context(()=>{if(!reduced)gsap.to(node,{opacity:exiting?0:1,duration:exiting?.28:.45,ease:'power2.out'});},node);
    return()=>ctx.revert();
  },[exiting,reduced]);
  const staticView=reduced||failed||!cover;
  return <div ref={root} className="playback-ending" data-ending-mode="celestial" data-static={staticView} data-ready={ready} data-exiting={exiting} onKeyDown={event=>{if(event.key==='Escape'&&linksOpen){event.preventDefault();event.stopPropagation();closeLinks();}}}>
    <div className="ending-media">
      <div className="ending-static with-frame" inert={!staticView} style={{opacity:staticView||!ready?1:0}} aria-hidden={!staticView}>
        {back? <div className="ending-back"><button className="static-avatar-button" onClick={openLinks} aria-label="Abrir links pelo ícone do Jorak"><Image src="/media/jorak-avatar-original.png" alt="Ícone do Jorak" width={1600} height={1600} unoptimized/></button></div>:
        cover?<Image src={cover} alt={project.coverAlt||project.title} width={1280} height={720} unoptimized/>:<span>JORAK</span>}
      </div>
      {preferencesReady&&!staticView&&cover&&<Scene cover={cover} paused={paused} exiting={exiting} onReady={sceneReady} onFailure={failure} onFaceChange={faceChanged} onInteract={interact} onBackClick={openLinks}/>}
    {back&&linksOpen&&!exiting&&links.length>0&&<nav ref={menu} className="ending-back-links" aria-label="Links do verso do disco">{links.map(link=><a key={link.href} href={link.href} target="_blank" rel="noreferrer">{link.label} ↗</a>)}<button onClick={closeLinks} aria-label="Fechar links do disco">Fechar links</button></nav>}
    </div>
    <div className="ending-controls">
      <button ref={repeat} onClick={onRepeat} disabled={exiting} className="pill primary">{ownEdition?'Repetir minha edição':'Repetir vídeo'}</button>
      {!staticView?<button className="text-button" aria-pressed={paused} onClick={()=>setPaused(!paused)}>{paused?'Retomar rotação':'Pausar rotação'}</button>:<button className="text-button" onClick={()=>{setBack(!back);setLinksOpen(false);}}>{back?'Ver capa':'Ver verso'}</button>}
      {back&&!linksOpen&&<button className="text-button" onClick={openLinks}>Links do trabalho</button>}
    </div>
    <p className="ending-attribution">Origem da capa: {platform==='youtube'?'YouTube':platform==='spotify'?'Spotify':'JORAK / outra origem'}. {ownEdition?'Reprodução da edição concluída.':'Reprodução do vídeo completo concluída.'}</p>
    {failed&&<p className="ending-note" role="status">Apresentação estática disponível. Você pode repetir o vídeo normalmente.</p>}
  </div>;
}
