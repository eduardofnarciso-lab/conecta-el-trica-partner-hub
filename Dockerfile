# Build
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json bun.lock* ./
RUN npm install -g bun && bun install --frozen-lockfile || npm install
COPY . .
RUN npm run build

# Serve
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
