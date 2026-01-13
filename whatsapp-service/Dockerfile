FROM node:20-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar git (necesario para algunas dependencias)
RUN apk add --no-cache git

# Instalar dependencias
RUN npm install

# Copiar código fuente
COPY . .

# Crear directorio para auth
RUN mkdir -p auth_info

# Exponer puerto
EXPOSE 3005

# Comando de inicio
CMD ["npm", "start"]
