'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import gsap from 'gsap';

type Profile = { outer: [number, number][]; holes: [number, number][][] };
type LogoData = { width: number; height: number; materials: Record<'whiteBorder' | 'body' | 'greenFaces' | 'highlights', string>; profiles: Record<'whiteBorder' | 'body' | 'greenFaces' | 'highlights', Profile[]> };

export default function LogoSculpture({ entrance, onReady }: { entrance: boolean; onReady: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const abort = new AbortController();
    const geometries: THREE.BufferGeometry[] = [], materials: THREE.Material[] = [];
    let renderer: THREE.WebGLRenderer | undefined;
    let environment: THREE.WebGLRenderTarget | undefined; let shadowLight: THREE.DirectionalLight | undefined;
    let resizeObserver: ResizeObserver | undefined, observer: IntersectionObserver | undefined, inertObserver: MutationObserver | undefined;
    let timeline: gsap.core.Timeline | undefined;
    let disposed = false, inView = false, frame = 0, lastFrame = 0, elapsed = 0, lastTick = 0;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reduced = preference.matches;
    let renderOnce = () => {};
    let sync = () => {};
    let pointerMove = (_event: PointerEvent) => {};
    let pointerLeave = () => {};
    let changePreference = () => {};
    const pointer = { x: 0, y: 0 };
    let rotateX: ReturnType<typeof gsap.quickTo> | undefined, rotateY: ReturnType<typeof gsap.quickTo> | undefined;
    const enabled = () => inView && !document.hidden && !element.closest('[inert]');
    const dispose = () => {
      disposed = true; abort.abort(); cancelAnimationFrame(frame); timeline?.kill();
      rotateX?.tween.kill(); rotateY?.tween.kill();
      resizeObserver?.disconnect(); observer?.disconnect(); inertObserver?.disconnect();
      element.removeEventListener('pointermove', pointerMove); element.removeEventListener('pointerleave', pointerLeave);
      document.removeEventListener('visibilitychange', sync); preference.removeEventListener('change', changePreference);
      renderer?.domElement.removeEventListener('webglcontextlost', contextLost);
      geometries.forEach(geometry => geometry.dispose()); materials.forEach(material => material.dispose());
      shadowLight?.shadow.dispose(); environment?.dispose(); renderer?.dispose(); renderer?.forceContextLoss(); renderer?.domElement.remove();
      element.dataset.animationActive = 'false';
    };
    const contextLost = (event: Event) => { event.preventDefault(); dispose(); element.dispatchEvent(new Event('jorak:logo-fallback', { bubbles: true })); };
    const initialize = async () => {
      try {
        const response = await fetch('/media/jorak-logo-shapes.json', { signal: abort.signal });
        if (!response.ok) { element.dispatchEvent(new Event('jorak:logo-fallback', { bubbles: true })); return; }
        const data = await response.json() as LogoData;
        if (disposed) return;
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
        renderer.setClearColor(0x000000, 0);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.NeutralToneMapping;
        renderer.toneMappingExposure = .96;
        renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
        renderer.domElement.setAttribute('aria-hidden', 'true');
        renderer.domElement.addEventListener('webglcontextlost', contextLost);
        element.appendChild(renderer.domElement);
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(22, 1, .1, 40);
        camera.position.set(0, 0, 12);
        const room = new RoomEnvironment(), pmrem = new THREE.PMREMGenerator(renderer);
        environment = pmrem.fromScene(room, .06);
        scene.environment = environment.texture;
        scene.environmentIntensity = .48;
        room.dispose(); pmrem.dispose();
        scene.add(new THREE.AmbientLight(0xd7f9e3, .32));
        const key = new THREE.DirectionalLight(0xffffff, 1.35); key.position.set(-3, 4.5, 7); key.castShadow = true; shadowLight = key;
        key.shadow.mapSize.set(1024, 1024); key.shadow.radius = 3; key.shadow.normalBias = .012; key.shadow.bias = -.00015;
        Object.assign(key.shadow.camera, { left: -6, right: 6, top: 4, bottom: -4, near: .1, far: 20 });
        scene.add(key);
        const fill = new THREE.DirectionalLight(0xd7f8ea, .48); fill.position.set(5, -.7, 6); scene.add(fill);
        const rim = new THREE.DirectionalLight(0xcceee3, 1.3); rim.position.set(1.5, 4, -2); scene.add(rim);
        const entry = new THREE.Group(), floating = new THREE.Group(); entry.add(floating); scene.add(entry);
        const scale = 8 / data.width;
        const path = (points: [number, number][], target: THREE.Path) => {
          points.forEach(([x, y], index) => {
            const px = (x - data.width / 2) * scale, py = (data.height / 2 - y) * scale;
            if (!index) target.moveTo(px, py); else target.lineTo(px, py);
          }); target.closePath();
        };
        const shapes = (profiles: Profile[]) => profiles.map(profile => {
          const shape = new THREE.Shape(); path(profile.outer, shape);
          profile.holes.forEach(hole => { const cutout = new THREE.Path(); path(hole, cutout); shape.holes.push(cutout); });
          return shape;
        });
        const physical = (color: string, roughness: number, clearcoat: number) => {
          const material = new THREE.MeshPhysicalMaterial({ color, metalness: .025, roughness, clearcoat, clearcoatRoughness: .23, ior: 1.46, specularIntensity: .65, envMapIntensity: .65 });
          materials.push(material); return material;
        };
        const white = physical(data.materials.whiteBorder, .3, .5);
        const whiteSide = physical('#a4c6b2', .4, .25);
        const body = physical(data.materials.body, .25, .72);
        const bodySide = physical('#073723', .36, .5);
        const green = physical(data.materials.greenFaces, .23, 1);
        const greenSide = physical('#21820c', .31, .75);
        const highlights = physical(data.materials.highlights, .28, .7);
        const layer = (profiles: Profile[], depth: number, z: number, bevel: number, front: THREE.Material, side: THREE.Material) => {
          if (!profiles.length) return;
          const geometry = new THREE.ExtrudeGeometry(shapes(profiles), { depth, steps: 1, bevelEnabled: bevel > 0, bevelSize: bevel, bevelOffset: -bevel, bevelThickness: bevel * .8, bevelSegments: 4 });
          geometries.push(geometry);
          const mesh = new THREE.Mesh(geometry, [front, side]);
          mesh.position.z = z; mesh.castShadow = true; mesh.receiveShadow = true; floating.add(mesh);
        };
        layer(data.profiles.whiteBorder, .32, -.12, .018, white, whiteSide);
        layer(data.profiles.body, .345, -.115, .011, body, bodySide);
        layer(data.profiles.greenFaces, .045, .238, .008, green, greenSide);
        layer(data.profiles.highlights, .006, .286, .001, highlights, green);
        const shadowGeometry = new THREE.PlaneGeometry(10, 4.5), shadowMaterial = new THREE.ShadowMaterial({ opacity: .28 });
        geometries.push(shadowGeometry); materials.push(shadowMaterial);
        const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial); shadow.position.set(.02, -.025, -.26); shadow.receiveShadow = true; scene.add(shadow);
        const draw = () => { if (!disposed && renderer && enabled()) renderer.render(scene, camera); };
        renderOnce = draw;
        const animate = (now: number) => {
          frame = 0;
          if (disposed || reduced || !enabled()) { element.dataset.animationActive = 'false'; return; }
          const fps = element.clientWidth < 500 ? 30 : 40;
          if (now - lastFrame >= 1000 / fps) {
            elapsed += lastTick ? Math.min((now - lastTick) / 1000, .1) : 0;
            lastTick = now; lastFrame = now;
            floating.position.y = Math.sin(elapsed * .85) * .036;
            floating.rotation.x = pointer.x + Math.sin(elapsed * .47) * .009;
            floating.rotation.y = pointer.y + Math.sin(elapsed * .55) * .018;
            floating.rotation.z = Math.sin(elapsed * .45) * .003;
            draw();
          }
          element.dataset.animationActive = 'true'; frame = requestAnimationFrame(animate);
        };
        sync = () => {
          if (disposed) return;
          if (enabled() && !reduced) { timeline?.resume(); if (!frame) { lastTick = 0; frame = requestAnimationFrame(animate); } }
          else { cancelAnimationFrame(frame); frame = 0; timeline?.pause(); element.dataset.animationActive = 'false'; if (enabled()) draw(); }
        };
        const resize = () => {
          if (!renderer || disposed) return;
          const { width, height } = element.getBoundingClientRect(); if (!width || !height) return;
          renderer.setPixelRatio(Math.min(devicePixelRatio, width < 500 ? 1.5 : 2));
          renderer.setSize(width, height);
          const aspect = width / height, vertical = Math.max(3.15, 8.35 / aspect);
          camera.aspect = aspect; camera.position.z = vertical / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) + .20; camera.updateProjectionMatrix();
          const shadowSize = width < 500 ? 512 : 1024;
          if (key.shadow.mapSize.x !== shadowSize) { key.shadow.map?.dispose(); key.shadow.map = null; key.shadow.mapSize.set(shadowSize, shadowSize); }
          draw();
        };
        rotateX = gsap.quickTo(pointer, 'x', { duration: .95, ease: 'power3.out' });
        rotateY = gsap.quickTo(pointer, 'y', { duration: .95, ease: 'power3.out' });
        pointerMove = (event: PointerEvent) => {
          if (event.pointerType !== 'mouse' || reduced || !enabled()) return;
          const bounds = element.getBoundingClientRect();
          rotateX?.((.5 - (event.clientY - bounds.top) / bounds.height) * .20);
          rotateY?.(((event.clientX - bounds.left) / bounds.width - .5) * .30);
        };
        pointerLeave = () => { rotateX?.(0); rotateY?.(0); };
        changePreference = () => {
          reduced = preference.matches;
          if (reduced) { timeline?.kill(); entry.rotation.set(0, 0, 0); entry.scale.setScalar(1); entry.position.z = 0; pointer.x = pointer.y = 0; floating.rotation.set(0, 0, 0); floating.position.y = 0; }
          sync();
        };
        if (entrance && !reduced) {
          entry.rotation.set(.14, -.34, -.018); entry.scale.setScalar(.88); entry.position.z = -.55;
          timeline = gsap.timeline({ paused: true }).to(entry.rotation, { x: 0, y: 0, z: 0, duration: 1.65, ease: 'power3.out' }, 0).to(entry.scale, { x: 1, y: 1, z: 1, duration: 1.65, ease: 'power3.out' }, 0).to(entry.position, { z: 0, duration: 1.65, ease: 'power3.out' }, 0);
        }
        resizeObserver = new ResizeObserver(resize); resizeObserver.observe(element);
        observer = new IntersectionObserver(entries => { inView = entries[0].isIntersecting; sync(); }, { threshold: .02 }); observer.observe(element);
        const background = element.closest('.portfolio-background');
        if (background) { inertObserver = new MutationObserver(sync); inertObserver.observe(background, { attributes: true, attributeFilter: ['inert'] }); }
        element.addEventListener('pointermove', pointerMove); element.addEventListener('pointerleave', pointerLeave);
        document.addEventListener('visibilitychange', sync); preference.addEventListener('change', changePreference);
        resize();
        // The observer owns continuous frames; readiness is announced after an actual rendered frame.
        inView = true; draw(); onReady(); sync();
      } catch (error) {
        if (!disposed && !(error instanceof DOMException && error.name === 'AbortError')) { if (process.env.NODE_ENV === 'development') console.warn('Falha ao iniciar a logo 3D.', error); dispose(); element.dispatchEvent(new Event('jorak:logo-fallback', { bubbles: true })); }
      }
    };
    void initialize();
    return dispose;
  }, [entrance, onReady]);
  return <div ref={host} className="logo-sculpture" data-animation-active="false"/>;
}
