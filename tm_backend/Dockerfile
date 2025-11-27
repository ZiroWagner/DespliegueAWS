# Etapa de construcción
FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN apt-get update && apt-get install -y libssl3 && rm -rf /var/lib/apt/lists/*

RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build


# Etapa de producción
FROM node:20-slim

WORKDIR /app

# Necesario también en la imagen final
RUN apt-get update && apt-get install -y libssl3 && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

ENV PORT=3000
EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && npm run start:prod"]