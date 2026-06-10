-- =====================================================================
-- Elettro Ponto · Clube de Pontos
-- Migration 0002 — Funções de segurança + Row Level Security (RLS)
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- Funções SECURITY DEFINER para checar papel sem recursão de RLS.
-- (Leem profiles com privilégio do owner, evitando loop nas policies.)
-- ---------------------------------------------------------------------
create or replace function public.app_role()
returns text language sql stable security definer set search_path = public as $$
  select role::text from public.profiles where id = auth.uid();
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(
    (select role in ('master','gestor','vendedor') from public.profiles where id = auth.uid()),
    false);
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(
    (select role in ('master','gestor') from public.profiles where id = auth.uid()),
    false);
$$;

create or replace function public.my_eletricista_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.eletricistas where profile_id = auth.uid();
$$;

-- ---------------------------------------------------------------------
-- Habilita RLS
-- ---------------------------------------------------------------------
alter table public.profiles          enable row level security;
alter table public.eletricistas      enable row level security;
alter table public.niveis            enable row level security;
alter table public.campanhas         enable row level security;
alter table public.notas             enable row level security;
alter table public.transacoes_pontos enable row level security;
alter table public.premios           enable row level security;
alter table public.resgates          enable row level security;
alter table public.comissoes         enable row level security;

-- ---------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_staff());

drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles for insert to authenticated
  with check (public.is_admin());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

drop policy if exists profiles_delete on public.profiles;
create policy profiles_delete on public.profiles for delete to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------
-- niveis / campanhas / premios — leitura para autenticados, escrita staff
-- ---------------------------------------------------------------------
drop policy if exists niveis_select on public.niveis;
create policy niveis_select on public.niveis for select to authenticated using (true);
drop policy if exists niveis_write on public.niveis;
create policy niveis_write on public.niveis for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists campanhas_select on public.campanhas;
create policy campanhas_select on public.campanhas for select to authenticated using (true);
drop policy if exists campanhas_write on public.campanhas;
create policy campanhas_write on public.campanhas for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists premios_select on public.premios;
create policy premios_select on public.premios for select to authenticated using (true);
drop policy if exists premios_write on public.premios;
create policy premios_write on public.premios for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- ---------------------------------------------------------------------
-- eletricistas — staff tudo; eletricista vê só o próprio
-- ---------------------------------------------------------------------
drop policy if exists eletricistas_select on public.eletricistas;
create policy eletricistas_select on public.eletricistas for select to authenticated
  using (public.is_staff() or profile_id = auth.uid());

drop policy if exists eletricistas_write on public.eletricistas;
create policy eletricistas_write on public.eletricistas for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- ---------------------------------------------------------------------
-- notas — staff tudo; eletricista vê só as próprias
-- ---------------------------------------------------------------------
drop policy if exists notas_select on public.notas;
create policy notas_select on public.notas for select to authenticated
  using (public.is_staff() or eletricista_id = public.my_eletricista_id());

drop policy if exists notas_write on public.notas;
create policy notas_write on public.notas for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- ---------------------------------------------------------------------
-- transacoes_pontos — staff tudo; eletricista vê só as próprias
-- ---------------------------------------------------------------------
drop policy if exists tp_select on public.transacoes_pontos;
create policy tp_select on public.transacoes_pontos for select to authenticated
  using (public.is_staff() or eletricista_id = public.my_eletricista_id());

drop policy if exists tp_write on public.transacoes_pontos;
create policy tp_write on public.transacoes_pontos for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- ---------------------------------------------------------------------
-- resgates — eletricista vê/cria os próprios; staff gerencia
-- ---------------------------------------------------------------------
drop policy if exists resgates_select on public.resgates;
create policy resgates_select on public.resgates for select to authenticated
  using (public.is_staff() or eletricista_id = public.my_eletricista_id());

drop policy if exists resgates_insert on public.resgates;
create policy resgates_insert on public.resgates for insert to authenticated
  with check (public.is_staff() or eletricista_id = public.my_eletricista_id());

drop policy if exists resgates_update on public.resgates;
create policy resgates_update on public.resgates for update to authenticated
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists resgates_delete on public.resgates;
create policy resgates_delete on public.resgates for delete to authenticated
  using (public.is_staff());

-- ---------------------------------------------------------------------
-- comissoes — admin tudo; vendedor vê só as próprias
-- ---------------------------------------------------------------------
drop policy if exists comissoes_select on public.comissoes;
create policy comissoes_select on public.comissoes for select to authenticated
  using (public.is_admin() or vendedor_id = auth.uid());

drop policy if exists comissoes_write on public.comissoes;
create policy comissoes_write on public.comissoes for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

commit;
