'use client';
import Image from 'next/image';
import type {Project,SiteSettings} from '@/lib/types';
import {productPrice,productRequest,productEmailHref,type EditingProduct} from '@/lib/editing-products';
import Header from './Header';
import Footer from './Footer';
import Link from './TransitionLink';
import Character from './Character';
import Icon from './Icon';
import './contextual-experience.css';
export default function ProductContactView({product,project,settings}:{product:EditingProduct;project?:Project;settings:SiteSettings}){
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
        <div className="briefing-form"><h2>Fale diretamente com Jorak.</h2><p className="request-form-note">Abra seu aplicativo de e-mail com o projeto, o preço e a mensagem preenchidos. Revise e clique em Enviar no aplicativo.</p>
          <p className="product-email-preview">{productRequest(product)}</p>
          <div className="form-submit"><a className="pill primary" href={productEmailHref(product,settings.email)}>Enviar e-mail sobre este projeto <Icon name="arrow-right-up-linear" size={19}/></a></div>
          <p className="request-form-note">Se o aplicativo não abrir, envie a mensagem acima para <a href={`mailto:${settings.email}`}>{settings.email}</a>.</p>
        </div>
      </section>
    </div>
  </main><Footer settings={settings}/></>;
}
