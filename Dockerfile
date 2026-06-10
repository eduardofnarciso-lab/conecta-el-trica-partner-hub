# =====================================================================
# Elettro Ponto · Clube de Pontos — build SSR (TanStack Start + Nitro)
# Gera um servidor Node em .output/ e roda com `node`.
# =====================================================================

# ---- Build ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json bun.lock* ./
RUN npm install
COPY . .
# Força o Nitro a gerar o preset Node (e não o cloudflare padrão)
ENV NITRO_PRESET=node-server
ENV SERVER_PRESET=node-server
RUN npm run build

# ---- Runtime ----
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
COPY --from=build /app/.output ./.output
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
