# Etapa de dependencias
FROM node:20.11-bullseye AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Etapa de construcción
FROM node:20.11-bullseye AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# Etapa de producción
FROM node:20.11-bullseye AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copia artefactos del build standalone
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./	
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

# ⬇️⬇️ AGREGA ESTO ⬇️⬇️
# Copiar script de arranque
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

EXPOSE 3000
ENV PORT=3000

# Usar el script en lugar de server.js directo
CMD ["/app/start.sh"]
