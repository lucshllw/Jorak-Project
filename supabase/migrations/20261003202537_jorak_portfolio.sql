-- Portfólio Jorak: aplicar em um projeto Supabase existente, depois de revisar.
-- Todas as tabelas são namespaced para evitar colisões com aplicações desse projeto.
begin;

create schema if not exists portfolio_private;
revoke all on schema portfolio_private from public;
grant usage on schema portfolio_private to anon, authenticated, service_role;

create table public.portfolio_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.portfolio_admins enable row level security;
revoke all on public.portfolio_admins from anon, authenticated;
grant select on public.portfolio_admins to authenticated;
grant all on public.portfolio_admins to service_role;

-- Única função SECURITY DEFINER: precisa consultar auth.sessions (não exposta).
-- Não aceita parâmetros nem lê user_metadata. A identidade vem do JWT verificado.
-- Está em schema privado, não na Data API, tem search_path vazio e retorna só boolean.
create function portfolio_private.is_admin()
returns boolean language sql stable security definer set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (select 1 from public.portfolio_admins a where a.user_id = (select auth.uid()) and a.enabled)
    and exists (
      select 1 from auth.sessions s
      where s.user_id = (select auth.uid())
        and s.id::text = ((select auth.jwt()) ->> 'session_id')
        and (s.not_after is null or s.not_after > now())
    );
$$;
revoke all on function portfolio_private.is_admin() from public;
grant execute on function portfolio_private.is_admin() to anon, authenticated, service_role;
create policy admin_read_self on public.portfolio_admins for select to authenticated
using (user_id = (select auth.uid()) and (select portfolio_private.is_admin()));

create table public.portfolio_artists (
  id text primary key check (id ~ '^[A-Za-z0-9_-]{1,100}$'),
  name text not null check (char_length(btrim(name)) between 1 and 100),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);
create unique index portfolio_artists_normalized_name on public.portfolio_artists (lower(btrim(name)));

create table public.portfolio_projects (
  id text primary key check (id ~ '^[A-Za-z0-9_-]{1,100}$'),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  featured boolean not null default false,
  featured_order integer check (featured_order >= 0),
  sort_order integer not null default 0 check (sort_order >= 0),
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  updated_at timestamptz not null default now()
);
create index portfolio_projects_status_order on public.portfolio_projects (status, sort_order);
create index portfolio_projects_featured on public.portfolio_projects (featured_order) where status = 'published' and featured;

create table public.portfolio_project_artists (
  project_id text not null references public.portfolio_projects(id) on delete cascade,
  artist_id text not null references public.portfolio_artists(id) on delete restrict,
  sort_order integer not null default 0,
  primary key (project_id, artist_id)
);
create index portfolio_project_artists_artist on public.portfolio_project_artists (artist_id, sort_order);

create table public.portfolio_segments (
  project_id text not null references public.portfolio_projects(id) on delete cascade,
  id text not null,
  sort_order integer not null,
  start_seconds numeric,
  end_seconds numeric,
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  primary key (project_id, id),
  check ((start_seconds is null and end_seconds is null) or (start_seconds is not null and end_seconds is not null and start_seconds >= 0 and end_seconds > start_seconds))
);

create table public.portfolio_media (
  id uuid primary key,
  filename text not null unique check (filename ~ '^[a-f0-9-]+\.(jpg|png|webp|mp4)$' and split_part(filename,'.',1)=id::text),
  mime text not null check (mime in ('image/jpeg','image/png','image/webp','video/mp4')),
  byte_size bigint not null check (byte_size > 0 and byte_size <= 104857600),
  created_at timestamptz not null default now()
);
create table public.portfolio_settings (
  id text primary key check (id = 'site'),
  data jsonb not null check (jsonb_typeof(data) = 'object')
);
create table public.portfolio_upload_intents (
  id uuid primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  filename text not null unique check (filename ~ '^[a-f0-9-]+\.(jpg|png|webp|mp4)$' and split_part(filename,'.',1)=id::text),
  mime text not null check (mime in ('image/jpeg','image/png','image/webp','video/mp4')),
  byte_size bigint not null check (byte_size > 0 and byte_size <= 104857600),
  expires_at timestamptz not null,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);
