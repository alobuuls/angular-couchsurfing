# syntax=docker/dockerfile:1

FROM node:20.20.2-alpine AS build

WORKDIR /docker-cs-app

COPY package*.json ./

RUN --mount=type=cache,target=/root/.npm \
    npm ci --ignore-scripts

COPY . .

RUN --mount=type=secret,id=env,target=/docker-cs-app/.env \
    npm run build:prod

FROM nginx:1.29.2-alpine3.22 AS production

RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build \
    /docker-cs-app/dist/couchsurfing-app \
    /usr/share/nginx/html

RUN chown -R nginx:nginx /usr/share/nginx/html \
    && chown -R nginx:nginx /var/cache/nginx \
    && chown -R nginx:nginx /var/log/nginx \
    && touch /var/run/nginx.pid \
    && chown nginx:nginx /var/run/nginx.pid

USER nginx

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
