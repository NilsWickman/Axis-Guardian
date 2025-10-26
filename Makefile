# Surveillance System - Development Makefile
# ==========================================
#
# Supports the frontend-first workflow:
# 1. Frontend developed with mock data for elicitation
# 2. API contracts defined based on frontend needs
# 3. Backend services implement contracts

# Load environment variables from .env file
ifneq (,$(wildcard .env))
    include .env
    export
endif

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
	@echo "$(YELLOW)🐳 Docker Development (Recommended):$(NC)"
	@echo "  $(GREEN)make docker-dev$(NC)         Start complete Docker dev environment"
	@echo "  $(GREEN)make docker-up$(NC)          Start Docker services only"
	@echo "  $(GREEN)make docker-down$(NC)        Stop Docker environment"
	@echo "  $(GREEN)make docker-logs$(NC)        View Docker logs"
	@echo "  $(GREEN)make docker-status$(NC)      Check Docker services status"
	@echo ""
	@echo "$(YELLOW)Traditional Development:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(YELLOW)Quick Start:$(NC)"
	@echo "  $(BLUE)make docker-dev$(NC)   # Complete environment with monitoring"
	@echo "  $(BLUE)make dev$(NC)          # Traditional setup (no Docker)"

.PHONY: setup
setup: ## Install dependencies and initialize infrastructure
	@echo "$(BLUE)Setting up development environment...$(NC)"
	@echo ""
	@echo "$(YELLOW)Checking MediaMTX...$(NC)"
	@if [ ! -f "simulation/mediamtx/mediamtx" ]; then \
		echo "$(YELLOW)MediaMTX binary not found. The source code is available in simulation/mediamtx/$(NC)"; \
		echo "$(YELLOW)You can build it with: cd simulation/mediamtx && make build$(NC)"; \
		echo "$(YELLOW)Or it will be built automatically when you run 'make infrastructure'$(NC)"; \
	else \
		echo "$(GREEN)✓ MediaMTX binary found$(NC)"; \
	fi
	@if [ ! -f "simulation/mediamtx/mediamtx.custom.yml" ]; then \
		echo "$(YELLOW)Creating custom MediaMTX config...$(NC)"; \
		cp simulation/mediamtx/mediamtx.yml simulation/mediamtx/mediamtx.custom.yml 2>/dev/null || true; \
	fi
	@echo ""
	@echo "$(YELLOW)Installing yarn workspaces...$(NC)"
	yarn install
	@echo ""
	@echo "$(YELLOW)Setting up Python virtual environments...$(NC)"
	@for dir in simulation/webrtc-detection simulation/object-detection simulation/site-map-generation; do \
		if [ -f "$$dir/requirements.txt" ]; then \
			echo "$(BLUE)Setting up $$dir$(NC)"; \
			if [ ! -d "$$dir/venv" ]; then \
				(cd "$$dir" && \
				 echo "$(YELLOW)  Creating virtual environment...$(NC)" && \
				 python3 -m venv --without-pip venv && \
				 echo "$(YELLOW)  Installing pip...$(NC)" && \
				 curl -fsSL https://bootstrap.pypa.io/get-pip.py -o /tmp/get-pip.py && \
				 venv/bin/python /tmp/get-pip.py && \
				 rm -f /tmp/get-pip.py); \
			fi; \
			(cd "$$dir" && \
			 echo "$(YELLOW)  Installing/updating requirements...$(NC)" && \
			 venv/bin/pip install --upgrade pip setuptools wheel && \
			 venv/bin/pip install -r requirements.txt && \
			 echo "$(GREEN)  ✓ Requirements up to date$(NC)"); \
		fi \
	done
	@echo ""
	@echo "$(GREEN)✓ Setup complete!$(NC)"
	@echo ""
	@echo "$(YELLOW)Note: Depth Anything V2 model (~2.5GB) will download during site map generation$(NC)"
	@echo ""
	@echo "$(YELLOW)Pre-processing detection videos...$(NC)"
	@$(MAKE) preprocess-videos
	@echo ""
	@echo "$(YELLOW)Generating initial site map from camera configuration...$(NC)"
	@$(MAKE) sitemap || echo "$(YELLOW)⚠  Site map generation skipped (will generate on first use)$(NC)"
	@echo ""
	@echo "$(YELLOW)Next steps:$(NC)"
	@echo "  1. Start surveillance system: make dev (MediaMTX will start automatically)"
	@echo "  2. Generated site map available at: shared/site-maps/generated/sitemap-setup.json"

