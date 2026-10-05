'use client';
import {useEffect,useRef,useState} from 'react';
import Link from './TransitionLink';
import Icon from './Icon';
import {contextDescription,contextualSuggestions,type FaqContext} from '@/lib/faq-context';
type Message={role:'user'|'assistant';text:string;href?:string;label?:string};
export default function FaqPanel({onClose,context}:{onClose:()=>void;context:FaqContext}){
  const info=contextDescription(context);
  const [messages,setMessages]=useState<Message[]>([{role:'assistant',text:info.greeting}]);
  const [question,setQuestion]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const root=useRef<HTMLElement>(null),input=useRef<HTMLInputElement>(null),list=useRef<HTMLDivElement>(null),request=useRef<AbortController|null>(null),alive=useRef(true);
  useEffect(()=>{alive.current=true;input.current?.focus({preventScroll:true});return()=>{alive.current=false;request.current?.abort();};},[]);
  useEffect(()=>{list.current?.scrollTo({top:list.current.scrollHeight});},[messages,busy,error]);
  async function ask(value:string){
    const text=value.trim();if(text.length<2||busy)return;
    setMessages(items=>[...items,{role:'user',text}]);setQuestion('');setBusy(true);setError('');
    const controller=new AbortController();request.current=controller;
    try{
      const response=await fetch('/api/faq',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question:text,context,previousQuestions:messages.filter(item=>item.role==='user').slice(-6).map(item=>item.text)}),signal:controller.signal});
      const result=await response.json();if(!response.ok)throw new Error(result.error||'Não foi possível responder agora.');
      if(alive.current)setMessages(items=>[...items,{role:'assistant',text:result.answer,href:result.href,label:result.label}]);
    }catch(issue){if(alive.current&&!controller.signal.aborted){setError(issue instanceof Error?issue.message:'Não foi possível responder. Tente novamente.');setQuestion(text);}}
    finally{if(alive.current)setBusy(false);}
  }
  return <section ref={root} className="faq-panel" role="dialog" aria-label={'Converse com Jorak — '+info.title} data-lenis-prevent onKeyDown={event=>{
    if(event.key==='Escape'){event.preventDefault();event.stopPropagation();onClose();}
    if(event.key==='Tab'){
      const items=Array.from(root.current!.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input'));
      if(event.shiftKey&&document.activeElement===items[0]){event.preventDefault();event.stopPropagation();items.at(-1)?.focus();}
      else if(!event.shiftKey&&document.activeElement===items.at(-1)){event.preventDefault();event.stopPropagation();items[0]?.focus();}
    }
  }}>
    <div className="faq-heading"><div><strong>Converse com Jorak</strong><span>{info.title}</span></div><button className="icon-button" onClick={onClose} aria-label="Fechar conversa"><Icon name="close-circle-linear" size={24}/></button></div>
    <div ref={list} className="faq-messages" role="log" aria-live="polite">{messages.map((message,index)=><div key={index} className={'faq-message '+message.role}><p>{message.text}</p>{message.href&&<Link href={message.href} onClick={onClose}>{message.label} ↗</Link>}</div>)}{busy&&<p role="status">Preparando resposta…</p>}{error&&<p className="inline-error" role="alert">{error}</p>}</div>
    <div className="faq-suggestions">{contextualSuggestions(context).map(value=><button key={value} disabled={busy} onClick={()=>void ask(value)}>{value}</button>)}</div>
    <form onSubmit={event=>{event.preventDefault();void ask(question);}}><label className="sr-only" htmlFor="faq-question">Sua pergunta</label><input id="faq-question" ref={input} value={question} onChange={event=>setQuestion(event.target.value)} maxLength={800} placeholder="Escreva sua pergunta…" autoComplete="off"/><button disabled={busy||question.trim().length<2} aria-label="Enviar pergunta"><Icon name="arrow-right-linear" size={20}/></button></form>
  </section>;
}
