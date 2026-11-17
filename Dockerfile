# syntax=docker/dockerfile:1
FROM node:26-alpine AS build
WORKDIR /workspace
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginxinc/nginx-unprivileged:stable-alpine
COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY docker/40-config-js.sh /docker-entrypoint.d/40-config-js.sh
COPY --from=build --chown=101:101 /workspace/dist /usr/share/nginx/html
ENV EDGE_GATEWAY_URL=http://edge-gateway:8080
EXPOSE 8080
