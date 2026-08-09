FROM node:22-alpine AS build
ARG APP_PATH
WORKDIR /app
COPY ${APP_PATH}/package.json ${APP_PATH}/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY ${APP_PATH}/ ./
RUN npm run build

FROM nginxinc/nginx-unprivileged:1.27-alpine
COPY infra/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/client /usr/share/nginx/html
EXPOSE 8080