.PHONY: infrastructure
infrastructure: ## Start MediaMTX media server (required for make dev)
	@echo "$(BLUE)Starting MediaMTX media server...$(NC)"
	@bash simulation/scripts/start-mediamtx.sh

.PHONY: stop-infrastructure
stop-infrastructure: ## Stop MediaMTX media server
	@echo "$(BLUE)Stopping MediaMTX media server...$(NC)"
	@bash simulation/scripts/stop-mediamtx.sh


.PHONY: dev
dev: cleanup-ports ## Start complete surveillance system (optimized with pre-processed detections)
	@echo "$(BLUE)Starting complete surveillance system (optimized mode)...$(NC)"
	@echo ""
	@echo "$(YELLOW)Checking pre-processed videos...$(NC)"
	@if [ ! -d "shared/cameras/preprocessed" ] || [ -z "$$(find shared/cameras/preprocessed -name '*.mp4' 2>/dev/null)" ]; then \
		echo "$(RED)Error: No pre-processed videos found!$(NC)"; \
		echo "$(YELLOW)Pre-processed videos are required for optimized mode.$(NC)"; \
		echo ""; \
		echo "$(YELLOW)Options:$(NC)"; \
		echo "  1. Generate pre-processed videos: make preprocess-videos"; \
		echo "  2. Use real-time mode instead: make dev-realtime"; \
		echo ""; \
		exit 1; \
	fi
	@echo "$(GREEN)✓ Pre-processed videos found$(NC)"
	@echo ""
	@echo "$(YELLOW)Starting infrastructure...$(NC)"
	@$(MAKE) infrastructure
	@echo ""
	@echo "$(YELLOW)Waiting for MediaMTX to be ready...$(NC)"
	@for i in 1 2 3 4 5; do \
		if curl -s http://localhost:9997/v3/config/global/get > /dev/null 2>&1; then \
			echo "$(GREEN)✓ MediaMTX is ready$(NC)"; \
			break; \
		fi; \
		echo "  Waiting... ($$i/5)"; \
		sleep 1; \
	done
	@if ! curl -s http://localhost:9997/v3/config/global/get > /dev/null 2>&1; then \
		echo "$(RED)Error: MediaMTX failed to start$(NC)"; \
		echo "$(YELLOW)Check logs with: make infrastructure$(NC)"; \
		exit 1; \
	fi
	@echo ""
	@echo "$(YELLOW)Starting services:$(NC)"
	@echo "  Frontend:          http://localhost:5173"
	@echo "  Cameras:           rtsp://localhost:8554/camera{1,2,3,4}"
	@echo "  HLS Streams:       http://localhost:8888/camera{1,2,3,4}"
	@echo "  WebRTC Detection:  http://localhost:8080 (signaling + data channels)"
	@echo ""
	@echo "$(GREEN)Mode: Optimized with pre-processed detections (default)$(NC)"
	@echo "  • Pre-processed videos with baked-in detections"
	@echo "  • Minimal CPU usage, maximum performance"
	@echo "  • Run 'make preprocess-videos' to generate/update preprocessed videos"
	@echo ""
	@echo "$(YELLOW)For real-time inference mode, use: make dev-realtime$(NC)"
	@echo ""
	@echo "$(YELLOW)Access WebRTC Detection view at: http://localhost:5173/webrtc-detection$(NC)"
	@echo ""
	@echo "$(YELLOW)Starting camera streams, WebRTC service, and frontend...$(NC)"
	@echo ""
	@yarn dev

