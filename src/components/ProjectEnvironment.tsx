'use client';
import ComicBackdrop from './ComicBackdrop';
export default function ProjectEnvironment({ projectId }: { projectId: string }) {
  return <div className="project-environment" data-project={projectId} aria-hidden="true"><ComicBackdrop mood="project" local/></div>;
}
