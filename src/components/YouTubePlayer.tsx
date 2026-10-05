'use client';
import {useEffect,useRef,useState,useId} from 'react';
import {announcePlayback} from '@/lib/media';
type Player={playVideo:()=>void;pauseVideo:()=>void;seekTo:(time:number,ahead:boolean)=>void;destroy:()=>void;getIframe:()=>HTMLIFrameElement};
type Event={target:Player;data:number};
type Api={Player:new(element:HTMLElement,options:object)=>Player};
type ApiWindow=Window&{YT?:Api;onYouTubeIframeAPIReady?:()=>void};
let apiPromise:Promise<Api>|undefined;
function loadApi(){
  if((window as ApiWindow).YT?.Player)return Promise.resolve((window as ApiWindow).YT!);
  if(!apiPromise)apiPromise=new Promise<Api>((resolve,reject)=>{
    const apiWindow=window as ApiWindow,previous=apiWindow.onYouTubeIframeAPIReady;
    const timer=setTimeout(()=>{apiPromise=undefined;reject(new Error('YouTube não respondeu.'));},12000);
    apiWindow.onYouTubeIframeAPIReady=()=>{clearTimeout(timer);previous?.();if(apiWindow.YT)resolve(apiWindow.YT);};
    const script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';script.async=true;
    script.onerror=()=>{clearTimeout(timer);apiPromise=undefined;script.remove();reject(new Error('YouTube indisponível.'));};document.head.appendChild(script);
  });
  return apiPromise;
}
export default function YouTubePlayer({id,title,loop,restart,onPlaying,onEnded}:{id:string;title:string;loop:boolean;restart:number;onPlaying:()=>void;onEnded:()=>void}){
  const host=useRef<HTMLDivElement>(null),instance=useRef<Player|null>(null),owner=useId(),latest=useRef({loop,onPlaying,onEnded});latest.current={loop,onPlaying,onEnded};
  const [error,setError]=useState(''),[loading,setLoading]=useState(true);
  useEffect(()=>{
    let disposed=false,started=false;const root=host.current!,target=document.createElement('div');root.appendChild(target);
    void loadApi().then(api=>{
      if(disposed)return;
      instance.current=new api.Player(target,{videoId:id,host:'https://www.youtube-nocookie.com',width:'100%',height:'100%',playerVars:{playsinline:1,origin:location.origin,rel:0},events:{
        onReady:(event:Event)=>{if(disposed)return;setLoading(false);const iframe=event.target.getIframe();iframe.title='Vídeo original de '+title;iframe.setAttribute('referrerpolicy','strict-origin-when-cross-origin');event.target.playVideo();},
        onStateChange:(event:Event)=>{if(disposed)return;window.dispatchEvent(new CustomEvent('jorak:media-state',{detail:{playing:event.data===1}}));if(event.data===1){started=true;announcePlayback(owner);latest.current.onPlaying();}if(event.data===0&&started){started=false;if(latest.current.loop){event.target.seekTo(0,true);event.target.playVideo();}else latest.current.onEnded();}},
        onError:(event:Event)=>{if(!disposed){setLoading(false);setError('O YouTube não disponibilizou esta reprodução incorporada ('+event.data+'). Use o link do vídeo original.');}}
      }});
    }).catch(()=>{if(!disposed){setLoading(false);setError('Não foi possível carregar o YouTube. Use o link do vídeo original.');}});
    const another=(event:globalThis.Event)=>{if((event as CustomEvent<{owner:string}>).detail?.owner!==owner)instance.current?.pauseVideo();};
    const visibility=()=>{if(document.hidden)instance.current?.pauseVideo();};
    const observer=new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)instance.current?.pauseVideo();},{threshold:.05});observer.observe(root);
    window.addEventListener('jorak:media-play',another);document.addEventListener('visibilitychange',visibility);
    return()=>{disposed=true;observer.disconnect();window.removeEventListener('jorak:media-play',another);document.removeEventListener('visibilitychange',visibility);instance.current?.destroy();instance.current=null;root.replaceChildren();window.dispatchEvent(new CustomEvent('jorak:media-state',{detail:{playing:false}}));};
  },[id,title,owner,restart]);
  return <div className="youtube-main"><div ref={host} style={{width:'100%',height:'100%'}}/>{loading&&<p className="video-loading" role="status">Preparando YouTube…</p>}{error&&<div className="youtube-failure" role="alert"><p>{error}</p><a className="pill" href={'https://www.youtube.com/watch?v='+id} target="_blank" rel="noreferrer">Assistir no YouTube</a></div>}</div>;
}
