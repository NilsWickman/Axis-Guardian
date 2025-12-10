# Build stage
FROM node:22-alpine AS build
WORKDIR /app

# Install build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

RUN corepack enable

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (including dev for tsx)
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Production stage
FROM node:22-alpine
WORKDIR /app

# Runtime dependencies for better-sqlite3
RUN apk add --no-cache sqlite

RUN corepack enable

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (tsx needed for runtime)
RUN pnpm install --frozen-lockfile

# Copy source from build stage
COPY --from=build /app/src ./src

# Create data directory for SQLite
RUN mkdir -p data

# Environment variables
ENV NODE_ENV=production
ENV PORT=3010
ENV HOST=0.0.0.0
ENV READ_ONLY_MODE=false

EXPOSE 3010

CMD ["npx", "tsx", "src/index.ts"]
