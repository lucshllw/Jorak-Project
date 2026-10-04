'use client';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';
const LogoSculpture = dynamic(() => import('./LogoSculpture'), { ssr: false });

export default function BrandArt({ entrance = true, onReady }: { entrance?: boolean; onReady?: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const reportReady = useCallback(() => { setReady(true); onReady?.(); }, [onReady]);
  useEffect(() => {
    const element = root.current;
    const fallback = () => { setReady(false); onReady?.(); };
    element?.addEventListener('jorak:logo-fallback', fallback);
    return () => element?.removeEventListener('jorak:logo-fallback', fallback);
  }, [onReady]);
  return <div ref={root} className={`brand-art brand-art-mark ${ready ? 'logo-is-ready' : ''}`} aria-hidden="true">
    <Image className="logo-image-fallback" src="/media/jorak-wordmark.png" width={594} height={223} alt="" priority unoptimized draggable={false}/>
    <LogoSculpture entrance={entrance} onReady={reportReady}/>
  </div>;
}
