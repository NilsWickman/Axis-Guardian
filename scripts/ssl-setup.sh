#!/bin/bash
###############################################
# Axis-Guardian SSL/TLS Setup Script
#
# This script sets up Let's Encrypt SSL certificates
# using Certbot for the Axis-Guardian application
#
# Usage:
#   sudo bash scripts/ssl-setup.sh your-domain.com
###############################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    log_error "Please run as root (use sudo)"
    exit 1
fi

# Check if domain provided
if [ -z "$1" ]; then
    log_error "Usage: $0 <domain.com>"
    log_error "Example: $0 surveillance.example.com"
    exit 1
fi

DOMAIN="$1"
EMAIL="${2:-admin@$DOMAIN}"  # Optional email parameter

log_info "Setting up SSL/TLS certificates for: $DOMAIN"
log_info "Contact email: $EMAIL"

###############################################
# 1. Verify DNS is pointing to this server
###############################################
log_info "Checking DNS configuration..."

SERVER_IP=$(curl -s ifconfig.me)
DOMAIN_IP=$(dig +short "$DOMAIN" | tail -n1)

log_info "Server IP: $SERVER_IP"
log_info "Domain IP: $DOMAIN_IP"

if [ "$SERVER_IP" != "$DOMAIN_IP" ]; then
    log_warn "DNS mismatch detected!"
    log_warn "  Server IP: $SERVER_IP"
    log_warn "  Domain resolves to: $DOMAIN_IP"
    log_warn "  Please update your DNS A record to point to $SERVER_IP"
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_error "Aborted. Please fix DNS and try again."
        exit 1
    fi
fi

###############################################
# 2. Create temporary Nginx config for ACME challenge
###############################################
log_info "Creating temporary Nginx configuration for ACME challenge..."

mkdir -p /var/www/certbot

cat > /etc/nginx/sites-available/certbot-temp <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;

    root /var/www/certbot;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 'ACME challenge endpoint active\n';
        add_header Content-Type text/plain;
    }
}
EOF

# Enable temporary config
ln -sf /etc/nginx/sites-available/certbot-temp /etc/nginx/sites-enabled/certbot-temp

# Remove any existing axis-guardian config temporarily
rm -f /etc/nginx/sites-enabled/axis-guardian

# Test and reload Nginx
nginx -t || {
    log_error "Nginx configuration test failed"
    exit 1
}

systemctl reload nginx

log_info "Temporary Nginx configuration active"

###############################################
# 3. Obtain SSL certificate
###############################################
log_info "Obtaining SSL certificate from Let's Encrypt..."

certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    --domain "$DOMAIN" \
    --domain "www.$DOMAIN" || {
    log_error "Failed to obtain SSL certificate"
    log_error "Common issues:"
    log_error "  1. DNS not pointing to this server"
    log_error "  2. Port 80 not accessible (check firewall)"
    log_error "  3. Rate limit reached (5 failures per hour)"
    exit 1
}

log_info "SSL certificate obtained successfully!"

###############################################
# 4. Verify certificate files
###############################################
log_info "Verifying certificate files..."

CERT_PATH="/etc/letsencrypt/live/$DOMAIN"

if [ ! -f "$CERT_PATH/fullchain.pem" ]; then
    log_error "Certificate file not found: $CERT_PATH/fullchain.pem"
    exit 1
fi

if [ ! -f "$CERT_PATH/privkey.pem" ]; then
    log_error "Private key not found: $CERT_PATH/privkey.pem"
    exit 1
fi

log_info "Certificate files verified"
log_info "  Certificate: $CERT_PATH/fullchain.pem"
log_info "  Private key: $CERT_PATH/privkey.pem"
log_info "  Chain: $CERT_PATH/chain.pem"

# Show certificate details
openssl x509 -in "$CERT_PATH/fullchain.pem" -noout -dates

###############################################
# 5. Configure automatic renewal
###############################################
log_info "Configuring automatic certificate renewal..."

# Certbot creates a systemd timer automatically, but let's verify
systemctl enable certbot.timer
systemctl start certbot.timer

# Check renewal works (dry-run)
log_info "Testing certificate renewal (dry-run)..."
certbot renew --dry-run || log_warn "Renewal dry-run failed, but continuing..."

###############################################
# 6. Setup renewal hook
###############################################
log_info "Setting up renewal hook..."

mkdir -p /etc/letsencrypt/renewal-hooks/post

cat > /etc/letsencrypt/renewal-hooks/post/axis-guardian.sh <<'EOF'
#!/bin/bash
# Reload Nginx after certificate renewal
systemctl reload nginx
echo "Nginx reloaded after certificate renewal"
EOF

chmod +x /etc/letsencrypt/renewal-hooks/post/axis-guardian.sh

###############################################
# 7. Remove temporary Nginx config
###############################################
log_info "Removing temporary Nginx configuration..."

rm -f /etc/nginx/sites-enabled/certbot-temp

###############################################
# 8. Update .env.production with domain
###############################################
if [ -f "/var/www/axis-guardian/.env.production" ]; then
    log_info "Updating .env.production with domain..."

    sed -i "s|DOMAIN=.*|DOMAIN=$DOMAIN|g" /var/www/axis-guardian/.env.production
    sed -i "s|your-domain.com|$DOMAIN|g" /var/www/axis-guardian/.env.production

    log_info ".env.production updated"
fi

###############################################
# 9. Print summary
###############################################
log_info "========================================="
log_info "SSL/TLS Setup Complete!"
log_info "========================================="
echo ""
log_info "Certificate Details:"
echo "  Domain: $DOMAIN"
echo "  Certificate: $CERT_PATH/fullchain.pem"
echo "  Private Key: $CERT_PATH/privkey.pem"
echo "  Expires: $(openssl x509 -in "$CERT_PATH/fullchain.pem" -noout -enddate | cut -d= -f2)"
echo ""
log_info "Automatic Renewal:"
echo "  Timer: certbot.timer (check with: systemctl status certbot.timer)"
echo "  Renewal hook: /etc/letsencrypt/renewal-hooks/post/axis-guardian.sh"
echo ""
log_info "Next steps:"
echo "  1. Run deployment script: bash scripts/deploy.sh"
echo "  2. Nginx will be configured with SSL automatically"
echo "  3. Access your application: https://$DOMAIN"
echo ""
log_warn "Important Notes:"
echo "  - Certificates renew automatically via certbot.timer"
echo "  - Rate limit: 5 certs per domain per week"
echo "  - Let's Encrypt certs expire after 90 days"
echo "  - Manual renewal: certbot renew"
echo ""
log_info "========================================="
