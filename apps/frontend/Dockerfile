FROM node:26-alpine

# Security Hardening: user creation
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --production

COPY server.js .

# Troca o ownership para o appuser
RUN chown -R appuser:appgroup /usr/src/app

# Drop root privileges
USER appuser

EXPOSE 3000

CMD ["npm", "start"]
