'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import type { PortfolioData, Project } from '@/lib/types';
import Header from './Header';
import Footer from './Footer';
import Intro from './Intro';
import Dialog from './Dialog';
import ProjectView from './ProjectView';
import Icon from './Icon';
import BrandArt from './BrandArt';
const DiscGallery = dynamic(() => import('./DiscGallery'), { ssr: false, loading: () => <div className="gallery-loading" role="status">Preparando a coleção…</div> });
type Collection = 'featured' | 'all' | 'artist';
const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export default function Portfolio({ data }: { data: PortfolioData }) {
  const [collection, setCollection] = useState<Collection>('featured'), [artistSlug, setArtistSlug] = useState(''), [query, setQuery] = useState(''), [category, setCategory] = useState('');
  const [activeIndex, setActiveIndex] = useState(0), [flipped, setFlipped] = useState(false), [indexOpen, setIndexOpen] = useState(false), [activeProject, setActiveProject] = useState<Project | null>(null);
  const [listView, setListView] = useState(false), [hydrated, setHydrated] = useState(false), [special, setSpecial] = useState(false);
  const gallery = useRef<HTMLElement>(null), galleryUrl = useRef('/');
  const getNames = (project: Project) => project.artistIds.map(id => data.artists.find(artist => artist.id === id)?.name).filter(Boolean).join(' / ');
  const artistOptions = useMemo(() => data.artists.filter(artist => data.projects.some(project => project.artistIds.includes(artist.id))).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')), [data]);
  const filter = (view: Collection, slug: string, search: string, type: string) => {
    const artist = data.artists.find(item => item.slug === slug);
    return data.projects.filter(project => (view === 'featured' ? project.featured : view === 'artist' ? project.artistIds.includes(artist?.id || '') : true)
      && (!search || normalize(`${project.title} ${project.character} ${project.work} ${getNames(project)}`).includes(normalize(search))) && (!type || project.category === type))
      .sort((a, b) => view === 'featured' ? (a.featuredOrder ?? 999) - (b.featuredOrder ?? 999) : view === 'all' ? getNames(a).localeCompare(getNames(b), 'pt-BR') || a.order - b.order : a.order - b.order);
  };
  const filtered = useMemo(() => filter(collection, artistSlug, query, category), [data, collection, artistSlug, query, category]);
  const extras = useMemo<Project[]>(() => [
    { ...data.projects[0], id:'about', slug:'sobre', title:'Sobre mim', character:'Jorak', work:'A história por trás dos cortes', artistIds:[], coverUrl:data.settings.avatarUrl, coverSource:'uploaded', coverAlt:'Avatar original de Jorak', coverPosition:{x:50,y:50}, accent:'#32E6A1', featured:false, segments:[] },
    { ...data.projects[0], id:'contact', slug:'contato', title:'Vamos criar?', character:'Contato & orçamento', work:'Sua próxima história começa aqui', artistIds:[], coverUrl:null, coverSource:null, coverAlt:'Contato e orçamento', coverPosition:{x:50,y:50}, accent:'#32E6A1', featured:false, segments:[] }
  ], [data]);
  const visible = special ? extras : filtered, current = visible[activeIndex];
  useEffect(() => {
    const restore = (initial = false) => {
      const params = new URLSearchParams(location.search);
      const view: Collection = params.get('artista') ? 'artist' : params.get('visao') === 'todos' ? 'all' : 'featured';
      const slug = params.get('artista') || '', search = params.get('busca') || '', type = params.get('tipo') || '';
      const projectSlug = location.pathname.startsWith('/projeto/') ? decodeURIComponent(location.pathname.split('/')[2] || '') : null;
      setCollection(view); setArtistSlug(slug); setQuery(search); setCategory(type); setSpecial(false);
      const found = filter(view, slug, search, type).findIndex(project => project.slug === (projectSlug || params.get('disco')));
      setActiveIndex(Math.max(0, found)); setFlipped(false);
      setActiveProject(projectSlug ? data.projects.find(project => project.slug === projectSlug) || null : null);
      if (initial) setIndexOpen(params.get('indice') === '1');
      setHydrated(true);
    };
    restore(true);
    const pop = () => restore();
    window.addEventListener('popstate', pop); return () => window.removeEventListener('popstate', pop);
  // Parse the entry URL exactly once; filters are maintained by the controls.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!hydrated || activeProject || location.pathname.startsWith('/projeto/')) return;
    const params = new URLSearchParams();
    if (collection === 'all') params.set('visao', 'todos');
    if (collection === 'artist') params.set('artista', artistSlug);
    if (query) params.set('busca', query); if (category) params.set('tipo', category);
    if (!special && current && activeIndex > 0) params.set('disco', current.slug);
    const url = `/${params.size ? `?${params}` : ''}`;
    galleryUrl.current = url; history.replaceState(history.state, '', url);
  }, [hydrated, collection, artistSlug, query, category, activeIndex, current, activeProject, special]);
  useEffect(() => { setActiveIndex(index => index >= visible.length ? 0 : index); }, [visible.length]);
  const select = (index: number) => { setActiveIndex(index); setFlipped(false); };
  const step = (direction: number) => { if (visible.length) select((activeIndex + direction + visible.length) % visible.length); };
  const changeCollection = (next: Collection, artist = '') => { setSpecial(false); setCollection(next); setArtistSlug(artist); setQuery(''); setCategory(''); select(0); };
  const openProject = (project: Project | undefined = current) => {
    if (!project) return;
    if (project.id === 'about' || project.id === 'contact') { location.href = `/${project.slug}`; return; }
    setIndexOpen(false);
    history.pushState({ ...history.state, jorakProject: true, galleryUrl: galleryUrl.current }, '', `/projeto/${project.slug}${galleryUrl.current.includes('?') ? galleryUrl.current.slice(galleryUrl.current.indexOf('?')) : ''}`);
    setActiveProject(project);
  };
  const closeProject = () => { if (history.state?.jorakProject) history.back(); else { history.replaceState(history.state, '', galleryUrl.current); setActiveProject(null); } };
  const collectionName = special ? 'Por trás da edição' : collection === 'featured' ? 'Trabalhos em destaque' : collection === 'artist' ? data.artists.find(item => item.slug === artistSlug)?.name || 'Artista' : 'Todos os trabalhos';
  const clear = () => { setQuery(''); setCategory(''); select(0); };
  const controls = <div className="collection-controls"><div className="collection-switch" aria-label="Coleção"><button onClick={() => changeCollection('featured')} aria-pressed={!special && collection === 'featured'} className={!special && collection === 'featured' ? 'is-active' : ''}>Destaques <span>{data.projects.filter(item => item.featured).length}</span></button><button onClick={() => changeCollection('all')} aria-pressed={!special && collection === 'all'} className={!special && collection === 'all' ? 'is-active' : ''}>Todos <span>{data.projects.length}</span></button></div><label className="artist-select"><span className="sr-only">Filtrar por artista</span><select aria-label="Filtrar por artista" value={!special && collection === 'artist' ? artistSlug : ''} onChange={event => event.target.value ? changeCollection('artist', event.target.value) : changeCollection('all')}><option value="">Por artista</option>{artistOptions.map(artist => <option key={artist.id} value={artist.slug}>{artist.name}</option>)}</select><Icon name="alt-arrow-down-linear" size={14}/></label></div>;
  return <div className={`portfolio ${activeProject ? 'project-is-open' : ''}`}>
    <div className="portfolio-background" inert={Boolean(indexOpen || activeProject)}>
    <Header settings={data.settings} mode={data.mode} onIndex={() => setIndexOpen(true)}/>
    <main id="conteudo">
      <section className="hero-heading"><div className="hero-wordmark"><h1><span className="sr-only">JORAK</span><BrandArt/></h1><span className="wordmark-caption">Editor MMV / Motion designer</span></div><div className="hero-introduction"><p>Do mangá<br/>ao <em>movimento.</em></p><span>Edição para a cena geek brasileira.<br/>Uma coleção de histórias em cada corte.</span></div></section>
      <section className="gallery-section" ref={gallery} tabIndex={0} aria-label="Galeria de discos. Use setas para navegar, Enter para abrir e Espaço para virar." onKeyDown={event => { if (event.target !== event.currentTarget || indexOpen || activeProject) return; if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); step(event.key === 'ArrowRight' ? 1 : -1); } else if (event.key === 'Enter') { event.preventDefault(); openProject(); } else if (event.code === 'Space') { event.preventDefault(); setFlipped(!flipped); } }}>
        <div className="gallery-topline"><div className="collection-label"><span className="green-asterisk" aria-hidden="true">✳</span><span>{collectionName}</span></div>{controls}<button className="gallery-mode text-button" onClick={() => setListView(!listView)} aria-pressed={listView}><Icon name={listView ? 'disk-linear' : 'list-linear'} size={18}/>{listView ? 'Discos' : 'Lista'}</button></div>
        {visible.length ? listView ? <div className="project-list">{visible.map((project, index) => <button key={project.id} className="project-list-row" onClick={() => { select(index); openProject(project); }}><span className="list-disc">{project.coverUrl && <Image src={project.coverUrl} alt="" width={64} height={64} unoptimized/>}<i/></span><span><strong>{project.title}</strong><small>{project.character}</small></span><span className="row-artist">{getNames(project)}</span><Icon name="arrow-right-up-linear"/></button>)}</div> : <><div className="disc-stage"><DiscGallery projects={visible} activeIndex={activeIndex} flipped={flipped} onSelect={select} onOpen={() => openProject()}/><span className="stage-caption">{flipped ? 'O outro lado da história.' : 'Arraste. Explore. Dê play.'}</span></div><div className="gallery-selection"><div className="disc-position"><span>{String(activeIndex + 1).padStart(2, '0')}</span><span className="position-divider"/><span>{String(visible.length).padStart(2, '0')}</span></div><div className="selected-project" aria-live="polite" aria-atomic="true"><p>{special ? current.character : getNames(current)}</p><button onClick={() => openProject()}><h2>{current.title}</h2><Icon name="arrow-right-up-linear" size={28}/></button><span>{special ? current.work : current.character}</span></div><div className="disc-actions"><button className="icon-button flip-button" aria-label="Virar disco" aria-pressed={flipped} onClick={() => setFlipped(!flipped)}><Icon name="refresh-circle-linear" size={24}/></button><button className="icon-button round" aria-label="Disco anterior" onClick={() => step(-1)}><Icon name="arrow-left-linear"/></button><button className="icon-button round" aria-label="Próximo disco" onClick={() => step(1)}><Icon name="arrow-right-linear"/></button></div></div></> : <div className="empty-gallery"><h2>Nenhum disco por aqui.</h2><p>Experimente outro artista ou limpe a busca.</p><button className="pill" onClick={clear}>Limpar filtros</button></div>}
      </section>
      <div className="gallery-bottom"><p>Um corte. Uma intenção.<br/><span>Explore a participação em cada projeto.</span></p><div className="special-discs"><button onClick={() => { setSpecial(true); setListView(false); select(0); gallery.current?.focus({preventScroll:true}); }}><span className="mini-disc mini-avatar"><Image src={data.settings.avatarUrl} width={42} height={42} alt="" unoptimized/><i/></span>Sobre mim</button><button onClick={() => { setSpecial(true); setListView(false); select(1); gallery.current?.focus({preventScroll:true}); }}><span className="mini-disc contact-disc"><Icon name="arrow-right-up-linear" size={20}/><i/></span>Contato & orçamento</button></div><button className="replay-button text-button" onClick={() => window.dispatchEvent(new Event('jorak:intro'))}>Rever introdução <Icon name="refresh-linear" size={14}/></button></div>
    </main><Footer settings={data.settings}/><Intro avatarUrl={data.settings.avatarUrl}/>
    <noscript><section className="no-js-collection"><h2>Explore os trabalhos</h2><p>Use os links para acessar a coleção sem animações.</p>{data.projects.filter(project => project.featured).sort((a,b)=>(a.featuredOrder??999)-(b.featuredOrder??999)).map(project=><Link key={project.id} href={`/projeto/${project.slug}`}>{project.title} — {getNames(project)}</Link>)}</section></noscript>
    </div>
    {indexOpen && <Dialog label="Índice de trabalhos" onClose={() => setIndexOpen(false)} className="index-dialog"><div className="index-header"><h2>A coleção.</h2><button className="icon-button round" onClick={() => setIndexOpen(false)} aria-label="Fechar índice"><Icon name="close-circle-linear" size={24}/></button></div><div className="index-tools">{controls}<label className="index-search"><Icon name="magnifer-linear" size={19}/><input placeholder="Música, personagem ou artista" aria-label="Buscar projetos" value={query} onChange={event => {setQuery(event.target.value); select(0);}}/></label><label className="index-category"><span className="sr-only">Tipo de entrega</span><select value={category} onChange={event => {setCategory(event.target.value); select(0);}}><option value="">Todas as entregas</option>{Array.from(new Set(data.projects.map(item => item.category))).map(item => <option key={item}>{item}</option>)}</select></label></div><p className="index-count">{filtered.length} {filtered.length === 1 ? 'trabalho' : 'trabalhos'} · {collectionName}{(query || category) && <button onClick={clear}>Limpar busca</button>}</p><div className="index-grid">{filtered.map((project, index) => <button className="index-project" key={project.id} onClick={() => { setSpecial(false); select(index); openProject(project); }}><div className="index-artwork" style={{backgroundColor:project.accent}}>{project.coverUrl ? <Image src={project.coverUrl} alt={project.coverAlt || project.title} fill sizes="(max-width: 650px) 45vw, 250px" unoptimized/> : <span>{project.title}<small>Capa em preparação</small></span>}<i/></div><div><span>{getNames(project)}</span><strong>{project.title}</strong><small>{project.character}</small></div><Icon name="arrow-right-up-linear"/></button>)}</div>{!filtered.length && <div className="empty-gallery"><p>Nenhum trabalho encontrado.</p><button className="pill" onClick={clear}>Limpar filtros</button></div>}</Dialog>}
    {activeProject && <Dialog label={activeProject.title} onClose={closeProject} className="project-dialog"><ProjectView project={activeProject} artists={data.artists} settings={data.settings} preview={data.mode === 'local'} onClose={closeProject}/></Dialog>}
  </div>;
}
