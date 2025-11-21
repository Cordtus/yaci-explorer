# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./
COPY packages/database-client/package.json ./packages/database-client/

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source
COPY . .

# Build database-client first
RUN yarn workspace @yaci/database-client build

# Build frontend with production API URL
ARG VITE_POSTGREST_URL
ENV VITE_POSTGREST_URL=$VITE_POSTGREST_URL
RUN yarn build

# Production stage
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/build/client /usr/share/nginx/html

# Copy nginx config for SPA routing
COPY deploy/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
