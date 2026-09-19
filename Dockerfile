# Etapa 1: construir la app frontend
FROM node:20-alpine AS build
WORKDIR /app
COPY app/package.json app/package-lock.json ./
RUN npm ci
COPY app/ ./
RUN npm run build

# Etapa 2: backend Node + estáticos
FROM node:20-alpine
WORKDIR /srv

# Instalar dependencias del backend (solo producción)
COPY server/package.json server/package-lock.json* ./server/
RUN cd server && npm ci --omit=dev

# Copiar el código del backend y el frontend ya construido
COPY server/ ./server/
COPY --from=build /app/dist ./app/dist

ENV NODE_ENV=production
ENV PORT=3000
# DATA_DIR por defecto: /srv/server/data (monta un volumen aquí en Easypanel)
ENV DATA_DIR=/srv/server/data

EXPOSE 3000
CMD ["node", "server/index.js"]
