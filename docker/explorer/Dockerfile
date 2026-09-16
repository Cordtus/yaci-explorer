# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies
RUN corepack enable && corepack prepare yarn@1.22.22 --activate && yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build the application with /api as the PostgREST URL
# This ensures the built JS uses relative URLs that work with the nginx proxy
ENV PUBLIC_POSTGREST_URL=/api
RUN bun run build

# Production stage
FROM nginx:alpine

# Copy custom nginx config
COPY docker/explorer/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application
COPY --from=builder /app/build/client /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
