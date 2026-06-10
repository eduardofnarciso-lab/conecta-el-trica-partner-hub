-- =====================================================================
-- Elettro Ponto · Clube de Pontos do Eletricista
-- Migration 0001 — Schema, segurança (RLS), triggers e views
-- Banco: PostgreSQL / Supabase
-- Como rodar: cole no SQL Editor do Supabase e execute.
-- Script ADITIVO e idempotente (não apaga dados). Roda dentro de transação.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- Extensões
-- ---------------------------------------------------------------------
create extension if not exists "pgcrypto";   -- gen_random_uuid()

-- ---------------------------------------------------------------------
-- Tipos (enums) — criados de forma idempotente
-- ---------------------------------------------------------------------
do $$ begin create type user_role as enum ('master','gestor','vendedor','eletricista'); exception when duplicate_object then null; end $$;
do $$ begin create type eletricista_status as enum ('ativo','bloqueado','pendente'); exception when duplicate_object then null; end $$;
do $$ begin create type campanha_status as enum ('rascunho','agendada','ativa','encerrada'); exception when duplicate_object then null; end $$;
do $$ begin create type nota_status as enum ('em_analise','confirmada','reprovada'); exception when duplicate_object then null; end $$;
do $$ begin create type transacao_tipo as enum ('ganho','resgate','ajuste','estorno'); exception when duplicate_object then null; end $$;
do $$ begin create type transacao_status as enum ('confirmado','pendente','cancelado'); exception when duplicate_object then null; end $$;
do $$ begin create type resgate_status as enum ('solicitado','em_separacao','concluido','cancelado'); exception when duplicate_object then null; end $$;
do $$ begin create type comissao_status as enum ('em_aberto','paga'); exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- Função utilitária: updated_at automático
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------------
-- profiles — todos os usuários autenticados (staff + eletricistas)
-- 1:1 com auth.users
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  nome        text not null default '',
  email       text,
  telefone    text,
  role        user_role not null default 'eletricista',
  ativo       boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- niveis (tiers) — configuração global
-- ---------------------------------------------------------------------
create table if not exists public.niveis (
  id         smallint primary key,
  nome       text not null unique,
  pontos_min integer not null default 0,
  ordem      smallint not null,
  cor        text
);

