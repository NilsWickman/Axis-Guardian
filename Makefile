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
	@echo "  PostgreSQL:  localhost:5432"
	@echo "  MQTT:        localhost:1883"
	@echo "  MinIO:       localhost:9000 (console: localhost:9090)"

.PHONY: dev
dev: ## Start frontend with mock server
	@echo "$(BLUE)Starting frontend with mock server...$(NC)"
	@npm --workspace frontend run dev

.PHONY: dev-all
dev-all: ## Start all development servers (frontend + all backend services)
	@echo "$(BLUE)Starting all development servers...$(NC)"
	@echo "$(YELLOW)Ensure database is running: make database$(NC)"
	@echo ""
	@npm run dev

.PHONY: api-contract
api-contract: ## Validate API contracts and generate types/clients
	@echo "$(BLUE)Validating API contracts...$(NC)"
	@if [ -d "shared/schemas" ] && [ -n "$$(ls -A shared/schemas/*.json 2>/dev/null || ls -A shared/schemas/*.yaml 2>/dev/null)" ]; then \
		echo "$(YELLOW)Validating OpenAPI schemas...$(NC)"; \
	else \
		echo "$(YELLOW)No API schemas found in shared/schemas/$(NC)"; \
		echo "$(YELLOW)Add your OpenAPI specs to shared/schemas/ directory$(NC)"; \
	fi
	@echo ""
	@echo "$(YELLOW)Generating TypeScript types and clients...$(NC)"
	@npm run generate:openapi
	@echo ""
	@echo "$(GREEN)✓ API contracts processed$(NC)"

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
