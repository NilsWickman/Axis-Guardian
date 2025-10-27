#!/bin/bash
###############################################
# Axis-Guardian Deployment Script
#
# This script deploys the Axis-Guardian application:
# - Pulls latest code from git
# - Builds frontend
# - Sets up Python virtual environments
# - Configures database
# - Installs systemd services
# - Starts all services
#
# Usage:
#   sudo bash scripts/deploy.sh
###############################################

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    log_error "Please run as root (use sudo)"
    exit 1
fi

# Deployment variables
APP_DIR="/var/www/axis-guardian"
ENV_FILE="$APP_DIR/.env.production"
USER="www-data"
GROUP="www-data"

log_info "Starting Axis-Guardian deployment..."
log_info "Application directory: $APP_DIR"

###############################################
# 1. Check if app directory exists
###############################################
if [ ! -d "$APP_DIR" ]; then
    log_error "Application directory does not exist: $APP_DIR"
    log_error "Please clone the repository first:"
    log_error "  git clone https://github.com/your-username/Axis-Guardian.git $APP_DIR"
    exit 1
fi

cd "$APP_DIR"

###############################################
# 2. Pull latest code
###############################################
log_step "Pulling latest code from git..."
sudo -u $USER git pull origin main || log_warn "Git pull failed or not a git repository"

###############################################
# 3. Check environment file
###############################################
log_step "Checking environment configuration..."
if [ ! -f "$ENV_FILE" ]; then
    log_error "Production environment file not found: $ENV_FILE"
    log_error "Please copy .env.production and configure it:"
    log_error "  cp .env.production.example .env.production"
    log_error "  vim .env.production"
    exit 1
fi

# Source environment variables
set -a
source "$ENV_FILE"
set +a

log_info "Environment loaded from $ENV_FILE"

###############################################
# 4. Install Node.js dependencies
###############################################
log_step "Installing Node.js dependencies..."
sudo -u $USER yarn install --frozen-lockfile

###############################################
# 5. Build frontend
###############################################
log_step "Building frontend for production..."
cd frontend
sudo -u $USER yarn build

if [ ! -d "dist" ]; then
    log_error "Frontend build failed - dist directory not created"
    exit 1
fi

log_info "Frontend built successfully: $APP_DIR/frontend/dist"
cd "$APP_DIR"

###############################################
# 6. Setup Python virtual environments
###############################################
log_step "Setting up Python virtual environments..."

# WebRTC Detection Service
if [ -d "simulation/webrtc-detection" ]; then
    log_info "Setting up WebRTC detection service..."
    cd simulation/webrtc-detection

    # Create venv if doesn't exist
    if [ ! -d "venv" ]; then
        sudo -u $USER python3.11 -m venv venv
    fi

    # Install dependencies
    sudo -u $USER venv/bin/pip install --upgrade pip
    sudo -u $USER venv/bin/pip install -r requirements.txt

    cd "$APP_DIR"
fi

# VAPIX Simulator
if [ -d "simulation/vapix-simulator" ]; then
    log_info "Setting up VAPIX simulator..."
    cd simulation/vapix-simulator

    if [ ! -d "venv" ]; then
        sudo -u $USER python3.11 -m venv venv
    fi

    sudo -u $USER venv/bin/pip install --upgrade pip
    sudo -u $USER venv/bin/pip install -r requirements.txt

    cd "$APP_DIR"
fi

###############################################
# 7. Download YOLOv8 models
###############################################
log_step "Downloading YOLOv8 models..."
mkdir -p shared/models
cd shared/models

if [ ! -f "yolov8n.pt" ]; then
    log_info "Downloading YOLOv8 nano model..."
    sudo -u $USER wget -q https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n.pt
fi

if [ ! -f "yolov8x.pt" ]; then
    log_info "Downloading YOLOv8 extra-large model (for preprocessing)..."
    sudo -u $USER wget -q https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8x.pt
fi

cd "$APP_DIR"

###############################################
# 8. Build MediaMTX
###############################################
log_step "Building MediaMTX..."
cd simulation/mediamtx

if [ ! -f "mediamtx" ]; then
    log_info "MediaMTX binary not found, building from source..."

    # Check if Go is installed
    if ! command -v go &> /dev/null; then
        log_error "Go is not installed. Installing Go..."
        wget -q https://go.dev/dl/go1.21.5.linux-amd64.tar.gz
        tar -C /usr/local -xzf go1.21.5.linux-amd64.tar.gz
        export PATH=$PATH:/usr/local/go/bin
        echo 'export PATH=$PATH:/usr/local/go/bin' >> /etc/profile
    fi

    sudo -u $USER make build || log_error "MediaMTX build failed"
fi

cd "$APP_DIR"

###############################################
# 9. Setup PostgreSQL Database
###############################################
log_step "Setting up PostgreSQL database..."

