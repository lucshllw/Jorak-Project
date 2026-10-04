import Image from 'next/image';
import Link from '@/components/TransitionLink';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Character from '@/components/Character';
import Icon from '@/components/Icon';
import { getPublicPortfolio } from '@/lib/server/repository';
export const dynamic='force-dynamic';
export const metadata={title:'Sobre mim'};
export default async function AboutPage(){ const {settings}=await getPublicPortfolio();return <><Header settings={settings}/><main id="conteudo" className="about-page"><div className="about-top"><div><p>Por trás dos cortes</p><h1>Prazer,<br/>eu sou <em>Jorak.</em></h1></div><div className="about-avatar"><Image src={settings.avatarUrl} width={400} height={400} alt="Ilustração original de perfil de Jorak com chapéu verde" unoptimized priority/><span>Editor. Motion designer. Professor.</span><Character place="about" settings={settings}/></div></div><div className="about-story"><h2>Do quadro<br/>à <em>história.</em></h2><div><p className="about-bio preserve-lines">{settings.bio}</p>{settings.career && <p className="preserve-lines">{settings.career}</p>}<a className="text-button" href="https://surfateacademy.com.br/" target="_blank" rel="noreferrer">Conheça a Surfate Academy <Icon name="arrow-right-up-linear" size={18}/></a></div></div>{settings.showreelUrl && <section className="showreel-section"><h2>Um pouco de cada história.</h2><a className="pill" href={settings.showreelUrl} target="_blank" rel="noreferrer">Assistir ao showreel <Icon name="play-linear" size={18}/></a></section>}<div className="about-ending"><p>Cada corte tem uma intenção.</p><Link href="/" className="pill">Explore os trabalhos <Icon name="arrow-right-linear" size={19}/></Link><Link href="/contato" className="pill primary">Vamos criar <Icon name="arrow-right-up-linear" size={19}/></Link></div></main><Footer settings={settings}/></>; }
