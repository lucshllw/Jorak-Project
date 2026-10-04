import { notFound } from 'next/navigation';
import ProjectView from '@/components/ProjectView';
import { getPublicPortfolio } from '@/lib/server/repository';
export const dynamic = 'force-dynamic';
export default async function ProjectPage({ params }: { params: Promise<{slug:string}> }) {
  const { slug } = await params;
  const data = await getPublicPortfolio();
  const project = data.projects.find(item => item.slug === slug);
  if (!project) notFound();
  return <ProjectView project={project} artists={data.artists} settings={data.settings}/>;
}
