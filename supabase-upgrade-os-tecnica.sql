-- Atualização OS Técnica + Timeline
-- Cole no SQL Editor do Supabase e clique em Run.

alter table public.agenda add column if not exists tipo_os text default 'Manutenção';
alter table public.agenda add column if not exists diagnostico text;
alter table public.agenda add column if not exists solucao text;
