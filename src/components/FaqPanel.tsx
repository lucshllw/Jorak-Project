'use client';
import { useEffect, useRef, useState } from 'react';
import Link from './TransitionLink';
import Icon from './Icon';
import { faqSuggestions } from '@/lib/faq';
type Message = { role: 'user' | 'assistant'; text: string; href?: string; label?: string };
export default function FaqPanel({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([{ role: 'assistant', text: 'Oi! Quer conhecer meu trabalho ou conversar sobre seu projeto?' }]);
  const [question, setQuestion] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState(''), [mode, setMode] = useState('registered');
  const input = useRef<HTMLInputElement>(null), list = useRef<HTMLDivElement>(null), request = useRef<AbortController | null>(null), alive = useRef(true);
  useEffect(() => { alive.current = true; input.current?.focus({ preventScroll: true }); return () => { alive.current = false; request.current?.abort(); }; }, []);
  useEffect(() => { list.current?.scrollTo({ top: list.current.scrollHeight }); }, [messages, busy, error]);
  async function ask(value: string) {
    const text = value.trim(); if (text.length < 2 || busy) return;
    setMessages(items => [...items, { role: 'user', text }]); setQuestion(''); setBusy(true); setError('');
    const controller = new AbortController(); request.current = controller;
    try {
      const response = await fetch('/api/faq', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: text }), signal: controller.signal });
      const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Não foi possível responder agora.');
      if (!alive.current) return;
      setMode(result.mode); setMessages(items => [...items, { role: 'assistant', text: result.answer, href: result.href, label: result.label }]);
    } catch (issue) { if (alive.current && !controller.signal.aborted) { setError(issue instanceof Error ? issue.message : 'Não foi possível responder agora. Tente novamente.'); setQuestion(text); } }
    finally { if (alive.current) setBusy(false); }
  }
  return <section className="faq-panel" role="dialog" aria-label="Converse com Jorak" data-lenis-prevent onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); onClose(); } }}>
    <div className="faq-heading"><div><strong>Converse com Jorak</strong><span>{mode === 'ai' ? 'Assistente do portfólio' : 'Respostas do portfólio'}</span></div><button className="icon-button" onClick={onClose} aria-label="Fechar conversa"><Icon name="close-circle-linear" size={24}/></button></div>
    <div ref={list} className="faq-messages" role="log" aria-live="polite">{messages.map((message, index) => <div key={index} className={`faq-message ${message.role}`}><p>{message.text}</p>{message.href && <Link href={message.href} onClick={onClose}>{message.label} ↗</Link>}</div>)}{busy && <p role="status">Preparando resposta…</p>}{error && <p className="inline-error" role="alert">{error}</p>}</div>
    <div className="faq-suggestions">{faqSuggestions.map(value => <button key={value} disabled={busy} onClick={() => void ask(value)}>{value}</button>)}</div>
    <form onSubmit={event => { event.preventDefault(); void ask(question); }}><label className="sr-only" htmlFor="faq-question">Sua pergunta</label><input id="faq-question" ref={input} value={question} onChange={event => setQuestion(event.target.value)} maxLength={800} placeholder="Escreva sua pergunta…" autoComplete="off"/><button disabled={busy || question.trim().length < 2} aria-label="Enviar pergunta"><Icon name="arrow-right-linear" size={20}/></button></form>
  </section>;
}
