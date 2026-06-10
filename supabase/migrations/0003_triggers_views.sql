-- =====================================================================
-- Elettro Ponto · Clube de Pontos
-- Migration 0003 — Triggers de negócio + Views (saldo e ranking)
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- Cria profile automaticamente quando um usuário se cadastra no Auth.
-- Papel padrão = 'eletricista' (promova o master manualmente, ver README).
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nome, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- Nota -> extrato. Mantém UMA transação 'ganho' por nota.
-- Confirmada => transação confirmada; qualquer outro status => cancelada.
-- ---------------------------------------------------------------------
create or replace function public.sync_nota_transacao()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'confirmada' then
    insert into public.transacoes_pontos
      (eletricista_id, tipo, pontos, origem, referencia_tipo, referencia_id,
       campanha_id, descricao, status, criado_por)
    values
      (new.eletricista_id, 'ganho', new.pontos, 'Lançamento de nota', 'nota', new.id,
       new.campanha_id,
       'Compra confirmada' || coalesce(' — NF ' || new.numero_nota, ''),
       'confirmado', new.criado_por)
    on conflict (referencia_tipo, referencia_id) do update
      set pontos         = excluded.pontos,
          eletricista_id = excluded.eletricista_id,
          campanha_id    = excluded.campanha_id,
          descricao      = excluded.descricao,
          status         = 'confirmado';
  else
    update public.transacoes_pontos
       set status = 'cancelado'
     where referencia_tipo = 'nota' and referencia_id = new.id;
  end if;
  return new;
end $$;

drop trigger if exists trg_nota_pontos on public.notas;
create trigger trg_nota_pontos
  after insert or update on public.notas
  for each row execute function public.sync_nota_transacao();

-- ---------------------------------------------------------------------
-- Resgate -> extrato. Débito (pontos negativos) enquanto não cancelado.
-- ---------------------------------------------------------------------
create or replace function public.sync_resgate_transacao()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'cancelado' then
    update public.transacoes_pontos
       set status = 'cancelado'
     where referencia_tipo = 'resgate' and referencia_id = new.id;
  else
    insert into public.transacoes_pontos
      (eletricista_id, tipo, pontos, origem, referencia_tipo, referencia_id,
       descricao, status, criado_por)
    values
      (new.eletricista_id, 'resgate', -abs(new.custo_pontos), 'Resgate de prêmio',
       'resgate', new.id, 'Resgate de prêmio', 'confirmado', new.criado_por)
    on conflict (referencia_tipo, referencia_id) do update
      set pontos = excluded.pontos,
          status = 'confirmado';
  end if;
  return new;
end $$;

drop trigger if exists trg_resgate_pontos on public.resgates;
create trigger trg_resgate_pontos
  after insert or update on public.resgates
  for each row execute function public.sync_resgate_transacao();

-- ---------------------------------------------------------------------
-- View: saldo de pontos por eletricista (somente transações confirmadas)
-- security_invoker => respeita o RLS de quem consulta.
-- ---------------------------------------------------------------------
create or replace view public.vw_saldo_eletricista
  with (security_invoker = on) as
select
  e.id   as eletricista_id,
  e.nome,
  coalesce(sum(t.pontos) filter (where t.status = 'confirmado'), 0)::int as saldo
from public.eletricistas e
left join public.transacoes_pontos t on t.eletricista_id = e.id
group by e.id, e.nome;

-- ---------------------------------------------------------------------
-- View: ranking por campanha (ganhos confirmados), com posição e prêmio
-- ---------------------------------------------------------------------
create or replace view public.vw_ranking
  with (security_invoker = on) as
select
  r.*,
  (r.posicao <= r.premiacao_top) as premiado
from (
  select
    c.id            as campanha_id,
    c.nome          as campanha,
    c.premiacao_top,
    e.id            as eletricista_id,
    e.nome,
    e.cidade,
    coalesce(sum(t.pontos) filter (where t.tipo = 'ganho' and t.status = 'confirmado'), 0)::int as pontos,
    row_number() over (
      partition by c.id
      order by coalesce(sum(t.pontos) filter (where t.tipo = 'ganho' and t.status = 'confirmado'), 0) desc, e.nome
    ) as posicao
  from public.campanhas c
  cross join public.eletricistas e
  left join public.transacoes_pontos t
         on t.eletricista_id = e.id and t.campanha_id = c.id
  where e.status = 'ativo'
  group by c.id, c.nome, c.premiacao_top, e.id, e.nome, e.cidade
) r;

commit;
