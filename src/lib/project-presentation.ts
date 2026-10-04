import type { Project, Segment } from './types';
import { confirmedRange, fileMediaUrl } from './media.ts';

export function editionPlaylist(project: Pick<Project, 'segments'>): Segment[] {
  const ready = project.segments.filter(segment => confirmedRange(segment) && fileMediaUrl(segment.clipUrl));
  // The original cut and the editor's showcase can document the same contribution.
  // Prefer original cuts; never replay the duplicate showcase as a second part.
  const original = ready.filter(segment => segment.timeline !== 'showcase');
  return (original.length ? original : ready.slice(0, 1)).sort((a, b) => (a.start! - b.start!) || a.order - b.order);
}
export function projectDescription(project: Pick<Project, 'title' | 'character' | 'work'>, artistNames: string) {
  const inspiration = project.character ? `, inspirada em ${project.character}${project.work ? `, do universo de ${project.work}` : ''}` : project.work ? `, com referências de ${project.work}` : '';
  return `Sou Jorak, editor MMV e motion designer. Neste projeto, participei da edição de “${project.title}”, de ${artistNames}${inspiration}. Minha contribuição conecta música, personagem e movimento na construção visual do lançamento. Acompanhe minha edição nesta página e explore os créditos e os links para conhecer o projeto completo.`;
}
export function coverTextureFrame(width: number, height: number, position = { x: 50, y: 50 }) {
  const rx = Math.min(1, height / width), ry = Math.min(1, width / height);
  const x = Math.min(100, Math.max(0, position.x)) / 100, y = Math.min(100, Math.max(0, position.y)) / 100;
  return { repeatX: rx, repeatY: ry, offsetX: (1 - rx) * x, offsetY: (1 - ry) * (1 - y) };
}
