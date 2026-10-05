import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Character from '@/components/Character';
import Link from '@/components/TransitionLink';
import Icon from '@/components/Icon';
import { getPublicPortfolio } from '@/lib/server/repository';
import { ACADEMY_URL } from '@/lib/editing-products';
export const dynamic='force-dynamic';
export const metadata={title:'Surfate Academy — Jorak e o ensino'};
export default async function AcademyPage(){
  const {settings}=await getPublicPortfolio();
  return <><Header settings={settings}/><main id="conteudo" className="academy-page feature-page"><section className="academy-opening feature-reveal"><p className="feature-eyebrow">02 / Surfate Academy · Criação & aprendizado</p><div className="academy-hero-grid"><div><h1>Aprender.<br/>Criar.<br/><em>Dar movimento.</em></h1><p className="feature-lead">O universo da edição também<br/>é um espaço para aprender.</p><a href={ACADEMY_URL} target="_blank" rel="noreferrer" className="pill primary">Conhecer a Surfate Academy <Icon name="arrow-right-up-linear" size={18}/></a></div><div className="academy-composition" aria-label="Jorak, professor de animação 2D no celular"><div className="academy-frame"><span className="frame-caption">ANIMAÇÃO / 2D</span><Image src={settings.avatarUrl} width={400} height={400} alt="Jorak, editor e professor de animação 2D no celular" unoptimized/><div className="academy-frame-name"><strong>JORAK</strong><span>Professor de animação 2D<br/>no celular</span></div></div><div className="academy-timeline" aria-hidden="true"><span>00:00:01:24</span><i/><i/><i/><i/></div><Character place="academy"/></div></div></section><div className="academy-official feature-reveal"><span>Surfate Academy</span><p>Conheça a formação e a equipe da <strong>Surfate Academy</strong> no site oficial.</p></div><section className="academy-learning feature-reveal"><div><p className="feature-eyebrow">Dentro da academia</p><h2>Do conceito<br/>à <em>animação.</em></h2></div><div><p>A Surfate Academy apresenta uma formação prática em animação digital, com conteúdos de animação 2D e 3D ligados à criação de vídeos e à cena geek.</p><p>Jorak integra a equipe como professor de animação 2D no celular, conectando sua experiência em edição ao ensino.</p><a className="text-button" href={ACADEMY_URL} target="_blank" rel="noreferrer">Confira a formação e as informações oficiais <Icon name="arrow-right-up-linear" size={18}/></a></div></section><section className="academy-bottom feature-reveal"><p>Da edição ao aprendizado.<br/><em>Uma história em movimento.</em></p><Link href="/" className="pill">Explore os trabalhos <Icon name="arrow-right-linear" size={18}/></Link></section></main><Footer settings={settings}/></>;
}
