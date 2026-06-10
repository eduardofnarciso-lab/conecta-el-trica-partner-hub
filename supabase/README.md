# Banco de dados — Elettro Ponto · Clube de Pontos (Supabase)

Modelagem do banco no Supabase/PostgreSQL: tabelas, segurança (RLS), triggers de pontos e views de saldo/ranking.

## Ordem de execução

Rode os arquivos **na ordem**, no **SQL Editor** do seu projeto Supabase (cada um já vem dentro de uma transação):

1. `migrations/0001_schema.sql` — tabelas, enums, índices
2. `migrations/0002_functions_rls.sql` — funções de segurança + RLS
3. `migrations/0003_triggers_views.sql` — triggers + views (saldo, ranking)
4. `migrations/0004_seed.sql` — dados de demonstração (opcional, mas recomendado pra apresentar)

> Os scripts são **aditivos e idempotentes** — não apagam dados e podem ser rodados de novo sem duplicar.

## Estrutura

- `profiles` — todos os usuários autenticados (1:1 com `auth.users`). Papéis: `master`, `gestor`, `vendedor`, `eletricista`.
- `eletricistas` — participantes do clube (podem ou não ter login).
- `campanhas` — campanhas com período, status e `pontos_por_real` (regra opcional).
- `niveis` — Bronze / Prata / Ouro / Diamante.
- `notas` — lançamento das compras (gera pontos quando confirmada).
- `transacoes_pontos` — extrato/ledger (fonte única do saldo).
- `premios` / `resgates` — catálogo e pedidos de resgate.
- `comissoes` — comissões da equipe de vendas.
- Views: `vw_saldo_eletricista`, `vw_ranking` (por campanha, com posição e prêmio).

## Como os pontos funcionam (regra flexível)

A regra ainda não está fechada, então deixei os dois caminhos prontos:

- **Manual (padrão):** a administração informa os `pontos` ao lançar a nota.
- **Automático (quando decidirem):** preencha `campanhas.pontos_por_real` e calcule `pontos = valor * pontos_por_real` na hora do lançamento.

Quando uma nota vira `confirmada`, um trigger cria a transação de `ganho` no extrato; ao confirmar um resgate, cria o débito. O saldo e o ranking são sempre derivados de `transacoes_pontos` confirmadas.

## Definir o usuário master

O `0004_seed.sql` cria eletricistas e campanha, mas **não** cria logins (isso vem do Supabase Auth). Para ter o seu usuário master:

1. No painel Supabase: **Authentication → Users → Add user** (crie com `adm@imctatui.com` e uma senha).
2. Isso dispara o trigger que cria o `profile` com papel `eletricista`. Promova para master:

```sql
update public.profiles set role = 'master'
where email = 'adm@imctatui.com';
```

Depois, se quiser, ligue um eletricista a um login:

```sql
update public.eletricistas set profile_id = '<uuid-do-auth-user>'
where nome = 'Carlos Lima';
```

## Conexão do app (próximo passo)

Para o app ler/escrever no banco, vamos precisar (na fase de integração) da **Project URL** e da **anon key** (em Project Settings → API). A `service_role key` é secreta e nunca vai no front-end.