.PHONY: dev-realtime
dev-realtime: cleanup-ports ## Start surveillance system with real-time inference
	@echo "$(BLUE)Starting complete surveillance system (real-time inference)...$(NC)"
	@echo ""
	@echo "$(YELLOW)Starting infrastructure...$(NC)"
	@$(MAKE) infrastructure
	@echo ""
	@echo "$(YELLOW)Waiting for MediaMTX to be ready...$(NC)"
	@for i in 1 2 3 4 5; do \
		if curl -s http://localhost:9997/v3/config/global/get > /dev/null 2>&1; then \
			echo "$(GREEN)✓ MediaMTX is ready$(NC)"; \
			break; \
		fi; \
		echo "  Waiting... ($$i/5)"; \
		sleep 1; \
	done
	@if ! curl -s http://localhost:9997/v3/config/global/get > /dev/null 2>&1; then \
		echo "$(RED)Error: MediaMTX failed to start$(NC)"; \
		echo "$(YELLOW)Check logs with: make infrastructure$(NC)"; \
		exit 1; \
	fi
	@echo ""
	@echo "$(YELLOW)Starting services:$(NC)"
	@echo "  Frontend:          http://localhost:5173"
	@echo "  Cameras:           rtsp://localhost:8554/camera{1,2,3,4}"
	@echo "  HLS Streams:       http://localhost:8888/camera{1,2,3,4}"
	@echo "  WebRTC Detection:  http://localhost:8080 (signaling + data channels)"
	@echo ""
	@echo "$(GREEN)Mode: Real-time inference$(NC)"
	@echo "  • Source videos streamed"
	@echo "  • Detection runs in real-time"
	@echo "  • Higher CPU usage, more realistic simulation"
	@echo ""
	@echo "$(YELLOW)Access WebRTC Detection view at: http://localhost:5173/webrtc-detection$(NC)"
	@echo ""
	@USE_RENDERED=0 USE_REALTIME=true yarn dev

.PHONY: cleanup-ports
cleanup-ports: ## Kill processes on development ports (5173, 8080)
	@bash simulation/scripts/cleanup-dev.sh

.PHONY: quality
quality: ## Check code quality (formatting and linting)
	@echo "$(BLUE)Checking code quality...$(NC)"
	@echo ""
	@echo "$(YELLOW)Checking formatting...$(NC)"
	@yarn workspaces foreach -A run format:check || echo "$(YELLOW)No format:check script defined yet$(NC)"
	@echo ""
	@echo "$(YELLOW)Running linters...$(NC)"
	@yarn workspaces foreach -A run lint || echo "$(YELLOW)No lint script defined yet$(NC)"
	@echo ""
	@echo "$(GREEN)✓ Quality checks complete$(NC)"

.PHONY: build
build: ## Build all compilable services
	@echo "$(BLUE)Building all services...$(NC)"
	@echo ""
	@echo "$(YELLOW)Building TypeScript services and frontend...$(NC)"
	@yarn workspaces foreach -A run build
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
	@bash simulation/scripts/stream-mock-cameras.sh all

.PHONY: test
test: ## Run all tests
	@echo "$(BLUE)Running all tests...$(NC)"
	@pytest

.PHONY: test-unit
test-unit: ## Run only unit tests
	@echo "$(BLUE)Running unit tests...$(NC)"
	@pytest -m unit

.PHONY: test-object-detection
test-object-detection: ## Run object detection service tests
	@echo "$(BLUE)Running object detection tests...$(NC)"
	@pytest simulation/object-detection/tests

.PHONY: test-webrtc
test-webrtc: ## Run WebRTC detection service tests
	@echo "$(BLUE)Running WebRTC detection tests...$(NC)"
	@pytest simulation/webrtc-detection/tests

.PHONY: test-cov
test-cov: ## Run tests with coverage report
	@echo "$(BLUE)Running tests with coverage...$(NC)"
	@pytest --cov --cov-report=html --cov-report=term
	@echo ""
	@echo "$(GREEN)✓ Coverage report generated at htmlcov/index.html$(NC)"

.PHONY: test-watch
test-watch: ## Run tests in watch mode (requires pytest-watch)
	@echo "$(BLUE)Running tests in watch mode...$(NC)"
	@echo "$(YELLOW)Press Ctrl+C to stop$(NC)"
	@pytest-watch || (echo "$(YELLOW)Install pytest-watch: pip install pytest-watch$(NC)" && exit 1)

.PHONY: clean
clean: ## Clean up temporary files and logs
	@echo "$(BLUE)Cleaning up...$(NC)"
	@echo "$(YELLOW)Removing temporary files and logs...$(NC)"
	@find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	@find . -type f -name "*.pyc" -delete 2>/dev/null || true
	@find . -type f -name "*.log" -delete 2>/dev/null || true
	@rm -rf htmlcov .coverage .pytest_cache 2>/dev/null || true
	@echo "$(GREEN)✓ Cleanup complete$(NC)"

