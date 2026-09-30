# Dockerfile
FROM node:22-alpine

RUN apk add --no-cache docker-cli

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .
RUN GENERATE_OPENAPI=true npm run build

EXPOSE 3009
CMD ["node", "dist/main.js"]