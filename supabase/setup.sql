-- =====================================================================
-- AgroConecta — Setup Supabase (schema + RLS + trigger + storage + realtime)
-- Correr UMA vez no Supabase → SQL Editor → New query → colar tudo → Run.
-- =====================================================================

-- ───────────────────────── EXTENSÕES ────────────────────────────────
create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ───────────────────────── HELPER is_admin ──────────────────────────
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false);
$$;

-- ───────────────────────── TABELAS ──────────────────────────────────
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  name          text,
  email         text,
  phone         text,
  role          text not null default 'user',          -- 'user' | 'admin'
  user_type     text not null default 'pendente',      -- agricultor|proprietario|vendedor|comprador|pendente
  user_types    text[] not null default '{}',
  plan          text not null default 'gratuito',      -- gratuito|mensal|trimestral|anual
  plan_ativado_em timestamptz,
  plan_expira_em  timestamptz,
  favoritos     text[] not null default '{}',
  photo_url     text,
  created_at    timestamptz not null default now()
);

create table if not exists public.properties (
  id            uuid primary key default gen_random_uuid(),
  nome          text not null,
  area          numeric not null,
  localizacao   text not null,
  tipo_solo     text not null,                          -- argiloso|arenoso|franco
  disponibilidade_agua boolean not null default false,
  preco         numeric not null,
  descricao     text not null default '',
  dono_uid      uuid not null references auth.users(id) on delete cascade,
  dono_nome     text not null,
  verificado    boolean not null default false,
  culturas      text[] not null default '{}',
  image_urls    text[] not null default '{}',
  created_at    timestamptz not null default now()
);
create index if not exists properties_created_idx on public.properties (created_at desc);
create index if not exists properties_dono_idx on public.properties (dono_uid);

create table if not exists public.listings (
  id            uuid primary key default gen_random_uuid(),
  listing_type  text not null,                          -- terra-procura|produto-oferta|produto-procura
  titulo        text not null,
  descricao     text not null default '',
  localizacao   text,
  area          numeric,
  tipo_solo     text,
  preco         numeric,
  produtos      text[],
  quantidade    text,
  autor_uid     uuid not null references auth.users(id) on delete cascade,
  autor_nome    text not null,
  created_at    timestamptz not null default now()
);
create index if not exists listings_created_idx on public.listings (created_at desc);
create index if not exists listings_autor_idx on public.listings (autor_uid);

create table if not exists public.producao (
  id            uuid primary key default gen_random_uuid(),
  uid           uuid not null references auth.users(id) on delete cascade,
  cultura       text not null,
  propriedade   text not null,
  area          numeric not null,
  data_inicio   text,
  data_colheita text,
  progresso     int not null default 0,
  status        text not null default 'Em Andamento',
  notas         text,
  created_at    timestamptz not null default now()
);
create index if not exists producao_uid_idx on public.producao (uid, created_at desc);

create table if not exists public.alertas (
  id            uuid primary key default gen_random_uuid(),
  uid           uuid not null references auth.users(id) on delete cascade,
  plano_id      uuid,
  plano_nome    text,
  tipo          text not null,
  titulo        text not null,
  descricao     text,
  urgencia      text not null default 'media',
  lido          boolean not null default false,
  created_at    timestamptz not null default now()
);
create index if not exists alertas_uid_idx on public.alertas (uid, created_at desc);

create table if not exists public.ocorrencias (
  id            uuid primary key default gen_random_uuid(),
  uid           uuid not null references auth.users(id) on delete cascade,
  plano_id      uuid,
  plano_nome    text,
  tipo          text not null,
  descricao     text,
  data          text,
  fotos         int,
  created_at    timestamptz not null default now()
);
create index if not exists ocorrencias_uid_idx on public.ocorrencias (uid, created_at desc);

create table if not exists public.negociacoes (
  id                 uuid primary key default gen_random_uuid(),
  property_id        uuid,
  property_nome      text not null,
  arrendatario_uid   uuid not null references auth.users(id) on delete cascade,
  arrendatario_nome  text not null,
  proprietario_uid   uuid not null references auth.users(id) on delete cascade,
  proprietario_nome  text not null,
  mensagem           text not null default '',
  status             text not null default 'pendente',  -- pendente|aceite|recusada
  created_at         timestamptz not null default now()
);
create index if not exists neg_arr_idx on public.negociacoes (arrendatario_uid);
create index if not exists neg_prop_idx on public.negociacoes (proprietario_uid);

create table if not exists public.mensagens (
  id            uuid primary key default gen_random_uuid(),
  negociacao_id uuid not null references public.negociacoes(id) on delete cascade,
  sender_id     uuid not null references auth.users(id) on delete cascade,
  text          text not null,
  created_at    timestamptz not null default now()
);
create index if not exists mensagens_neg_idx on public.mensagens (negociacao_id, created_at);