# Check if database exists
DB_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$POSTGRES_DB'" || echo "0")

if [ "$DB_EXISTS" != "1" ]; then
    log_info "Creating database: $POSTGRES_DB"
    sudo -u postgres createdb "$POSTGRES_DB"
fi

# Check if user exists
USER_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$POSTGRES_USER'" || echo "0")

if [ "$USER_EXISTS" != "1" ]; then
    log_info "Creating database user: $POSTGRES_USER"
    sudo -u postgres psql -c "CREATE USER $POSTGRES_USER WITH PASSWORD '$POSTGRES_PASSWORD';"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $POSTGRES_DB TO $POSTGRES_USER;"
fi

log_info "Database setup complete"

###############################################
# 10. Setup Redis
###############################################
log_step "Configuring Redis..."

# Set Redis password
redis-cli CONFIG SET requirepass "$REDIS_PASSWORD" || log_warn "Failed to set Redis password"

log_info "Redis configured"

###############################################
# 11. Install systemd services
###############################################
log_step "Installing systemd services..."

# Copy service files
cp systemd/*.service /etc/systemd/system/

# Reload systemd
systemctl daemon-reload

# Enable services
systemctl enable mediamtx.service
systemctl enable webrtc-detection.service
systemctl enable camera-streams.service
systemctl enable auth-service.service
systemctl enable vapix-simulator.service || log_warn "VAPIX simulator service not enabled (may not exist)"

log_info "Systemd services installed and enabled"

###############################################
# 12. Configure Nginx
###############################################
log_step "Configuring Nginx..."

# Process template (replace ${DOMAIN} and other vars)
envsubst '${DOMAIN}' < nginx/axis-guardian.conf > /tmp/axis-guardian.conf

# Copy to Nginx sites-available
cp /tmp/axis-guardian.conf /etc/nginx/sites-available/axis-guardian

# Create symlink to sites-enabled
ln -sf /etc/nginx/sites-available/axis-guardian /etc/nginx/sites-enabled/axis-guardian

# Remove default site
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t || {
    log_error "Nginx configuration test failed"
    exit 1
}

log_info "Nginx configured"

###############################################
# 13. Set proper permissions
###############################################
log_step "Setting file permissions..."

chown -R $USER:$GROUP "$APP_DIR"
chmod -R 755 "$APP_DIR"

# Restrict .env.production permissions
chmod 600 "$ENV_FILE"
chown $USER:$GROUP "$ENV_FILE"

# Make scripts executable
chmod +x "$APP_DIR"/scripts/*.sh

log_info "Permissions set"

###############################################
# 14. Start services
###############################################
log_step "Starting services..."

# Start MediaMTX first (other services depend on it)
systemctl restart mediamtx.service
sleep 3

# Start camera streams
systemctl restart camera-streams.service
sleep 2

# Start WebRTC detection
systemctl restart webrtc-detection.service
sleep 2

# Start auth service
systemctl restart auth-service.service
sleep 2

# Start VAPIX simulator (if exists)
systemctl restart vapix-simulator.service 2>/dev/null || log_warn "VAPIX simulator not started"

# Start Nginx
systemctl restart nginx.service

log_info "All services started"

###############################################
# 15. Check service status
###############################################
log_step "Checking service status..."

check_service() {
    if systemctl is-active --quiet "$1"; then
        log_info "  ✓ $1 is running"
    else
        log_error "  ✗ $1 failed to start"
        systemctl status "$1" --no-pager -l
    fi
}

check_service "mediamtx.service"
check_service "camera-streams.service"
check_service "webrtc-detection.service"
check_service "auth-service.service"
check_service "nginx.service"

###############################################
# 16. Print deployment summary
###############################################
log_info "========================================="
log_info "Deployment Complete!"
log_info "========================================="
echo ""
log_info "Application URLs:"
echo "  Frontend: https://$DOMAIN"
echo "  API: https://$DOMAIN/api"
echo "  WebRTC: https://$DOMAIN:8080"
echo ""
log_info "Service Management:"
echo "  View logs: journalctl -u <service-name> -f"
echo "  Restart: systemctl restart <service-name>"
echo "  Status: systemctl status <service-name>"
echo ""
log_info "Useful commands:"
echo "  Check all services: systemctl status mediamtx webrtc-detection camera-streams auth-service nginx"
echo "  View application logs: tail -f /var/log/axis-guardian/*.log"
echo "  Backup database: /usr/local/bin/axis-guardian-backup.sh"
echo ""
log_warn "Next steps:"
echo "  1. Verify services are running: systemctl status"
echo "  2. Test frontend: curl https://$DOMAIN"
echo "  3. Check logs for errors: journalctl -xe"
echo "  4. Update DNS if needed (A record pointing to this server)"
echo ""
log_info "========================================="
