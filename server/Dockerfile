FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build:prod

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist
COPY .env.production ./

ENV NODE_ENV=production
ENV PORT=5002

EXPOSE 5002
USER node
CMD ["node", "dist/index.js"]