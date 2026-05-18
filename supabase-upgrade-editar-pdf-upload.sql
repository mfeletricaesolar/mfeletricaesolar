-- Rode no SQL Editor do Supabase
alter table public.alertas add column if not exists arquivo_url text;
alter table public.agenda add column if not exists arquivo_url text;
alter table public.relatorios add column if not exists arquivo_url text;

insert into storage.buckets (id, name, public)
values ('anexos-mf', 'anexos-mf', true)
on conflict (id) do nothing;

drop policy if exists "anexos insert anon" on storage.objects;
drop policy if exists "anexos select anon" on storage.objects;

create policy "anexos insert anon" on storage.objects
for insert to anon with check (bucket_id = 'anexos-mf');

create policy "anexos select anon" on storage.objects
for select to anon using (bucket_id = 'anexos-mf');
