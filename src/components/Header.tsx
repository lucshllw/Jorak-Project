'use client';
import Link from './TransitionLink';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import type { SiteSettings } from '@/lib/types';
import Icon from './Icon';
export default function Header({ settings, onIndex, mode }: { settings: SiteSettings; onIndex?: () => void; mode?: string }) {
  const [menu, setMenu] = useState(false);
  const pathname=usePathname(),menuButton=useRef<HTMLButtonElement>(null);
  useEffect(()=>{const close=(event:KeyboardEvent)=>{if(event.key==='Escape'&&menu){setMenu(false);menuButton.current?.focus();}};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close);},[menu]);
  return <header className="site-header">
    <Link href="/" className="brand" aria-label="Jorak, início"><Image className="brand-avatar" src={settings.avatarUrl || '/media/jorak-avatar.jpg'} alt="" width={38} height={38} unoptimized/><span>jorak<span className="brand-period">.</span></span></Link>
    <nav id="main-navigation" aria-label="Navegação principal" className={menu ? 'main-nav is-open' : 'main-nav'}>
      <Link href="/" onClick={() => setMenu(false)}>Trabalhos</Link>
      {onIndex ? <button onClick={() => { onIndex(); setMenu(false); }}>Índice <span className="nav-plus">+</span></button> : <Link href="/?indice=1" onClick={() => setMenu(false)}>Índice <span className="nav-plus">+</span></Link>}
      <Link href="/projetos-de-edicao" aria-current={pathname==='/projetos-de-edicao'?'page':undefined} onClick={()=>setMenu(false)}>Projetos de edição</Link>
      <Link href="/surface-academy" className="nav-academy" aria-current={pathname==='/surface-academy'?'page':undefined} onClick={()=>setMenu(false)}>Surfate Academy <span aria-hidden="true">↗</span></Link>
      <Link href="/sobre" onClick={() => setMenu(false)}>Sobre mim</Link>
      <Link href="/contato" className="nav-contact" onClick={() => setMenu(false)}>Vamos criar <Icon name="arrow-right-up-linear" size={16}/></Link>
    </nav>
    <div className="header-note"><span className="status-dot"/>{mode === 'local' ? 'Prévia local' : 'Edição & motion design'}</div>
    <button ref={menuButton} className="mobile-menu icon-button" aria-controls="main-navigation" aria-label={menu ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menu} onClick={() => setMenu(!menu)}><Icon name={menu ? 'close-circle-linear' : 'hamburger-menu-linear'}/></button>
  </header>;
}
