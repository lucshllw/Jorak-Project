'use client';
import Image from 'next/image';
import {useState} from 'react';
import type {Project,SiteSettings} from '@/lib/types';
import {productPrice,productRequest,productEmailHref,type EditingProduct} from '@/lib/editing-products';
import Header from './Header';
import Footer from './Footer';
import Link from './TransitionLink';
import Character from './Character';
import Icon from './Icon';
import './contextual-experience.css';
export default function ProductContactView({product,project,settings}:{product:EditingProduct;project?:Project;settings:SiteSettings}){
  const [prepared,setPrepared]=useState(false);
  function prepareEmail(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();
    const fields=new FormData(event.currentTarget);
    const href=productEmailHref(product,settings.email,{name:String(fields.get('name')||''),email:String(fields.get('email')||''),message:String(fields.get('message')||'')});
    window.location.href=href;setPrepared(true);
  }
  return <><Header settings={settings}/><main id="conteudo" className="product-request-page">
    <Link href="/projetos-de-edicao" className="text-button"><Icon name="arrow-left-linear"/> Voltar ao catálogo</Link>
    <div className="product-request-grid">
      <section className="request-product" aria-label="Projeto selecionado">
        <div className="request-art"><Image src={project?.coverUrl||`/media/covers/${product.portfolioSlug}.jpg`} alt={project?.coverAlt||`${product.name} — ${product.artist}`} width={1280} height={720} unoptimized/></div>
        <p>Arquivo de projeto · {product.artist}</p><h1>{product.name}</h1><strong className="request-price">{productPrice(product)}</strong>
        <p className="request-compatibility">Projeto para Node Video. Compatível somente com versões superiores à 6.70.</p>
        <p>Este é o valor do arquivo selecionado. A compra e o pagamento serão combinados diretamente por e-mail.</p>
      </section>
      <section className="request-form-section" aria-label="Solicitar este arquivo">
        <Character place="contact" context={{page:'product-contact',productId:product.id}}/>
        <form className="briefing-form" onSubmit={prepareEmail}><h2>Interesse neste projeto.</h2><p className="request-form-note">Produto e preço fixos. Preencha seu contato e revise a mensagem para enviar um e-mail diretamente ao Jorak.</p>
          <div className="form-grid"><label>Seu nome<input name="name" autoComplete="name" required minLength={2} maxLength={120}/></label><label>E-mail<input name="email" type="email" autoComplete="email" required maxLength={200}/></label>
          <label className="full-field">Mensagem<textarea name="message" rows={5} required minLength={10} maxLength={5000} defaultValue={productRequest(product)}/></label></div>
          <div className="form-submit"><p>Seu aplicativo abrirá com os dados preenchidos.<br/>Revise e clique em Enviar no aplicativo.</p><button className="pill primary" type="submit">Enviar e-mail sobre este projeto <Icon name="arrow-right-up-linear" size={19}/></button></div>
          {prepared&&<p className="request-form-note" role="status">O e-mail foi preparado. O envio só acontece ao clicar em Enviar no seu aplicativo de e-mail.</p>}
          <p className="request-form-note">Se o aplicativo não abrir, envie a mensagem para <a href={`mailto:${settings.email}`}>{settings.email}</a>.</p>
        </form>
      </section>
    </div>
  </main><Footer settings={settings}/></>;
}