.PHONY: clean-venv
clean-venv: ## Remove Python virtual environments (forces rebuild on next setup)
	@echo "$(BLUE)Removing Python virtual environments...$(NC)"
	@rm -rf simulation/webrtc-detection/venv simulation/object-detection/venv
	@echo "$(GREEN)✓ Virtual environments removed$(NC)"
	@echo "$(YELLOW)Run 'make setup' to recreate them$(NC)"

.PHONY: preprocess-videos
preprocess-videos: ## Pre-process detection videos for optimized streaming
	@echo "$(BLUE)Pre-processing detection videos...$(NC)"
	@echo ""
	@if [ ! -d "simulation/webrtc-detection/venv" ]; then \
		echo "$(YELLOW)Python virtual environment not found. Running setup first...$(NC)"; \
		$(MAKE) setup; \
	fi
	@echo "$(YELLOW)Auto-detecting videos in shared/cameras/$(NC)"
	@if [ -n "$$PREPROCESSED_QUALITY" ]; then \
		echo "$(YELLOW)Quality: $$PREPROCESSED_QUALITY (from PREPROCESSED_QUALITY env variable)$(NC)"; \
	else \
		echo "$(YELLOW)Quality: 720p (default - set PREPROCESSED_QUALITY in .env to change)$(NC)"; \
	fi
	@echo ""
	@cd simulation/scripts && \
		../webrtc-detection/venv/bin/python preprocess_detections.py --batch-all
	@echo ""
	@echo "$(GREEN)✓ Pre-processing complete!$(NC)"
	@echo "$(YELLOW)Pre-processed videos: shared/cameras/preprocessed/$${PREPROCESSED_QUALITY:-720p}/$(NC)"
	@echo ""
	@echo "Next steps:"
	@echo "  1. Start the system: make dev"
	@echo "  2. Pre-processed videos will be used automatically"
	@echo ""
	@echo "Note: Already preprocessed videos are skipped. Use 'make preprocess-videos-force' to re-process all."

.PHONY: preprocess-videos-force
preprocess-videos-force: ## Force re-process all videos (ignore existing)
	@echo "$(BLUE)Force re-processing all detection videos...$(NC)"
	@echo ""
	@if [ ! -d "simulation/webrtc-detection/venv" ]; then \
		echo "$(YELLOW)Python virtual environment not found. Running setup first...$(NC)"; \
		$(MAKE) setup; \
	fi
	@echo "$(YELLOW)Auto-detecting videos in shared/cameras/$(NC)"
	@if [ -n "$$PREPROCESSED_QUALITY" ]; then \
		echo "$(YELLOW)Quality: $$PREPROCESSED_QUALITY (from PREPROCESSED_QUALITY env variable)$(NC)"; \
	else \
		echo "$(YELLOW)Quality: 720p (default - set PREPROCESSED_QUALITY in .env to change)$(NC)"; \
	fi
	@echo ""
	@cd simulation/scripts && \
		../webrtc-detection/venv/bin/python preprocess_detections.py --batch-all --force
	@echo ""
	@echo "$(GREEN)✓ Re-processing complete!$(NC)"

.PHONY: preprocess-video
preprocess-video: ## Pre-process a single video (usage: make preprocess-video VIDEO=filename.mp4)
	@echo "$(BLUE)Pre-processing single video...$(NC)"
	@if [ -z "$(VIDEO)" ]; then \
		echo "$(RED)Error: VIDEO parameter required$(NC)"; \
		echo "Usage: make preprocess-video VIDEO=view-HC3.mp4"; \
		exit 1; \
	fi
	@if [ ! -d "simulation/webrtc-detection/venv" ]; then \
		echo "$(YELLOW)Python virtual environment not found. Running setup first...$(NC)"; \
		$(MAKE) setup; \
	fi
	@cd simulation/scripts && \
		../webrtc-detection/venv/bin/python preprocess_detections.py --input $(VIDEO)
	@echo ""
	@echo "$(GREEN)✓ Pre-processing complete!$(NC)"

# Backward compatibility aliases
.PHONY: prerender-videos
prerender-videos: ## [DEPRECATED] Use 'make preprocess-videos' instead
	@echo "$(YELLOW)⚠  Warning: 'make prerender-videos' is deprecated$(NC)"
	@echo "$(YELLOW)   Use 'make preprocess-videos' instead$(NC)"
	@echo ""
	@$(MAKE) preprocess-videos