-- ---------------------------------------------------------------------
-- vendedores são profiles com role 'vendedor'/'gestor'/'master'.
-- eletricistas — participantes do clube
-- ---------------------------------------------------------------------
create table if not exists public.eletricistas (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid unique references public.profiles(id) on delete set null,
  nome         text not null,
  apelido      text,
  cpf_cnpj     text,
  telefone     text,
  email        text,
  cidade       text,
  uf           char(2) default 'SP',
  segmento     text,
  foto_url     text,
  vendedor_id  uuid references public.profiles(id) on delete set null,
  status       eletricista_status not null default 'ativo',
  observacoes  text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists ix_eletricistas_status   on public.eletricistas(status);
create index if not exists ix_eletricistas_cidade    on public.eletricistas(cidade);
create index if not exists ix_eletricistas_vendedor  on public.eletricistas(vendedor_id);
create unique index if not exists ux_eletricistas_cpf on public.eletricistas(cpf_cnpj) where cpf_cnpj is not null;

drop trigger if exists trg_eletricistas_updated on public.eletricistas;
create trigger trg_eletricistas_updated before update on public.eletricistas
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- campanhas
-- pontos_por_real: regra opcional (NULL = pontos informados manualmente na nota)
-- ---------------------------------------------------------------------
create table if not exists public.campanhas (
  id             uuid primary key default gen_random_uuid(),
  nome           text not null,
  descricao      text,
  data_inicio    date,
  data_fim       date,
  status         campanha_status not null default 'rascunho',
  destaque       boolean not null default false,
  premiacao_top  smallint not null default 10,
  pontos_por_real numeric(10,4),
  regras         text[],
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint ck_campanha_datas check (data_fim is null or data_inicio is null or data_fim >= data_inicio)
);
create index if not exists ix_campanhas_status on public.campanhas(status);

drop trigger if exists trg_campanhas_updated on public.campanhas;
create trigger trg_campanhas_updated before update on public.campanhas
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- notas (lançamento de compras dos eletricistas)
-- ---------------------------------------------------------------------
create table if not exists public.notas (
  id                 uuid primary key default gen_random_uuid(),
  eletricista_id     uuid not null references public.eletricistas(id) on delete restrict,
  campanha_id        uuid references public.campanhas(id) on delete set null,
  vendedor_id        uuid references public.profiles(id) on delete set null,
  numero_nota        text,
  valor              numeric(12,2) not null default 0 check (valor >= 0),
  pontos             integer not null default 0 check (pontos >= 0),
  segmento           text,
  data_compra        date not null default current_date,
  anexo_url          text,
  status             nota_status not null default 'em_analise',
  motivo_reprovacao  text,
  criado_por         uuid references public.profiles(id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists ix_notas_eletricista on public.notas(eletricista_id);
create index if not exists ix_notas_campanha    on public.notas(campanha_id);
create index if not exists ix_notas_status      on public.notas(status);
create index if not exists ix_notas_data        on public.notas(data_compra);

drop trigger if exists trg_notas_updated on public.notas;
create trigger trg_notas_updated before update on public.notas
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- transacoes_pontos (extrato / ledger) — fonte única do saldo
-- ganho = positivo, resgate/estorno = negativo
-- ---------------------------------------------------------------------
create table if not exists public.transacoes_pontos (
  id              uuid primary key default gen_random_uuid(),
  eletricista_id  uuid not null references public.eletricistas(id) on delete cascade,
  tipo            transacao_tipo not null,
  pontos          integer not null,
  origem          text,
  referencia_tipo text,
  referencia_id   uuid,
  campanha_id     uuid references public.campanhas(id) on delete set null,
  descricao       text,
  status          transacao_status not null default 'confirmado',
  criado_por      uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now()
);
create index if not exists ix_tp_eletricista on public.transacoes_pontos(eletricista_id);
create index if not exists ix_tp_campanha    on public.transacoes_pontos(campanha_id);
create index if not exists ix_tp_status      on public.transacoes_pontos(status);
-- Unique não-parcial: permite ON CONFLICT na sincronia nota/resgate -> extrato.
-- (referencia_id NULL em ajustes manuais não conflita, pois NULLs são distintos.)
create unique index if not exists ux_tp_referencia
  on public.transacoes_pontos(referencia_tipo, referencia_id);

-- ---------------------------------------------------------------------
-- premios (catálogo de recompensas)
-- ---------------------------------------------------------------------
create table if not exists public.premios (
  id           uuid primary key default gen_random_uuid(),
  nome         text not null,
  descricao    text,
  categoria    text,
  custo_pontos integer not null check (custo_pontos >= 0),
  disponivel   boolean not null default true,
  estoque      integer,
  imagem_url   text,
  emoji        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists ix_premios_disp on public.premios(disponivel);

drop trigger if exists trg_premios_updated on public.premios;
create trigger trg_premios_updated before update on public.premios
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- resgates (pedidos de resgate de prêmios)
-- ---------------------------------------------------------------------
create table if not exists public.resgates (
  id              uuid primary key default gen_random_uuid(),
  eletricista_id  uuid not null references public.eletricistas(id) on delete restrict,
  premio_id       uuid references public.premios(id) on delete set null,
  custo_pontos    integer not null check (custo_pontos >= 0),
  status          resgate_status not null default 'solicitado',
  observacao      text,
  criado_por      uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists ix_resgates_eletricista on public.resgates(eletricista_id);
create index if not exists ix_resgates_status      on public.resgates(status);

drop trigger if exists trg_resgates_updated on public.resgates;
create trigger trg_resgates_updated before update on public.resgates
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- comissoes (equipe de vendas)
-- ---------------------------------------------------------------------
create table if not exists public.comissoes (
  id             uuid primary key default gen_random_uuid(),
  vendedor_id    uuid not null references public.profiles(id) on delete restrict,
  competencia    date not null,
  periodo_label  text,
  qtd_vendas     integer not null default 0,
  valor_vendas   numeric(14,2) not null default 0,
  taxa           numeric(6,4) not null default 0,
  valor_comissao numeric(14,2) not null default 0,
  status         comissao_status not null default 'em_aberto',
  pago_em        timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists ix_comissoes_vendedor on public.comissoes(vendedor_id);
create index if not exists ix_comissoes_status   on public.comissoes(status);

drop trigger if exists trg_comissoes_updated on public.comissoes;
create trigger trg_comissoes_updated before update on public.comissoes
  for each row execute function public.set_updated_at();

commit;
