.PHONY: setup dev help clean check-pnpm kill-ports dev-frontend dev-camera dev-tracking db-seed db-reset debug-tracking debug-tracking-stop https-setup dev-https https-stop

# Colors for output
CYAN := \033[0;36m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

# Ports used by development servers
DEV_PORTS := 5173 9101 3010

# Ports used by HTTPS development (includes proxy ports)
HTTPS_PORTS := 5173 9101 3010 80 443

help: ## Show this help message
	@echo "$(CYAN)Axis-Guardian Development Makefile$(NC)"
	@echo ""
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2}'

check-pnpm: ## Check if pnpm is installed
	@command -v pnpm >/dev/null 2>&1 || { echo "$(YELLOW)Warning: pnpm is not installed. Install it with: npm install -g pnpm$(NC)"; exit 1; }

setup: check-pnpm ## Install all dependencies and seed database
	@echo "$(CYAN)Starting setup...$(NC)"
	@echo ""

	@echo "$(GREEN)[1/4] Installing frontend dependencies...$(NC)"
	@cd frontend && pnpm install
	@echo "$(GREEN)✓ Frontend dependencies installed$(NC)"
	@echo ""

	@echo "$(GREEN)[2/4] Installing camera-emulator dependencies...$(NC)"
	@cd camera-emulator && pnpm install
	@echo "$(YELLOW)   Rebuilding mediasoup native worker...$(NC)"
	@cd camera-emulator && npm rebuild mediasoup 2>/dev/null || true
	@echo "$(GREEN)✓ Camera emulator dependencies installed$(NC)"
	@echo ""

	@echo "$(GREEN)[3/4] Installing tracking-service dependencies...$(NC)"
	@cd tracking-service && pnpm install
	@echo "$(GREEN)✓ Tracking service dependencies installed$(NC)"
	@echo ""

	@echo "$(GREEN)[4/4] Seeding tracking-service database...$(NC)"
	@cd tracking-service && pnpm db:seed
	@echo "$(GREEN)✓ Database seeded from shared/config/sitemap-rectangular-room.json$(NC)"
	@echo ""

	@echo "$(GREEN)Setup complete! Run 'make dev' to start all development servers.$(NC)"

db-seed: ## Seed the tracking-service database from shared config
	@echo "$(CYAN)Seeding database...$(NC)"
	@cd tracking-service && pnpm db:seed
	@echo "$(GREEN)✓ Database seeded$(NC)"

db-reset: ## Reset and re-seed the tracking-service database
	@echo "$(CYAN)Resetting database...$(NC)"
	@cd tracking-service && pnpm db:reset
	@echo "$(GREEN)✓ Database reset and re-seeded$(NC)"

kill-ports: ## Kill any processes using development ports (5173, 9101, 3010)
	@echo "$(CYAN)Checking for processes on development ports...$(NC)"
	@for port in $(DEV_PORTS); do \
		pid=$$(lsof -t -i:$$port 2>/dev/null); \
		if [ -n "$$pid" ]; then \
			echo "$(YELLOW)Killing process $$pid on port $$port$(NC)"; \
			kill -9 $$pid 2>/dev/null || true; \
		fi; \
	done
	@echo "$(GREEN)✓ Ports cleared$(NC)"

dev: kill-ports ## Start all development servers (frontend + camera-emulator + tracking-service)
	@echo "$(CYAN)Starting development servers...$(NC)"
	@echo ""
	@echo "$(YELLOW)Starting frontend dev server (port 5173)...$(NC)"
	@echo "$(YELLOW)Starting camera-emulator (port 9101)...$(NC)"
	@echo "$(YELLOW)Starting tracking-service (port 3010)...$(NC)"
	@echo ""
	@FRONTEND_PID=0; \
	CAMERA_PID=0; \
	TRACKING_PID=0; \
	cleanup() { \
		echo ""; \
		echo "$(CYAN)Shutting down development servers...$(NC)"; \
		[ $$FRONTEND_PID -ne 0 ] && kill $$FRONTEND_PID 2>/dev/null; \
		[ $$CAMERA_PID -ne 0 ] && kill $$CAMERA_PID 2>/dev/null; \
		[ $$TRACKING_PID -ne 0 ] && kill $$TRACKING_PID 2>/dev/null; \
		wait 2>/dev/null; \
		echo "$(GREEN)✓ All servers stopped$(NC)"; \
		exit 0; \
	}; \
	trap cleanup INT TERM; \
	(cd tracking-service && exec pnpm run dev) & \
	TRACKING_PID=$$!; \
	sleep 1; \
	(cd camera-emulator && exec pnpm run dev) & \
	CAMERA_PID=$$!; \
	sleep 1; \
	(cd frontend && exec pnpm run dev) & \
	FRONTEND_PID=$$!; \
	wait

