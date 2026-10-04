import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import './brand-theme.css';
import VisualMotion from '@/components/VisualMotion';

const archivo = localFont({ src: '../../public/fonts/archivo-variable.ttf', variable: '--font-archivo', weight: '100 900', display: 'swap' });
export const metadata: Metadata = {
  title: { default: 'Jorak — Edição em movimento', template: '%s — Jorak' },
  description: 'Edição MMV e motion design para a cena geek brasileira. Explore os trabalhos de Jorak e conte a sua próxima história.',
  robots: { index: process.env.PORTFOLIO_MODE === 'supabase', follow: process.env.PORTFOLIO_MODE === 'supabase' }
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="pt-BR" data-scroll-behavior="smooth" className={archivo.variable}><body><a className="skip-link" href="#conteudo">Pular para o conteúdo</a><VisualMotion/>{children}</body></html>;
}
