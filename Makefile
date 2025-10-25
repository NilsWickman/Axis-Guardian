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
	@for dir in simulation/webrtc-detection simulation/object-detection; do \
		if [ -f "$$dir/requirements.txt" ]; then \
			echo "$(BLUE)Setting up $$dir$(NC)"; \
			(cd "$$dir" && python3 -m venv venv && . venv/bin/activate && pip install -r requirements.txt); \
		fi \
	done
	@echo ""
	@echo "$(GREEN)✓ Setup complete!$(NC)"
	@echo ""
	@echo "$(YELLOW)Next steps:$(NC)"
	@echo "  1. Start surveillance system: make dev (MediaMTX will start automatically)"

.PHONY: infrastructure
infrastructure: ## Start MediaMTX media server (required for make dev)
	@echo "$(BLUE)Starting MediaMTX media server...$(NC)"
	@bash simulation/scripts/start-mediamtx.sh

.PHONY: stop-infrastructure
stop-infrastructure: ## Stop MediaMTX media server
	@echo "$(BLUE)Stopping MediaMTX media server...$(NC)"
	@bash simulation/scripts/stop-mediamtx.sh


.PHONY: dev
dev: cleanup-ports ## Start complete surveillance system (frontend + cameras + WebRTC detection)
	@echo "$(BLUE)Starting complete surveillance system...$(NC)"
	@echo ""
	@echo "$(YELLOW)Starting infrastructure...$(NC)"
	@$(MAKE) infrastructure
	@sleep 1
	@echo ""
	@echo "$(YELLOW)Starting services:$(NC)"
	@echo "  Frontend:          http://localhost:5173"
	@echo "  Cameras:           rtsp://localhost:8554/camera{1,2,3}"
	@echo "  HLS Streams:       http://localhost:8888/camera{1,2,3}"
	@echo "  WebRTC Detection:  http://localhost:8080 (signaling + data channels)"
	@echo ""
	@echo "$(YELLOW)Note: All services start automatically in parallel$(NC)"
	@echo "$(YELLOW)Access WebRTC Detection view at: http://localhost:5173/webrtc-detection$(NC)"
	@echo ""
	@yarn dev

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

.PHONY: clean
clean: ## Clean up temporary files and logs
	@echo "$(BLUE)Cleaning up...$(NC)"
	@echo "$(YELLOW)Removing temporary files and logs...$(NC)"
	@find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	@find . -type f -name "*.pyc" -delete 2>/dev/null || true
	@find . -type f -name "*.log" -delete 2>/dev/null || true
	@echo "$(GREEN)✓ Cleanup complete$(NC)"
