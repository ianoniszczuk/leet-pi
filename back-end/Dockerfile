FROM node:22-alpine

WORKDIR /app

# Copiar manifiestos e instalar dependencias
COPY package*.json ./
RUN npm install

# Copiar el código fuente
COPY . .

EXPOSE 3001

# Por defecto arranca en modo dev con tsx
CMD ["npx", "tsx", "src/index.ts"]
