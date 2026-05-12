# Build Stage
FROM node:26-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig.json ./
RUN npm install

COPY src/ ./src/
RUN npm run build

# Production Stage
FROM node:26-alpine

# Security Hardening
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --production

# Copia apenas o JavaScript compilado
COPY --from=builder /usr/src/app/dist ./dist

RUN chown -R appuser:appgroup /usr/src/app

USER appuser

CMD ["npm", "start"]
