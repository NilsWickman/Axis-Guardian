# Colors
CYAN := \033[36m
GREEN := \033[32m
YELLOW := \033[33m
RED := \033[31m
RESET := \033[0m
BOLD := \033[1m

.PHONY: help setup dev clean docker-up docker-down docker-logs docker-status docker-build docker-clean \
        onvif-build onvif-up onvif-down onvif-logs onvif-status onvif-restart \
        sitemap3d-build sitemap3d-up sitemap3d-down sitemap3d-logs sitemap3d-generate sitemap3d-clean sitemap3d-status \
        monitoring-up monitoring-down monitoring-logs monitoring-status \
        full-up full-down full-build

help:
	@echo "$(BOLD)$(CYAN)Available commands:$(RESET)"
	@echo ""
	@echo "$(BOLD)General:$(RESET)"
	@echo "  $(GREEN)make setup$(RESET)              - Install dependencies and setup environment"
	@echo "  $(GREEN)make dev$(RESET)                - Start development environment (native)"
	@echo "  $(GREEN)make clean$(RESET)              - Clean temporary files and build artifacts"
	@echo ""
	@echo "$(BOLD)Docker Profiles (Single docker-compose.yml):$(RESET)"
	@echo "  $(GREEN)make docker-up$(RESET)          - Start base infrastructure (postgres, redis, mediamtx, frontend)"
	@echo "  $(GREEN)make docker-down$(RESET)        - Stop all Docker services"
	@echo "  $(GREEN)make docker-logs$(RESET)        - View all Docker logs"
	@echo "  $(GREEN)make docker-status$(RESET)      - Check all Docker service status"
	@echo "  $(GREEN)make docker-build$(RESET)       - Build all Docker images"
	@echo "  $(GREEN)make docker-clean$(RESET)       - Remove all containers, volumes, and images"
	@echo ""
	@echo "  $(GREEN)make onvif-up$(RESET)           - Start ONVIF camera emulators (profile: onvif)"
	@echo "  $(GREEN)make onvif-down$(RESET)         - Stop ONVIF cameras"
	@echo "  $(GREEN)make onvif-build$(RESET)        - Build ONVIF camera Docker image"
	@echo "  $(GREEN)make onvif-logs$(RESET)         - View ONVIF camera logs"
	@echo "  $(GREEN)make onvif-status$(RESET)       - Check ONVIF camera status"
	@echo ""
	@echo "  $(GREEN)make sitemap3d-up$(RESET)       - Start 3D site map generator (profile: sitemap3d)"
	@echo "  $(GREEN)make sitemap3d-down$(RESET)     - Stop site map generator"
	@echo "  $(GREEN)make sitemap3d-build$(RESET)    - Build site map generator image"
	@echo "  $(GREEN)make sitemap3d-logs$(RESET)     - View site map generator logs"
	@echo "  $(GREEN)make sitemap3d-generate$(RESET) - Generate 3D site map via API"
	@echo "  $(GREEN)make sitemap3d-status$(RESET)   - Check generation status"
	@echo "  $(GREEN)make sitemap3d-clean$(RESET)    - Clean generated 3D site maps"
	@echo ""
	@echo "  $(GREEN)make monitoring-up$(RESET)      - Start monitoring stack (profile: monitoring)"
	@echo "  $(GREEN)make monitoring-down$(RESET)    - Stop monitoring services"
	@echo "  $(GREEN)make monitoring-logs$(RESET)    - View monitoring logs"
	@echo ""
	@echo "  $(GREEN)make full-up$(RESET)            - Start ALL services (profile: full)"
	@echo "  $(GREEN)make full-down$(RESET)          - Stop all services"
	@echo "  $(GREEN)make full-build$(RESET)         - Build all images"

setup:
	@echo "$(BOLD)$(CYAN)Setting up Axis-Guardian...$(RESET)"
	@echo "$(CYAN)Installing frontend dependencies...$(RESET)"
	cd frontend && pnpm install
	@echo "$(CYAN)Installing Python dependencies with uv...$(RESET)"
	cd simulation/webrtc-detection && uv venv && uv pip install -r requirements.txt
	cd simulation/object-detection && uv venv && uv pip install -r requirements.txt
	cd simulation/onvif-emulator && uv venv && uv pip install -r requirements.txt
	cd simulation/vapix-api && uv venv && uv pip install -r requirements.txt
	@echo "$(BOLD)$(GREEN)✓ Setup complete!$(RESET)"

dev:
	@echo "$(BOLD)$(CYAN)Starting development environment...$(RESET)"
	cd frontend && pnpm run dev

clean:
	@echo "$(BOLD)$(YELLOW)Cleaning up...$(RESET)"
	cd frontend && rm -rf node_modules dist
	@echo "$(BOLD)$(GREEN)✓ Clean complete!$(RESET)"

# ============================================================================
# Base Docker Commands
# ============================================================================

docker-up:
	@echo "$(BOLD)$(CYAN)Starting base infrastructure...$(RESET)"
	docker compose --profile base up -d
	@echo "$(BOLD)$(GREEN)✓ Base infrastructure started!$(RESET)"
	@echo "$(CYAN)Services: PostgreSQL, Redis, MediaMTX, Frontend$(RESET)"

docker-down:
	@echo "$(BOLD)$(YELLOW)Stopping all Docker services...$(RESET)"
	docker compose down
	@echo "$(BOLD)$(GREEN)✓ All services stopped!$(RESET)"

docker-logs:
	@echo "$(BOLD)$(CYAN)Docker logs:$(RESET)"
	docker compose logs -f

docker-status:
	@echo "$(BOLD)$(CYAN)Docker service status:$(RESET)"
	docker compose ps

docker-build:
	@echo "$(BOLD)$(CYAN)Building all Docker images...$(RESET)"
	docker compose build
	@echo "$(BOLD)$(GREEN)✓ All images built!$(RESET)"

docker-clean:
	@echo "$(BOLD)$(YELLOW)Removing all containers, volumes, and images...$(RESET)"
	docker compose down -v --rmi all
	@echo "$(BOLD)$(GREEN)✓ Cleanup complete!$(RESET)"

# ============================================================================
# ONVIF Profile Commands
# ============================================================================

onvif-build:
	@echo "$(BOLD)$(CYAN)Building ONVIF camera emulator...$(RESET)"
	docker compose --profile onvif build
	@echo "$(BOLD)$(GREEN)✓ ONVIF emulator built!$(RESET)"

onvif-up:
	@echo "$(BOLD)$(CYAN)Starting ONVIF camera containers...$(RESET)"
	docker compose --profile onvif up -d
	@echo "$(BOLD)$(GREEN)✓ ONVIF cameras started!$(RESET)"
	@echo "$(BOLD)$(CYAN)Camera endpoints:$(RESET)"
	@echo "  Camera 1: http://172.20.0.11:80 (host port 9001)"
	@echo "  Camera 2: http://172.20.0.12:80 (host port 9002)"
	@echo "$(BOLD)$(CYAN)Credentials:$(RESET) admin / axis123"

onvif-down:
	@echo "$(BOLD)$(YELLOW)Stopping ONVIF camera containers...$(RESET)"
	docker compose --profile onvif down
	@echo "$(BOLD)$(GREEN)✓ ONVIF cameras stopped!$(RESET)"

onvif-logs:
	@echo "$(BOLD)$(CYAN)ONVIF camera logs:$(RESET)"
	docker compose --profile onvif logs -f

onvif-status:
	@echo "$(BOLD)$(CYAN)ONVIF camera status:$(RESET)"
	docker compose --profile onvif ps

onvif-restart:
	@echo "$(BOLD)$(YELLOW)Restarting ONVIF cameras...$(RESET)"
	docker compose --profile onvif restart
	@echo "$(BOLD)$(GREEN)✓ ONVIF cameras restarted!$(RESET)"

# ============================================================================
# 3D Site Map Generator Profile Commands
# ============================================================================

sitemap3d-build:
	@echo "$(BOLD)$(CYAN)Building 3D site map generator Docker image...$(RESET)"
	docker compose --profile sitemap3d build
	@echo "$(BOLD)$(GREEN)✓ Docker image built!$(RESET)"

sitemap3d-up:
	@echo "$(BOLD)$(CYAN)Starting 3D site map generator service...$(RESET)"
	@mkdir -p frontend/public/site-maps
	docker compose --profile sitemap3d up -d
	@echo "$(BOLD)$(GREEN)✓ Service started!$(RESET)"
	@echo "$(CYAN)API available at: http://localhost:8081$(RESET)"
	@echo "$(CYAN)Health check: http://localhost:8081/health$(RESET)"

sitemap3d-down:
	@echo "$(BOLD)$(YELLOW)Stopping 3D site map generator service...$(RESET)"
	docker compose --profile sitemap3d down
	@echo "$(BOLD)$(GREEN)✓ Service stopped!$(RESET)"

sitemap3d-logs:
	@echo "$(BOLD)$(CYAN)3D site map generator logs:$(RESET)"
	docker compose --profile sitemap3d logs -f

sitemap3d-generate:
	@echo "$(BOLD)$(CYAN)Triggering 3D site map generation...$(RESET)"
	@curl -X POST http://localhost:8081/api/site-maps/generate \
		-H "Content-Type: application/json" \
		-d '{"output_name": "site_map_$(shell date +%s)", "device": "cpu"}' \
		-s | python3 -m json.tool || echo "$(RED)Error: Make sure service is running (make sitemap3d-up)$(RESET)"
	@echo ""
	@echo "$(CYAN)Check status with: make sitemap3d-status$(RESET)"

sitemap3d-status:
	@echo "$(BOLD)$(CYAN)Generation status:$(RESET)"
	@curl -s http://localhost:8081/api/site-maps/status | python3 -m json.tool || echo "$(RED)Error: Service not running$(RESET)"

sitemap3d-clean:
	@echo "$(BOLD)$(YELLOW)Cleaning generated 3D site maps...$(RESET)"
	rm -f frontend/public/site-maps/*.gltf
	@echo "$(BOLD)$(GREEN)✓ Cleaned!$(RESET)"

# ============================================================================
# Monitoring Profile Commands
# ============================================================================

monitoring-up:
	@echo "$(BOLD)$(CYAN)Starting monitoring stack...$(RESET)"
	docker compose --profile monitoring up -d
	@echo "$(BOLD)$(GREEN)✓ Monitoring stack started!$(RESET)"
	@echo "$(CYAN)Prometheus: http://localhost:9090$(RESET)"
	@echo "$(CYAN)Grafana: http://localhost:3000 (admin/admin)$(RESET)"

monitoring-down:
	@echo "$(BOLD)$(YELLOW)Stopping monitoring services...$(RESET)"
	docker compose --profile monitoring down
	@echo "$(BOLD)$(GREEN)✓ Monitoring stopped!$(RESET)"

monitoring-logs:
	@echo "$(BOLD)$(CYAN)Monitoring logs:$(RESET)"
	docker compose --profile monitoring logs -f

monitoring-status:
	@echo "$(BOLD)$(CYAN)Monitoring status:$(RESET)"
	docker compose --profile monitoring ps

# ============================================================================
# Full Stack Commands (All Profiles)
# ============================================================================

full-build:
	@echo "$(BOLD)$(CYAN)Building all Docker images...$(RESET)"
	docker compose --profile full build
	@echo "$(BOLD)$(GREEN)✓ All images built!$(RESET)"

full-up:
	@echo "$(BOLD)$(CYAN)Starting ALL services (full stack)...$(RESET)"
	@mkdir -p frontend/public/site-maps
	docker compose --profile full up -d
	@echo "$(BOLD)$(GREEN)✓ Full stack started!$(RESET)"
	@echo ""
	@echo "$(BOLD)$(CYAN)Service Endpoints:$(RESET)"
	@echo "  Frontend: http://localhost:5173"
	@echo "  PostgreSQL: localhost:5433"
	@echo "  Redis: localhost:6379"
	@echo "  MediaMTX RTSP: rtsp://localhost:8554"
	@echo "  MediaMTX HLS: http://localhost:8888"
	@echo "  MediaMTX API: http://localhost:9997"
	@echo "  ONVIF Camera 1: http://172.20.0.11:80 (host port 9001)"
	@echo "  ONVIF Camera 2: http://172.20.0.12:80 (host port 9002)"
	@echo "  Site Map Generator: http://localhost:8081"
	@echo "  Prometheus: http://localhost:9090"
	@echo "  Grafana: http://localhost:3000 (admin/admin)"

full-down:
	@echo "$(BOLD)$(YELLOW)Stopping all services...$(RESET)"
	docker compose --profile full down
	@echo "$(BOLD)$(GREEN)✓ All services stopped!$(RESET)"
