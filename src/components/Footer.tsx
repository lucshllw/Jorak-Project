import type { SiteSettings } from '@/lib/types';
export default function Footer({ settings }: { settings: SiteSettings }) {
  return <footer className="site-footer"><span>Feito para dar movimento.</span><div><a href={settings.xUrl} target="_blank" rel="noreferrer">X / Twitter</a><a href={settings.linktreeUrl} target="_blank" rel="noreferrer">Links</a></div><span>Jorak © {new Date().getFullYear()}</span></footer>;
}
