# Etapa de construcción
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build

# Etapa de producción
FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Variables de entorno por defecto (serán sobreescritas en despliegue)
ENV PORT=3000
EXPOSE 3000

CMD ["npm", "run", "start:prod"]