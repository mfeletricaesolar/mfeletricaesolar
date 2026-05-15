-- Cole tudo no SQL Editor do Supabase e clique em RUN.

create table if not exists public.alertas (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  cliente text not null,
  painel text not null,
  situacao text not null,
  prioridade text default 'Média',
  status text default 'Pendente',
  responsavel text,
  observacao text
);

create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  nome text not null,
  contato text,
  cidade text,
  painel text,
  potencia text,
  status text default 'Normal'
);

create table if not exists public.agenda (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  data date not null,
  horario time,
  local text not null,
  servico text not null,
  equipe text,
  status text default 'Agendado'
);

create table if not exists public.relatorios (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  dia date not null,
  cliente text not null,
  atividade text not null,
  resultado text not null,
  responsavel text,
  status text default 'Bem-sucedido'
);

alter table public.alertas enable row level security;
alter table public.clientes enable row level security;
alter table public.agenda enable row level security;
alter table public.relatorios enable row level security;

drop policy if exists "Permitir tudo alertas" on public.alertas;
drop policy if exists "Permitir tudo clientes" on public.clientes;
drop policy if exists "Permitir tudo agenda" on public.agenda;
drop policy if exists "Permitir tudo relatorios" on public.relatorios;

create policy "Permitir tudo alertas" on public.alertas for all to anon using (true) with check (true);
create policy "Permitir tudo clientes" on public.clientes for all to anon using (true) with check (true);
create policy "Permitir tudo agenda" on public.agenda for all to anon using (true) with check (true);
create policy "Permitir tudo relatorios" on public.relatorios for all to anon using (true) with check (true);
