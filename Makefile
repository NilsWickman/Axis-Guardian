.PHONY: setup dev help clean check-pnpm check-python kill-ports

# Colors for output
CYAN := \033[0;36m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

# Ports used by development servers
DEV_PORTS := 5173 9101 9102

help: ## Show this help message
	@echo "$(CYAN)Axis-Guardian Development Makefile$(NC)"
	@echo ""
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2}'

check-pnpm: ## Check if pnpm is installed
	@command -v pnpm >/dev/null 2>&1 || { echo "$(YELLOW)Warning: pnpm is not installed. Install it with: npm install -g pnpm$(NC)"; exit 1; }

check-python: ## Check if python3 is installed
	@command -v python3 >/dev/null 2>&1 || { echo "$(YELLOW)Warning: python3 is not installed$(NC)"; exit 1; }

setup: check-pnpm check-python ## Install all dependencies (frontend + Python environments)
	@echo "$(CYAN)Starting setup...$(NC)"
	@echo ""

	@echo "$(GREEN)[1/2] Installing frontend dependencies...$(NC)"
	@cd frontend && pnpm install
	@echo "$(GREEN)✓ Frontend dependencies installed$(NC)"
	@echo ""

	@echo "$(GREEN)[2/2] Setting up Python environments...$(NC)"
	@if [ ! -d "camera-emulator/venv" ]; then \
		echo "  Creating virtual environment for camera-emulator..."; \
		cd camera-emulator && python3 -m venv venv; \
	else \
		echo "  Virtual environment already exists for camera-emulator"; \
	fi
	@echo "  Installing Python dependencies for camera-emulator..."
	@cd camera-emulator && . venv/bin/activate && pip install --upgrade pip && pip install -r requirements.txt
	@echo "$(GREEN)✓ Camera emulator dependencies installed$(NC)"
	@echo ""

	@echo "$(GREEN)Setup complete! Run 'make dev' to start development servers.$(NC)"

kill-ports: ## Kill any processes using development ports (5173, 9101, 9102)
	@echo "$(CYAN)Checking for processes on development ports...$(NC)"
	@for port in $(DEV_PORTS); do \
		pid=$$(lsof -t -i:$$port 2>/dev/null); \
		if [ -n "$$pid" ]; then \
			echo "$(YELLOW)Killing process $$pid on port $$port$(NC)"; \
			kill -9 $$pid 2>/dev/null || true; \
		fi; \
	done
	@echo "$(GREEN)✓ Ports cleared$(NC)"

dev: kill-ports ## Start all development servers (frontend + camera-emulator)
	@echo "$(CYAN)Starting development servers...$(NC)"
	@echo ""
	@echo "$(YELLOW)Starting frontend dev server (port 5173)...$(NC)"
	@echo "$(YELLOW)Starting camera-emulator...$(NC)"
	@echo ""
	@FRONTEND_PID=0; \
	CAMERA_PID=0; \
	cleanup() { \
		echo ""; \
		echo "$(CYAN)Shutting down development servers...$(NC)"; \
		[ $$FRONTEND_PID -ne 0 ] && kill $$FRONTEND_PID 2>/dev/null; \
		[ $$CAMERA_PID -ne 0 ] && kill $$CAMERA_PID 2>/dev/null; \
		wait 2>/dev/null; \
		echo "$(GREEN)✓ All servers stopped$(NC)"; \
		exit 0; \
	}; \
	trap cleanup INT TERM; \
	(cd frontend && exec pnpm run dev) & \
	FRONTEND_PID=$$!; \
	(cd camera-emulator && . venv/bin/activate && CAMERA_DATA_PATH=../shared/cameras/preprocessed/1080p exec python src/main.py) & \
	CAMERA_PID=$$!; \
	wait

dev-frontend: ## Start only the frontend dev server
	@echo "$(CYAN)Starting frontend dev server...$(NC)"
	@cd frontend && pnpm run dev

dev-camera: ## Start only the camera emulator
	@echo "$(CYAN)Starting camera emulator...$(NC)"
	@cd camera-emulator && . venv/bin/activate && python src/main.py

clean: ## Remove node_modules and Python virtual environments
	@echo "$(CYAN)Cleaning up...$(NC)"
	@rm -rf frontend/node_modules
	@rm -rf camera-emulator/venv
	@echo "$(GREEN)✓ Cleanup complete$(NC)"

check: ## Check if all dependencies are installed
	@echo "$(CYAN)Checking dependencies...$(NC)"
	@command -v pnpm >/dev/null 2>&1 && echo "$(GREEN)✓ pnpm installed$(NC)" || echo "$(YELLOW)✗ pnpm not installed$(NC)"
	@command -v python3 >/dev/null 2>&1 && echo "$(GREEN)✓ python3 installed$(NC)" || echo "$(YELLOW)✗ python3 not installed$(NC)"
	@[ -d "frontend/node_modules" ] && echo "$(GREEN)✓ Frontend dependencies installed$(NC)" || echo "$(YELLOW)✗ Frontend dependencies not installed$(NC)"
	@[ -d "camera-emulator/venv" ] && echo "$(GREEN)✓ Camera emulator venv exists$(NC)" || echo "$(YELLOW)✗ Camera emulator venv not created$(NC)"
