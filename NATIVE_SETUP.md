# Native Installation Guide

This guide provides detailed instructions for setting up the Axis-Guardian project using **native installations** only (no Docker required).

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [System Dependencies](#system-dependencies)
3. [PostgreSQL Setup](#postgresql-setup)
4. [MediaMTX Setup](#mediamtx-setup)
5. [Python Services Setup](#python-services-setup)
6. [Node.js Setup](#nodejs-setup)
7. [Environment Configuration](#environment-configuration)
8. [Verification](#verification)
9. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

- **Operating System**: Ubuntu 20.04+, Debian 11+, or macOS 12+
- **Node.js**: v22.19.0 (use nvm for version management)
- **Python**: 3.12+
- **Git**: Latest version
- **Make**: Build automation tool
- **Curl**: For API testing

### Optional (for GPU acceleration)

- **CUDA**: 12.x
- **cuDNN**: 8.x
- **NVIDIA GPU**: For accelerated object detection

## System Dependencies

### Ubuntu/Debian

```bash
# Update package lists
sudo apt-get update

# Install build essentials
sudo apt-get install -y \
  build-essential \
  git \
  curl \
  wget \
  pkg-config \
  libssl-dev

# Install FFmpeg (required for camera streaming)
sudo apt-get install -y ffmpeg

# Install Python development headers
sudo apt-get install -y \
  python3.12 \
  python3.12-venv \
  python3.12-dev \
  python3-pip

# Install system libraries for OpenCV
sudo apt-get install -y \
  libsm6 \
  libxext6 \
  libxrender-dev \
  libgomp1 \
  libglib2.0-0 \
  libgl1-mesa-glx

# Verify installations
ffmpeg -version
python3.12 --version
```

### macOS

```bash
# Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install dependencies
brew install \
  python@3.12 \
  ffmpeg \
  postgresql@15 \
  postgis \
  pkg-config

# Verify installations
ffmpeg -version
python3.12 --version
```

## PostgreSQL Setup

### Ubuntu/Debian Installation

```bash
# Add PostgreSQL APT repository
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -

# Update and install PostgreSQL 15 with PostGIS
sudo apt-get update
sudo apt-get install -y postgresql-15 postgresql-15-postgis-3

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify installation
sudo systemctl status postgresql
```

### macOS Installation

```bash
# Install PostgreSQL with PostGIS
brew install postgresql@15 postgis

# Start PostgreSQL service
brew services start postgresql@15

# Verify installation
brew services list | grep postgresql
```

### Database Configuration

```bash
# Create database and user
sudo -u postgres psql << 'EOF'
-- Create development user
CREATE USER dev WITH PASSWORD 'dev';

-- Create database
CREATE DATABASE surveillance_dev OWNER dev;

-- Connect to database
\c surveillance_dev

-- Install PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE surveillance_dev TO dev;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO dev;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO dev;

-- Verify
\dx
\q
EOF

# Test connection
psql -h localhost -U dev -d surveillance_dev -c "SELECT version();"
```

**Expected output:**
```
PostgreSQL 15.x on x86_64-pc-linux-gnu, compiled by gcc...
```

## MediaMTX Setup

MediaMTX is the media server that handles RTSP/WebRTC camera streams.

### Building MediaMTX

```bash
# Navigate to MediaMTX source directory
cd simulation/mediamtx

# Build MediaMTX (requires Go compiler)
# Option 1: Build from source (if Go is installed)
make build

# Option 2: Download pre-built binary (recommended)
# For Linux x86_64
wget https://github.com/bluenviron/mediamtx/releases/download/v1.0.0/mediamtx_v1.0.0_linux_amd64.tar.gz
tar -xzf mediamtx_v1.0.0_linux_amd64.tar.gz

# For macOS ARM64 (M1/M2)
wget https://github.com/bluenviron/mediamtx/releases/download/v1.0.0/mediamtx_v1.0.0_darwin_arm64.tar.gz
tar -xzf mediamtx_v1.0.0_darwin_arm64.tar.gz

# Make executable
chmod +x mediamtx

# Verify
./mediamtx --version
```

### Configure MediaMTX

```bash
# Create custom configuration (if not exists)
cp mediamtx.yml mediamtx.custom.yml

# Edit configuration as needed
vim mediamtx.custom.yml
```

**Key configuration options:**

```yaml
# RTSP server
rtspAddress: :8554

# HLS server
hlsAddress: :8888

# WebRTC server
webrtcAddress: :8889

# API server
api: yes
apiAddress: :9997

# Recording path
recordPath: ./recordings/%path/%Y-%m-%d_%H-%M-%S
```

### Start MediaMTX

```bash
# From project root
make infrastructure

# Or manually
cd simulation/mediamtx
./mediamtx mediamtx.custom.yml

# Verify it's running
curl http://localhost:9997/v3/config/global/get
```

## Python Services Setup

### WebRTC Detection Service

```bash
# Navigate to service directory
cd simulation/webrtc-detection

# Create virtual environment
python3.12 -m venv venv

# Activate virtual environment
source venv/bin/activate  # Linux/macOS
# OR
venv\Scripts\activate  # Windows

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Download YOLO model to shared location
cd ../../../shared/models
wget https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n.pt

# Verify installation
cd ../../simulation/webrtc-detection
python -c "import cv2; import torch; from ultralytics import YOLO; print('All dependencies installed successfully')"

# Deactivate when done
deactivate
```

### Object Detection Service

```bash
# Navigate to service directory
cd simulation/object-detection

# Create virtual environment
python3.12 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Verify installation
python -c "import cv2; import paho.mqtt.client as mqtt; print('Dependencies OK')"

# Deactivate when done
deactivate
```

## Node.js Setup

### Install Node Version Manager (nvm)

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload shell configuration
source ~/.bashrc  # or ~/.zshrc for zsh

# Install Node.js 22.19.0
nvm install 22.19.0
nvm use 22.19.0
nvm alias default 22.19.0

# Verify installation
node --version  # Should show v22.19.0
npm --version
```

### Install Project Dependencies

```bash
# From project root
npm install

# This installs dependencies for:
# - Root workspace
# - Frontend workspace
# - Shared types workspace
```

## Environment Configuration

### Create Root Environment File

```bash
# From project root
cp .env.example .env

# Edit configuration
vim .env  # or nano .env
```

### Required Environment Variables

```bash
# Database Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=dev
POSTGRES_PASSWORD=dev
POSTGRES_DB=surveillance_dev

# MediaMTX Configuration
MEDIAMTX_HOST=localhost
MEDIAMTX_RTSP_PORT=8554
MEDIAMTX_HLS_PORT=8888
MEDIAMTX_WEBRTC_PORT=8889
MEDIAMTX_API_PORT=9997

# WebRTC Detection Service
WEBRTC_DETECTION_HOST=0.0.0.0
WEBRTC_DETECTION_PORT=8081
MODEL_PATH=/home/nilwi971/projects/Axis-Guardian/shared/models/yolov8n.pt
CONFIDENCE_THRESHOLD=0.5
IOU_THRESHOLD=0.45
FRAME_SKIP=1
MAX_FPS=30
DRAW_ON_FRAME=true

# Camera URLs (RTSP streams from MediaMTX)
CAMERA1_URL=rtsp://localhost:8554/camera1
CAMERA2_URL=rtsp://localhost:8554/camera2
CAMERA3_URL=rtsp://localhost:8554/camera3

# Frontend Configuration
VITE_API_BASE_URL=http://localhost:8000
VITE_RTSP_PROXY_URL=http://localhost:8081
VITE_LOG_LEVEL=info
```

**Note:** Adjust paths to match your system configuration.

## Verification

### Test Each Component

#### 1. PostgreSQL

```bash
# Test connection
psql -h localhost -U dev -d surveillance_dev -c "SELECT version();"

# Expected: PostgreSQL version info
```

#### 2. MediaMTX

```bash
# Check if running
ps aux | grep mediamtx

# Test API
curl http://localhost:9997/v3/config/global/get

# Expected: JSON configuration response
```

#### 3. FFmpeg

```bash
# Verify version
ffmpeg -version

# Expected: FFmpeg version 7.x or higher
```

#### 4. Python Services

```bash
# WebRTC Detection
cd simulation/webrtc-detection
source venv/bin/activate
python -c "from src.config import settings; print(f'WebRTC Detection configured on port {settings.port}')"

# Object Detection
cd ../object-detection
source venv/bin/activate
python -c "from src.config import settings; print('Object detection configured successfully')"
```

#### 5. Node.js Frontend

```bash
# From project root
npm run build

# Expected: Successful build output with no errors
```

### Full System Test

```bash
# From project root
make setup    # Initial setup
make dev      # Start all services

# Access in browser:
# - Frontend: http://localhost:5173
# - WebRTC Detection: http://localhost:8081/health
# - MediaMTX API: http://localhost:9997/v3/config/global/get
```

## Troubleshooting

### PostgreSQL Issues

**Problem: Connection refused**

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start if not running
sudo systemctl start postgresql

# Check port
sudo lsof -i :5432
```

**Problem: Authentication failed**

```bash
# Reset user password
sudo -u postgres psql -c "ALTER USER dev WITH PASSWORD 'dev';"

# Check pg_hba.conf authentication method
sudo vim /etc/postgresql/15/main/pg_hba.conf
# Ensure: local all dev md5
```

### MediaMTX Issues

**Problem: MediaMTX won't start**

```bash
# Check port conflicts
sudo lsof -i :8554
sudo lsof -i :9997

# Kill conflicting process
kill -9 <PID>

# Check configuration
cd simulation/mediamtx
./mediamtx --help
```

**Problem: Can't access RTSP streams**

```bash
# Test with ffplay
ffplay rtsp://localhost:8554/camera1

# Check MediaMTX logs
tail -f simulation/mediamtx/logs/*.log
```

### Python Service Issues

**Problem: Module not found**

```bash
# Verify virtual environment is activated
which python  # Should show venv path

# Reinstall dependencies
pip install --force-reinstall -r requirements.txt
```

**Problem: CUDA/GPU not detected**

```bash
# Verify CUDA installation
nvidia-smi

# Check PyTorch CUDA support
python -c "import torch; print(f'CUDA available: {torch.cuda.is_available()}')"

# Install CUDA-enabled PyTorch (if needed)
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
```

### Node.js Issues

**Problem: Node version mismatch**

```bash
# Check current version
node --version

# Switch to correct version
nvm use 22.19.0

# Set as default
nvm alias default 22.19.0
```

**Problem: Dependency installation fails**

```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules
rm -rf node_modules frontend/node_modules

# Reinstall
npm install
```

### Port Conflicts

```bash
# Check all development ports
make cleanup-ports

# Or manually check specific ports
lsof -i :5173  # Frontend
lsof -i :8081  # WebRTC Detection
lsof -i :8554  # MediaMTX RTSP
lsof -i :5432  # PostgreSQL
```

## Next Steps

After completing native installation:

1. **Configure cameras**: Add your camera streams in `.env`
2. **Start development**: Run `make dev` to start all services
3. **Access frontend**: Navigate to `http://localhost:5173`
4. **View documentation**: Check service-specific READMEs for advanced configuration

## Support

For issues or questions:

1. Check [README.md](README.md) for project overview
2. Review [ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md) for configuration details
3. Consult service-specific documentation in `simulation/services/*/README.md`
4. Check logs in `simulation/services/*/logs/`

## Migration from Docker

If migrating from a Docker-based setup:

1. **Stop all containers**: Services now run natively
2. **Remove volumes**: Data is stored in native directories
3. **Update scripts**: Replace Docker commands with native equivalents
4. **Reconfigure ports**: Some ports may have changed (check `.env`)
5. **Update paths**: File paths are now absolute, not container-relative