create table if not exists public.config (
  id   text primary key,
  data jsonb not null default '{}'
);

-- ─────────────────── helper: é parte da negociação? ──────────────────
create or replace function public.is_neg_party(neg_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.negociacoes n
    where n.id = neg_id and auth.uid() in (n.arrendatario_uid, n.proprietario_uid)
  );
$$;

-- ───────────────── trigger: criar profile no signup ─────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, phone, user_type, user_types)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    coalesce(new.raw_user_meta_data->>'user_type', 'pendente'),
    coalesce((select array_agg(value::text) from jsonb_array_elements_text(
       case when jsonb_typeof(new.raw_user_meta_data->'user_types') = 'array'
            then new.raw_user_meta_data->'user_types' else '[]'::jsonb end)), '{}')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── trigger: impedir o próprio de mudar role/plan (só admin) ─────────
create or replace function public.protect_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    new.role := old.role;
    new.plan := old.plan;
    new.plan_ativado_em := old.plan_ativado_em;
    new.plan_expira_em := old.plan_expira_em;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile on public.profiles;
create trigger protect_profile
  before update on public.profiles
  for each row execute function public.protect_profile_fields();

-- ───────────────────────── RLS ──────────────────────────────────────
alter table public.profiles    enable row level security;
alter table public.properties  enable row level security;
alter table public.listings    enable row level security;
alter table public.producao    enable row level security;
alter table public.alertas     enable row level security;
alter table public.ocorrencias enable row level security;
alter table public.negociacoes enable row level security;
alter table public.mensagens   enable row level security;
alter table public.config      enable row level security;

-- profiles
create policy "profiles read own/admin" on public.profiles for select using (auth.uid() = id or public.is_admin());
create policy "profiles update own/admin" on public.profiles for update using (auth.uid() = id or public.is_admin());

-- properties
create policy "properties read auth" on public.properties for select to authenticated using (true);
create policy "properties insert dono" on public.properties for insert to authenticated with check (dono_uid = auth.uid());
create policy "properties update dono/admin" on public.properties for update using (dono_uid = auth.uid() or public.is_admin());
create policy "properties delete dono/admin" on public.properties for delete using (dono_uid = auth.uid() or public.is_admin());

-- listings
create policy "listings read auth" on public.listings for select to authenticated using (true);
create policy "listings insert autor" on public.listings for insert to authenticated with check (autor_uid = auth.uid());
create policy "listings update autor/admin" on public.listings for update using (autor_uid = auth.uid() or public.is_admin());
create policy "listings delete autor/admin" on public.listings for delete using (autor_uid = auth.uid() or public.is_admin());

-- producao / alertas / ocorrencias (só dono)
create policy "producao owner" on public.producao for all using (uid = auth.uid() or public.is_admin()) with check (uid = auth.uid());
create policy "alertas owner" on public.alertas for all using (uid = auth.uid() or public.is_admin()) with check (uid = auth.uid());
create policy "ocorrencias owner" on public.ocorrencias for all using (uid = auth.uid() or public.is_admin()) with check (uid = auth.uid());

-- negociacoes
create policy "neg read parties" on public.negociacoes for select using (auth.uid() in (arrendatario_uid, proprietario_uid) or public.is_admin());
create policy "neg insert arrendatario" on public.negociacoes for insert to authenticated with check (arrendatario_uid = auth.uid() and status = 'pendente');
create policy "neg update proprietario" on public.negociacoes for update using (proprietario_uid = auth.uid() or public.is_admin());

-- mensagens (só partes da negociação)
create policy "msg read parties" on public.mensagens for select using (public.is_neg_party(negociacao_id));
create policy "msg insert party" on public.mensagens for insert to authenticated with check (sender_id = auth.uid() and public.is_neg_party(negociacao_id));

-- config
create policy "config read auth" on public.config for select to authenticated using (true);
create policy "config write admin" on public.config for all using (public.is_admin()) with check (public.is_admin());

-- ───────────────────────── REALTIME ─────────────────────────────────
alter publication supabase_realtime add table public.mensagens;
alter publication supabase_realtime add table public.alertas;
alter publication supabase_realtime add table public.negociacoes;

-- ───────────────────────── STORAGE (imagens) ────────────────────────
insert into storage.buckets (id, name, public)
values ('property-images', 'property-images', true)
on conflict (id) do nothing;

create policy "img public read" on storage.objects for select using (bucket_id = 'property-images');
create policy "img upload auth" on storage.objects for insert to authenticated with check (bucket_id = 'property-images');
create policy "img delete owner" on storage.objects for delete to authenticated using (bucket_id = 'property-images' and owner = auth.uid());

-- =====================================================================
-- DEPOIS de te registares na app, torna a tua conta admin (opcional):
--   update public.profiles set role = 'admin' where email = 'o-teu-email@exemplo.com';
-- =====================================================================
