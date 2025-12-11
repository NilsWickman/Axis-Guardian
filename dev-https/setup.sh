#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CERTS_DIR="$SCRIPT_DIR/certs"

echo -e "${GREEN}=== Axis-Guardian Local HTTPS Setup ===${NC}"
echo ""

# Check for mkcert
if ! command -v mkcert &> /dev/null; then
    echo -e "${YELLOW}mkcert is not installed. Installing...${NC}"

    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if command -v apt-get &> /dev/null; then
            sudo apt-get update && sudo apt-get install -y libnss3-tools
            curl -JLO "https://dl.filippo.io/mkcert/latest?for=linux/amd64"
            chmod +x mkcert-v*-linux-amd64
            sudo mv mkcert-v*-linux-amd64 /usr/local/bin/mkcert
        elif command -v pacman &> /dev/null; then
            sudo pacman -S mkcert nss
        else
            echo -e "${RED}Please install mkcert manually: https://github.com/FiloSottile/mkcert${NC}"
            exit 1
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        brew install mkcert nss
    else
        echo -e "${RED}Unsupported OS. Please install mkcert manually: https://github.com/FiloSottile/mkcert${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}mkcert found: $(which mkcert)${NC}"

# Install local CA
echo ""
echo -e "${YELLOW}Installing local Certificate Authority...${NC}"
echo -e "${YELLOW}(You may be prompted for your password)${NC}"
mkcert -install

# Generate certificates
echo ""
echo -e "${YELLOW}Generating certificates for local domains...${NC}"
mkdir -p "$CERTS_DIR"
cd "$CERTS_DIR"

mkcert \
    "axis.local" \
    "api.axis.local" \
    "camera1.axis.local" \
    "camera2.axis.local" \
    "*.axis.local" \
    "localhost" \
    "127.0.0.1" \
    "::1"

# Rename to standard names
mv *+7.pem axis.crt
mv *+7-key.pem axis.key

echo ""
echo -e "${GREEN}Certificates generated:${NC}"
ls -la "$CERTS_DIR"

# Add hosts entries
echo ""
echo -e "${YELLOW}Checking /etc/hosts entries...${NC}"

HOSTS_ENTRIES="127.0.0.1 axis.local api.axis.local camera1.axis.local camera2.axis.local"

if grep -q "axis.local" /etc/hosts; then
    echo -e "${GREEN}Hosts entries already exist${NC}"
else
    echo -e "${YELLOW}Adding hosts entries (requires sudo)...${NC}"
    echo "$HOSTS_ENTRIES" | sudo tee -a /etc/hosts > /dev/null
    echo -e "${GREEN}Hosts entries added${NC}"
fi

# Create .env.local files if they don't exist
echo ""
echo -e "${YELLOW}Creating environment files for HTTPS mode...${NC}"

FRONTEND_ENV_LOCAL="$SCRIPT_DIR/../frontend/.env.local"
if [ ! -f "$FRONTEND_ENV_LOCAL" ]; then
    cat > "$FRONTEND_ENV_LOCAL" << 'EOF'
# HTTPS Development Mode
# This file is loaded in addition to .env when using HTTPS dev mode

# Override tracking service URLs for HTTPS
VITE_TRACKING_WS_URL=wss://api.axis.local/ws
VITE_TRACKING_API_URL=https://api.axis.local

# Override camera emulator URLs for HTTPS
VITE_CAMERA1_WEBRTC_URL=https://camera1.axis.local
VITE_CAMERA2_WEBRTC_URL=https://camera2.axis.local
EOF
    echo -e "${GREEN}Created $FRONTEND_ENV_LOCAL${NC}"
else
    echo -e "${YELLOW}$FRONTEND_ENV_LOCAL already exists, skipping${NC}"
fi

TRACKING_ENV_LOCAL="$SCRIPT_DIR/../tracking-service/.env.local"
if [ ! -f "$TRACKING_ENV_LOCAL" ]; then
    cat > "$TRACKING_ENV_LOCAL" << 'EOF'
# HTTPS Development Mode
# This file is loaded in addition to .env when using HTTPS dev mode

# Override CORS for HTTPS domains
CORS_ORIGIN=https://axis.local,https://localhost:5173
EOF
    echo -e "${GREEN}Created $TRACKING_ENV_LOCAL${NC}"
else
    echo -e "${YELLOW}$TRACKING_ENV_LOCAL already exists, skipping${NC}"
fi

echo ""
echo -e "${GREEN}=== Setup Complete ===${NC}"
echo ""
echo "Next steps:"
echo "  1. Start HTTPS dev environment: make dev-https"
echo "  2. Access the app at: https://axis.local"
echo "  3. API available at: https://api.axis.local"
echo "  4. Camera 1 at: https://camera1.axis.local"
echo "  5. Camera 2 at: https://camera2.axis.local"
echo ""
echo -e "${YELLOW}Note for WSL2 users:${NC}"
echo "  - You may need to add hosts entries to Windows: C:\\Windows\\System32\\drivers\\etc\\hosts"
echo "  - The CA needs to be installed in Windows too for browser trust"
echo "  - Run in PowerShell (admin): mkcert -install"
echo ""
