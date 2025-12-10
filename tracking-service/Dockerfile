# Build stage
FROM node:22-alpine AS build
WORKDIR /app

# Install build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

RUN corepack enable

# Copy workspace files from root context
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tracking-service/package.json ./tracking-service/

# Install dependencies
WORKDIR /app/tracking-service
RUN pnpm install --frozen-lockfile

# Copy source
COPY tracking-service/src ./src

# Production stage
FROM node:22-alpine
WORKDIR /app

# Runtime dependencies for better-sqlite3
RUN apk add --no-cache sqlite

RUN corepack enable

# Copy workspace files
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tracking-service/package.json ./tracking-service/

WORKDIR /app/tracking-service
RUN pnpm install --frozen-lockfile

# Copy source from build stage
COPY --from=build /app/tracking-service/src ./src

# Create data directory for SQLite
RUN mkdir -p data

# Environment variables
ENV NODE_ENV=production
ENV PORT=3010
ENV HOST=0.0.0.0
ENV READ_ONLY_MODE=false

EXPOSE 3010

CMD ["npx", "tsx", "src/index.ts"]
