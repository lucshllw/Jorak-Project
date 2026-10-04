import 'server-only';
import { randomUUID } from 'node:crypto';
import type { Project, PortfolioData, Inquiry } from '@/lib/types';
import { seedPortfolio } from '@/lib/seed';
import { getMode, guardServerRequest, isLocalPreview } from './config';
import { localTransaction, readLocalData } from './local-store';
import { publicSupabase, serviceSupabase, databaseError } from './supabase';
import type { InquiryInput } from './validation';

function publicSelection(data: PortfolioData, includeLocalDrafts = false): PortfolioData {
  const projects = data.projects
    .filter(project => project.status === 'published' || (includeLocalDrafts && project.status === 'draft'))
    .sort((a, b) => a.order - b.order);
  const usedArtists = new Set(projects.flatMap(project => project.artistIds));
  return {
    projects,
    artists: data.artists.filter(artist => usedArtists.has(artist.id)).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    settings: data.settings,
    mode: getMode(),
  };
}

async function readPublishedPortfolio(): Promise<PortfolioData> {
  if (getMode() === 'local') return publicSelection(await readLocalData());
  const client = publicSupabase();
  const results = await Promise.all([
    client.from('portfolio_projects').select('id,slug,status,featured,featured_order,sort_order,data,portfolio_project_artists(artist_id,sort_order),portfolio_segments(data)').eq('status', 'published').order('sort_order'),
    client.from('portfolio_artists').select('id,name,slug').order('name'),
    client.from('portfolio_settings').select('data').eq('id', 'site').maybeSingle(),
  ]);
  results.forEach(result => databaseError(result.error, 'Não foi possível carregar o conteúdo do banco.'));
  const projects: Project[] = (results[0].data || []).map(row => ({
    ...row.data, id: row.id, slug: row.slug, status: row.status, featured: row.featured,
    featuredOrder: row.featured_order, order: row.sort_order,
    artistIds: [...(row.portfolio_project_artists || [])].sort((a, b) => a.sort_order - b.sort_order).map(item => item.artist_id),
    segments: (row.portfolio_segments || []).map(item => item.data).sort((a, b) => a.order - b.order),
  } as Project));
  return publicSelection({
    projects, artists: results[1].data || [],
    settings: results[2].data?.data || seedPortfolio.settings, mode: 'supabase',
  });
}

export async function getPublicPortfolio(): Promise<PortfolioData> {
  await guardServerRequest();
  // Apenas a configuração local explícita permite visualizar o catálogo em revisão.
  // Nenhum parâmetro de URL nem cookie altera a seleção em produção.
  return isLocalPreview() ? publicSelection(await readLocalData(), true) : readPublishedPortfolio();
}

export async function getPublishedPortfolio(): Promise<PortfolioData> {
  await guardServerRequest();
  // Mídia privada exige uma referência publicada mesmo durante a prévia local.
  return readPublishedPortfolio();
}

export async function saveInquiry(input: InquiryInput): Promise<Inquiry> {
  const inquiry: Inquiry = { ...input, id: randomUUID(), status: 'new', createdAt: new Date().toISOString() };
  if (getMode() === 'local') return localTransaction(data => { data.inquiries.push(inquiry); return inquiry; });
  // A única escrita do repositório é o contato já validado e limitado no servidor.
  const { error } = await serviceSupabase().from('portfolio_inquiries').insert({
    id: inquiry.id, status: inquiry.status, data: inquiry, created_at: inquiry.createdAt,
  });
  databaseError(error, 'Não foi possível salvar sua mensagem. Tente novamente.');
  return inquiry;
}
