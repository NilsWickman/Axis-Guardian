# Build stage
FROM node:22-alpine AS build
WORKDIR /app

RUN corepack enable

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build args for Vite (injected at build time)
ARG VITE_TRACKING_WS_URL
ARG VITE_TRACKING_API_URL
ARG VITE_DEMO_MODE=true

ENV VITE_TRACKING_WS_URL=$VITE_TRACKING_WS_URL
ENV VITE_TRACKING_API_URL=$VITE_TRACKING_API_URL
ENV VITE_DEMO_MODE=$VITE_DEMO_MODE

# Build production bundle
RUN pnpm build

# Production stage - nginx for static files
FROM nginx:alpine

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
