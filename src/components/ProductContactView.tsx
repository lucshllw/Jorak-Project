'use client';
import Image from 'next/image';
import {useState} from 'react';
import type {Project,SiteSettings} from '@/lib/types';
import {productPrice,productRequest,type EditingProduct} from '@/lib/editing-products';
import Header from './Header';
import Footer from './Footer';
import Link from './TransitionLink';
import Character from './Character';
import Icon from './Icon';
import './contextual-experience.css';
export default function ProductContactView({product,project,settings}:{product:EditingProduct;project?:Project;settings:SiteSettings}){
  const [state,setState]=useState<'idle'|'sending'|'success'|'error'>('idle'),[error,setError]=useState('');
  async function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();if(state==='sending')return;
    const form=event.currentTarget,fields=new FormData(form);setState('sending');setError('');
    try{
      const response=await fetch('/api/product-interest',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({productId:product.id,name:fields.get('name'),email:fields.get('email'),message:fields.get('message'),website:fields.get('website')})});
      const result=await response.json();if(!response.ok)throw new Error(result.error||'Não foi possível enviar seu interesse.');
      setState('success');form.reset();
    }catch(issue){setState('error');setError(issue instanceof Error?issue.message:'Não foi possível enviar. Tente novamente.');}
  }
  return <><Header settings={settings}/><main id="conteudo" className="product-request-page">
    <Link href="/projetos-de-edicao" className="text-button"><Icon name="arrow-left-linear"/> Voltar ao catálogo</Link>
    <div className="product-request-grid">
      <section className="request-product" aria-label="Projeto selecionado">
        <div className="request-art"><Image src={project?.coverUrl||`/media/covers/${product.portfolioSlug}.jpg`} alt={project?.coverAlt||`${product.name} — ${product.artist}`} width={1280} height={720} unoptimized/></div>
        <p>Arquivo de projeto · {product.artist}</p><h1>{product.name}</h1><strong className="request-price">{productPrice(product)}</strong>
        <p className="request-compatibility">Projeto para Node Video. Compatível somente com versões superiores à 6.70.</p>
        <p>Este é o valor do arquivo selecionado. A solicitação registra seu interesse; o pagamento será combinado diretamente.</p>
      </section>
      <section className="request-form-section" aria-label="Solicitar este arquivo">
        <Character place="contact" context={{page:'product-contact',productId:product.id}}/>
        {state==='success'?<div className="form-success" role="status"><Icon name="check-circle-linear" size={48}/><h2>Seu interesse já está por aqui.</h2><p>O pedido de {product.name}, de {product.artist}, por {productPrice(product)}, foi salvo. Jorak poderá responder pelo e-mail informado.</p><Link href="/projetos-de-edicao" className="pill">Voltar ao catálogo</Link></div>:
        <form onSubmit={submit} className="briefing-form"><h2>Interesse neste projeto.</h2><p className="request-form-note">Produto e preço fixos. Informe seus dados para receber uma resposta.</p>
          <div className="form-grid"><label>Seu nome<input name="name" autoComplete="name" required minLength={2} maxLength={120}/></label><label>E-mail<input name="email" type="email" autoComplete="email" required maxLength={200}/></label>
          <label className="full-field">Mensagem<textarea name="message" rows={5} required minLength={10} maxLength={5000} defaultValue={productRequest(product)}/></label>
          <div className="honeypot" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off"/></label></div></div>
          <div className="form-submit"><p>Seus dados serão usados para responder a esta solicitação.</p><button className="pill primary" disabled={state==='sending'} type="submit">{state==='sending'?'Enviando…':'Enviar interesse neste projeto'}</button></div>
          {state==='error'&&<p role="alert" className="inline-error">{error}</p>}
        </form>}
      </section>
    </div>
  </main><Footer settings={settings}/></>;
}