.PHONY: prerender-videos-force
prerender-videos-force: ## [DEPRECATED] Use 'make preprocess-videos-force' instead
	@echo "$(YELLOW)⚠  Warning: 'make prerender-videos-force' is deprecated$(NC)"
	@echo "$(YELLOW)   Use 'make preprocess-videos-force' instead$(NC)"
	@echo ""
	@$(MAKE) preprocess-videos-force

.PHONY: prerender-video
prerender-video: ## [DEPRECATED] Use 'make preprocess-video' instead
	@echo "$(YELLOW)⚠  Warning: 'make prerender-video' is deprecated$(NC)"
	@echo "$(YELLOW)   Use 'make preprocess-video' instead$(NC)"
	@echo ""
	@$(MAKE) preprocess-video

.PHONY: list-videos
list-videos: ## List available source videos for pre-processing
	@echo "$(BLUE)Available source videos:$(NC)"
	@if [ -d "shared/cameras" ]; then \
		find shared/cameras -maxdepth 1 -name "*.mp4" -type f -exec basename {} \; | sort; \
	else \
		echo "$(YELLOW)No videos directory found$(NC)"; \
	fi
	@echo ""
	@echo "$(BLUE)Pre-processed videos:$(NC)"
	@if [ -d "shared/cameras/rendered" ]; then \
		find shared/cameras/rendered -name "*.mp4" -type f -exec basename {} \; | sort || echo "None"; \
	else \
		echo "None (run 'make prerender-videos' to generate)"; \
	fi

###############################################
# Site Map Generation
###############################################

.PHONY: sitemap
sitemap: ## Generate site map from mock cameras (skips if exists, use sitemap-force to regenerate)
	@echo "$(BLUE)Generating site map from camera configuration...$(NC)"
	@if [ ! -d "simulation/site-map-generation/venv" ]; then \
		echo "$(RED)Error: Virtual environment not found$(NC)"; \
		echo "$(YELLOW)This should be called after Python setup$(NC)"; \
		exit 1; \
	fi
	@echo "$(YELLOW)This will generate a site map using depth estimation$(NC)"
	@echo "$(YELLOW)Note: Uses clean frames from videos in shared/cameras/$(NC)"
	@echo "$(YELLOW)      Falls back to live cameras or synthetic data if videos unavailable$(NC)"
	@echo ""
	@cd simulation/site-map-generation && \
		venv/bin/python generate_cli.py --output ../../shared/site-maps/generated/sitemap-setup.json
	@echo ""
	@echo "$(GREEN)✓ Site map ready!$(NC)"
	@echo "$(YELLOW)Location: shared/site-maps/generated/sitemap-setup.json$(NC)"

.PHONY: sitemap-force
sitemap-force: ## Force regenerate site map (overwrites existing)
	@echo "$(BLUE)Force regenerating site map...$(NC)"
	@if [ ! -d "simulation/site-map-generation/venv" ]; then \
		echo "$(RED)Error: Virtual environment not found$(NC)"; \
		echo "$(YELLOW)Run 'make setup' first$(NC)"; \
		exit 1; \
	fi
	@echo "$(YELLOW)This will overwrite any existing site map$(NC)"
	@echo ""
	@cd simulation/site-map-generation && \
		venv/bin/python generate_cli.py --output ../../shared/site-maps/generated/sitemap-setup.json --force
	@echo ""
	@echo "$(GREEN)✓ Site map regenerated!$(NC)"
	@echo "$(YELLOW)Location: shared/site-maps/generated/sitemap-setup.json$(NC)"

.PHONY: sitemap-service
sitemap-service: ## Start site map generation service
	@echo "$(BLUE)Starting site map generation service...$(NC)"
	@if [ ! -d "simulation/site-map-generation/venv" ]; then \
		echo "$(RED)Error: Virtual environment not found$(NC)"; \
		echo "$(YELLOW)Run 'make setup' first$(NC)"; \
		exit 1; \
	fi
	@echo "$(YELLOW)Service will start on http://localhost:8091$(NC)"
	@echo "$(YELLOW)API docs available at http://localhost:8091/docs$(NC)"
	@echo ""
	@cd simulation/site-map-generation && \
		venv/bin/python -m uvicorn src.main:app --host 0.0.0.0 --port 8091 --reload

