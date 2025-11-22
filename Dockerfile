FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock ./
COPY packages/database-client/package.json packages/database-client/
RUN yarn install --frozen-lockfile

COPY . .

ARG VITE_POSTGREST_URL
ENV VITE_POSTGREST_URL=$VITE_POSTGREST_URL

RUN yarn build

FROM nginx:alpine

COPY --from=builder /app/build/client /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
