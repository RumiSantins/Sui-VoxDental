# Etapa 1: Compilación
FROM node:18-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Etapa 2: Servidor Web
FROM nginx:alpine

# Copiar la configuración que soporta React Router y Proxy Inverso
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar la aplicación estática construida
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