create table public.portfolio_inquiries (
  id uuid primary key,
  status text not null default 'new' check (status in ('new','read','replied')),
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  created_at timestamptz not null default now()
);
create index portfolio_inquiries_date on public.portfolio_inquiries (created_at desc);

alter table public.portfolio_artists enable row level security;
alter table public.portfolio_projects enable row level security;
alter table public.portfolio_project_artists enable row level security;
alter table public.portfolio_segments enable row level security;
alter table public.portfolio_media enable row level security;
alter table public.portfolio_settings enable row level security;
alter table public.portfolio_inquiries enable row level security;
alter table public.portfolio_upload_intents enable row level security;

grant select on public.portfolio_artists, public.portfolio_projects, public.portfolio_project_artists, public.portfolio_segments, public.portfolio_settings to anon, authenticated;
grant insert, update, delete on public.portfolio_artists, public.portfolio_projects, public.portfolio_project_artists, public.portfolio_segments, public.portfolio_settings to authenticated;
revoke insert, update on public.portfolio_media from anon, authenticated;
grant select, delete on public.portfolio_media to authenticated;
grant select, insert, update, delete on public.portfolio_inquiries to authenticated;
grant select, insert, update, delete on public.portfolio_upload_intents to authenticated;
grant all on public.portfolio_artists, public.portfolio_projects, public.portfolio_project_artists, public.portfolio_segments, public.portfolio_media, public.portfolio_settings, public.portfolio_inquiries to service_role;
grant all on public.portfolio_upload_intents to service_role;

create policy projects_public_read on public.portfolio_projects for select to anon, authenticated using (status = 'published');
create policy projects_admin_all on public.portfolio_projects for all to authenticated using ((select portfolio_private.is_admin())) with check ((select portfolio_private.is_admin()));
create policy artists_public_read on public.portfolio_artists for select to anon, authenticated using (exists (
  select 1 from public.portfolio_project_artists pa join public.portfolio_projects p on p.id = pa.project_id where pa.artist_id = portfolio_artists.id and p.status = 'published'
));
create policy artists_admin_all on public.portfolio_artists for all to authenticated using ((select portfolio_private.is_admin())) with check ((select portfolio_private.is_admin()));
create policy project_artists_public_read on public.portfolio_project_artists for select to anon, authenticated using (exists (
  select 1 from public.portfolio_projects p where p.id = project_id and p.status = 'published'
));
create policy project_artists_admin_all on public.portfolio_project_artists for all to authenticated using ((select portfolio_private.is_admin())) with check ((select portfolio_private.is_admin()));
create policy segments_public_read on public.portfolio_segments for select to anon, authenticated using (exists (
  select 1 from public.portfolio_projects p where p.id = project_id and p.status = 'published'
));
create policy segments_admin_all on public.portfolio_segments for all to authenticated using ((select portfolio_private.is_admin())) with check ((select portfolio_private.is_admin()));
create policy settings_public_read on public.portfolio_settings for select to anon, authenticated using (true);
create policy settings_admin_all on public.portfolio_settings for all to authenticated using ((select portfolio_private.is_admin())) with check ((select portfolio_private.is_admin()));
create policy media_admin_all on public.portfolio_media for all to authenticated using ((select portfolio_private.is_admin())) with check ((select portfolio_private.is_admin()));
create policy inquiries_admin_all on public.portfolio_inquiries for all to authenticated using ((select portfolio_private.is_admin())) with check ((select portfolio_private.is_admin()));
create policy upload_intents_admin_own on public.portfolio_upload_intents for all to authenticated
using (owner_id=(select auth.uid()) and (select portfolio_private.is_admin()))
with check (owner_id=(select auth.uid()) and (select portfolio_private.is_admin()));
-- Sem INSERT público em solicitações: apenas o endpoint com validação e anti-spam.

create function public.portfolio_save_project(input_project jsonb)
returns void language plpgsql security invoker set search_path = ''
as $$
declare
  project_id_value text := input_project ->> 'id';
  artist_value jsonb;
  segment_value jsonb;
  position_value integer := 0;
