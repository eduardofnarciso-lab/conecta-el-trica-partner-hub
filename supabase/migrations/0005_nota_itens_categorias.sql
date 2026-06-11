-- =====================================================================
-- Elettro Ponto · Clube de Pontos
-- Migration 0005 — Categorias pontuáveis por campanha + itens da nota
-- Fluxo: nota lançada via XML da NF-e; cada item é conferido contra as
-- categorias cadastradas na campanha ativa e pontua (ou não).
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- campanha_categorias — o que pontua em cada campanha
-- Match do item: por prefixo de NCM (preferência) ou palavra-chave na
-- descrição do produto. pontos_por_real define o multiplicador.
-- ---------------------------------------------------------------------
create table if not exists public.campanha_categorias (
  id              uuid primary key default gen_random_uuid(),
  campanha_id     uuid not null references public.campanhas(id) on delete cascade,
  nome            text not null,
  palavras_chave  text[] not null default '{}',
  ncm_prefixos    text[] not null default '{}',
  pontos_por_real numeric(10,4) not null default 1 check (pontos_por_real >= 0),
  ativo           boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint ux_campanha_categoria unique (campanha_id, nome)
);
create index if not exists ix_cc_campanha on public.campanha_categorias(campanha_id);

drop trigger if exists trg_cc_updated on public.campanha_categorias;
create trigger trg_cc_updated before update on public.campanha_categorias
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- nota_itens — itens lidos do XML da NF-e
-- elegivel/pontos calculados no lançamento; gestor pode ajustar antes
-- de confirmar a nota.
-- ---------------------------------------------------------------------
create table if not exists public.nota_itens (
  id            uuid primary key default gen_random_uuid(),
  nota_id       uuid not null references public.notas(id) on delete cascade,
  codigo        text,
  descricao     text not null,
  ncm           text,
  quantidade    numeric(14,4) not null default 1,
  valor         numeric(12,2) not null default 0 check (valor >= 0),
  categoria_id  uuid references public.campanha_categorias(id) on delete set null,
  elegivel      boolean not null default false,
  pontos        integer not null default 0 check (pontos >= 0),
  created_at    timestamptz not null default now()
);
create index if not exists ix_ni_nota      on public.nota_itens(nota_id);
create index if not exists ix_ni_categoria on public.nota_itens(categoria_id);

-- ---------------------------------------------------------------------
-- Consistência: notas.pontos = soma dos itens elegíveis.
-- Recalcula sempre que itens mudam (o trigger trg_nota_pontos de 0003
-- propaga ao extrato quando a nota está confirmada).
-- ---------------------------------------------------------------------
create or replace function public.recalc_nota_pontos()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_nota uuid := coalesce(new.nota_id, old.nota_id);
begin
  update public.notas n
     set pontos = coalesce((
       select sum(i.pontos) from public.nota_itens i
       where i.nota_id = v_nota and i.elegivel
     ), 0)
   where n.id = v_nota;
  return coalesce(new, old);
end $$;

drop trigger if exists trg_ni_recalc on public.nota_itens;
create trigger trg_ni_recalc
  after insert or update or delete on public.nota_itens
  for each row execute function public.recalc_nota_pontos();

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.campanha_categorias enable row level security;
alter table public.nota_itens          enable row level security;

-- categorias: leitura para autenticados (eletricista vê regras), escrita staff
drop policy if exists cc_select on public.campanha_categorias;
create policy cc_select on public.campanha_categorias for select to authenticated using (true);
drop policy if exists cc_write on public.campanha_categorias;
create policy cc_write on public.campanha_categorias for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- itens: staff tudo; eletricista lê itens das próprias notas
drop policy if exists ni_select on public.nota_itens;
create policy ni_select on public.nota_itens for select to authenticated
  using (
    public.is_staff()
    or exists (
      select 1 from public.notas n
      where n.id = nota_id and n.eletricista_id = public.my_eletricista_id()
    )
  );
drop policy if exists ni_write on public.nota_itens;
create policy ni_write on public.nota_itens for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

commit;
