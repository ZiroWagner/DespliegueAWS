#!/bin/sh

# Crear archivo .env.production dinámicamente
echo "NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}" > /app/.env.production

echo "Usando NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}"

# Iniciar Next.js standalone server
exec node server.js
