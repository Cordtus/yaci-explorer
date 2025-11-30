# Build stage
FROM oven/bun:1.2 AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build the application with /api as the PostgREST URL
ENV VITE_POSTGREST_URL=/api
RUN bun run build

# Production stage
FROM nginx:alpine

# Copy custom nginx config
COPY docker/explorer/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application from dist (not build/client)
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
