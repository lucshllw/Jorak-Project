import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import './brand-theme.css';
import VisualMotion from '@/components/VisualMotion';
import SmoothScroll from '@/components/SmoothScroll';
import { TransitionController } from '@/components/TransitionLink';
import './experience.css';
import './finalization.css';

const archivo = localFont({ src: '../../public/fonts/archivo-variable.ttf', variable: '--font-archivo', weight: '100 900', display: 'swap' });
const storageMode = process.env.PORTFOLIO_MODE || (process.env.NODE_ENV === 'production' ? 'supabase' : 'local');
const siteTitle = 'Jorak - Editor MMV / Motion designer';
export const metadata: Metadata = {
  title: { default: siteTitle, template: '%s — Jorak' },
  openGraph: { title: siteTitle },
  twitter: { title: siteTitle },
  description: 'Edição MMV e motion design para a cena geek brasileira. Explore os trabalhos de Jorak e conte a sua próxima história.',
  robots: { index: storageMode === 'supabase', follow: storageMode === 'supabase' }
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="pt-BR" data-scroll-behavior="smooth" className={archivo.variable}><body><a className="skip-link" href="#conteudo">Pular para o conteúdo</a><SmoothScroll/><TransitionController/><VisualMotion/>{children}</body></html>;
}
