# Etapa 1: Construcción (Build) con Node.js
FROM node:20-alpine AS build
WORKDIR /app

# Copiar package.json y package-lock.json (si existe)
COPY package*.json ./
RUN npm install

# Copiar el resto del código de la aplicación Angular
COPY . .

# Compilar Angular en modo producción usando esbuild
RUN npm run build -- --configuration=production

# Etapa 2: Servidor Web Ligero con Nginx
FROM nginx:alpine AS final

# Copiar la configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar los artefactos compilados de Angular al directorio raíz de Nginx
COPY --from=build /app/dist/kumamoto-web/browser /usr/share/nginx/html

# Exponer el puerto 80 para la web
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
