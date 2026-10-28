# Imagen de BellaStyle Manager (backend Express + páginas del frontend)
# 1. Imagen base: Node.js 20 en Linux Alpine (liviana)
FROM node:20-alpine

# 2. Carpeta de trabajo dentro del contenedor
WORKDIR /app

# 3. Primero solo package.json: así Docker reutiliza las dependencias
#    instaladas si el código cambia pero las dependencias no
COPY backend/package*.json backend/
RUN cd backend && npm ci --omit=dev

# 4. Se copia el resto del código (lo de .dockerignore no entra)
COPY backend/ backend/
COPY frontend/ frontend/
COPY init_db.sql ./

# 5. Variables por defecto (Render las reemplaza con las suyas)
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# 6. Comando que arranca el servidor
WORKDIR /app/backend
CMD ["node", "app.js"]
