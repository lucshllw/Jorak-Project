'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import type { PortfolioData, Project } from '@/lib/types';
import Header from './Header';
import Footer from './Footer';
import Intro from './Intro';
import Dialog from './Dialog';
import Icon from './Icon';
import BrandArt from './BrandArt';
import type { PreviewAnchor, PreviewInteraction, PreviewRequest } from './DiscPreview';
import { claimHomeIntroduction } from '@/lib/introduction';
import { navigateWithTransition } from './TransitionLink';
import Character from './Character';
const DiscGallery = dynamic(() => import('./DiscGallery'), { ssr: false, loading: () => <div className="gallery-loading" role="status">Preparando a coleção…</div> });
const DiscPreview = dynamic(() => import('./DiscPreview'));
const ProjectView = dynamic(() => import('./ProjectView'));
type Collection = 'featured' | 'all' | 'artist';
const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export default function Portfolio({ data }: { data: PortfolioData }) {
  const [collection, setCollection] = useState<Collection>('featured'), [artistSlug, setArtistSlug] = useState(''), [query, setQuery] = useState(''), [category, setCategory] = useState('');
  const [activeIndex, setActiveIndex] = useState(0), [flipped, setFlipped] = useState(false), [indexOpen, setIndexOpen] = useState(false), [activeProject, setActiveProject] = useState<Project | null>(null);
  const [listView, setListView] = useState(false), [hydrated, setHydrated] = useState(false), [special, setSpecial] = useState(false);
  const [preview, setPreview] = useState<PreviewRequest | null>(null);
  const [faqOpen, setFaqOpen] = useState(false);
  const faqActive = useRef(false); faqActive.current = faqOpen;
  const [compact, setCompact] = useState(false);
  const [intro, setIntro] = useState(true), [introChecking, setIntroChecking] = useState(true);
  const introClaimed = useRef<boolean | null>(null), blocked = useRef(true);
  blocked.current = intro || introChecking;
  const previewRef = useRef<PreviewRequest | null>(null), pendingPreview = useRef<PreviewRequest | null>(null), suppressedFocus = useRef<{ node: HTMLElement | null } | null>(null);
  const previewOpenTimer = useRef<ReturnType<typeof setTimeout> | null>(null), previewCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const keepPreview = useCallback(() => { if (previewCloseTimer.current) { clearTimeout(previewCloseTimer.current); previewCloseTimer.current = null; } }, []);
  useEffect(() => {
    const preference = window.matchMedia('(max-width: 700px)'), update = () => setCompact(preference.matches);
    update(); preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);
  const closePreview = useCallback(() => {
    if (previewRef.current) suppressedFocus.current = { node: previewRef.current.trigger || null };
    if (previewOpenTimer.current) clearTimeout(previewOpenTimer.current);
    if (previewCloseTimer.current) clearTimeout(previewCloseTimer.current);
    previewOpenTimer.current = null; previewCloseTimer.current = null; pendingPreview.current = null; previewRef.current = null; setPreview(null);
  }, []);
  useEffect(() => { if (faqOpen) closePreview(); }, [faqOpen, closePreview]);
  useEffect(() => {
    if (introClaimed.current === null) introClaimed.current = claimHomeIntroduction();
    closePreview(); setIntro(introClaimed.current); setIntroChecking(false);
  }, [closePreview]);
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('jorak:interaction-lock', { detail: intro || introChecking || indexOpen || !!activeProject }));
    return () => { window.dispatchEvent(new CustomEvent('jorak:interaction-lock', { detail: false })); };
  }, [intro, introChecking, indexOpen, activeProject]);
  const leavePreview = useCallback((event?: React.SyntheticEvent<HTMLElement>) => {
    if (!previewRef.current && event?.currentTarget === suppressedFocus.current?.node) suppressedFocus.current = null;
    if (previewOpenTimer.current) { clearTimeout(previewOpenTimer.current); previewOpenTimer.current = null; pendingPreview.current = null; }
    if (previewRef.current?.interaction === 'touch' || previewRef.current?.interaction === 'keyboard') return;
    if (!previewCloseTimer.current) previewCloseTimer.current = setTimeout(closePreview, 480);
  }, [closePreview]);
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
  useEffect(() => { if (hydrated && current) window.dispatchEvent(new CustomEvent('jorak:disc-select', { detail: current.id })); }, [current?.id, hydrated]);
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
  useEffect(() => { if (hydrated) setActiveIndex(index => index >= visible.length ? 0 : index); }, [visible.length, hydrated]);
  const select = (index: number) => { if (blocked.current) return; closePreview(); setActiveIndex(index); setFlipped(false); };
  const step = (direction: number) => { if (visible.length) select((activeIndex + direction + visible.length) % visible.length); };
  const changeCollection = (next: Collection, artist = '') => { setSpecial(false); setCollection(next); setArtistSlug(artist); setQuery(''); setCategory(''); select(0); };
  const openProject = (project: Project | undefined = current) => {
    if (!project || blocked.current) return;
    closePreview();
    if (project.id === 'about' || project.id === 'contact') { navigateWithTransition(`/${project.slug}`); return; }
    setIndexOpen(false);
    history.pushState({ ...history.state, jorakProject: true, galleryUrl: galleryUrl.current }, '', `/projeto/${project.slug}${galleryUrl.current.includes('?') ? galleryUrl.current.slice(galleryUrl.current.indexOf('?')) : ''}`);
    setActiveProject(project);
  };
  const closeProject = () => { if (history.state?.jorakProject) history.back(); else { history.replaceState(history.state, '', galleryUrl.current); setActiveProject(null); } };
  const requestPreview = (project: Project | undefined, anchor: PreviewAnchor, interaction: PreviewInteraction, trigger?: HTMLElement) => {
    if (!project || blocked.current || activeProject || faqActive.current) return;
    // A compact modal should open on activation, so Tab can traverse the collection without trapping focus.
    if ((interaction === 'pointer' || interaction === 'focus') && window.matchMedia('(max-width: 700px)').matches) return;
    if (project.id === 'about' || project.id === 'contact') { if (interaction === 'touch' || interaction === 'keyboard') openProject(project); return; }
    const suppression = suppressedFocus.current;
    // Closing restores focus and can expose the same card under the pointer. Neither should reopen it.
    if ((interaction === 'focus' || interaction === 'pointer') && suppression && suppression.node === trigger) return;
    suppressedFocus.current = null; keepPreview();
    const request: PreviewRequest = { project, anchor, interaction, trigger };
    const show = () => { pendingPreview.current = null; previewOpenTimer.current = null; if (blocked.current || faqActive.current) return; previewRef.current = request; setPreview(request); };
    if (previewRef.current?.project.id === project.id && interaction === 'pointer') return;
    if (interaction === 'pointer') {
      if (pendingPreview.current?.project.id === project.id) return;
      if (previewOpenTimer.current) clearTimeout(previewOpenTimer.current);
      pendingPreview.current = request; previewOpenTimer.current = setTimeout(show, 190);
    } else { if (previewOpenTimer.current) clearTimeout(previewOpenTimer.current); show(); }
  };
  const previewFromButton = (project: Project, trigger: HTMLButtonElement, interaction: PreviewInteraction) => {
    const artwork = trigger.querySelector<HTMLElement>('.index-artwork, .list-disc');
    const rect = (artwork || trigger).getBoundingClientRect(); requestPreview(project, { left: rect.left, top: rect.top, width: rect.width, height: rect.height }, interaction, trigger);
  };
  const chooseProject = (project: Project, index: number, event: React.MouseEvent<HTMLButtonElement>) => {
    if (event.detail === 0 || window.innerWidth <= 700 || window.matchMedia('(pointer: coarse)').matches) previewFromButton(project, event.currentTarget, event.detail === 0 ? 'keyboard' : 'touch');
    else { select(index); openProject(project); }
  };
  useEffect(() => { closePreview(); }, [collection, artistSlug, query, category, listView, special, indexOpen, activeProject, closePreview]);
  useEffect(() => {
    const scroll = (event: Event) => {
      // Locking the background can itself scroll the document when a mobile sheet opens.
      if (previewRef.current && (previewRef.current.interaction === 'touch' || window.matchMedia('(max-width: 700px)').matches)) return;
      // Focus can scroll its trigger into view; keep keyboard previews attached while that happens.
      if (previewRef.current?.trigger?.isConnected && (previewRef.current.interaction === 'focus' || previewRef.current.interaction === 'keyboard')) return;
      if (!(event.target instanceof Element && event.target.closest('.disc-preview,.faq-panel'))) closePreview();
    };
    window.addEventListener('scroll', scroll, true);
    return () => { window.removeEventListener('scroll', scroll, true); if (previewOpenTimer.current) clearTimeout(previewOpenTimer.current); if (previewCloseTimer.current) clearTimeout(previewCloseTimer.current); };
  }, [closePreview]);
  const previewWindow = preview && <DiscPreview key={preview.project.id} {...preview} artist={getNames(preview.project)} onOpen={() => openProject(preview.project)} onClose={closePreview} onKeepOpen={keepPreview} onLeave={leavePreview}/>;
  const previewIsModal = false;
  const collectionName = special ? 'Por trás da edição' : collection === 'featured' ? 'Trabalhos em destaque' : collection === 'artist' ? data.artists.find(item => item.slug === artistSlug)?.name || 'Artista' : 'Todos os trabalhos';
  const clear = () => { setQuery(''); setCategory(''); select(0); };
  const controls = <div className="collection-controls"><div className="collection-switch" aria-label="Coleção"><button onClick={() => changeCollection('featured')} aria-pressed={!special && collection === 'featured'} className={!special && collection === 'featured' ? 'is-active' : ''}>Destaques <span>{data.projects.filter(item => item.featured).length}</span></button><button onClick={() => changeCollection('all')} aria-pressed={!special && collection === 'all'} className={!special && collection === 'all' ? 'is-active' : ''}>Todos <span>{data.projects.length}</span></button></div><label className="artist-select"><span className="sr-only">Filtrar por artista</span><select aria-label="Filtrar por artista" value={!special && collection === 'artist' ? artistSlug : ''} onChange={event => event.target.value ? changeCollection('artist', event.target.value) : changeCollection('all')}><option value="">Por artista</option>{artistOptions.map(artist => <option key={artist.id} value={artist.slug}>{artist.name}</option>)}</select><Icon name="alt-arrow-down-linear" size={14}/></label></div>;
  return <div className={`portfolio ${activeProject ? 'project-is-open' : ''}`}>
    <div className="portfolio-background" inert={Boolean(intro || introChecking || indexOpen || activeProject || previewIsModal)}>
    <Header settings={data.settings} mode={data.mode} onIndex={() => setIndexOpen(true)}/>
    <main id="conteudo">
      <section className="hero-heading"><div className="hero-wordmark"><h1><span className="sr-only">JORAK</span><BrandArt/></h1><span className="wordmark-caption">Editor MMV / Motion designer</span></div><div className="hero-introduction"><p>Do mangá<br/>ao <em>movimento.</em></p><span>Edição para a cena geek brasileira.<br/>Uma coleção de histórias em cada corte.</span></div></section>
      <section className="gallery-section" ref={gallery} tabIndex={0} aria-label="Galeria de discos. Use setas para navegar, Enter para ver a prévia e Espaço para virar." onKeyDown={event => { if (blocked.current || event.target !== event.currentTarget || indexOpen || activeProject) return; if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); step(event.key === 'ArrowRight' ? 1 : -1); } else if (event.key === 'Enter') { event.preventDefault(); if (current) requestPreview(current, event.currentTarget.getBoundingClientRect(), 'keyboard', event.currentTarget); } else if (event.code === 'Space') { event.preventDefault(); setFlipped(!flipped); } }}>
        <div className="gallery-topline"><div className="collection-label"><span className="green-asterisk" aria-hidden="true">✳</span><span>{collectionName}</span></div>{controls}<button className="gallery-mode text-button" onClick={() => setListView(!listView)} aria-pressed={listView}><Icon name={listView ? 'disk-linear' : 'list-linear'} size={18}/>{listView ? 'Discos' : 'Lista'}</button></div>
        {visible.length ? listView ? <div className="project-list">{visible.map((project, index) => <button key={project.id} className="project-list-row" aria-haspopup="dialog" onPointerEnter={event => { if (event.pointerType === 'mouse') previewFromButton(project, event.currentTarget, 'pointer'); }} onPointerLeave={leavePreview} onFocus={event => previewFromButton(project, event.currentTarget, 'focus')} onBlur={leavePreview} onClick={event => chooseProject(project, index, event)}><span className="list-disc">{project.coverUrl && <Image src={project.coverUrl} alt="" width={64} height={64} unoptimized style={{objectFit:"cover",objectPosition:`${project.coverPosition?.x ?? 50}% ${project.coverPosition?.y ?? 50}%`}}/>}<i/></span><span><strong>{project.title}</strong><small>{project.character}</small></span><span className="row-artist">{getNames(project)}</span><Icon name="arrow-right-up-linear"/></button>)}</div> : <><div className="disc-stage"><DiscGallery disabled={intro || introChecking || indexOpen || !!activeProject} projects={visible} activeIndex={activeIndex} flipped={flipped} onSelect={select} onOpen={() => openProject()} onPreview={(index, anchor, interaction, trigger) => requestPreview(visible[index], anchor, interaction, trigger)} onPreviewLeave={leavePreview} onPreviewCancel={closePreview}/><Character place="home" settings={data.settings} onOpenChange={setFaqOpen} hidden={intro || introChecking || !!activeProject || indexOpen}/><span className="stage-caption">{flipped ? 'O outro lado da história.' : 'Arraste. Explore. Dê play.'}</span></div><div className="gallery-selection"><div className="disc-position"><span>{String(activeIndex + 1).padStart(2, '0')}</span><span className="position-divider"/><span>{String(visible.length).padStart(2, '0')}</span></div><div className="selected-project" aria-live="polite" aria-atomic="true"><p>{special ? current.character : getNames(current)}</p><button aria-haspopup="dialog" onPointerEnter={event => { if (event.pointerType === 'mouse') previewFromButton(current, event.currentTarget, 'pointer'); }} onPointerLeave={leavePreview} onFocus={event => previewFromButton(current, event.currentTarget, 'focus')} onBlur={leavePreview} onClick={event => chooseProject(current, activeIndex, event)}><h2>{current.title}</h2><Icon name="arrow-right-up-linear" size={28}/></button><span>{special ? current.work : current.character}</span></div><div className="disc-actions"><button className="icon-button flip-button" aria-label="Virar disco" aria-pressed={flipped} onClick={() => setFlipped(!flipped)}><Icon name="refresh-circle-linear" size={24}/></button><button className="icon-button round" aria-label="Disco anterior" onClick={() => step(-1)}><Icon name="arrow-left-linear"/></button><button className="icon-button round" aria-label="Próximo disco" onClick={() => step(1)}><Icon name="arrow-right-linear"/></button></div></div></> : <div className="empty-gallery"><h2>Nenhum disco por aqui.</h2><p>Experimente outro artista ou limpe a busca.</p><button className="pill" onClick={clear}>Limpar filtros</button></div>}
      </section>
      {listView && <div className="list-character-slot"><Character place="home" onOpenChange={setFaqOpen} hidden={intro || introChecking || !!activeProject || indexOpen}/></div>}
      <div className="gallery-bottom"><p>Um corte. Uma intenção.<br/><span>Explore a participação em cada projeto.</span></p><div className="special-discs"><button onClick={() => { setSpecial(true); setListView(false); select(0); gallery.current?.focus({preventScroll:true}); }}><span className="mini-disc mini-avatar"><Image src={data.settings.avatarUrl} width={42} height={42} alt="" unoptimized/><i/></span>Sobre mim</button><button onClick={() => { setSpecial(true); setListView(false); select(1); gallery.current?.focus({preventScroll:true}); }}><span className="mini-disc contact-disc"><Icon name="arrow-right-up-linear" size={20}/><i/></span>Contato & orçamento</button></div></div>
    </main><Footer settings={data.settings}/>
    </div>
    <noscript><section className="no-js-collection"><h2>Explore os trabalhos</h2><p>Use os links para acessar a coleção sem animações.</p>{data.projects.filter(project => project.featured).sort((a,b)=>(a.featuredOrder??999)-(b.featuredOrder??999)).map(project=><Link key={project.id} href={`/projeto/${project.slug}`}>{project.title} — {getNames(project)}</Link>)}</section></noscript>
    {intro && <Intro avatarUrl={data.settings.avatarUrl} onComplete={() => { closePreview(); setIntro(false); }}/>}
    {!intro && !introChecking && indexOpen && <Dialog label="Índice de trabalhos" onClose={() => setIndexOpen(false)} className="index-dialog"><div className="index-dialog-content" inert={previewIsModal}><div className="index-header"><h2>A coleção.</h2><Character place="index" settings={data.settings} onOpenChange={setFaqOpen}/><button className="icon-button round" onClick={() => setIndexOpen(false)} aria-label="Fechar índice"><Icon name="close-circle-linear" size={24}/></button></div><div className="index-tools">{controls}<label className="index-search"><Icon name="magnifer-linear" size={19}/><input placeholder="Música, personagem ou artista" aria-label="Buscar projetos" value={query} onChange={event => {setQuery(event.target.value); select(0);}}/></label><label className="index-category"><span className="sr-only">Tipo de entrega</span><select value={category} onChange={event => {setCategory(event.target.value); select(0);}}><option value="">Todas as entregas</option>{Array.from(new Set(data.projects.map(item => item.category))).map(item => <option key={item}>{item}</option>)}</select></label></div><p className="index-count">{filtered.length} {filtered.length === 1 ? 'trabalho' : 'trabalhos'} · {collectionName}{(query || category) && <button onClick={clear}>Limpar busca</button>}</p><div className="index-grid">{filtered.map((project, index) => <button className="index-project" key={project.id} aria-haspopup="dialog" onPointerEnter={event => { if (event.pointerType === 'mouse') previewFromButton(project, event.currentTarget, 'pointer'); }} onPointerLeave={leavePreview} onFocus={event => previewFromButton(project, event.currentTarget, 'focus')} onBlur={leavePreview} onClick={event => chooseProject(project, index, event)}><div className="index-artwork" style={{backgroundColor:project.accent}}>{project.coverUrl ? <Image src={project.coverUrl} alt={project.coverAlt || project.title} fill sizes="(max-width: 650px) 45vw, 250px" unoptimized style={{objectPosition:`${project.coverPosition?.x ?? 50}% ${project.coverPosition?.y ?? 50}%`}}/> : <span>{project.title}<small>Capa em preparação</small></span>}<i/></div><div><span>{getNames(project)}</span><strong>{project.title}</strong><small>{project.character}</small></div><Icon name="arrow-right-up-linear"/></button>)}</div>{!filtered.length && <div className="empty-gallery"><p>Nenhum trabalho encontrado.</p><button className="pill" onClick={clear}>Limpar filtros</button></div>}</div>{previewWindow}</Dialog>}
    {!intro && !introChecking && !indexOpen && !activeProject && previewWindow}
    {!intro && !introChecking && activeProject && <Dialog label={activeProject.title} onClose={closeProject} className="project-dialog"><ProjectView project={activeProject} artists={data.artists} settings={data.settings} preview={data.mode === 'local'} onClose={closeProject}/></Dialog>}
  </div>;
}
