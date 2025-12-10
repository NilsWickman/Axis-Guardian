# Build stage
FROM node:22-alpine AS build
WORKDIR /app

# mediasoup requires build tools
RUN apk add --no-cache python3 make g++ linux-headers

RUN corepack enable

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build TypeScript
RUN pnpm build

# Production stage
FROM node:22-alpine
WORKDIR /app

# Runtime dependencies: FFmpeg for video streaming
RUN apk add --no-cache ffmpeg python3

RUN corepack enable

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Copy node_modules from build (includes compiled mediasoup)
COPY --from=build /app/node_modules ./node_modules

# Copy built output
COPY --from=build /app/dist ./dist

# Create videos directory
RUN mkdir -p /app/videos

# Copy video files from shared folder (at build context root)
# Note: Build context should be project root to access shared/
COPY shared/cameras/preprocessed/1080p/view-HC3-preprocessed.mp4 /app/videos/
COPY shared/cameras/preprocessed/1080p/view-HC3-preprocessed.detections.json.gz /app/videos/
COPY shared/cameras/preprocessed/1080p/view-HC4-preprocessed.mp4 /app/videos/
COPY shared/cameras/preprocessed/1080p/view-HC4-preprocessed.detections.json.gz /app/videos/

# Environment variables
ENV NODE_ENV=production
ENV TRACKING_SERVICE_URL=http://tracking-service:3010
ENV VIDEO_PATH=/app/videos
ENV ANNOUNCED_IP=127.0.0.1

# WebRTC signaling ports
EXPOSE 9101 9102

# WebRTC media UDP ports
EXPOSE 10000-10100/udp

CMD ["node", "dist/index.js"]
