# Guía de Despliegue en AWS Free Tier

Esta guía detalla paso a paso cómo desplegar tu aplicación de gestión de tareas (NestJS + Next.js + PostgreSQL + S3) en AWS utilizando la capa gratuita (Free Tier).

## 1. Arquitectura y Prerrequisitos

### Arquitectura Propuesta
El despliegue utilizará los siguientes servicios de AWS:
- **EC2 (Elastic Compute Cloud)**:
  - 2 instancias `t2.micro` para el Frontend (Next.js) detrás de un balanceador de carga.
  - 1 instancia `t2.micro` para el Backend (NestJS).
- **ALB (Application Load Balancer)**: Distribuye el tráfico entre las instancias del frontend.
- **RDS (Relational Database Service)**: 1 instancia `db.t3.micro` o `db.t4g.micro` con PostgreSQL.
- **S3 (Simple Storage Service)**: Bucket para almacenamiento de archivos.
- **ECR (Elastic Container Registry)**: Repositorios privados para almacenar las imágenes Docker.
- **GitHub Actions**: Para CI/CD (construcción y despliegue automático).

### Prerrequisitos
Asegúrate de tener instalado y configurado:
1. **Cuenta de AWS**: Con acceso a la consola y credenciales de acceso programático.
2. **AWS CLI**: Instalado y configurado localmente (`aws configure`).
3. **Docker Desktop**: Para pruebas locales y construcción de imágenes.
4. **Git**: Para control de versiones.
5. **Node.js**: Versión LTS recomendada.

---

## 2. Contenedorización

Prepararemos las aplicaciones para ejecutarse en contenedores Docker.

### 2.1 Backend (NestJS)

**Paso previo importante**: Modifica tu archivo `tm_backend/prisma/schema.prisma` para incluir los `binaryTargets` necesarios para Linux Alpine:

```prisma
generator client {
  provider = "prisma-client-js"
  binaryTargets = ["native", "linux-musl-openssl-3.0.x"]
}
```

Crea un archivo llamado `Dockerfile` en la raíz de `tm_backend`:

```dockerfile
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
```

### 2.2 Frontend (Next.js)

Crea un archivo llamado `Dockerfile` en la raíz de `tm_frontend`.
**Nota**: Asegúrate de configurar `output: 'standalone'` en tu `next.config.ts` (o .js) para optimizar la imagen.

```dockerfile
# Etapa de dependencias
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Etapa de construcción
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Deshabilita telemetría durante build
ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Etapa de producción
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copia solo los archivos necesarios del modo standalone
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

### 2.3 Docker Compose (Desarrollo Local)

Crea un archivo `docker-compose.yml` en la raíz de tu proyecto (carpeta padre `DespliegueAWS`) para orquestar todo localmente.

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: taskdb
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./tm_backend
    ports:
      - "3001:3000"
    environment:
      DATABASE_URL: "postgresql://user:password@postgres:5432/taskdb?schema=public"
      AWS_REGION: "us-east-1"
      AWS_ACCESS_KEY_ID: "test" # Solo para local
      AWS_SECRET_ACCESS_KEY: "test" # Solo para local
      AWS_BUCKET_NAME: "test-bucket"
    depends_on:
      - postgres

  frontend:
    build: ./tm_frontend
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: "http://localhost:3001"
    depends_on:
      - backend

volumes:
  postgres_data:
```

---

## 3. Infraestructura AWS (Capa de Datos y Red)

Sigue estos pasos en la consola de AWS.

### 3.1 Red y Seguridad
1. **VPC**: Puedes usar la VPC por defecto (`default`) para simplificar.
2. **Security Groups (SG)**:
   - **SG-ALB**: Permite entrada HTTP (80) desde `0.0.0.0/0`.
   - **SG-Frontend**: Permite entrada TCP (3000) desde **SG-ALB**.
   - **SG-Backend**: Permite entrada TCP (3000) desde **SG-Frontend**.
   - **SG-RDS**: Permite entrada TCP (5432) desde **SG-Backend**.

