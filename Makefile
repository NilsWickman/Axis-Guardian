# AXIS Surveillance System - Root Setup
# ====================================
#
# This Makefile handles initial system setup and dependency installation
# for new developers joining the project.

# Colors for output
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[0;33m
BLUE := \033[0;34m
NC := \033[0m # No Color

# Required versions
NODE_VERSION := 22.19.0
PYTHON_VERSION := 3.12

# Default target
.PHONY: help
help: ## Show this help message
	@echo "$(BLUE)AXIS Surveillance System - Initial Setup$(NC)"
	@echo "========================================"
	@echo ""
	@echo "$(YELLOW)Available commands:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(YELLOW)Quick Start for New Developers:$(NC)"
	@echo "  make check-system    # Check what's installed"
	@echo "  make install-deps    # Install missing dependencies"
	@echo "  make setup-project   # Setup shared contracts and validate"
	@echo "  make verify-install  # Verify everything works"

.PHONY: check-system
check-system: ## Check installed dependencies and versions
	@echo "$(BLUE)Checking system dependencies...$(NC)"
	@echo ""
	@echo "$(YELLOW)Operating System:$(NC)"
	@uname -a
	@echo ""
	@echo "$(YELLOW)Git:$(NC)"
	@if command -v git &> /dev/null; then \
		echo "  $(GREEN)✓ Git installed:$(NC) $$(git --version)"; \
	else \
		echo "  $(RED)✗ Git not found$(NC)"; \
	fi
	@echo ""
	@echo "$(YELLOW)Node.js:$(NC)"
	@if command -v node &> /dev/null; then \
		CURRENT_NODE=$$(node --version | sed 's/v//'); \
		if [ "$$CURRENT_NODE" = "$(NODE_VERSION)" ]; then \
			echo "  $(GREEN)✓ Node.js $(NODE_VERSION) installed$(NC)"; \
		else \
			echo "  $(YELLOW)⚠ Node.js installed but wrong version:$(NC) $$CURRENT_NODE (need $(NODE_VERSION))"; \
		fi \
	else \
		echo "  $(RED)✗ Node.js not found$(NC)"; \
	fi
	@echo ""
	@echo "$(YELLOW)npm:$(NC)"
	@if command -v npm &> /dev/null; then \
		echo "  $(GREEN)✓ npm installed:$(NC) $$(npm --version)"; \
	else \
		echo "  $(RED)✗ npm not found$(NC)"; \
	fi
	@echo ""
	@echo "$(YELLOW)NVM (Node Version Manager):$(NC)"
	@if [ -f "$$HOME/.nvm/nvm.sh" ] || command -v nvm &> /dev/null; then \
		echo "  $(GREEN)✓ NVM installed$(NC)"; \
	else \
		echo "  $(YELLOW)⚠ NVM not found (recommended for Node.js version management)$(NC)"; \
	fi
	@echo ""
	@echo "$(YELLOW)Python:$(NC)"
	@if command -v python3 &> /dev/null; then \
		CURRENT_PYTHON=$$(python3 --version | sed 's/Python //'); \
		PYTHON_MAJOR_MINOR=$$(echo $$CURRENT_PYTHON | cut -d. -f1,2); \
		if [ "$$PYTHON_MAJOR_MINOR" = "$(PYTHON_VERSION)" ]; then \
			echo "  $(GREEN)✓ Python $(PYTHON_VERSION) installed:$(NC) $$CURRENT_PYTHON"; \
		else \
			echo "  $(YELLOW)⚠ Python installed but wrong version:$(NC) $$CURRENT_PYTHON (need $(PYTHON_VERSION).x)"; \
		fi \
	else \
		echo "  $(RED)✗ Python 3 not found$(NC)"; \
	fi
	@echo ""
	@echo "$(YELLOW)pip:$(NC)"
	@if command -v pip3 &> /dev/null; then \
		echo "  $(GREEN)✓ pip3 installed:$(NC) $$(pip3 --version)"; \
	else \
		echo "  $(RED)✗ pip3 not found$(NC)"; \
	fi
	@echo ""
	@echo "$(YELLOW)Docker:$(NC)"
	@if command -v docker &> /dev/null; then \
		echo "  $(GREEN)✓ Docker installed:$(NC) $$(docker --version)"; \
		if docker info &> /dev/null; then \
			echo "  $(GREEN)✓ Docker daemon running$(NC)"; \
		else \
			echo "  $(YELLOW)⚠ Docker installed but daemon not running$(NC)"; \
		fi \
	else \
		echo "  $(YELLOW)⚠ Docker not found (optional for development)$(NC)"; \
	fi
	@echo ""
	@echo "$(YELLOW)Docker Compose:$(NC)"
	@if command -v docker-compose &> /dev/null; then \
		echo "  $(GREEN)✓ Docker Compose installed:$(NC) $$(docker-compose --version)"; \
	else \
		echo "  $(YELLOW)⚠ Docker Compose not found (optional for development)$(NC)"; \
	fi

.PHONY: install-git
install-git: ## Install Git version control
	@echo "$(BLUE)Installing Git...$(NC)"
	@if command -v git &> /dev/null; then \
		echo "$(GREEN)✓ Git already installed$(NC)"; \
	else \
		if [ "$$(uname)" = "Darwin" ]; then \
			echo "$(YELLOW)Installing Git via Homebrew...$(NC)"; \
			/bin/bash -c "$$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" || true; \
			brew install git; \
		elif [ "$$(uname)" = "Linux" ]; then \
			if command -v apt-get &> /dev/null; then \
				echo "$(YELLOW)Installing Git via apt...$(NC)"; \
				sudo apt-get update && sudo apt-get install -y git; \
			elif command -v yum &> /dev/null; then \
				echo "$(YELLOW)Installing Git via yum...$(NC)"; \
				sudo yum install -y git; \
			elif command -v dnf &> /dev/null; then \
				echo "$(YELLOW)Installing Git via dnf...$(NC)"; \
				sudo dnf install -y git; \
			else \
				echo "$(RED)✗ Unable to install Git automatically. Please install manually.$(NC)"; \
				exit 1; \
			fi \
		else \
			echo "$(RED)✗ Unsupported operating system for automatic Git installation$(NC)"; \
			exit 1; \
		fi \
	fi

.PHONY: install-nvm
install-nvm: ## Install Node Version Manager (NVM)
	@echo "$(BLUE)Installing NVM...$(NC)"
	@if [ -f "$$HOME/.nvm/nvm.sh" ]; then \
		echo "$(GREEN)✓ NVM already installed$(NC)"; \
	else \
		echo "$(YELLOW)Downloading and installing NVM...$(NC)"; \
		curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash; \
		echo "$(GREEN)✓ NVM installed$(NC)"; \
		echo "$(YELLOW)Please restart your terminal or run: source ~/.bashrc$(NC)"; \
	fi

.PHONY: install-node
install-node: ## Install Node.js v22.19.0 using NVM
	@echo "$(BLUE)Installing Node.js $(NODE_VERSION)...$(NC)"
	@if [ ! -f "$$HOME/.nvm/nvm.sh" ]; then \
		echo "$(YELLOW)NVM not found, installing first...$(NC)"; \
		$(MAKE) install-nvm; \
		echo "$(YELLOW)Please restart terminal and run 'make install-node' again$(NC)"; \
		exit 1; \
	fi
	@export NVM_DIR="$$HOME/.nvm"; \
	[ -s "$$NVM_DIR/nvm.sh" ] && . "$$NVM_DIR/nvm.sh"; \
	if command -v node &> /dev/null; then \
		CURRENT_NODE=$$(node --version | sed 's/v//'); \
		if [ "$$CURRENT_NODE" = "$(NODE_VERSION)" ]; then \
			echo "$(GREEN)✓ Node.js $(NODE_VERSION) already installed$(NC)"; \
		else \
			echo "$(YELLOW)Installing Node.js $(NODE_VERSION)...$(NC)"; \
			nvm install $(NODE_VERSION); \
			nvm use $(NODE_VERSION); \
			nvm alias default $(NODE_VERSION); \
		fi \
	else \
		echo "$(YELLOW)Installing Node.js $(NODE_VERSION)...$(NC)"; \
		nvm install $(NODE_VERSION); \
		nvm use $(NODE_VERSION); \
		nvm alias default $(NODE_VERSION); \
	fi

.PHONY: install-python
install-python: ## Install Python 3.12
	@echo "$(BLUE)Installing Python $(PYTHON_VERSION)...$(NC)"
	@if command -v python3 &> /dev/null; then \
		CURRENT_PYTHON=$$(python3 --version | sed 's/Python //'); \
		PYTHON_MAJOR_MINOR=$$(echo $$CURRENT_PYTHON | cut -d. -f1,2); \
		if [ "$$PYTHON_MAJOR_MINOR" = "$(PYTHON_VERSION)" ]; then \
			echo "$(GREEN)✓ Python $(PYTHON_VERSION) already installed$(NC)"; \
		else \
			echo "$(YELLOW)Python $$CURRENT_PYTHON found, but need $(PYTHON_VERSION).x$(NC)"; \
			$(MAKE) _install-python-platform; \
		fi \
	else \
		$(MAKE) _install-python-platform; \
	fi

.PHONY: _install-python-platform
_install-python-platform: ## Internal: Platform-specific Python installation
	@if [ "$$(uname)" = "Darwin" ]; then \
		echo "$(YELLOW)Installing Python $(PYTHON_VERSION) via Homebrew...$(NC)"; \
		if ! command -v brew &> /dev/null; then \
			echo "$(YELLOW)Installing Homebrew first...$(NC)"; \
			/bin/bash -c "$$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"; \
		fi; \
		brew install python@$(PYTHON_VERSION); \
		echo "$(GREEN)✓ Python $(PYTHON_VERSION) installed$(NC)"; \
	elif [ "$$(uname)" = "Linux" ]; then \
		if command -v apt-get &> /dev/null; then \
			echo "$(YELLOW)Installing Python $(PYTHON_VERSION) via apt...$(NC)"; \
			sudo apt-get update; \
			sudo apt-get install -y software-properties-common; \
			sudo add-apt-repository ppa:deadsnakes/ppa -y; \
			sudo apt-get update; \
			sudo apt-get install -y python$(PYTHON_VERSION) python$(PYTHON_VERSION)-pip python$(PYTHON_VERSION)-venv; \
			sudo ln -sf /usr/bin/python$(PYTHON_VERSION) /usr/local/bin/python3; \
		elif command -v dnf &> /dev/null; then \
			echo "$(YELLOW)Installing Python $(PYTHON_VERSION) via dnf...$(NC)"; \
			sudo dnf install -y python$(PYTHON_VERSION) python$(PYTHON_VERSION)-pip; \
		else \
			echo "$(RED)✗ Unable to install Python automatically. Please install Python $(PYTHON_VERSION) manually.$(NC)"; \
			exit 1; \
		fi \
	else \
		echo "$(RED)✗ Unsupported operating system for automatic Python installation$(NC)"; \
		exit 1; \
	fi

.PHONY: install-docker
install-docker: ## Install Docker and Docker Compose (optional)
	@echo "$(BLUE)Installing Docker...$(NC)"
	@if command -v docker &> /dev/null; then \
		echo "$(GREEN)✓ Docker already installed$(NC)"; \
	else \
		if [ "$$(uname)" = "Darwin" ]; then \
			echo "$(YELLOW)Please install Docker Desktop from: https://docs.docker.com/desktop/install/mac/$(NC)"; \
		elif [ "$$(uname)" = "Linux" ]; then \
			echo "$(YELLOW)Installing Docker via convenience script...$(NC)"; \
			curl -fsSL https://get.docker.com -o get-docker.sh; \
			sudo sh get-docker.sh; \
			sudo usermod -aG docker $$USER; \
			rm get-docker.sh; \
			echo "$(GREEN)✓ Docker installed$(NC)"; \
			echo "$(YELLOW)Please log out and back in for Docker group membership to take effect$(NC)"; \
		else \
			echo "$(RED)✗ Unsupported operating system for automatic Docker installation$(NC)"; \
		fi \
	fi

.PHONY: install-deps
install-deps: ## Install all required dependencies
	@echo "$(BLUE)Installing all dependencies...$(NC)"
	@echo ""
	$(MAKE) install-git
	@echo ""
	$(MAKE) install-nvm
	@echo ""
	$(MAKE) install-node
	@echo ""
	$(MAKE) install-python
	@echo ""
	@echo "$(GREEN)✓ Core dependencies installed$(NC)"
	@echo ""
	@echo "$(YELLOW)Optional: Install Docker for containerized development:$(NC)"
	@echo "  make install-docker"

.PHONY: setup-project
setup-project: ## Setup the AXIS project after dependencies are installed
	@echo "$(BLUE)Setting up AXIS project...$(NC)"
	@echo ""
	@if [ ! -f "shared/package.json" ]; then \
		echo "$(RED)✗ shared/package.json not found. Are you in the correct directory?$(NC)"; \
		exit 1; \
	fi
	@echo "$(YELLOW)Setting up shared contracts...$(NC)"
	cd shared && make setup
	@echo ""
	@echo "$(YELLOW)Validating OpenAPI specifications...$(NC)"
	cd shared && make validate
	@echo ""
	@echo "$(YELLOW)Generating models and clients...$(NC)"
	cd shared && make generate
	@echo ""
	@echo "$(GREEN)✓ Project setup complete$(NC)"
	@echo ""
	@echo "$(YELLOW)Next steps:$(NC)"
	@echo "  1. Choose your team setup:"
	@echo "     cd shared && make team-setup TEAM=frontend"
	@echo "     cd shared && make team-setup TEAM=communications"
	@echo "     cd shared && make team-setup TEAM=intelligence"
	@echo ""
	@echo "  2. Start development environment:"
	@echo "     cd shared && make docs    # API documentation"
	@echo "     cd shared && make mock    # Mock servers"

.PHONY: verify-install
verify-install: ## Verify that everything is installed correctly
	@echo "$(BLUE)Verifying installation...$(NC)"
	@echo ""
	@echo "$(YELLOW)Checking dependencies...$(NC)"
	@$(MAKE) check-system
	@echo ""
	@echo "$(YELLOW)Testing shared project setup...$(NC)"
	@if [ -f "shared/package.json" ]; then \
		echo "$(GREEN)✓ Shared package.json found$(NC)"; \
	else \
		echo "$(RED)✗ Shared package.json missing$(NC)"; \
		exit 1; \
	fi
	@if [ -d "shared/node_modules" ]; then \
		echo "$(GREEN)✓ Shared dependencies installed$(NC)"; \
	else \
		echo "$(YELLOW)⚠ Shared dependencies not installed. Run: make setup-project$(NC)"; \
	fi
	@if [ -f "shared/docs/api-contracts/shared/models.yaml" ]; then \
		echo "$(GREEN)✓ OpenAPI contracts found$(NC)"; \
	else \
		echo "$(RED)✗ OpenAPI contracts missing$(NC)"; \
		exit 1; \
	fi
	@echo ""
	@echo "$(YELLOW)Testing basic commands...$(NC)"
	@export NVM_DIR="$$HOME/.nvm"; \
	[ -s "$$NVM_DIR/nvm.sh" ] && . "$$NVM_DIR/nvm.sh"; \
	if command -v node &> /dev/null; then \
		echo "$(GREEN)✓ Node.js accessible$(NC)"; \
	else \
		echo "$(RED)✗ Node.js not accessible$(NC)"; \
	fi
	@if command -v python3 &> /dev/null; then \
		echo "$(GREEN)✓ Python 3 accessible$(NC)"; \
	else \
		echo "$(RED)✗ Python 3 not accessible$(NC)"; \
	fi
	@if command -v pip3 &> /dev/null; then \
		echo "$(GREEN)✓ pip3 accessible$(NC)"; \
	else \
		echo "$(RED)✗ pip3 not accessible$(NC)"; \
	fi
	@echo ""
	@echo "$(GREEN)✓ Verification complete$(NC)"

.PHONY: clean-install
clean-install: ## Clean installation and start fresh
	@echo "$(BLUE)Cleaning installation...$(NC)"
	@echo "$(YELLOW)Removing shared/node_modules...$(NC)"
	rm -rf shared/node_modules
	@echo "$(YELLOW)Removing shared generated files...$(NC)"
	cd shared && make clean || true
	@echo "$(GREEN)✓ Clean complete. Run 'make setup-project' to reinstall$(NC)"

.PHONY: doctor
doctor: ## Run comprehensive system check and provide recommendations
	@echo "$(BLUE)AXIS Development Environment Doctor$(NC)"
	@echo "=================================="
	@echo ""
	@$(MAKE) check-system
	@echo ""
	@echo "$(YELLOW)Recommendations:$(NC)"
	@NEED_SETUP=false; \
	if ! command -v git &> /dev/null; then \
		echo "  $(RED)⚠ Install Git: make install-git$(NC)"; \
		NEED_SETUP=true; \
	fi; \
	if [ ! -f "$$HOME/.nvm/nvm.sh" ]; then \
		echo "  $(YELLOW)⚠ Install NVM for Node.js management: make install-nvm$(NC)"; \
	fi; \
	export NVM_DIR="$$HOME/.nvm"; \
	[ -s "$$NVM_DIR/nvm.sh" ] && . "$$NVM_DIR/nvm.sh"; \
	if ! command -v node &> /dev/null; then \
		echo "  $(RED)⚠ Install Node.js: make install-node$(NC)"; \
		NEED_SETUP=true; \
	else \
		CURRENT_NODE=$$(node --version | sed 's/v//'); \
		if [ "$$CURRENT_NODE" != "$(NODE_VERSION)" ]; then \
			echo "  $(YELLOW)⚠ Update Node.js to $(NODE_VERSION): make install-node$(NC)"; \
		fi \
	fi; \
	if ! command -v python3 &> /dev/null; then \
		echo "  $(RED)⚠ Install Python: make install-python$(NC)"; \
		NEED_SETUP=true; \
	else \
		CURRENT_PYTHON=$$(python3 --version | sed 's/Python //'); \
		PYTHON_MAJOR_MINOR=$$(echo $$CURRENT_PYTHON | cut -d. -f1,2); \
		if [ "$$PYTHON_MAJOR_MINOR" != "$(PYTHON_VERSION)" ]; then \
			echo "  $(YELLOW)⚠ Update Python to $(PYTHON_VERSION).x: make install-python$(NC)"; \
			NEED_SETUP=true; \
		fi \
	fi; \
	if ! command -v docker &> /dev/null; then \
		echo "  $(YELLOW)⚠ Install Docker (optional): make install-docker$(NC)"; \
	fi; \
	if [ ! -d "shared/node_modules" ]; then \
		echo "  $(YELLOW)⚠ Setup project: make setup-project$(NC)"; \
	fi; \
	if [ "$$NEED_SETUP" = "true" ]; then \
		echo ""; \
		echo "$(GREEN)Run 'make install-deps' to install missing dependencies$(NC)"; \
	else \
		echo ""; \
		echo "$(GREEN)✓ All core dependencies are installed!$(NC)"; \
	fi

.PHONY: update
update: ## Update all dependencies to latest versions
	@echo "$(BLUE)Updating dependencies...$(NC)"
	@export NVM_DIR="$$HOME/.nvm"; \
	[ -s "$$NVM_DIR/nvm.sh" ] && . "$$NVM_DIR/nvm.sh"; \
	if command -v nvm &> /dev/null; then \
		echo "$(YELLOW)Updating Node.js to $(NODE_VERSION)...$(NC)"; \
		nvm install $(NODE_VERSION); \
		nvm use $(NODE_VERSION); \
		nvm alias default $(NODE_VERSION); \
	fi
	@if [ -d "shared/node_modules" ]; then \
		echo "$(YELLOW)Updating npm packages...$(NC)"; \
		cd shared && npm update; \
	fi
	@echo "$(GREEN)✓ Update complete$(NC)"