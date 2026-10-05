import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from '@/components/TransitionLink';
import Character from '@/components/Character';
import Icon from '@/components/Icon';
import { getPublicPortfolio } from '@/lib/server/repository';
import { editingProducts, NODE_VIDEO_COMPATIBILITY, productPrice, productHref, productDescription } from '@/lib/editing-products';
export const dynamic='force-dynamic';
export const metadata={title:'Projetos de edição — Node Video',description:'Arquivos de projeto da edição de Jorak para Node Video. Consulte os valores e a compatibilidade.'};
export default async function EditingProjectsPage(){
  const {settings,projects}=await getPublicPortfolio();
  return <><Header settings={settings}/><main id="conteudo" className="products-page feature-page">
    <section className="product-opening feature-reveal"><div><p className="feature-eyebrow">01 / Arquivos de projeto</p><h1>Por dentro<br/>da <em>edição.</em></h1><p className="feature-lead">Abra o projeto. Explore a construção.<br/>Conheça o movimento por trás de cada corte.</p></div><div className="product-intro-side"><span className="node-badge">NODE VIDEO <span>↗</span></span><p>Uma seleção de arquivos de projeto do Jorak para explorar no aplicativo.</p><a href="#catalogo" className="text-button">Explore os 14 projetos <Icon name="arrow-right-linear" size={18}/></a><Character place="products"/></div></section>
    <aside className="compatibility-strip feature-reveal"><span className="compatibility-symbol" aria-hidden="true">&gt; 6.70</span><div><strong>Antes de abrir seu projeto</strong><p>{NODE_VIDEO_COMPATIBILITY}</p></div></aside>
    <section id="catalogo" aria-label="Catálogo de arquivos de projeto"><div className="catalog-heading"><h2>Seleção de projetos<span> / 14</span></h2><p>Arquivos para Node Video</p></div><div className="product-grid">{editingProducts.map((product,index)=>{
      const work=projects.find(project=>project.slug===product.portfolioSlug);
      const coverUrl=work?.coverUrl||`/media/covers/${product.portfolioSlug}.jpg`;
      return <article key={product.id} className={`product-card feature-reveal${product.price===0?' product-free':''}`} data-product={product.id}>
        <div className="product-image"><Image src={coverUrl} alt={`${product.name} — ${product.artist}`} width={720} height={405} sizes="(max-width: 650px) 100vw, (max-width: 1000px) 50vw, 33vw" loading={index<3?'eager':'lazy'} unoptimized style={{objectPosition:work?.coverPosition?`${work.coverPosition.x}% ${work.coverPosition.y}%`:undefined}}/><span className="product-number">{String(index+1).padStart(2,'0')} / JORAK</span><span className="product-format">NODE VIDEO</span></div>
        <div className="product-body"><div className="product-title"><div><p>{product.artist}</p><h3>{product.name}</h3></div><strong className="product-price">{productPrice(product)}</strong></div><p className="product-description">{productDescription(product)}</p><details className="product-details"><summary>Compatibilidade</summary><p>{NODE_VIDEO_COMPATIBILITY}</p></details>{product.price===0?<a className="product-action free-action" href={productHref(product)} target="_blank" rel="noreferrer">Baixar gratuitamente <Icon name="arrow-right-up-linear" size={19}/></a>:<Link className="product-action" href={productHref(product)}>Tenho interesse <Icon name="arrow-right-up-linear" size={19}/></Link>}{work&&<Link href={`/projeto/${work.slug}`} className="product-work-link">Conheça a edição <span aria-hidden="true">↗</span></Link>}</div>
      </article>;
    })}</div></section><section className="catalog-ending feature-reveal"><div><p>Uma ideia só sua?</p><h2>Vamos criar<br/><em>o próximo corte.</em></h2></div><div><p>Para contratar uma edição personalizada, conte a sua ideia no formulário de orçamento.</p><Link href="/contato" className="pill">Solicitar orçamento <Icon name="arrow-right-up-linear" size={18}/></Link></div></section>
  </main><Footer settings={settings}/></>;
}
