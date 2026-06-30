# 1. Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# AJOUT : Mise à jour de sécurité pour corriger les failles de l'image de base Alpine
RUN apk update && apk upgrade

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# 2. Production stage
FROM node:20-alpine

WORKDIR /app

# AJOUT : Également sur l'image finale de production pour garantir un environnement sain
RUN apk update && apk upgrade

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY prisma ./prisma

EXPOSE 3000

CMD ["npm", "run", "start:prod"]