dev-frontend: ## Start only the frontend dev server
	@echo "$(CYAN)Starting frontend dev server...$(NC)"
	@cd frontend && pnpm run dev

dev-camera: ## Start only the camera emulator
	@echo "$(CYAN)Starting camera emulator...$(NC)"
	@cd camera-emulator && pnpm run dev

dev-tracking: ## Start only the tracking service
	@echo "$(CYAN)Starting tracking service...$(NC)"
	@cd tracking-service && pnpm run dev

clean: ## Remove node_modules from all projects
	@echo "$(CYAN)Cleaning up...$(NC)"
	@rm -rf frontend/node_modules
	@rm -rf camera-emulator/node_modules
	@rm -rf tracking-service/node_modules
	@echo "$(GREEN)✓ Cleanup complete$(NC)"

check: ## Check if all dependencies are installed
	@echo "$(CYAN)Checking dependencies...$(NC)"
	@command -v pnpm >/dev/null 2>&1 && echo "$(GREEN)✓ pnpm installed$(NC)" || echo "$(YELLOW)✗ pnpm not installed$(NC)"
	@command -v ffmpeg >/dev/null 2>&1 && echo "$(GREEN)✓ ffmpeg installed$(NC)" || echo "$(YELLOW)✗ ffmpeg not installed (required for camera-emulator)$(NC)"
	@[ -d "frontend/node_modules" ] && echo "$(GREEN)✓ Frontend dependencies installed$(NC)" || echo "$(YELLOW)✗ Frontend dependencies not installed$(NC)"
	@[ -d "camera-emulator/node_modules" ] && echo "$(GREEN)✓ Camera emulator dependencies installed$(NC)" || echo "$(YELLOW)✗ Camera emulator dependencies not installed$(NC)"
	@[ -d "tracking-service/node_modules" ] && echo "$(GREEN)✓ Tracking service dependencies installed$(NC)" || echo "$(YELLOW)✗ Tracking service dependencies not installed$(NC)"

# Database path for debug operations
DB_PATH := tracking-service/data/tracking.db

debug-tracking: ## Clear debug tables, start recording, wait for Ctrl+C to stop
	@echo "$(CYAN)Starting debug tracking session...$(NC)"
	@echo ""
	@echo "$(YELLOW)[1/2] Clearing debug tables...$(NC)"
	@sqlite3 $(DB_PATH) "DELETE FROM debug_track_states; DELETE FROM debug_track_associations; DELETE FROM debug_projected_positions; DELETE FROM debug_raw_detections; DELETE FROM debug_sessions;" 2>/dev/null || echo "$(YELLOW)   Tables may not exist yet - will be created on first use$(NC)"
	@echo "$(GREEN)✓ Debug tables cleared$(NC)"
	@echo ""
	@echo "$(YELLOW)[2/2] Starting debug session...$(NC)"
	@curl -s -X POST http://localhost:3010/api/debug/session/start \
		-H "Content-Type: application/json" \
		-d '{"name": "Debug session $(shell date +%Y-%m-%d_%H:%M:%S)"}' | \
		(command -v jq >/dev/null 2>&1 && jq '.' || cat)
	@echo ""
	@echo "$(GREEN)✓ Debug recording started!$(NC)"
	@echo ""
	@echo "$(CYAN)Recording pipeline data to: $(DB_PATH)$(NC)"
	@echo "$(CYAN)Press Ctrl+C to stop recording...$(NC)"
	@echo ""
	@trap 'curl -s -X POST http://localhost:3010/api/debug/session/end -H "Content-Type: application/json" -d "{}" >/dev/null; echo ""; echo "$(GREEN)✓ Debug recording stopped$(NC)"; echo ""; echo "$(CYAN)Query data: sqlite3 $(DB_PATH)$(NC)"; exit 0' INT; \
	while true; do sleep 1; done

