# ── Stage 1: instalar todas las dependencias ─────────────────────
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ── Stage 2: desarrollo (hot-reload con nodemon + tsx) ────────────
FROM node:22-alpine AS dev
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json tsconfig*.json nodemon.json ./
# El código fuente se monta como volumen desde compose; no se copia aquí.
EXPOSE 3001
CMD ["npx", "nodemon"]

# ── Stage 3: compilar TypeScript ──────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx tsc -p tsconfig.json

# ── Stage 4: imagen de producción (solo runtime) ──────────────────
FROM node:22-alpine AS prod
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
USER app
EXPOSE 3001
CMD ["node", "dist/index.js"]