.PHONY: sitemap-service-bg
sitemap-service-bg: ## Start site map generation service in background
	@echo "$(BLUE)Starting site map generation service in background...$(NC)"
	@if [ ! -d "simulation/site-map-generation/venv" ]; then \
		echo "$(RED)Error: Virtual environment not found$(NC)"; \
		echo "$(YELLOW)Run 'make setup' first$(NC)"; \
		exit 1; \
	fi
	@cd simulation/site-map-generation && \
		nohup venv/bin/python -m uvicorn src.main:app --host 0.0.0.0 --port 8091 > /dev/null 2>&1 &
	@echo "$(GREEN)✓ Service started in background on http://localhost:8091$(NC)"

.PHONY: sitemap-test
sitemap-test: ## Test site map generation with mock cameras
	@echo "$(BLUE)Testing site map generation...$(NC)"
	@if [ ! -d "simulation/site-map-generation/venv" ]; then \
		echo "$(RED)Error: Virtual environment not found$(NC)"; \
		echo "$(YELLOW)Run 'make setup' first$(NC)"; \
		exit 1; \
	fi
	@echo "$(YELLOW)This will generate a site map from current camera configuration$(NC)"
	@cd simulation/site-map-generation && \
		venv/bin/python -m pytest tests/ -v

###############################################
# Docker Development Environment
###############################################

.PHONY: docker-dev
docker-dev: ## 🐳 Start complete Docker dev environment with monitoring
	@echo "$(BLUE)╔════════════════════════════════════════╗$(NC)"
	@echo "$(BLUE)║   Docker Development Environment      ║$(NC)"
	@echo "$(BLUE)╚════════════════════════════════════════╝$(NC)"
	@echo ""
	@if ! command -v docker &> /dev/null; then \
		echo "$(RED)Error: Docker not found. Please install Docker.$(NC)"; \
		echo "$(YELLOW)Visit: https://docs.docker.com/get-docker/$(NC)"; \
		exit 1; \
	fi
	@if ! docker compose version &> /dev/null 2>&1; then \
		echo "$(RED)Error: docker compose not found.$(NC)"; \
		echo "$(YELLOW)Visit: https://docs.docker.com/compose/install/$(NC)"; \
		exit 1; \
	fi
	@echo "$(GREEN)✓ Docker available$(NC)"
	@echo ""
	@bash ./scripts/dev-start.sh

.PHONY: docker-up
docker-up: ## 🐳 Start Docker services only (no Python/frontend)
	@echo "$(BLUE)Starting Docker services...$(NC)"
	@if ! command -v docker &> /dev/null; then \
		echo "$(RED)Error: Docker not found.$(NC)"; \
		exit 1; \
	fi
	@docker compose -f docker-compose.dev.yml up -d
	@echo ""
	@echo "$(GREEN)✓ Docker services started$(NC)"
	@echo ""
	@$(MAKE) docker-status

.PHONY: docker-down
docker-down: ## 🐳 Stop Docker dev environment
	@echo "$(BLUE)Stopping Docker services...$(NC)"
	@if [ -f "./scripts/dev-stop.sh" ]; then \
		bash ./scripts/dev-stop.sh; \
	else \
		docker compose -f docker-compose.dev.yml down; \
		echo "$(GREEN)✓ Docker services stopped$(NC)"; \
	fi

.PHONY: docker-restart
docker-restart: docker-down docker-up ## 🐳 Restart Docker services

.PHONY: docker-logs
docker-logs: ## 🐳 View Docker service logs
	@echo "$(YELLOW)Tailing Docker logs (Ctrl+C to exit)...$(NC)"
	@docker compose -f docker-compose.dev.yml logs -f

.PHONY: docker-logs-service
docker-logs-service: ## 🐳 View logs for specific service (usage: make docker-logs-service SERVICE=grafana)
	@if [ -z "$(SERVICE)" ]; then \
		echo "$(RED)Error: SERVICE parameter required$(NC)"; \
		echo "$(YELLOW)Usage: make docker-logs-service SERVICE=grafana$(NC)"; \
		echo ""; \
		echo "Available services:"; \
		echo "  - postgres"; \
		echo "  - mediamtx"; \
		echo "  - prometheus"; \
		echo "  - grafana"; \
		echo "  - node-exporter"; \
		echo "  - redis"; \
		exit 1; \
	fi
	@echo "$(YELLOW)Tailing logs for $(SERVICE)...$(NC)"
	@docker compose -f docker-compose.dev.yml logs -f $(SERVICE)

