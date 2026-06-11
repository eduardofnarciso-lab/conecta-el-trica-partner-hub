-- =====================================================================
-- Migration 0006 — Match por código de produto nas categorias
-- =====================================================================
begin;

alter table public.campanha_categorias
  add column if not exists codigos text[] not null default '{}';

comment on column public.campanha_categorias.codigos is
  'Códigos de produto do PDV/catálogo. Prioridade de match: código > NCM > palavra-chave.';

commit;
