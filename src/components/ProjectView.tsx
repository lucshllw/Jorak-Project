'use client';
import Link from './TransitionLink';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import type { Artist, Project, SiteSettings } from '@/lib/types';
import Header from './Header';
import Footer from './Footer';
import MediaPlayer from './MediaPlayer';
import Icon from './Icon';
import { projectDescription } from '@/lib/project-presentation';
import ProjectEnvironment from './ProjectEnvironment';
export default function ProjectView({ project, artists, settings, preview = false, onClose }: { project: Project; artists: Artist[]; settings: SiteSettings; preview?: boolean; onClose?: () => void }) {
  const artistNames = project.artistIds.map(id => artists.find(artist => artist.id === id)?.name).filter(Boolean).join(' / ');
  const [returnUrl, setReturnUrl] = useState('/');
  useEffect(() => { const params = new URLSearchParams(location.search); params.delete('preview'); params.set('disco', project.slug); setReturnUrl(`/?${params}`); }, [project.slug]);
  return <div className="project-page" style={{ '--project-accent': project.accent } as React.CSSProperties}>
    <ProjectEnvironment projectId={project.id}/>
    {!onClose && <><Header settings={settings}/></>}
    <div className="project-return">{onClose ? <button onClick={onClose} className="text-button"><Icon name="arrow-left-linear"/> Voltar à coleção</button> : <Link href={returnUrl} className="text-button"><Icon name="arrow-left-linear"/> Voltar à coleção</Link>}<span>{preview ? 'Prévia do projeto' : project.category}</span><span>{project.work}</span></div>
    <main id="conteudo" className="project-content">
      <div className="project-heading"><div><p className="project-artist">{artistNames}</p><h1>{project.title}</h1></div><p className="project-character">{project.character}</p></div>
      <MediaPlayer project={project}/>
      <div className="project-information"><div className="project-overview"><h2>Sobre este projeto</h2><p>{projectDescription(project, artistNames)}</p>{project.process && <><h2>Por trás da edição</h2><p className="preserve-lines">{project.process}</p></>}
        {project.processImages.length > 0 && <div className="process-images">{project.processImages.map((url, i) => <Image key={url} src={url} alt={`Imagem de processo ${i + 1} de ${project.title}`} width={900} height={550} unoptimized/>)}</div>}
      </div><aside className="project-facts"><div><span>Projeto</span><strong>{project.character || project.title}</strong><p>{project.work}</p></div><div><span>Artista</span><strong>{artistNames}</strong></div><div><span>Entrega</span><strong>{project.category}</strong></div>{project.date && <div><span>Lançamento</span><strong>{new Date(`${project.date}T12:00:00`).toLocaleDateString('pt-BR')}</strong></div>}{project.techniques.length > 0 && <div><span>Técnicas</span><strong>{project.techniques.join(', ')}</strong></div>}{project.tools.length > 0 && <div><span>Ferramentas</span><strong>{project.tools.join(', ')}</strong></div>}</aside></div>
      {project.credits && <section className="credit-section"><h2>Créditos</h2><p className="preserve-lines">{project.credits}</p>{project.creditSource && <a className="text-button" href={project.creditSource} target="_blank" rel="noreferrer">Consultar fonte <Icon name="arrow-right-up-linear" size={18}/></a>}</section>}
      <section className="full-track"><div><p>Continue a história</p><h2>A música completa.</h2></div><div className="track-links">{project.youtubeUrl && <a className="pill" href={project.youtubeUrl} target="_blank" rel="noreferrer">Assistir no YouTube <Icon name="arrow-right-up-linear"/></a>}{project.spotifyUrl && <a className="pill" href={project.spotifyUrl} target="_blank" rel="noreferrer">Ouvir no Spotify <Icon name="arrow-right-up-linear"/></a>}{project.xUrl && <a className="text-button" href={project.xUrl} target="_blank" rel="noreferrer">Bastidores no X <Icon name="arrow-right-up-linear" size={18}/></a>}</div></section>
      <div className="project-bottom"><Link href="/contato"><span>Sua próxima história</span><strong>Vamos dar movimento? <Icon name="arrow-right-up-linear" size={42}/></strong></Link></div>
    </main><Footer settings={settings}/>
  </div>;
}
