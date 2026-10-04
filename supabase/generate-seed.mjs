// Gera somente o SQL local para revisão. Não conecta nem grava no Supabase.
// Requer Node 22.18+ para ler o catálogo TypeScript com remoção nativa de tipos.
import { writeFile } from 'node:fs/promises';
import { seedPortfolio } from '../src/lib/seed.ts';

const literal = value => value === null || value === undefined ? 'null' : typeof value === 'boolean' || typeof value === 'number' ? String(value) : `'${String(value).replaceAll("'", "''")}'`;
const json = value => `${literal(JSON.stringify(value))}::jsonb`;
const lines = [
  '-- Catálogo inicial pesquisado. Revisar antes de aplicar em um projeto Supabase existente.',
  '-- Todos os trabalhos permanecem rascunhos; nenhuma mídia ou participação pendente é inventada.',
  '-- Este seed exige catálogo vazio e não sobrescreve trabalhos do proprietário.',
  'begin;',
  "do $$ begin if exists (select 1 from public.portfolio_projects) or exists (select 1 from public.portfolio_artists) or exists (select 1 from public.portfolio_settings) then raise exception 'O catálogo já contém dados. Não aplique o seed sem revisar a importação.'; end if; end; $$;",
];
for (const artist of seedPortfolio.artists) lines.push(`insert into public.portfolio_artists (id,name,slug) values (${literal(artist.id)},${literal(artist.name)},${literal(artist.slug)});`);
for (const original of seedPortfolio.projects) {
  const { id, slug, featured, featuredOrder, order, artistIds, segments, status: _status, ...data } = original;
  lines.push(`insert into public.portfolio_projects (id,slug,status,featured,featured_order,sort_order,data) values (${literal(id)},${literal(slug)},'draft',${literal(featured)},${literal(featuredOrder)},${literal(order)},${json(data)});`);
  artistIds.forEach((artistId, index) => lines.push(`insert into public.portfolio_project_artists (project_id,artist_id,sort_order) values (${literal(id)},${literal(artistId)},${index});`));
  segments.forEach(segment => lines.push(`insert into public.portfolio_segments (project_id,id,sort_order,start_seconds,end_seconds,data) values (${literal(id)},${literal(segment.id)},${literal(segment.order)},${literal(segment.start)},${literal(segment.end)},${json(segment)});`));
}
lines.push(`insert into public.portfolio_settings (id,data) values ('site',${json(seedPortfolio.settings)});`, 'commit;', '');
await writeFile(new URL('./seed.sql', import.meta.url), lines.join('\n'), 'utf8');
console.log(`Seed SQL preparado: ${seedPortfolio.projects.length} rascunhos e ${seedPortfolio.artists.length} artistas. Nenhuma conexão remota foi aberta.`);
