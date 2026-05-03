FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache python3 make g++ linux-headers eudev-dev

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
ARG VITE_BASE_PATH=/
ARG VITE_API_BASE_URL=http://localhost:8081
ENV VITE_BASE_PATH=$VITE_BASE_PATH
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1/ || exit 1