begin
  if not (select portfolio_private.is_admin()) then raise insufficient_privilege using message = 'Admin authorization required'; end if;
  if jsonb_typeof(input_project) <> 'object' then raise invalid_parameter_value using message = 'Invalid project'; end if;
  insert into public.portfolio_projects (id,slug,status,featured,featured_order,sort_order,data,updated_at)
  values (project_id_value,input_project ->> 'slug',input_project ->> 'status',(input_project ->> 'featured')::boolean,
    (input_project ->> 'featuredOrder')::integer,(input_project ->> 'order')::integer,
    input_project - array['id','slug','status','featured','featuredOrder','order','artistIds','segments'],now())
  on conflict (id) do update set slug=excluded.slug,status=excluded.status,featured=excluded.featured,
    featured_order=excluded.featured_order,sort_order=excluded.sort_order,data=excluded.data,updated_at=excluded.updated_at;

  delete from public.portfolio_project_artists where project_id=project_id_value;
  for artist_value in select value from jsonb_array_elements(input_project -> 'artistIds') loop
    insert into public.portfolio_project_artists (project_id,artist_id,sort_order) values (project_id_value,artist_value #>> '{}',position_value);
    position_value := position_value + 1;
  end loop;
  delete from public.portfolio_segments where project_id=project_id_value;
  for segment_value in select value from jsonb_array_elements(input_project -> 'segments') loop
    insert into public.portfolio_segments (project_id,id,sort_order,start_seconds,end_seconds,data)
    values (project_id_value,segment_value ->> 'id',(segment_value ->> 'order')::integer,
      (segment_value ->> 'start')::numeric,(segment_value ->> 'end')::numeric,segment_value);
  end loop;
end;
$$;
revoke all on function public.portfolio_save_project(jsonb) from public, anon;
grant execute on function public.portfolio_save_project(jsonb) to authenticated;

create function public.portfolio_complete_upload(upload_id uuid, requested_owner uuid)
returns void language plpgsql security invoker set search_path = ''
as $$
declare upload_row public.portfolio_upload_intents%rowtype;
begin
  -- Só service_role pode executar, após validação do conteúdo pelo endpoint privado.
  if not exists (select 1 from public.portfolio_admins where user_id=requested_owner and enabled) then raise insufficient_privilege using message = 'Admin authorization required'; end if;
  select * into upload_row from public.portfolio_upload_intents where id=upload_id and owner_id=requested_owner for update;
  if not found then raise invalid_parameter_value using message = 'Upload not found'; end if;
  if upload_row.expires_at < now() then raise invalid_parameter_value using message = 'Upload expired'; end if;
  insert into public.portfolio_media (id,filename,mime,byte_size)
    values (upload_row.id,upload_row.filename,upload_row.mime,upload_row.byte_size)
    on conflict (id) do nothing;
  update public.portfolio_upload_intents set completed_at=now() where id=upload_id;
end;
$$;
revoke all on function public.portfolio_complete_upload(uuid,uuid) from public, anon, authenticated;
grant execute on function public.portfolio_complete_upload(uuid,uuid) to service_role;

do $$
begin
  if exists (select 1 from storage.buckets where id='portfolio-media' and public) then
    raise exception 'O bucket portfolio-media já existe e é público. Revise o conflito antes de aplicar a migration.';
  end if;
end;
$$;
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('portfolio-media','portfolio-media',false,104857600,array['image/jpeg','image/png','image/webp','video/mp4'])
on conflict (id) do nothing;
create policy portfolio_storage_admin_read on storage.objects for select to authenticated
using (bucket_id='portfolio-media' and (select portfolio_private.is_admin()));
create policy portfolio_storage_admin_insert on storage.objects for insert to authenticated
with check (bucket_id='portfolio-media' and (select portfolio_private.is_admin()));
create policy portfolio_storage_admin_update on storage.objects for update to authenticated
using (bucket_id='portfolio-media' and (select portfolio_private.is_admin()))
with check (bucket_id='portfolio-media' and (select portfolio_private.is_admin()));
create policy portfolio_storage_admin_delete on storage.objects for delete to authenticated
using (bucket_id='portfolio-media' and (select portfolio_private.is_admin()));
-- Arquivos permanecem privados. /api/media verifica publicação e emite URL por 60s.
commit;
