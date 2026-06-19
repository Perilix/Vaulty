# syntax=docker/dockerfile:1
# ---- Build Angular ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- Runtime nginx (sert le front + proxy /api vers le backend) ----
FROM nginx:alpine
# Le template est transformé par envsubst au démarrage (mécanisme officiel nginx)
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
# Script sourcé avant la substitution : expose $RESOLVER (DNS du conteneur).
# Doit être exécutable, sinon l'entrypoint nginx l'ignore.
COPY --chmod=0755 resolver.envsh /docker-entrypoint.d/19-resolver.envsh
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
# Valeurs par défaut (surchargées en prod : Render injecte PORT, BACKEND_HOSTPORT via render.yaml)
ENV PORT=8080
ENV BACKEND_HOSTPORT=backend:3000
EXPOSE 8080