### 3.2 Base de Datos (RDS)
1. Ve a **RDS** -> **Create database**.
2. Selecciona **PostgreSQL** y la versión (ej. 16.x).
3. En **Templates**, elige **Free tier**.
4. **Settings**:
   - DB instance identifier: `task-db`
   - Master username: `postgres`
   - Master password: Crea una contraseña segura.
5. **Instance configuration**: `db.t3.micro` o `db.t4g.micro`.
6. **Connectivity**:
   - Public access: **No**.
   - VPC Security Group: Selecciona **SG-RDS**.
7. Crea la base de datos y anota el **Endpoint** cuando esté disponible.

### 3.3 Almacenamiento (S3)
1. Ve a **S3** -> **Create bucket**.
2. Nombre único: ej. `mi-task-app-storage-123`.
3. **Block Public Access**: Mantenlo activado (Bloquear todo) por seguridad. Usaremos credenciales de IAM para acceder.
4. Crea el bucket.

### 3.4 Repositorios ECR
1. Ve a **ECR** -> **Create repository**.
2. Crea uno llamado `tm-frontend` (Visibilidad: Private).
3. Crea otro llamado `tm-backend` (Visibilidad: Private).
4. Anota las URIs (ej. `123456789012.dkr.ecr.us-east-1.amazonaws.com/tm-backend`).

---

## 4. CI/CD con GitHub Actions

Configuraremos GitHub Actions para construir y subir las imágenes automáticamente.

### 4.1 Secretos en GitHub
En tu repositorio de GitHub, ve a **Settings** -> **Secrets and variables** -> **Actions** y agrega:
- `AWS_ACCESS_KEY_ID`: Tu Access Key.
- `AWS_SECRET_ACCESS_KEY`: Tu Secret Key.
- `AWS_REGION`: Tu región (ej. `us-east-1`).
- `ECR_REPOSITORY_FRONTEND`: Nombre del repo frontend (ej. `tm-frontend`).
- `ECR_REPOSITORY_BACKEND`: Nombre del repo backend (ej. `tm-backend`).

### 4.2 Workflow
Crea el archivo `.github/workflows/deploy.yml`:

```yaml
name: Build and Push to ECR

on:
  push:
    branches: [ "main" ]

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout code
      uses: actions/checkout@v3

    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v1
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-east-1

    - name: Login to Amazon ECR
      id: login-ecr
      uses: aws-actions/amazon-ecr-login@v1

    - name: Build, tag, and push Backend image
      env:
        ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        ECR_REPOSITORY: ${{ secrets.ECR_REPOSITORY_BACKEND }}
        IMAGE_TAG: latest
      run: |
        docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG ./tm_backend
        docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG

    - name: Build, tag, and push Frontend image
      env:
        ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        ECR_REPOSITORY: ${{ secrets.ECR_REPOSITORY_FRONTEND }}
        IMAGE_TAG: latest
      run: |
        docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG ./tm_frontend
        docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
```

---

## 5. Infraestructura de Cómputo (EC2)

Lanzaremos las instancias EC2 y configuraremos el balanceador de carga.

### 5.1 Roles IAM
Antes de crear las instancias, crea un rol IAM para permitir que EC2 acceda a ECR y S3.
1. Ve a **IAM** -> **Roles** -> **Create role**.
2. Trusted entity type: **AWS service** -> **EC2**.
3. Permissions policies:
   - `AmazonEC2ContainerRegistryReadOnly` (para descargar imágenes).
   - `AmazonS3FullAccess` (o una política más restrictiva para tu bucket).
4. Name: `EC2-App-Role`.

### 5.2 User Data Scripts
Prepara estos scripts para automatizar la instalación al iniciar las instancias. Reemplaza `<REGION>` y `<ECR_URI>` con tus valores.

