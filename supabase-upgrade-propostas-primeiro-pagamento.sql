-- Ajuste Propostas de Financiamento
-- Remove total estimado do PDF e adiciona data do primeiro pagamento.
-- Cole no SQL Editor do Supabase e clique em Run.

alter table public.propostas add column if not exists primeiro_pagamento text;
