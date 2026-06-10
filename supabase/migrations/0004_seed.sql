-- =====================================================================
-- Elettro Ponto · Clube de Pontos
-- Migration 0004 — Seeds de demonstração (níveis, prêmios, campanha,
-- 12 eletricistas e notas confirmadas que populam ranking e extrato).
-- Idempotente: só insere o que ainda não existe.
-- =====================================================================

begin;

-- Níveis (tiers)
insert into public.niveis (id, nome, pontos_min, ordem, cor) values
  (1, 'Bronze',       0, 1, 'bronze'),
  (2, 'Prata',     5000, 2, 'silver'),
  (3, 'Ouro',     10000, 3, 'gold'),
  (4, 'Diamante', 15000, 4, 'diamond')
on conflict (id) do nothing;

-- Prêmios (catálogo)
insert into public.premios (nome, descricao, categoria, custo_pontos, disponivel, emoji)
select * from (values
  ('Furadeira Profissional',   'Furadeira de impacto 750W com maleta.',          'Ferramentas',  5000, true,  '🔧'),
  ('Multímetro Digital',       'Multímetro True RMS categoria CAT III.',         'Ferramentas',  2500, true,  '📟'),
  ('Alicate Amperímetro',      'Alicate amperímetro 600A AC/DC.',                'Ferramentas',  3000, true,  '🪛'),
  ('Curso NR10 Básico',        'Curso de segurança em instalações elétricas.',   'Cursos',       4000, true,  '🎓'),
  ('Vale Combustível R$100',   'Crédito em postos parceiros.',                   'Benefícios',   2000, true,  '⛽'),
  ('PIX R$50',                 'Crédito direto via PIX.',                        'PIX/Crédito',  1000, true,  '💸'),
  ('PIX R$200',                'Crédito direto via PIX.',                        'PIX/Crédito',  4000, true,  '💸'),
  ('Jantar para 2 pessoas',    'Experiência em restaurante parceiro.',           'Experiências', 3500, true,  '🍽️')
) as v(nome, descricao, categoria, custo_pontos, disponivel, emoji)
where not exists (select 1 from public.premios);

-- Eletricistas (12) — só insere os que ainda não existem (por nome)
insert into public.eletricistas (nome, cidade, segmento, status)
select v.nome, v.cidade, 'Materiais Elétricos', 'ativo'::eletricista_status
from (values
  ('Carlos Lima',     'Tatuí - SP'),
  ('Roberto Alves',   'Sorocaba - SP'),
  ('Felipe Castro',   'Itapetininga - SP'),
  ('André Moreira',   'Boituva - SP'),
  ('Ricardo Tavares', 'Cerquilho - SP'),
  ('Marcos Vinícius', 'Cesário Lange - SP'),
  ('Henrique Sá',     'Tatuí - SP'),
  ('Bruno Mendes',    'Sorocaba - SP'),
  ('Igor Bastos',     'Itapetininga - SP'),
  ('Daniel Prado',    'Boituva - SP'),
  ('Anderson Ramos',  'Cerquilho - SP'),
  ('Wesley Tavares',  'Tatuí - SP')
) as v(nome, cidade)
where not exists (select 1 from public.eletricistas e where e.nome = v.nome);

-- Campanha ativa + notas confirmadas (apenas na primeira execução)
do $$
declare
  v_camp uuid;
  rec record;
begin
  if not exists (select 1 from public.campanhas) then
    insert into public.campanhas
      (nome, descricao, data_inicio, data_fim, status, destaque, premiacao_top, regras)
    values
      ('Centro Sul Paulista 2026',
       'Campanha de pontuação dos eletricistas parceiros da Elettro Ponto.',
       date '2026-06-01', date '2026-08-31', 'ativa', true, 10,
       array['Pontue a cada compra registrada na loja.',
             'Notas sujeitas à aprovação da administração.',
             'Os 10 primeiros do ranking são premiados ao fim da campanha.'])
    returning id into v_camp;

    -- Uma nota confirmada por eletricista, com pontuação decrescente,
    -- para popular ranking e extrato (o trigger gera as transações).
    for rec in
      select id, row_number() over (order by nome) as rn
      from public.eletricistas where status = 'ativo'
    loop
      insert into public.notas
        (eletricista_id, campanha_id, valor, pontos, segmento, data_compra, status)
      values
        (rec.id, v_camp,
         (14800 - rec.rn * 1000)::numeric,
         greatest(14800 - rec.rn * 1000, 0)::int / 10,
         'Materiais Elétricos',
         current_date - (rec.rn || ' days')::interval,
         'confirmada');
    end loop;
  end if;
end $$;

commit;