**Script Backend (user-data-backend.sh)**:
```bash
#!/bin/bash
yum update -y
yum install -y docker
service docker start
usermod -a -G docker ec2-user

# Login ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 752651455582.dkr.ecr.us-east-1.amazonaws.com

# Run Backend
docker run -d -p 3000:3000 \
  -e DATABASE_URL="postgresql://postgres:adminpostgres@task-db.chsn7cq8j8gq.us-east-1.rds.amazonaws.com:5432/taskdb?schema=public" \
  -e AWS_REGION="us-east-1" \
  -e AWS_BUCKET_NAME="mi-task-app-storage-123" \
  752651455582.dkr.ecr.us-east-1.amazonaws.com/tm-backend:latest
```

**Script Frontend (user-data-frontend.sh)**:
```bash
#!/bin/bash
yum update -y
yum install -y docker
service docker start
usermod -a -G docker ec2-user

# Login ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 752651455582.dkr.ecr.us-east-1.amazonaws.com

# Run Frontend
docker run -d -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL="http://172.31.23.153:3000" \
  752651455582.dkr.ecr.us-east-1.amazonaws.com/tm-frontend:latest
```

### 5.3 Lanzar Instancias
1. **Backend**:
   - Launch Instance -> Name: `Backend-App`.
   - AMI: Amazon Linux 2023.
   - Instance Type: `t2.micro`.
   - Key Pair: Crea o selecciona uno.
   - Network settings: Selecciona **SG-Backend**.
   - Advanced details -> IAM instance profile: `EC2-App-Role`.
   - Advanced details -> User data: Pega el contenido de `user-data-backend.sh` (con tus valores reales).
   - Lanza la instancia y anota su **Private IP**.

2. **Frontend** (Repite 2 veces):
   - Launch Instance -> Name: `Frontend-App-1` (y luego `Frontend-App-2`).
   - AMI: Amazon Linux 2023.
   - Instance Type: `t2.micro`.
   - Network settings: Selecciona **SG-Frontend**.
   - Advanced details -> IAM instance profile: `EC2-App-Role`.
   - Advanced details -> User data: Pega el contenido de `user-data-frontend.sh` (actualiza `NEXT_PUBLIC_API_URL` con la IP privada del Backend).

### 5.4 Load Balancer (ALB)
1. Ve a **EC2** -> **Load Balancers** -> **Create load balancer**.
2. Type: **Application Load Balancer**.
3. Name: `my-app-alb`.
4. Scheme: **Internet-facing**.
5. Network mapping: Selecciona tu VPC y al menos 2 subnets en diferentes zonas.
6. Security groups: Selecciona **SG-ALB**.
7. Listeners and routing:
   - Protocol: HTTP Port 80.
   - Default action: Create target group.
     - Target type: **Instances**.
     - Name: `frontend-targets`.
     - Protocol: HTTP Port 3000 (El puerto donde corre tu contenedor).
     - Health check path: `/` (o `/api/health` si tienes).
     - Register targets: Selecciona tus 2 instancias Frontend.
8. Crea el ALB.

---

## 6. Verificación y Finalización

1. Espera a que el estado del ALB sea **Active**.
2. Copia el **DNS name** del ALB (ej. `my-app-alb-12345.us-east-1.elb.amazonaws.com`).
3. Abre esa URL en tu navegador. Deberías ver tu aplicación Frontend.
4. Intenta crear una tarea. El Frontend se comunicará con el Backend (vía IP privada), el cual guardará datos en RDS y archivos en S3.

### Troubleshooting
- **Error 502 Bad Gateway**: Revisa si los contenedores en las instancias Frontend están corriendo (`docker ps`). Revisa los logs (`docker logs <container_id>`).
- **Error de conexión a DB**: Verifica que el Security Group de RDS permita tráfico desde el Security Group del Backend.
- **Error de S3**: Verifica que el rol IAM tenga permisos y que el nombre del bucket sea correcto.
