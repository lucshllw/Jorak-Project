'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import type { SiteSettings } from '@/lib/types';
import Icon from './Icon';
export default function Header({ settings, onIndex, mode }: { settings: SiteSettings; onIndex?: () => void; mode?: string }) {
  const [menu, setMenu] = useState(false);
  return <header className="site-header">
    <Link href="/" className="brand" aria-label="Jorak, início"><Image className="brand-avatar" src={settings.avatarUrl || '/media/jorak-avatar.jpg'} alt="" width={38} height={38} unoptimized/><span>jorak<span className="brand-period">.</span></span></Link>
    <nav aria-label="Navegação principal" className={menu ? 'main-nav is-open' : 'main-nav'}>
      <Link href="/" onClick={() => setMenu(false)}>Trabalhos</Link>
      {onIndex ? <button onClick={() => { onIndex(); setMenu(false); }}>Índice <span className="nav-plus">+</span></button> : <Link href="/?indice=1" onClick={() => setMenu(false)}>Índice <span className="nav-plus">+</span></Link>}
      <Link href="/sobre" onClick={() => setMenu(false)}>Sobre mim</Link>
      <Link href="/contato" className="nav-contact" onClick={() => setMenu(false)}>Vamos criar <Icon name="arrow-right-up-linear" size={16}/></Link>
    </nav>
    <div className="header-note"><span className="status-dot"/>{mode === 'local' ? 'Prévia local' : 'Edição & motion design'}</div>
    <button className="mobile-menu icon-button" aria-label={menu ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menu} onClick={() => setMenu(!menu)}><Icon name={menu ? 'close-circle-linear' : 'hamburger-menu-linear'}/></button>
  </header>;
}
