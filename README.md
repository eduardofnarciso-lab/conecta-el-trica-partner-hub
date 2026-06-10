# Elettro Ponto · Clube de Pontos do Eletricista

Plataforma de pontuação, ranking e premiação para **eletricistas parceiros** da Elettro Ponto (Tatuí - SP). A cada compra registrada (nota), o eletricista pontua e sobe no ranking da campanha; os 10 primeiros são premiados ao fim do período.

> Este repositório contém apenas o **front-end** (MVP visual). Dados são mockados em `src/lib/mocks.ts` e os serviços (`src/lib/services.ts`) já estão estruturados para futura integração com API/Supabase.

## Stack

- React 19 + TypeScript
- TanStack Start / TanStack Router (file-based)
- Tailwind CSS v4 + Shadcn/UI
- Lucide Icons
- Sonner (toasts)

## Rodando localmente

```bash
npm install
npm run dev
```

Build de produção:
```bash
npm run build
npm run preview
```

## Docker / EasyPanel

```bash
docker compose up -d --build
# acesse http://localhost:8080
```

Para EasyPanel: aponte para este repositório e use o `Dockerfile` incluído. A imagem expõe a porta `80`.

## Estrutura

```
src/
  components/
    app-shell.tsx        # Sidebar + topbar + bottom nav
    badges.tsx           # Badges de categoria e status
    ui/                  # Shadcn components
  lib/
    mocks.ts             # Dados mockados (substituir por API)
    services.ts          # authService, campaignService, etc.
  routes/
    login.tsx
    _app.tsx             # Layout autenticado
    _app.index.tsx       # Dashboard
    _app.campanhas.tsx
    _app.campanhas.$id.tsx
    _app.ranking.tsx
    _app.extrato.tsx
    _app.loja.tsx
    _app.indicacoes.tsx
    _app.perfil.tsx
    _app.admin.tsx       # Layout administração
    _app.admin.index.tsx
    _app.admin.parceiros.tsx
    _app.admin.campanhas.tsx
    _app.admin.premios.tsx
    _app.admin.aprovacoes.tsx
    _app.admin.relatorios.tsx
```

## Conectando a um back-end

Os arquivos em `src/lib/services.ts` retornam promises com dados mockados. Para integrar com uma API real (REST ou Supabase), basta substituir o conteúdo de cada função pelo `fetch` / cliente correspondente — a UI não precisa mudar.

## Login de demonstração

Qualquer e-mail e senha são aceitos. Por enquanto há um **único usuário master** (admin) com acesso total — `Administrador Elettro Ponto`. O controle de permissões por usuário (Rodrigo, Fábio, Júnior etc.) será adicionado depois.

## Novos módulos (admin)

- `_app.admin.notas.tsx` — Lançamento de Notas: registro das compras dos eletricistas que geram pontos.
- `_app.admin.comissoes.tsx` — Comissões da equipe de vendas.
