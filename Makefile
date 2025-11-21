.PHONY: setup dev help clean check-pnpm check-python

# Colors for output
CYAN := \033[0;36m
GREEN := \033[0;32m
YELLOW := \033[0;33m
NC := \033[0m # No Color

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

dev: ## Start all development servers (frontend + camera-emulator)
	@echo "$(CYAN)Starting development servers...$(NC)"
	@echo ""
	@echo "$(YELLOW)Starting frontend dev server (port 5173)...$(NC)"
	@echo "$(YELLOW)Starting camera-emulator...$(NC)"
	@echo ""
	@trap 'kill 0' EXIT; \
	(cd frontend && pnpm run dev) & \
	(cd camera-emulator && . venv/bin/activate && CAMERA_DATA_PATH=../shared/cameras/preprocessed/1080p python src/main.py) & \
	wait

dev-frontend: ## Start only the frontend dev server
	@echo "$(CYAN)Starting frontend dev server...$(NC)"
	@cd frontend && pnpm run dev

dev-camera: ## Start only the camera emulator
	@echo "$(CYAN)Starting camera emulator...$(NC)"
	@cd camera-emulator && . venv/bin/activate && CAMERA_DATA_PATH=../shared/cameras/preprocessed/1080p python src/main.py

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
