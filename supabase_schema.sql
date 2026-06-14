-- ============================================================
-- FitManager — Schema Supabase (execute no SQL Editor)
-- ============================================================

-- PROFILES (personal trainers e clientes)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  nome text,
  email text,
  telefone text,
  cref text,
  bio text,
  especialidades text[],
  role text not null default 'personal', -- 'personal' | 'cliente'
  personal_id uuid references public.profiles(id),
  avatar_url text,
  created_at timestamptz default now()
);

-- INVITES
create table if not exists public.invites (
  id uuid default gen_random_uuid() primary key,
  personal_id uuid references public.profiles(id) on delete cascade not null,
  email text not null,
  nome_sugerido text,
  token text unique not null,
  status text default 'pending', -- 'pending' | 'accepted' | 'expired'
  cliente_id uuid references public.profiles(id),
  created_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '7 days')
);

-- FICHAS DE TREINO
create table if not exists public.fichas (
  id uuid default gen_random_uuid() primary key,
  personal_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  exercises jsonb default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- FICHAS ATRIBUÍDAS A CLIENTES
create table if not exists public.fichas_clientes (
  id uuid default gen_random_uuid() primary key,
  ficha_id uuid references public.fichas(id) on delete cascade,
  cliente_id uuid references public.profiles(id) on delete cascade,
  is_atual boolean default false,
  created_at timestamptz default now(),
  unique(ficha_id, cliente_id)
);

-- PERIODIZAÇÃO
create table if not exists public.periodizacao (
  id uuid default gen_random_uuid() primary key,
  cliente_id uuid references public.profiles(id) on delete cascade,
  personal_id uuid references public.profiles(id),
  macro jsonb,
  mesos jsonb default '[]',
  micros jsonb default '[]',
  updated_at timestamptz default now()
);

-- MEDIDAS
create table if not exists public.medidas (
  id uuid default gen_random_uuid() primary key,
  cliente_id uuid references public.profiles(id) on delete cascade,
  personal_id uuid references public.profiles(id),
  tipo text not null, -- 'circunferencias' | '7dobras' | 'foto'
  data date not null,
  dados jsonb default '{}',
  foto_url text,
  obs text,
  created_at timestamptz default now()
);

-- COMPROMISSOS / AGENDA
create table if not exists public.compromissos (
  id uuid default gen_random_uuid() primary key,
  personal_id uuid references public.profiles(id) on delete cascade,
  titulo text not null,
  tipo text, -- 'musculacao' | 'funcional' | 'hiit' | 'avaliacao'
  local text,
  inicio timestamptz not null,
  fim timestamptz,
  obs text,
  status text default 'confirmado', -- 'confirmado' | 'cancelado' | 'realizado'
  created_at timestamptz default now()
);

-- COMPROMISSOS <-> CLIENTES
create table if not exists public.compromissos_clientes (
  id uuid default gen_random_uuid() primary key,
  compromisso_id uuid references public.compromissos(id) on delete cascade,
  cliente_id uuid references public.profiles(id) on delete cascade,
  status text default 'confirmado',
  unique(compromisso_id, cliente_id)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;
alter table public.invites enable row level security;
alter table public.fichas enable row level security;
alter table public.fichas_clientes enable row level security;
alter table public.periodizacao enable row level security;
alter table public.medidas enable row level security;
alter table public.compromissos enable row level security;
alter table public.compromissos_clientes enable row level security;

-- Profiles: usuário vê o próprio perfil + clientes vinculados
create policy "profiles_select" on public.profiles for select using (
  auth.uid() = id
  or personal_id = auth.uid()
  or id = auth.uid()
);
create policy "profiles_insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on public.profiles for update using (auth.uid() = id or personal_id = auth.uid());

-- Invites: personal vê seus próprios + acesso pelo token
create policy "invites_select" on public.invites for select using (
  personal_id = auth.uid() or true -- token-based access handled in app
);
create policy "invites_insert" on public.invites for insert with check (personal_id = auth.uid());
create policy "invites_update" on public.invites for update using (personal_id = auth.uid() or true);

-- Fichas: personal gerencia as suas
create policy "fichas_all" on public.fichas for all using (personal_id = auth.uid());
create policy "fichas_clientes_all" on public.fichas_clientes for all using (
  exists (select 1 from public.fichas f where f.id = ficha_id and f.personal_id = auth.uid())
  or cliente_id = auth.uid()
);

-- Periodização, medidas: personal ou o próprio cliente
create policy "periodizacao_all" on public.periodizacao for all using (
  personal_id = auth.uid() or cliente_id = auth.uid()
);
create policy "medidas_all" on public.medidas for all using (
  personal_id = auth.uid() or cliente_id = auth.uid()
);

-- Compromissos
create policy "compromissos_all" on public.compromissos for all using (personal_id = auth.uid());
create policy "compromissos_clientes_all" on public.compromissos_clientes for all using (
  exists (select 1 from public.compromissos c where c.id = compromisso_id and c.personal_id = auth.uid())
  or cliente_id = auth.uid()
);

-- ============================================================
-- TRIGGER: auto-create profile on signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, nome, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'personal')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