debug-tracking-stop: ## Stop the current debug recording session
	@echo "$(CYAN)Stopping debug tracking session...$(NC)"
	@curl -s -X POST http://localhost:3010/api/debug/session/end \
		-H "Content-Type: application/json" \
		-d '{}' | \
		(command -v jq >/dev/null 2>&1 && jq '.' || cat)
	@echo ""
	@echo "$(GREEN)✓ Debug recording stopped$(NC)"
	@echo ""
	@echo "$(CYAN)Query the data with:$(NC)"
	@echo "  sqlite3 $(DB_PATH)"
	@echo ""
	@echo "$(CYAN)Example queries:$(NC)"
	@echo "  SELECT * FROM debug_sessions ORDER BY started_at DESC LIMIT 1;"
	@echo "  SELECT camera_id, world_x, world_y FROM debug_projected_positions LIMIT 20;"

# HTTPS Development Environment
https-setup: ## One-time HTTPS setup (mkcert + certs)
	@echo "$(CYAN)Setting up HTTPS development environment...$(NC)"
	@cd dev-https && ./setup.sh

dev-https: ## Start all services with HTTPS (requires https-setup first)
	@echo "$(CYAN)Starting HTTPS development environment...$(NC)"
	@echo ""
	@echo "$(YELLOW)Killing any existing processes on ports $(HTTPS_PORTS)...$(NC)"
	@for port in $(HTTPS_PORTS); do \
		pid=$$(lsof -t -i:$$port 2>/dev/null); \
		if [ -n "$$pid" ]; then \
			echo "$(YELLOW)Killing process $$pid on port $$port$(NC)"; \
			kill -9 $$pid 2>/dev/null || true; \
		fi; \
	done
	@-docker stop axis-https-proxy 2>/dev/null || true
	@echo ""
	@echo "$(GREEN)Starting nginx HTTPS proxy...$(NC)"
	@cd dev-https && docker-compose up -d
	@echo ""
	@echo "$(YELLOW)Starting tracking-service (port 3010)...$(NC)"
	@echo "$(YELLOW)Starting camera-emulator (port 9101)...$(NC)"
	@echo "$(YELLOW)Starting frontend dev server (port 5173)...$(NC)"
	@echo ""
	@echo "$(GREEN)Access the app at:$(NC)"
	@echo "  Frontend:         https://axis.local"
	@echo "  Tracking API:     https://api.axis.local"
	@echo "  Camera 1:         https://camera1.axis.local"
	@echo "  Camera 2:         https://camera2.axis.local"
	@echo ""
	@FRONTEND_PID=0; \
	CAMERA_PID=0; \
	TRACKING_PID=0; \
	cleanup() { \
		echo ""; \
		echo "$(CYAN)Shutting down HTTPS development servers...$(NC)"; \
		[ $$FRONTEND_PID -ne 0 ] && kill $$FRONTEND_PID 2>/dev/null; \
		[ $$CAMERA_PID -ne 0 ] && kill $$CAMERA_PID 2>/dev/null; \
		[ $$TRACKING_PID -ne 0 ] && kill $$TRACKING_PID 2>/dev/null; \
		docker stop axis-https-proxy 2>/dev/null || true; \
		wait 2>/dev/null; \
		echo "$(GREEN)✓ All servers stopped$(NC)"; \
		exit 0; \
	}; \
	trap cleanup INT TERM; \
	(cd tracking-service && CORS_ORIGIN="https://axis.local,https://localhost:5173" exec pnpm run dev) & \
	TRACKING_PID=$$!; \
	sleep 1; \
	(cd camera-emulator && exec pnpm run dev) & \
	CAMERA_PID=$$!; \
	sleep 1; \
	(cd frontend && VITE_TRACKING_WS_URL="wss://api.axis.local/ws" VITE_TRACKING_API_URL="https://api.axis.local" VITE_CAMERA1_WEBRTC_URL="https://camera1.axis.local" VITE_CAMERA2_WEBRTC_URL="https://camera2.axis.local" __VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS=axis.local exec pnpm exec vite --host) & \
	FRONTEND_PID=$$!; \
	wait

https-stop: ## Stop HTTPS development environment
	@echo "$(CYAN)Stopping HTTPS development environment...$(NC)"
	@cd dev-https && docker-compose down
	@for port in $(HTTPS_PORTS); do \
		pid=$$(lsof -t -i:$$port 2>/dev/null); \
		if [ -n "$$pid" ]; then \
			echo "$(YELLOW)Killing process $$pid on port $$port$(NC)"; \
			kill -9 $$pid 2>/dev/null || true; \
		fi; \
	done
	@echo "$(GREEN)✓ HTTPS environment stopped$(NC)"
