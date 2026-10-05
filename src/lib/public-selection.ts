import type { Project } from './types';
import { confirmedRange, fileMediaUrl } from './media.ts';

/** A source link or artwork alone is never a playable contribution. */
export function hasPlayableContribution(project: Project) {
  return project.segments.some(segment => confirmedRange(segment) && Boolean(fileMediaUrl(segment.clipUrl)));
}

export function selectPublicProjects(projects: Project[], includeDrafts = false) {
  return projects.filter(project => (project.status === 'published' || (includeDrafts && project.status === 'draft'))
    && hasPlayableContribution(project)).sort((a, b) => a.order - b.order);
}
