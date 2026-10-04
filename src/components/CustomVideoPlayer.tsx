'use client';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent } from 'react';
import Icon from './Icon';
import { announcePlayback, formatTime } from '@/lib/media';
import './media-player.css';

type SafariVideo = HTMLVideoElement & { webkitEnterFullscreen?: () => void };

export default function CustomVideoPlayer({ src, poster, title, loop = false }: { src: string; poster?: string; title: string; loop?: boolean }) {
  const owner = useId(), root = useRef<HTMLDivElement>(null), video = useRef<HTMLVideoElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null), keyboardFocus = useRef(false), pointerInput = useRef(false);
  const [playing, setPlaying] = useState(false), [buffering, setBuffering] = useState(true), [error, setError] = useState('');
  const [current, setCurrent] = useState(0), [duration, setDuration] = useState(0), [volume, setVolume] = useState(.8), [muted, setMuted] = useState(false);
  const [controls, setControls] = useState(true), [fullscreen, setFullscreen] = useState(false), [announcement, setAnnouncement] = useState('');
  const playingRef = useRef(false);
  const clearHide = useCallback(() => { if (hideTimer.current) clearTimeout(hideTimer.current); hideTimer.current = null; }, []);
  const showControls = useCallback(() => {
    clearHide(); setControls(true);
    if (playingRef.current && !keyboardFocus.current) hideTimer.current = setTimeout(() => setControls(false), 2600);
  }, [clearHide]);
  const start = useCallback(async () => {
    const node = video.current; if (!node) return;
    setError(''); setAnnouncement('');
    try { await node.play(); }
    catch (failure) {
      setBuffering(false); setControls(true);
      if (failure instanceof DOMException && failure.name === 'AbortError') return;
      if (failure instanceof DOMException && failure.name === 'NotAllowedError') setAnnouncement('Toque em reproduzir para iniciar o vídeo.');
      else setError('O trecho não carregou. Tente novamente ou assista ao vídeo original.');
    }
  }, []);
  const toggle = useCallback(() => { if (video.current?.paused) void start(); else video.current?.pause(); }, [start]);
  const seek = (value: number) => {
    if (!video.current || !Number.isFinite(video.current.duration)) return;
    video.current.currentTime = Math.min(Math.max(value, 0), video.current.duration); setCurrent(video.current.currentTime); showControls();
  };
  const changeVolume = (value: number) => { const node = video.current; if (!node) return; node.volume = Math.min(Math.max(value, 0), 1); node.muted = value === 0; showControls(); };
  const toggleMute = () => { const node = video.current; if (!node) return; node.muted = !node.muted; if (!node.muted && node.volume === 0) node.volume = .8; showControls(); };
  const toggleFullscreen = async () => {
    const element = root.current, node = video.current as SafariVideo | null; if (!element) return;
    try {
      if (document.fullscreenElement === element) await document.exitFullscreen();
      else if (element.requestFullscreen) await element.requestFullscreen();
      else if (node?.webkitEnterFullscreen) node.webkitEnterFullscreen();
      else setAnnouncement('Tela cheia não está disponível neste navegador.');
    } catch { setAnnouncement('Não foi possível abrir a tela cheia.'); }
    showControls();
  };
  const keyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    pointerInput.current = false; keyboardFocus.current = true; showControls();
    if ((event.target as HTMLElement).closest('button,input,a')) return;
    const key = event.key.toLowerCase();
    if (key === ' ' || key === 'k') { event.preventDefault(); toggle(); }
    else if (key === 'arrowleft' || key === 'j') { event.preventDefault(); seek(current - (key === 'j' ? 10 : 5)); }
    else if (key === 'arrowright' || key === 'l') { event.preventDefault(); seek(current + (key === 'l' ? 10 : 5)); }
    else if (key === 'arrowup' || key === 'arrowdown') { event.preventDefault(); changeVolume(volume + (key === 'arrowup' ? .1 : -.1)); }
    else if (key === 'm') { event.preventDefault(); toggleMute(); }
    else if (key === 'f') { event.preventDefault(); void toggleFullscreen(); }
    else if (key === 'home' || key === 'end') { event.preventDefault(); seek(key === 'home' ? 0 : duration); }
  };
  useEffect(() => {
    const node = video.current; if (!node) return;
    // Restore the source after React's development effect cleanup as well as a source change.
    node.src = src; node.load();
    node.volume = .8;
    const another = (event: Event) => { if ((event as CustomEvent<{ owner: string }>).detail?.owner !== owner) node.pause(); };
    const visibility = () => { if (document.hidden) node.pause(); };
    const screen = () => { setFullscreen(document.fullscreenElement === root.current); showControls(); };
    const observer = new IntersectionObserver(entries => { if (!entries[0].isIntersecting) node.pause(); }, { threshold: .05 }); observer.observe(node);
    window.addEventListener('jorak:media-play', another); document.addEventListener('visibilitychange', visibility); document.addEventListener('fullscreenchange', screen);
    void start();
    return () => { clearHide(); observer.disconnect(); node.pause(); node.removeAttribute('src'); node.load(); window.removeEventListener('jorak:media-play', another); document.removeEventListener('visibilitychange', visibility); document.removeEventListener('fullscreenchange', screen); };
  }, [src, owner, start, showControls, clearHide]);
  const progress = duration > 0 ? Math.min(current / duration * 100, 100) : 0;
  return <div ref={root} className="custom-video-player" role="region" aria-label={`Player de ${title}`} tabIndex={0} data-controls-visible={controls || !playing || !!error} onKeyDown={keyboard}
    onPointerMove={showControls} onPointerDown={() => { pointerInput.current = true; keyboardFocus.current = false; showControls(); }}
    onPointerUp={event => { if ((event.target as HTMLElement).closest('button')) root.current?.focus({ preventScroll: true }); }}
    onFocusCapture={() => { keyboardFocus.current = !pointerInput.current; showControls(); }}
    onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) { keyboardFocus.current = false; showControls(); } }}>
    <video ref={video} src={src} poster={poster} playsInline preload="metadata" loop={loop} aria-label={`Trecho de ${title}`} onClick={toggle}
      onLoadedMetadata={event => { const node = event.currentTarget; setDuration(Number.isFinite(node.duration) ? node.duration : 0); }}
      onDurationChange={event => setDuration(Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0)}
      onTimeUpdate={event => setCurrent(event.currentTarget.currentTime)}
      onPlay={() => { playingRef.current = true; setPlaying(true); announcePlayback(owner); showControls(); }}
      onPlaying={() => { setBuffering(false); setError(''); }}
      onPause={() => { playingRef.current = false; setPlaying(false); clearHide(); setControls(true); }}
      onEnded={() => { playingRef.current = false; setPlaying(false); setControls(true); }}
      onWaiting={() => setBuffering(true)} onCanPlay={() => setBuffering(false)}
      onVolumeChange={event => { setVolume(event.currentTarget.volume); setMuted(event.currentTarget.muted); }}
      onError={() => { setBuffering(false); setError('O trecho não carregou. Tente novamente ou assista ao vídeo original.'); }}/>
    {buffering && !error && <div className="video-loading" role="status"><span className="video-loading-ring"/><span>Carregando trecho…</span></div>}
    {error && <div className="video-failure"><p role="alert">{error}</p><button onClick={() => { video.current?.load(); void start(); }} className="pill">Tentar novamente</button></div>}
    {!playing && !buffering && !error && <button className="video-center-play" onClick={toggle} aria-label="Reproduzir trecho"><Icon name="play-bold" size={32}/></button>}
    <div className="custom-video-controls">
      <label className="video-progress"><span className="sr-only">Posição no trecho</span><input type="range" min={0} max={duration || 1} step={.1} value={Math.min(current, duration || 1)} disabled={!duration} onChange={event => seek(Number(event.target.value))} aria-valuetext={`${formatTime(current)} de ${formatTime(duration)}`} style={{ '--range-progress': `${progress}%` } as CSSProperties}/></label>
      <div className="video-controls-row">
        <button onClick={toggle} aria-label={playing ? 'Pausar trecho' : 'Reproduzir trecho'} title={playing ? 'Pausar (K)' : 'Reproduzir (K)'}><Icon name={playing ? 'pause-bold' : 'play-bold'} size={22}/></button>
        <button onClick={toggleMute} aria-label={muted || volume === 0 ? 'Ativar som' : 'Silenciar'} title="Som (M)"><Icon name={muted || volume === 0 ? 'volume-cross-linear' : 'volume-loud-linear'} size={21}/></button>
        <label className="video-volume"><span className="sr-only">Volume</span><input type="range" min={0} max={1} step={.05} value={muted ? 0 : volume} onChange={event => changeVolume(Number(event.target.value))} aria-valuetext={`${Math.round((muted ? 0 : volume) * 100)}%`}/></label>
        <span className="video-time" aria-hidden="true">{formatTime(current)} <span>/ {formatTime(duration)}</span></span>
        <button className="video-fullscreen" onClick={() => void toggleFullscreen()} aria-label={fullscreen ? 'Sair da tela cheia' : 'Tela cheia'} title="Tela cheia (F)"><Icon name={fullscreen ? 'minimize-square-linear' : 'maximize-square-linear'} size={21}/></button>
      </div>
    </div>
    <span className="sr-only" role="status">{announcement}</span>
  </div>;
}
