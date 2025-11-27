FROM oven/bun:1 AS builder

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Cache bust on every build
ARG CACHEBUST=1

COPY . .

ARG VITE_POSTGREST_URL
ARG VITE_CHAIN_REST_ENDPOINT
ENV VITE_POSTGREST_URL=$VITE_POSTGREST_URL
ENV VITE_CHAIN_REST_ENDPOINT=$VITE_CHAIN_REST_ENDPOINT

RUN bun run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
