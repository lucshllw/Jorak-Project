'use client';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import type { SiteSettings } from '@/lib/types';
import { characterPose, poseSrc, type CharacterPlace, type CharacterPose } from '@/lib/character-poses';
import dynamic from 'next/dynamic';
import {faqContext,contextDescription,type FaqContext} from '@/lib/faq-context';
import './contextual-experience.css';

let lastEntrySide=1;
const FaqPanel = dynamic(() => import('./FaqPanel'));
export default function Character({place,hidden=false,context:suppliedContext,onOpenChange}:{place:CharacterPlace;settings?:SiteSettings;hidden?:boolean;context?:FaqContext;onOpenChange?:(open:boolean)=>void}){
  const context=suppliedContext||faqContext(place),contextKey=context.page+':'+(context.productId||'');
  const root=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement>(null);
  const [open,setOpen]=useState(false),[pose,setPose]=useState<CharacterPose>(()=>characterPose(place)),[blink,setBlink]=useState(false),[blocked,setBlocked]=useState(true);
  useEffect(()=>{onOpenChange?.(open);},[open,onOpenChange]);
  useEffect(()=>()=>{onOpenChange?.(false);},[onOpenChange]);
  useEffect(()=>setOpen(false),[contextKey]);
  useEffect(()=>{if(hidden)setOpen(false);},[hidden]);
  useEffect(()=>{
    if(hidden||!root.current)return;
    const node=root.current,preference=window.matchMedia('(prefers-reduced-motion: reduce)'),finalPose=characterPose(place),ctx=gsap.context(()=>{},node);
    let sequence:gsap.core.Timeline|undefined,breathe:gsap.core.Tween|undefined,head:gsap.core.Tween|undefined;
    let blinkTimer:ReturnType<typeof setTimeout>|undefined,alive=true,inView=false,idle=false,generation=0;
    const preload=(next:CharacterPose[])=>Promise.all(next.map(value=>new Promise<void>(resolve=>{const image=new window.Image();image.onload=()=>resolve();image.onerror=()=>resolve();image.src=poseSrc(value);if(image.complete)resolve();})));
    const clearBlink=()=>{if(blinkTimer)clearTimeout(blinkTimer);blinkTimer=undefined;setBlink(false);};
    const blinkLater=()=>{
      if(!alive||!idle||!inView||document.hidden||preference.matches||finalPose!=='seated')return;
      blinkTimer=setTimeout(()=>{if(!alive)return;setBlink(true);blinkTimer=setTimeout(()=>{setBlink(false);blinkLater();},130);},4200+Math.random()*2700);
    };
    const visibility=()=>{
      const active=inView&&!document.hidden&&!preference.matches;
      [sequence,breathe,head].forEach(animation=>active?animation?.resume():animation?.pause());
      clearBlink();if(active&&idle)blinkLater();
    };
    const startIdle=()=>{
      if(!alive)return;idle=true;setBlocked(false);setPose(finalPose);
      ctx.add(()=>{
        breathe=gsap.to(node.querySelector('.character-body'),{y:-1.7,scaleY:1.006,duration:2.8,yoyo:true,repeat:-1,ease:'sine.inOut'});
        if(finalPose==='seated')head=gsap.to(node.querySelector('.character-head'),{rotation:.55,duration:3.5,yoyo:true,repeat:-1,ease:'sine.inOut'});
      });visibility();
    };
    const setup=async()=>{
      const current=++generation;ctx.revert();clearBlink();idle=false;setBlocked(true);setPose(finalPose);
      if(preference.matches){gsap.set(node,{clearProps:'all'});setBlocked(false);return;}
      await preload(place==='home'?['falling','landing','seated','seated-blink']:finalPose==='seated'?['seated-blink']:[]);
      if(!alive||preference.matches||current!==generation)return;
      ctx.add(()=>{
        if(place==='home'){
          lastEntrySide*=-1;setPose('falling');
          sequence=gsap.timeline({onComplete:startIdle});
          sequence.fromTo(node,{y:-150,x:18*lastEntrySide,rotation:8*lastEntrySide,autoAlpha:0},{autoAlpha:1,duration:.1});
          sequence.to(node,{y:0,x:0,rotation:0,duration:.42,ease:'power2.in'});
          sequence.call(()=>setPose('landing')).to(node,{scaleY:.94,scaleX:1.04,duration:.1,ease:'power1.out'}).to(node,{scaleY:1,scaleX:1,duration:.2,ease:'power2.out'});
          sequence.call(()=>setPose('seated')).to(node,{y:-3,duration:.12,ease:'sine.out'}).to(node,{y:0,duration:.16,ease:'sine.inOut'});
        }else sequence=gsap.timeline({onComplete:startIdle}).fromTo(node,{y:12,autoAlpha:0},{y:0,autoAlpha:1,duration:.4,ease:'power3.out'});
      });visibility();
    };
    const observer=new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;visibility();},{threshold:.1});observer.observe(node);
    const exit=()=>{++generation;setBlocked(true);setOpen(false);clearBlink();sequence?.kill();breathe?.kill();head?.kill();idle=false;if(preference.matches)return;setPose('point-side');ctx.add(()=>{sequence=gsap.timeline().to(node,{y:-3,rotation:-2,duration:.1}).to(node,{y:5,autoAlpha:.5,duration:.13,ease:'power2.in'});});};
    const reset=()=>void setup(); window.addEventListener('jorak:transition-cancel',reset);
    void setup();preference.addEventListener('change',setup);document.addEventListener('visibilitychange',visibility);window.addEventListener('jorak:transition',exit);
    return()=>{alive=false;++generation;clearBlink();observer.disconnect();preference.removeEventListener('change',setup);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('jorak:transition',exit);window.removeEventListener('jorak:transition-cancel',reset);ctx.revert();};
  },[place,hidden]);
  const close=()=>{setOpen(false);trigger.current?.focus({preventScroll:true});};
  if(hidden)return null;
  const seated=pose==='seated';
  const art=<span className={`character-body${seated?' is-seated':''}`}><Image className="character-art" src={poseSrc(pose)} alt={place==='home'?'Personagem de Jorak sentado. Toque para conversar.':'Personagem ilustrado de Jorak'} width={384} height={512} unoptimized/>{seated&&<span className="character-head" aria-hidden="true"><Image src={poseSrc(blink?'seated-blink':'seated')} alt="" width={384} height={512} unoptimized/></span>}</span>;
  return <div ref={root} className={`character-anchor character-${place}`} data-character-pose={seated&&blink?'seated-blink':pose}>
    {<><button ref={trigger} className="character-trigger" disabled={blocked} aria-label={'Conversar com Jorak — '+contextDescription(context).title} aria-haspopup="dialog" aria-expanded={open} onClick={()=>setOpen(!open)}>{art}<span className="character-caption">Vamos conversar?</span></button>{open&&createPortal(<FaqPanel key={contextKey} context={context} onClose={close}/>,root.current?.closest('.dialog')||document.body)}</>}
  </div>;
}
