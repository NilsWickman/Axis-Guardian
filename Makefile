# Surveillance System - Development Makefile
# ==========================================
#
# Supports the frontend-first workflow:
# 1. Frontend developed with mock data for elicitation
# 2. API contracts defined based on frontend needs
# 3. Backend services implement contracts

# Colors for output
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[0;33m
BLUE := \033[0;34m
NC := \033[0m # No Color

.PHONY: help
help: ## Show this help message
	@echo "$(BLUE)Surveillance System - Development Commands$(NC)"
	@echo "============================================"
	@echo ""
	@echo "$(YELLOW)Available commands:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}'

.PHONY: setup
setup: ## Install dependencies and initialize database
	@echo "$(BLUE)Setting up development environment...$(NC)"
	@echo ""
	@echo "$(YELLOW)Installing npm workspaces...$(NC)"
	npm install
	@echo ""
	@echo "$(YELLOW)Setting up Python virtual environments...$(NC)"
	@for dir in backend/python/*/; do \
		if [ -f "$$dir/requirements.txt" ]; then \
			echo "$(BLUE)Setting up $$dir$(NC)"; \
			cd "$$dir" && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt && cd -; \
		fi \
	done
	@echo ""
	@$(MAKE) database
	@echo ""
	@$(MAKE) mock-videos
	@echo ""
	@echo "$(GREEN)✓ Setup complete!$(NC)"
	@echo ""
	@echo "$(YELLOW)Next steps:$(NC)"
	@echo "  1. Start frontend: make dev"
	@echo "  2. Define API contracts in shared/schemas/"
	@echo "  3. Generate types: make api-contract"

.PHONY: database
database: ## Setup database (stops existing, starts fresh, applies migrations, seeds data)
	@echo "$(BLUE)Setting up database...$(NC)"
	@echo "$(YELLOW)Stopping existing containers...$(NC)"
	@docker compose -f infrastructure/docker-compose/docker-compose.dev.yml down -v 2>/dev/null || true
	@echo "$(YELLOW)Starting fresh database containers...$(NC)"
	@docker compose -f infrastructure/docker-compose/docker-compose.dev.yml up -d
	@echo "$(YELLOW)Waiting for PostgreSQL to be ready...$(NC)"
	@sleep 5
	@echo "$(YELLOW)Running migrations...$(NC)"
	@if [ -d "database/migrations" ] && [ -n "$$(ls -A database/migrations 2>/dev/null)" ]; then \
		echo "  Migrations found, applying..."; \
	else \
		echo "  No migrations found yet"; \
	fi
	@echo "$(YELLOW)Seeding data...$(NC)"
	@if [ -d "database/seeds" ] && [ -n "$$(ls -A database/seeds 2>/dev/null)" ]; then \
		echo "  Seeds found, applying..."; \
	else \
		echo "  No seeds found yet"; \
	fi
	@echo ""
	@echo "$(GREEN)✓ Database ready$(NC)"
	@echo ""
	@echo "$(YELLOW)Services:$(NC)"
	@echo "  PostgreSQL:  localhost:5433"
	@echo "  MQTT:        localhost:1883"
	@echo "  MinIO:       localhost:9000 (console: localhost:9090)"
	@echo "  MediaMTX:    rtsp://localhost:8554 (WebRTC: localhost:8889, HLS: localhost:8888)"

.PHONY: mock-videos
mock-videos: ## Prepare mock videos (copy from shared/mock/camera-feeds and convert AVI to MP4)
	@echo "$(BLUE)Preparing mock videos...$(NC)"
	@echo "$(YELLOW)Copying videos from shared/mock/camera-feeds/ to mock-server/videos/...$(NC)"
	@mkdir -p frontend/mock-server/videos
	@cp shared/mock/camera-feeds/* frontend/mock-server/videos/ 2>/dev/null || true
	@echo "$(YELLOW)Converting AVI files to MP4...$(NC)"
	@cd frontend/mock-server && node convert-videos.js 2>/dev/null || echo "$(YELLOW)  No AVI files to convert$(NC)"
	@echo "$(GREEN)✓ Mock videos ready$(NC)"

.PHONY: dev
dev: mock-videos cleanup-ports ## Start complete surveillance system (frontend + cameras + WebRTC detection)
	@echo "$(BLUE)Starting complete surveillance system...$(NC)"
	@echo "$(YELLOW)Starting services:$(NC)"
	@echo "  Frontend:          http://localhost:5173"
	@echo "  Mock Server:       http://localhost:8000"
	@echo "  Cameras:           rtsp://localhost:8554/camera{1,2,3}"
	@echo "  HLS Streams:       http://localhost:8888/camera{1,2,3}"
	@echo "  WebRTC Detection:  http://localhost:8080 (signaling + data channels)"
	@echo ""
	@echo "$(YELLOW)Note: All services start automatically in parallel$(NC)"
	@echo "$(YELLOW)Access WebRTC Detection view at: http://localhost:5173/webrtc-detection$(NC)"
	@echo ""
	@npm run dev

.PHONY: cleanup-ports
cleanup-ports: ## Kill processes on development ports (5173, 8000, 8080)
	@echo "$(YELLOW)Cleaning up ports...$(NC)"
	@fuser -k 5173/tcp 2>/dev/null || true
	@fuser -k 8000/tcp 2>/dev/null || true
	@fuser -k 8080/tcp 2>/dev/null || true
	@sleep 1

.PHONY: dev-all
dev-all: ## Start all development servers (frontend + all backend services)
	@echo "$(BLUE)Starting all development servers...$(NC)"
	@echo "$(YELLOW)Ensure database is running: make database$(NC)"
	@echo ""
	@npm run dev

.PHONY: api-contract
api-contract: ## Validate API contracts and generate types/clients (OpenAPI + AsyncAPI → TS + Python)
	@echo "$(BLUE)Processing API contracts...$(NC)"
	@if [ -d "shared/schemas" ] && [ -n "$$(ls -A shared/schemas/*.yaml 2>/dev/null || ls -A shared/schemas/*.yml 2>/dev/null || ls -A shared/schemas/*.json 2>/dev/null)" ]; then \
		echo "$(YELLOW)Validating OpenAPI schemas...$(NC)"; \
		npm run validate:schemas || true; \
		echo ""; \
		echo "$(YELLOW)Generating types and clients (REST + WebSocket)...$(NC)"; \
		npm run generate:all; \
	else \
		echo "$(YELLOW)⚠ No API schemas found in shared/schemas/$(NC)"; \
		echo "$(YELLOW)Add OpenAPI/AsyncAPI specs to shared/schemas/ directory$(NC)"; \
		echo "$(YELLOW)Example: shared/schemas/auth-service.openapi.yaml$(NC)"; \
		exit 1; \
	fi
	@echo ""
	@echo "$(GREEN)✓ API contracts processed$(NC)"
	@echo ""
	@echo "$(YELLOW)Generated files:$(NC)"
	@echo "  TypeScript:"
	@echo "    - shared/types/generated/*.types.ts (REST API types)"
	@echo "    - shared/clients/typescript/*/ (REST clients)"
	@echo "    - shared/clients/typescript/websocket/*.ts (WebSocket clients)"
	@echo "    - frontend/src/types/generated/*.types.ts"
	@echo "    - frontend/src/api/generated/*/"
	@echo "    - frontend/src/api/websocket/*.ts"
	@echo "  Python:"
	@echo "    - shared/types/python/*_models.py (Pydantic models)"
	@echo "    - shared/clients/python/*/ (REST clients)"
	@echo "    - shared/clients/python/websocket/*_client.py (WebSocket clients)"

.PHONY: quality
quality: ## Check code quality (formatting and linting)
	@echo "$(BLUE)Checking code quality...$(NC)"
	@echo ""
	@echo "$(YELLOW)Checking formatting...$(NC)"
	@npm run format:check --workspaces --if-present || echo "$(YELLOW)No format:check script defined yet$(NC)"
	@echo ""
	@echo "$(YELLOW)Running linters...$(NC)"
	@npm run lint --workspaces --if-present || echo "$(YELLOW)No lint script defined yet$(NC)"
	@echo ""
	@echo "$(GREEN)✓ Quality checks complete$(NC)"

.PHONY: build
build: ## Build all compilable services
	@echo "$(BLUE)Building all services...$(NC)"
	@echo ""
	@echo "$(YELLOW)Building TypeScript services and frontend...$(NC)"
	@npm run build --workspaces --if-present
	@echo ""
	@echo "$(GREEN)✓ Build complete$(NC)"

.PHONY: cameras
cameras: ## Stream mock camera feeds to MediaMTX (requires FFmpeg)
	@echo "$(BLUE)Starting mock camera streams...$(NC)"
	@if ! which ffmpeg > /dev/null 2>&1; then \
		echo "$(RED)Error: FFmpeg is not installed$(NC)"; \
		echo "$(YELLOW)Install with: sudo apt-get install ffmpeg$(NC)"; \
		exit 1; \
	fi
	@echo "$(YELLOW)Available cameras:$(NC)"
	@echo "  camera1 - People detection video (people-detection.mp4)"
	@echo "  camera2 - Car detection video (car-detection.mp4)"
	@echo "  camera3 - Mixed detection video (person-bicycle-car-detection.mp4)"
	@echo ""
	@echo "$(YELLOW)Stream URLs:$(NC)"
	@echo "  RTSP:   rtsp://localhost:8554/camera{1,2,3}"
	@echo "  HLS:    http://localhost:8888/camera{1,2,3}"
	@echo "  WebRTC: http://localhost:8889/camera{1,2,3}"
	@echo ""
	@bash infrastructure/scripts/stream-mock-cameras.sh all

.PHONY: cameras-persistent
cameras-persistent: ## Stream cameras continuously with auto-restart (production mode)
	@echo "$(BLUE)Starting persistent camera streams...$(NC)"
	@if ! which ffmpeg > /dev/null 2>&1; then \
		echo "$(RED)Error: FFmpeg is not installed$(NC)"; \
		echo "$(YELLOW)Install with: sudo apt-get install ffmpeg$(NC)"; \
		exit 1; \
	fi
	@echo "$(YELLOW)Features:$(NC)"
	@echo "  • Infinite video looping"
	@echo "  • Auto-restart on failure"
	@echo "  • Restart statistics tracking"
	@echo ""
	@echo "$(YELLOW)Stream URLs:$(NC)"
	@echo "  RTSP:   rtsp://localhost:8554/camera1"
	@echo "  HLS:    http://localhost:8888/camera1"
	@echo "  WebRTC: http://localhost:8889/camera1"
	@echo ""
	@bash infrastructure/scripts/stream-cameras-persistent.sh all

.PHONY: camera-status
camera-status: ## Check MediaMTX status and active streams
	@echo "$(BLUE)MediaMTX Status$(NC)"
	@echo ""
	@if curl -s http://localhost:9997/v3/config/global/get > /dev/null 2>&1; then \
		echo "$(GREEN)✓ MediaMTX is running$(NC)"; \
		echo ""; \
		echo "$(YELLOW)Active streams:$(NC)"; \
		curl -s http://localhost:9997/v3/paths/list | grep -o '"name":"[^"]*"' | cut -d'"' -f4 | while read path; do \
			echo "  - $$path"; \
		done || echo "  No active streams"; \
		echo ""; \
		echo "$(YELLOW)Endpoints:$(NC)"; \
		echo "  RTSP:   rtsp://localhost:8554/<stream_name>"; \
		echo "  HLS:    http://localhost:8888/<stream_name>"; \
		echo "  WebRTC: http://localhost:8889/<stream_name>"; \
		echo "  API:    http://localhost:9997/v3/"; \
	else \
		echo "$(RED)✗ MediaMTX is not running$(NC)"; \
		echo "$(YELLOW)Start with: make database$(NC)"; \
	fi

.PHONY: detect-install
detect-install: ## Install object detection service dependencies
	@echo "$(BLUE)Installing object detection service dependencies...$(NC)"
	@cd backend/python/object-detection-service && \
		if [ ! -d "venv" ]; then \
			echo "$(YELLOW)Creating virtual environment...$(NC)"; \
			python3 -m venv venv; \
		fi && \
		echo "$(YELLOW)Installing dependencies...$(NC)" && \
		. venv/bin/activate && \
		pip install -r requirements.txt && \
		echo "" && \
		echo "$(GREEN)✓ Dependencies installed$(NC)"

.PHONY: detect
detect: ## Run object detection service with camera streams
	@echo "$(BLUE)Starting Object Detection Service$(NC)"
	@echo ""
	@if ! docker ps | grep -q mosquitto; then \
		echo "$(RED)Error: MQTT broker not running$(NC)"; \
		echo "$(YELLOW)Start with: make database$(NC)"; \
		exit 1; \
	fi
	@if ! curl -s http://localhost:9997/v3/config/global/get > /dev/null 2>&1; then \
		echo "$(RED)Error: MediaMTX not running$(NC)"; \
		echo "$(YELLOW)Start with: make database$(NC)"; \
		exit 1; \
	fi
	@echo "$(YELLOW)Checking for active camera streams...$(NC)"
	@stream_count=$$(curl -s http://localhost:9997/v3/paths/list | grep -o '"name":"camera[0-9]"' | wc -l); \
	if [ "$$stream_count" -eq 0 ]; then \
		echo "$(YELLOW)⚠ No camera streams detected. Start cameras in another terminal:$(NC)"; \
		echo "  make cameras"; \
		echo ""; \
	fi
	@echo "$(YELLOW)Services:$(NC)"
	@echo "  MQTT Broker:     localhost:1883"
	@echo "  Camera Streams:  rtsp://localhost:8554/camera1, camera2"
	@echo "  Detection Topic: surveillance/detections/#"
	@echo ""
	@echo "$(YELLOW)View detections:$(NC)"
	@echo "  make detect-viewer    (or open http://localhost:8080/detection-viewer.html)"
	@echo ""
	@cd backend/python/object-detection-service && \
		if [ ! -f ".env" ]; then \
			echo "$(YELLOW)Creating .env file...$(NC)"; \
			cp .env.example .env; \
		fi && \
		. venv/bin/activate && \
		python src/main.py

.PHONY: detect-viewer
detect-viewer: ## Open detection viewer in browser (starts HTTP server)
	@echo "$(BLUE)Starting Detection Viewer$(NC)"
	@echo ""
	@if pgrep -f "python.*http.server.*8080" > /dev/null; then \
		echo "$(GREEN)✓ HTTP server already running on port 8080$(NC)"; \
	else \
		echo "$(YELLOW)Starting HTTP server on port 8080...$(NC)"; \
		python3 -m http.server 8080 > /dev/null 2>&1 & \
		sleep 2; \
		echo "$(GREEN)✓ HTTP server started$(NC)"; \
	fi
	@echo ""
	@echo "$(GREEN)Detection viewer available at:$(NC)"
	@echo "  http://localhost:8080/detection-viewer.html"
	@echo ""
	@echo "$(YELLOW)Opening in browser...$(NC)"
	@if command -v xdg-open > /dev/null 2>&1; then \
		xdg-open http://localhost:8080/detection-viewer.html 2>/dev/null || true; \
	elif command -v open > /dev/null 2>&1; then \
		open http://localhost:8080/detection-viewer.html 2>/dev/null || true; \
	else \
		echo "$(YELLOW)Please open manually: http://localhost:8080/detection-viewer.html$(NC)"; \
	fi
	@echo ""
	@echo "$(YELLOW)Note: HTTP server is running in background. To stop:$(NC)"
	@echo "  pkill -f 'python.*http.server.*8080'"

.PHONY: surveillance
surveillance: ## Start complete surveillance system (cameras + detection with looping)
	@echo "$(BLUE)Starting Complete Surveillance System$(NC)"
	@echo ""
	@bash infrastructure/scripts/start-surveillance-system.sh all

.PHONY: surveillance-cameras
surveillance-cameras: ## Start only camera streams (with looping)
	@bash infrastructure/scripts/start-surveillance-system.sh cameras

.PHONY: surveillance-detection
surveillance-detection: ## Start only detection service
	@bash infrastructure/scripts/start-surveillance-system.sh detection

.PHONY: webrtc-detect-install
webrtc-detect-install: ## Install WebRTC detection service dependencies
	@echo "$(BLUE)Installing WebRTC detection service dependencies...$(NC)"
	@cd backend/python/webrtc-detection-service && \
		if [ ! -d "venv" ]; then \
			echo "$(YELLOW)Creating virtual environment...$(NC)"; \
			python3 -m venv venv; \
		fi && \
		echo "$(YELLOW)Installing dependencies...$(NC)" && \
		. venv/bin/activate && \
		pip install -r requirements.txt && \
		echo "" && \
		echo "$(GREEN)✓ Dependencies installed$(NC)"

.PHONY: webrtc-detect
webrtc-detect: ## Run WebRTC detection service with data channels
	@echo "$(BLUE)Starting WebRTC Detection Service$(NC)"
	@echo ""
	@if ! docker ps | grep -q mediamtx; then \
		echo "$(RED)Error: MediaMTX not running$(NC)"; \
		echo "$(YELLOW)Start with: make database$(NC)"; \
		exit 1; \
	fi
	@echo "$(YELLOW)Checking for active camera streams...$(NC)"
	@stream_count=$$(curl -s http://localhost:9997/v3/paths/list 2>/dev/null | grep -o '"name":"camera[0-9]"' | wc -l); \
	if [ "$$stream_count" -eq 0 ]; then \
		echo "$(YELLOW)⚠ No camera streams detected. Start cameras in another terminal:$(NC)"; \
		echo "  make cameras"; \
		echo ""; \
	fi
	@echo "$(YELLOW)Services:$(NC)"
	@echo "  Signaling Server:  http://localhost:8080"
	@echo "  Camera Streams:    rtsp://localhost:8554/camera{1,2,3}"
	@echo "  Data Channel:      Detections sent per-frame"
	@echo ""
	@echo "$(YELLOW)Access in frontend:$(NC)"
	@echo "  Navigate to WebRTC Detection view at: http://localhost:5173"
	@echo ""
	@cd backend/python/webrtc-detection-service && \
		if [ ! -f ".env" ]; then \
			echo "$(YELLOW)Creating .env file...$(NC)"; \
			cp .env.example .env; \
		fi && \
		. venv/bin/activate && \
		python src/main.py

.PHONY: webrtc-detect-docker
webrtc-detect-docker: ## Run WebRTC detection service in Docker
	@echo "$(BLUE)Starting WebRTC Detection Service in Docker$(NC)"
	@echo ""
	@cd backend/python/webrtc-detection-service && \
		docker compose up --build

.PHONY: webrtc-detect-status
webrtc-detect-status: ## Check WebRTC detection service health
	@echo "$(BLUE)WebRTC Detection Service Status$(NC)"
	@echo ""
	@if curl -s http://localhost:8080/health > /dev/null 2>&1; then \
		echo "$(GREEN)✓ Service is running$(NC)"; \
		echo ""; \
		curl -s http://localhost:8080/health | python3 -m json.tool; \
	else \
		echo "$(RED)✗ Service is not running$(NC)"; \
		echo "$(YELLOW)Start with: make webrtc-detect$(NC)"; \
	fi