.PHONY: docker-status
docker-status: ## 🐳 Check Docker services status
	@echo "$(BLUE)Docker Services Status:$(NC)"
	@echo ""
	@docker compose -f docker-compose.dev.yml ps
	@echo ""
	@echo "$(BLUE)Service Health:$(NC)"
	@echo ""
	@echo -n "  PostgreSQL:    "
	@if docker exec axis-guardian-postgres pg_isready -U dev &> /dev/null; then \
		echo "$(GREEN)✓ Healthy$(NC)"; \
	else \
		echo "$(RED)✗ Unhealthy$(NC)"; \
	fi
	@echo -n "  Prometheus:    "
	@if curl -s http://localhost:9090/-/healthy &> /dev/null; then \
		echo "$(GREEN)✓ Healthy$(NC)"; \
	else \
		echo "$(RED)✗ Unhealthy$(NC)"; \
	fi
	@echo -n "  Grafana:       "
	@if curl -s http://localhost:3000/api/health &> /dev/null; then \
		echo "$(GREEN)✓ Healthy$(NC)"; \
	else \
		echo "$(RED)✗ Unhealthy$(NC)"; \
	fi
	@echo -n "  MediaMTX:      "
	@if curl -s http://localhost:9997/v3/config/global/get &> /dev/null; then \
		echo "$(GREEN)✓ Healthy$(NC)"; \
	else \
		echo "$(RED)✗ Unhealthy$(NC)"; \
	fi
	@echo -n "  Redis:         "
	@if docker exec axis-guardian-redis redis-cli -a devpassword --no-auth-warning ping &> /dev/null; then \
		echo "$(GREEN)✓ Healthy$(NC)"; \
	else \
		echo "$(RED)✗ Unhealthy$(NC)"; \
	fi
	@echo ""
	@echo "$(BLUE)Access URLs:$(NC)"
	@echo "  Grafana:       $(YELLOW)http://localhost:3000$(NC) (admin/admin)"
	@echo "  Prometheus:    $(YELLOW)http://localhost:9090$(NC)"
	@echo "  MediaMTX API:  $(YELLOW)http://localhost:9997$(NC)"
	@echo "  PostgreSQL:    $(YELLOW)localhost:5432$(NC) (dev/dev)"
	@echo "  Redis:         $(YELLOW)localhost:6379$(NC) (password: devpassword)"

.PHONY: docker-clean
docker-clean: ## 🐳 Clean Docker volumes and images (destructive!)
	@echo "$(RED)⚠️  WARNING: This will delete all Docker volumes and data!$(NC)"
	@echo -n "$(YELLOW)Are you sure? [y/N]: $(NC)" && read ans && [ $${ans:-N} = y ]
	@echo "$(BLUE)Stopping and removing containers...$(NC)"
	@docker compose -f docker-compose.dev.yml down -v
	@echo "$(BLUE)Removing Docker images...$(NC)"
	@docker compose -f docker-compose.dev.yml down --rmi all
	@echo "$(GREEN)✓ Docker environment cleaned$(NC)"

.PHONY: docker-backup
docker-backup: ## 🐳 Backup Docker volumes
	@echo "$(BLUE)Backing up Docker volumes...$(NC)"
	@mkdir -p backups
	@echo "$(YELLOW)Backing up PostgreSQL...$(NC)"
	@docker exec axis-guardian-postgres pg_dump -U dev surveillance > backups/postgres-backup-$$(date +%Y%m%d-%H%M%S).sql
	@echo "$(GREEN)✓ PostgreSQL backed up$(NC)"
	@echo "$(YELLOW)Backing up Grafana...$(NC)"
	@docker run --rm -v axis-guardian_grafana_data:/data -v $$(pwd)/backups:/backup alpine tar czf /backup/grafana-backup-$$(date +%Y%m%d-%H%M%S).tar.gz /data
	@echo "$(GREEN)✓ Grafana backed up$(NC)"
	@echo "$(YELLOW)Backing up Prometheus...$(NC)"
	@docker run --rm -v axis-guardian_prometheus_data:/data -v $$(pwd)/backups:/backup alpine tar czf /backup/prometheus-backup-$$(date +%Y%m%d-%H%M%S).tar.gz /data
	@echo "$(GREEN)✓ Prometheus backed up$(NC)"
	@echo ""
	@echo "$(GREEN)✓ All backups saved to: backups/$(NC)"

