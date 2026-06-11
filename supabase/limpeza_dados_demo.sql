-- =====================================================================
-- Elettro Ponto · LIMPEZA DOS DADOS DE DEMONSTRAÇÃO (seed 0004)
-- Rode no SQL Editor do Supabase.
-- ANTES DE RODAR: confira os SELECTs de validação. Só apaga:
--   • os 12 eletricistas demo (sem login vinculado), suas notas,
--     itens, transações e resgates
--   • a campanha demo "Centro Sul Paulista 2026" (e categorias)
--   • o catálogo de prêmios demo
-- Mantém: níveis (Bronze→Diamante), usuários reais e tudo que você
-- cadastrou manualmente.
-- =====================================================================

-- 1) VALIDAÇÃO — veja o que será apagado antes de confirmar
select 'eletricistas demo' as alvo, count(*) from public.eletricistas
 where profile_id is null and nome in
 ('Carlos Lima','Roberto Alves','Felipe Castro','André Moreira','Ricardo Tavares','Marcos Vinícius',
  'Henrique Sá','Bruno Mendes','Igor Bastos','Daniel Prado','Anderson Ramos','Wesley Tavares');

select 'campanha demo' as alvo, count(*) from public.campanhas
 where nome = 'Centro Sul Paulista 2026';

select 'prêmios demo' as alvo, count(*) from public.premios
 where nome in ('Furadeira Profissional','Multímetro Digital','Alicate Amperímetro','Curso NR10 Básico',
                'Vale Combustível R$100','PIX R$50','PIX R$200','Jantar para 2 pessoas');

-- 2) LIMPEZA — execute depois de conferir acima
begin;

with demo_elet as (
  select id from public.eletricistas
   where profile_id is null and nome in
   ('Carlos Lima','Roberto Alves','Felipe Castro','André Moreira','Ricardo Tavares','Marcos Vinícius',
    'Henrique Sá','Bruno Mendes','Igor Bastos','Daniel Prado','Anderson Ramos','Wesley Tavares')
)
delete from public.transacoes_pontos where eletricista_id in (select id from demo_elet);

with demo_elet as (
  select id from public.eletricistas
   where profile_id is null and nome in
   ('Carlos Lima','Roberto Alves','Felipe Castro','André Moreira','Ricardo Tavares','Marcos Vinícius',
    'Henrique Sá','Bruno Mendes','Igor Bastos','Daniel Prado','Anderson Ramos','Wesley Tavares')
)
delete from public.resgates where eletricista_id in (select id from demo_elet);

with demo_elet as (
  select id from public.eletricistas
   where profile_id is null and nome in
   ('Carlos Lima','Roberto Alves','Felipe Castro','André Moreira','Ricardo Tavares','Marcos Vinícius',
    'Henrique Sá','Bruno Mendes','Igor Bastos','Daniel Prado','Anderson Ramos','Wesley Tavares')
)
delete from public.notas where eletricista_id in (select id from demo_elet);
-- nota_itens caem em cascata com as notas

delete from public.eletricistas
 where profile_id is null and nome in
 ('Carlos Lima','Roberto Alves','Felipe Castro','André Moreira','Ricardo Tavares','Marcos Vinícius',
  'Henrique Sá','Bruno Mendes','Igor Bastos','Daniel Prado','Anderson Ramos','Wesley Tavares');

-- campanha demo (categorias caem em cascata; notas reais nela ficam com campanha nula)
delete from public.campanhas where nome = 'Centro Sul Paulista 2026'
  and not exists (select 1 from public.notas n where n.campanha_id = campanhas.id);

-- prêmios demo (só os sem resgate vinculado)
delete from public.premios p
 where p.nome in ('Furadeira Profissional','Multímetro Digital','Alicate Amperímetro','Curso NR10 Básico',
                  'Vale Combustível R$100','PIX R$50','PIX R$200','Jantar para 2 pessoas')
   and not exists (select 1 from public.resgates r where r.premio_id = p.id);

commit;

-- 3) CONFERÊNCIA FINAL
select (select count(*) from public.eletricistas)  as eletricistas,
       (select count(*) from public.notas)          as notas,
       (select count(*) from public.campanhas)      as campanhas,
       (select count(*) from public.premios)        as premios,
       (select count(*) from public.transacoes_pontos) as transacoes;
