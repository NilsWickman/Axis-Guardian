#!/bin/bash
# One-time VPS setup script for Axis-Guardian native deployment
# Run this once on a fresh VPS before the first deploy

set -e

echo "=== Axis-Guardian VPS Setup ==="

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "Please run without sudo (script will use sudo when needed)"
    exit 1
fi

# Get domain from argument or prompt
DOMAIN=${1:-}
if [ -z "$DOMAIN" ]; then
    read -p "Enter your domain (e.g., demo.example.com): " DOMAIN
fi

echo ""
echo "Domain: $DOMAIN"
echo ""

# Create directories
echo "Creating directories..."
sudo mkdir -p /opt/axis-guardian/{frontend,backend,camera-emulator,videos,config,data}
sudo chown -R $USER:$USER /opt/axis-guardian

# Create emulator.env with public IP
echo "Detecting public IP..."
PUBLIC_IP=$(curl -s ifconfig.me)
echo "ANNOUNCED_IP=$PUBLIC_IP" > /opt/axis-guardian/emulator.env
echo "Public IP: $PUBLIC_IP"

# Install systemd services
echo "Installing systemd services..."
sudo cp deploy/backend.service /etc/systemd/system/
sudo cp deploy/camera-emulator.service /etc/systemd/system/

# Update user in service files (replace www-data with current user)
sudo sed -i "s/User=www-data/User=$USER/" /etc/systemd/system/backend.service
sudo sed -i "s/User=www-data/User=$USER/" /etc/systemd/system/camera-emulator.service

sudo systemctl daemon-reload
sudo systemctl enable backend camera-emulator

# Install nginx config
echo "Installing nginx config..."
sed "s/GUARDIAN_DOMAIN_PLACEHOLDER/$DOMAIN/g" deploy/nginx-site.conf | sudo tee /etc/nginx/sites-available/axis-guardian > /dev/null
sudo ln -sf /etc/nginx/sites-available/axis-guardian /etc/nginx/sites-enabled/

# Test nginx config
sudo nginx -t

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "1. Copy video files to /opt/axis-guardian/videos/"
echo "   - view-HC3-preprocessed.mp4"
echo "   - view-HC3-preprocessed.detections.json.gz"
echo "   - view-HC4-preprocessed.mp4"
echo "   - view-HC4-preprocessed.detections.json.gz"
echo ""
echo "2. Get SSL certificate:"
echo "   sudo certbot certonly --nginx -d $DOMAIN"
echo ""
echo "3. Push to main branch to trigger first deployment"
echo ""
echo "4. After first deploy, start services:"
echo "   sudo systemctl start backend camera-emulator"
echo "   sudo systemctl reload nginx"
