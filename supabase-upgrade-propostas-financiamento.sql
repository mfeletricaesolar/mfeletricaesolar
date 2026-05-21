-- Módulo Propostas de Financiamento
-- Cole no SQL Editor do Supabase e clique em Run.

create table if not exists public.propostas (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  cliente text not null,
  valor_projeto text,
  carencia text,
  banco text,
  validade text,
  observacoes text,
  opcoes text
);

alter table public.propostas enable row level security;

drop policy if exists "propostas select anon" on public.propostas;
drop policy if exists "propostas insert anon" on public.propostas;
drop policy if exists "propostas update anon" on public.propostas;
drop policy if exists "propostas delete anon" on public.propostas;

create policy "propostas select anon" on public.propostas for select to anon using (true);
create policy "propostas insert anon" on public.propostas for insert to anon with check (true);
create policy "propostas update anon" on public.propostas for update to anon using (true);
create policy "propostas delete anon" on public.propostas for delete to anon using (true);
