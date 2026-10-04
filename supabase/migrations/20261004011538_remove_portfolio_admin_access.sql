-- Remoção da área administrativa sem apagar dados nem reescrever a migration original.
-- Aplicar depois de 20261003202537_jorak_portfolio.sql no projeto existente escolhido.
begin;

drop policy if exists admin_read_self on public.portfolio_admins;
drop policy if exists projects_admin_all on public.portfolio_projects;
drop policy if exists artists_admin_all on public.portfolio_artists;
drop policy if exists project_artists_admin_all on public.portfolio_project_artists;
drop policy if exists segments_admin_all on public.portfolio_segments;
drop policy if exists settings_admin_all on public.portfolio_settings;
drop policy if exists media_admin_all on public.portfolio_media;
drop policy if exists inquiries_admin_all on public.portfolio_inquiries;
drop policy if exists upload_intents_admin_own on public.portfolio_upload_intents;

drop policy if exists portfolio_storage_admin_read on storage.objects;
drop policy if exists portfolio_storage_admin_insert on storage.objects;
drop policy if exists portfolio_storage_admin_update on storage.objects;
drop policy if exists portfolio_storage_admin_delete on storage.objects;

revoke all on public.portfolio_admins, public.portfolio_upload_intents
  from public, anon, authenticated, service_role;
revoke all on public.portfolio_artists, public.portfolio_projects,
  public.portfolio_project_artists, public.portfolio_segments,
  public.portfolio_settings, public.portfolio_media, public.portfolio_inquiries
  from public, anon, authenticated, service_role;

-- Visitantes e contas antigas têm a mesma leitura, limitada pelas políticas publicadas.
grant select on public.portfolio_artists, public.portfolio_projects,
  public.portfolio_project_artists, public.portfolio_segments, public.portfolio_settings
  to anon, authenticated;
-- O servidor só consulta metadados de mídia após verificar uma referência publicada
-- e insere contatos após validar o formulário. Mensagens não são consultáveis pela API.
grant select on public.portfolio_media to service_role;
grant insert on public.portfolio_inquiries to service_role;

-- Nenhum RPC de salvamento, upload ou autorização administrativa permanece disponível.
drop function if exists public.portfolio_save_project(jsonb);
drop function if exists public.portfolio_complete_upload(uuid, uuid);
drop function if exists portfolio_private.is_admin();
revoke all on schema portfolio_private from public, anon, authenticated, service_role;

-- RLS, políticas de leitura de conteúdo publicado e bucket privado permanecem ativos.
-- As tabelas históricas são conservadas sem grants da aplicação; não há exclusão de dados.
commit;
