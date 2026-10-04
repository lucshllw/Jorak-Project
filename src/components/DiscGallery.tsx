'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import gsap from 'gsap';
import type { Project } from '@/lib/types';

type Props = { projects: Project[]; activeIndex: number; flipped: boolean; onSelect: (index: number) => void; onOpen: () => void };
type Disc = { group: THREE.Group; index: number };
const relativeIndex = (index: number, active: number, count: number) => {
  let delta = index - active;
  if (delta > count / 2) delta -= count;
  if (delta < -count / 2) delta += count;
  return delta;
};
function labelTexture(project: Project) {
  const canvas = document.createElement('canvas'); canvas.width = 768; canvas.height = 768;
  const context = canvas.getContext('2d')!;
  context.fillStyle = project.accent || '#32E6A1'; context.fillRect(0, 0, 768, 768);
  context.fillStyle = '#181A16'; context.font = '900 64px Arial'; context.textAlign = 'center';
  context.fillText('JORAK', 384, 260);
  context.font = '24px Arial'; context.fillText(project.title.slice(0, 34), 384, 530);
  context.font = '18px Arial'; context.fillText(project.id === 'contact' ? 'CONTATO & ORÇAMENTO' : 'CAPA EM PREPARAÇÃO', 384, 566);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
export default function DiscGallery({ projects, activeIndex, flipped, onSelect, onOpen }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const runtime = useRef<{ update: () => void } | null>(null);
  const props = useRef({ activeIndex, flipped, onSelect, onOpen });
  props.current = { activeIndex, flipped, onSelect, onOpen };
  const [fallback, setFallback] = useState(false);
  useEffect(() => {
    const element = host.current;
    if (!element || !projects.length || fallback) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setFallback(true); return; }
    let disposed = false, visible = true, pendingFrame = 0;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' }); }
    catch { setFallback(true); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.95;
    element.appendChild(renderer.domElement);
    renderer.domElement.setAttribute('aria-hidden', 'true');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 50); camera.position.set(0, 0, 8.9);
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const environment = pmrem.fromScene(room, 0.04); scene.environment = environment.texture;
    room.dispose(); pmrem.dispose();
    scene.add(new THREE.AmbientLight(0xffffff, 1.2));
    const light = new THREE.DirectionalLight(0xffffff, 2); light.position.set(1, 4, 6); scene.add(light);
    const backLight = new THREE.DirectionalLight(0x32e6a1, 1.2); backLight.position.set(-4, 0, -2); scene.add(backLight);
    const collection = new THREE.Group(); scene.add(collection);
    const shape = new THREE.Shape(); shape.absarc(0, 0, 1.62, 0, Math.PI * 2, false);
    const hole = new THREE.Path(); hole.absarc(0, 0, 0.115, 0, Math.PI * 2, true); shape.holes.push(hole);
    const bodyGeometry = new THREE.ExtrudeGeometry(shape, { depth: 0.055, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.009, bevelThickness: 0.008, curveSegments: 80 });
    const faceGeometry = new THREE.RingGeometry(0.28, 1.60, 96);
    const positions = faceGeometry.attributes.position, uv = faceGeometry.attributes.uv;
    for (let i = 0; i < positions.count; i++) uv.setXY(i, positions.getX(i) / 3.2 + 0.5, positions.getY(i) / 3.2 + 0.5);
    const hubGeometry = new THREE.RingGeometry(0.115, 0.28, 64);
    const grooveGeometry = new THREE.RingGeometry(0.32, 0.33, 64);
    const metal = new THREE.MeshPhysicalMaterial({ color: '#d6d8d5', metalness: 1, roughness: 0.18, iridescence: 0.75, iridescenceIOR: 1.3, iridescenceThicknessRange: [80, 400], side: THREE.DoubleSide, envMapIntensity: 1.35 });
    const hubMaterial = new THREE.MeshPhysicalMaterial({ color: '#e3e4e0', metalness: 0.75, roughness: 0.22, transmission: 0.12, thickness: 0.03, side: THREE.DoubleSide });
    const resources = new Set<THREE.Texture>();
    const discs: Disc[] = [];
    const materials: THREE.Material[] = [];
    const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
    const textureLoader = new THREE.TextureLoader();
    const render = () => {
      if (disposed || !visible || document.hidden || pendingFrame) return;
      pendingFrame = requestAnimationFrame(() => { pendingFrame = 0; if (!disposed && visible && !document.hidden) renderer.render(scene, camera); });
    };
    const destroyDisc = (disc: Disc) => {
      gsap.killTweensOf(disc.group.position); gsap.killTweensOf(disc.group.rotation); gsap.killTweensOf(disc.group.scale);
      collection.remove(disc.group);
      disc.group.traverse(object => { if (object instanceof THREE.Mesh && object.material !== metal && object.material !== hubMaterial) {
        const material = object.material as THREE.MeshBasicMaterial;
        material.map?.dispose(); if (material.map) resources.delete(material.map); material.dispose();
      } });
    };
    const createDisc = (index: number) => {
      const project = projects[index], group = new THREE.Group(); group.userData.index = index;
      const body = new THREE.Mesh(bodyGeometry, metal); body.position.z = -0.027; group.add(body);
      const placeholder = labelTexture(project); resources.add(placeholder);
      const faceMaterial = new THREE.MeshBasicMaterial({ map: placeholder, side: THREE.FrontSide, toneMapped: false }); materials.push(faceMaterial);
      const face = new THREE.Mesh(faceGeometry, faceMaterial); face.position.z = 0.046; group.add(face);
      const hub = new THREE.Mesh(hubGeometry, hubMaterial); hub.position.z = 0.048; group.add(hub);
      const reverseHub = new THREE.Mesh(hubGeometry, hubMaterial); reverseHub.position.z = -0.044; group.add(reverseHub);
      const groove = new THREE.Mesh(grooveGeometry, hubMaterial); groove.position.z = -0.046; group.add(groove);
      const disc = { index, group }; discs.push(disc); collection.add(group); group.scale.setScalar(0.8);
      if (project.coverUrl) textureLoader.load(project.coverUrl, texture => {
        if (disposed || !discs.includes(disc)) { texture.dispose(); return; }
        texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 4);
        const x = project.coverPosition?.x ?? 50, y = project.coverPosition?.y ?? 50;
        texture.offset.set((x - 50) / 200, (50 - y) / 200);
        resources.add(texture); faceMaterial.map = texture; faceMaterial.needsUpdate = true;
        placeholder.dispose(); resources.delete(placeholder); render();
      }, undefined, () => render());
      return disc;
    };
    const update = () => {
      const current = props.current.activeIndex;
      const nearby = projects.map((_, i) => i).filter(i => Math.abs(relativeIndex(i, current, projects.length)) <= 3);
      for (let i = discs.length - 1; i >= 0; i--) if (!nearby.includes(discs[i].index)) { destroyDisc(discs[i]); discs.splice(i, 1); }
      nearby.forEach(i => { if (!discs.some(d => d.index === i)) createDisc(i); });
      discs.forEach(({ group, index }) => {
        const delta = relativeIndex(index, current, projects.length), selected = delta === 0;
        gsap.to(group.position, { x: delta * 1.47, y: selected ? -0.16 : Math.abs(delta) * 0.22 + 0.03, z: selected ? 0.8 : -Math.abs(delta) * 0.52, duration: 0.72, ease: 'power3.out', onUpdate: render });
        gsap.to(group.rotation, { x: -0.08, y: selected && props.current.flipped ? Math.PI : delta * -0.13, z: delta * -0.095, duration: 0.72, ease: 'power3.out', onUpdate: render });
        gsap.to(group.scale, { x: selected ? 1.07 : 0.95, y: selected ? 1.07 : 0.95, z: 1, duration: 0.72, ease: 'power3.out', onUpdate: render });
      }); render();
    };
    runtime.current = { update };
    const resize = () => { const { width, height } = element.getBoundingClientRect(); if (!width || !height) return; renderer.setSize(width, height); camera.aspect = width / height; camera.position.z = width < 600 ? 8.5 : 7.8; camera.updateProjectionMatrix(); render(); };
    const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(element);
    const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; if (visible) render(); }, { threshold: 0.01 }); observer.observe(element);
    const visibility = () => render(); document.addEventListener('visibilitychange', visibility);
    let startX = 0, startY = 0, down = false, lastX = 0, velocity = 0, moved = false, pointerId = -1;
    const downHandler = (event: PointerEvent) => { down = true; moved = false; startX = lastX = event.clientX; startY = event.clientY; velocity = 0; pointerId = event.pointerId; };
    const moveHandler = (event: PointerEvent) => {
      if (down) { const dx = event.clientX - startX; velocity = event.clientX - lastX; lastX = event.clientX;
        if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(event.clientY - startY)) { moved = true; if (!renderer.domElement.hasPointerCapture(pointerId)) renderer.domElement.setPointerCapture(pointerId); gsap.set(collection.position, { x: dx / element.clientWidth * 10 }); render(); }
      } else if (event.pointerType === 'mouse') {
        const box = element.getBoundingClientRect();
        gsap.to(collection.rotation, { x: (event.clientY - box.top - box.height / 2) / box.height * 0.06, y: (event.clientX - box.left - box.width / 2) / box.width * 0.06, duration: 0.4, overwrite: true, onUpdate: render });
      }
    };
    const upHandler = (event: PointerEvent) => {
      if (!down) return; down = false;
      if (renderer.domElement.hasPointerCapture(pointerId)) renderer.domElement.releasePointerCapture(pointerId);
      gsap.to(collection.position, { x: 0, duration: 0.6, ease: 'power3.out', onUpdate: render });
      if (moved) { const distance = event.clientX - startX; const amount = Math.max(1, Math.min(3, Math.round((Math.abs(distance) + Math.abs(velocity) * 4) / (element.clientWidth * 0.18)))); const next = (props.current.activeIndex + (distance < 0 ? amount : -amount) + projects.length) % projects.length; props.current.onSelect(next); return; }
      if (Math.abs(event.clientY - startY) > 12) return;
      const rect = element.getBoundingClientRect(); pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(collection.children, true)[0];
      if (hit) { let object = hit.object; while (object.parent && object.parent !== collection) object = object.parent; const index = object.userData.index as number; if (index === props.current.activeIndex) props.current.onOpen(); else props.current.onSelect(index); }
    };
    const cancel = () => { down = false; gsap.to(collection.position, { x: 0, duration: 0.4, onUpdate: render }); };
    const leave = () => { if (!down) gsap.to(collection.rotation, { x: 0, y: 0, duration: 0.4, onUpdate: render }); };
    const contextLost = (event: Event) => { event.preventDefault(); setFallback(true); };
    renderer.domElement.addEventListener('pointerdown', downHandler); renderer.domElement.addEventListener('pointermove', moveHandler); renderer.domElement.addEventListener('pointerup', upHandler); renderer.domElement.addEventListener('pointercancel', cancel); renderer.domElement.addEventListener('pointerleave', leave); renderer.domElement.addEventListener('webglcontextlost', contextLost);
    resize(); update();
    return () => {
      disposed = true; runtime.current = null; cancelAnimationFrame(pendingFrame); resizeObserver.disconnect(); observer.disconnect(); document.removeEventListener('visibilitychange', visibility);
      gsap.killTweensOf(collection.position); gsap.killTweensOf(collection.rotation);
      discs.forEach(destroyDisc); resources.forEach(t => t.dispose()); materials.forEach(m => m.dispose());
      bodyGeometry.dispose(); faceGeometry.dispose(); hubGeometry.dispose(); grooveGeometry.dispose(); metal.dispose(); hubMaterial.dispose(); environment.dispose();
      renderer.domElement.removeEventListener('pointerdown', downHandler); renderer.domElement.removeEventListener('pointermove', moveHandler); renderer.domElement.removeEventListener('pointerup', upHandler); renderer.domElement.removeEventListener('pointercancel', cancel); renderer.domElement.removeEventListener('pointerleave', leave); renderer.domElement.removeEventListener('webglcontextlost', contextLost);
      renderer.dispose(); renderer.domElement.remove();
    };
  }, [projects, fallback]);
  useEffect(() => { runtime.current?.update(); }, [activeIndex, flipped]);
  const current = projects[activeIndex];
  if (fallback && current) return <div className="disc-static"><button onClick={onOpen} aria-label={`Abrir ${current.title}`} className="static-disc">{current.coverUrl ? <Image src={current.coverUrl} alt={current.coverAlt || current.title} fill sizes="360px" unoptimized/> : <span>{current.title}<small>Capa em preparação</small></span>}<i/></button></div>;
  return <div ref={host} className="disc-canvas"/>;
}
