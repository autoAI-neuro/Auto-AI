FROM node:20-alpine

# Instalar Git (necesario para algunas dependencias) y dependencias de sistema mínimas
RUN apk add --no-cache git

WORKDIR /app

# Copiar archivos de dependencia
COPY package*.json ./

# Instalar dependencias (usando ci para builds reproducibles)
RUN npm install

# Crear directorios para sesiones
RUN mkdir -p auth_info

# Copiar el resto del código
COPY . .

# Exponer puertos posibles (Railway usará el que necesite)
EXPOSE 3005
EXPOSE 8080
EXPOSE 3000

# Comando de inicio
CMD ["npm", "start"]
