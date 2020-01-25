FROM node:12.13.0-alpine as build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY . /app
RUN npm run ng -- build --prod --output-path ./dist/out

FROM nginx:1.17.5-alpine
COPY --from=build /app/dist/out /usr/share/nginx/html
COPY --from=build /app/nginx.conf /etc/nginx/conf.d/default.conf