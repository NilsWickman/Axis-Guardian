# Build stage
FROM node:22-alpine AS build
WORKDIR /app

# Install build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

RUN corepack enable

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (including dev for build)
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build TypeScript
RUN pnpm build

# Production stage
FROM node:22-alpine
WORKDIR /app

# Runtime dependencies for better-sqlite3
RUN apk add --no-cache sqlite

RUN corepack enable

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built output from build stage
COPY --from=build /app/dist ./dist

# Create data directory for SQLite
RUN mkdir -p data

# Environment variables
ENV NODE_ENV=production
ENV PORT=3010
ENV HOST=0.0.0.0
ENV READ_ONLY_MODE=false

EXPOSE 3010

CMD ["node", "dist/index.js"]
