# Lightweight WhatsApp Service (Baileys)
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install git (required for some npm packages)
RUN apk add --no-cache git

# Install dependencies (pure Node.js, no system libs needed)
RUN npm install

# Copy app code
COPY . .

# Expose port (Railway sets PORT env var)
EXPOSE 3005

# Start server
CMD ["node", "server.js"]