.PHONY: docker-shell
docker-shell: ## 🐳 Open shell in Docker service (usage: make docker-shell SERVICE=postgres)
	@if [ -z "$(SERVICE)" ]; then \
		echo "$(RED)Error: SERVICE parameter required$(NC)"; \
		echo "$(YELLOW)Usage: make docker-shell SERVICE=postgres$(NC)"; \
		exit 1; \
	fi
	@echo "$(BLUE)Opening shell in $(SERVICE)...$(NC)"
	@docker compose -f docker-compose.dev.yml exec $(SERVICE) sh || \
		docker compose -f docker-compose.dev.yml exec $(SERVICE) bash

.PHONY: docker-psql
docker-psql: ## 🐳 Open PostgreSQL shell
	@echo "$(BLUE)Opening PostgreSQL shell...$(NC)"
	@docker exec -it axis-guardian-postgres psql -U dev surveillance

.PHONY: docker-redis-cli
docker-redis-cli: ## 🐳 Open Redis CLI
	@echo "$(BLUE)Opening Redis CLI...$(NC)"
	@docker exec -it axis-guardian-redis redis-cli -a devpassword

.PHONY: docker-grafana-url
docker-grafana-url: ## 🐳 Open Grafana in browser
	@echo "$(BLUE)Opening Grafana...$(NC)"
	@if command -v xdg-open &> /dev/null; then \
		xdg-open http://localhost:3000; \
	elif command -v open &> /dev/null; then \
		open http://localhost:3000; \
	else \
		echo "$(YELLOW)Grafana URL: http://localhost:3000$(NC)"; \
		echo "$(YELLOW)Credentials: admin/admin$(NC)"; \
	fi

.PHONY: docker-prometheus-url
docker-prometheus-url: ## 🐳 Open Prometheus in browser
	@echo "$(BLUE)Opening Prometheus...$(NC)"
	@if command -v xdg-open &> /dev/null; then \
		xdg-open http://localhost:9090; \
	elif command -v open &> /dev/null; then \
		open http://localhost:9090; \
	else \
		echo "$(YELLOW)Prometheus URL: http://localhost:9090$(NC)"; \
	fi

.PHONY: docker-help
docker-help: ## 🐳 Show Docker development help
	@echo "$(BLUE)╔════════════════════════════════════════╗$(NC)"
	@echo "$(BLUE)║   Docker Development Commands         ║$(NC)"
	@echo "$(BLUE)╚════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(YELLOW)Quick Start:$(NC)"
	@echo "  $(GREEN)make docker-dev$(NC)         Start complete environment"
	@echo "  $(GREEN)make docker-status$(NC)      Check services status"
	@echo "  $(GREEN)make docker-logs$(NC)        View logs"
	@echo "  $(GREEN)make docker-down$(NC)        Stop everything"
	@echo ""
	@echo "$(YELLOW)Service Management:$(NC)"
	@echo "  $(GREEN)make docker-up$(NC)          Start Docker services only"
	@echo "  $(GREEN)make docker-restart$(NC)     Restart services"
	@echo "  $(GREEN)make docker-clean$(NC)       Clean volumes (destructive)"
	@echo "  $(GREEN)make docker-backup$(NC)      Backup volumes"
	@echo ""
	@echo "$(YELLOW)Access Services:$(NC)"
	@echo "  $(GREEN)make docker-psql$(NC)        PostgreSQL shell"
	@echo "  $(GREEN)make docker-redis-cli$(NC)   Redis CLI"
	@echo "  $(GREEN)make docker-grafana-url$(NC) Open Grafana"
	@echo "  $(GREEN)make docker-prometheus-url$(NC) Open Prometheus"
	@echo ""
	@echo "$(YELLOW)Debugging:$(NC)"
	@echo "  $(GREEN)make docker-logs SERVICE=grafana$(NC)  View service logs"
	@echo "  $(GREEN)make docker-shell SERVICE=postgres$(NC) Open service shell"
	@echo ""
	@echo "$(YELLOW)Documentation:$(NC)"
	@echo "  $(BLUE)DOCKER_DEV_SETUP.md$(NC)     Complete Docker guide"
	@echo "  $(BLUE)monitoring/README.md$(NC)    Monitoring guide"
