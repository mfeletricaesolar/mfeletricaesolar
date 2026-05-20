-- Atualização QR Code + Assinatura Digital
-- Cole no SQL Editor do Supabase e clique em Run.

alter table public.agenda add column if not exists assinatura_nome text;
alter table public.agenda add column if not exists assinatura_url text;
