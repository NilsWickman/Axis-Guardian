#!/bin/bash
###############################################
# Axis-Guardian Firewall Setup Script
#
# This script configures UFW (Uncomplicated Firewall)
# for the Axis-Guardian surveillance system
#
# Usage:
#   sudo bash scripts/ufw-setup.sh
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

log_info "Configuring UFW firewall for Axis-Guardian..."

###############################################
# 1. Install UFW if not installed
###############################################
if ! command -v ufw &> /dev/null; then
    log_info "Installing UFW..."
    apt-get update
    apt-get install -y ufw
fi

###############################################
# 2. Reset UFW to defaults (if needed)
###############################################
log_warn "Resetting UFW to default configuration..."
echo "y" | ufw reset

###############################################
# 3. Set default policies
###############################################
log_info "Setting default policies..."
ufw default deny incoming
ufw default allow outgoing

###############################################
# 4. Allow SSH (IMPORTANT - do this first!)
###############################################
log_info "Allowing SSH connections..."

# Get current SSH port (default 22)
SSH_PORT=$(grep "^Port " /etc/ssh/sshd_config 2>/dev/null | awk '{print $2}')
SSH_PORT=${SSH_PORT:-22}

ufw allow "$SSH_PORT/tcp" comment 'SSH access'

log_warn "SSH allowed on port $SSH_PORT"
log_warn "IMPORTANT: If you change SSH port, update firewall rules!"

###############################################
# 5. Allow HTTP and HTTPS
###############################################
log_info "Allowing HTTP and HTTPS..."
ufw allow 80/tcp comment 'HTTP (Let'\''s Encrypt ACME)'
ufw allow 443/tcp comment 'HTTPS'

###############################################
# 6. Allow WebRTC signaling (HTTPS)
###############################################
log_info "Allowing WebRTC signaling..."
ufw allow 8080/tcp comment 'WebRTC signaling (HTTPS)'

###############################################
# 7. Allow WebRTC media (UDP)
###############################################
log_info "Allowing WebRTC media streams..."
# WebRTC UDP port for media
ufw allow 8189/udp comment 'WebRTC media (UDP)'

# Allow UDP port range for WebRTC (if using TURN server)
# Uncomment if you set up a TURN server
# ufw allow 49152:65535/udp comment 'WebRTC TURN media range'

###############################################
# 8. Rate limiting for SSH (prevent brute force)
###############################################
log_info "Enabling rate limiting for SSH..."
ufw limit "$SSH_PORT/tcp" comment 'SSH rate limiting'

###############################################
# 9. Allow localhost connections
###############################################
log_info "Allowing localhost connections..."
ufw allow from 127.0.0.1
ufw allow from ::1

###############################################
# 10. Optional: Allow specific IP addresses
###############################################
# Uncomment and modify if you want to restrict access to specific IPs
# log_info "Allowing specific IP addresses..."
# ufw allow from YOUR_HOME_IP to any port 443 comment 'Your home IP'
# ufw allow from YOUR_OFFICE_IP to any port 443 comment 'Your office IP'

###############################################
# 11. Logging
###############################################
log_info "Configuring firewall logging..."
ufw logging medium

###############################################
# 12. Enable UFW
###############################################
log_warn "Enabling UFW firewall..."
log_warn "This will activate the firewall with the rules configured above."
echo ""
log_warn "Current rules:"
ufw show added
echo ""

read -p "Enable firewall now? (y/N): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "y" | ufw enable

    log_info "UFW firewall enabled!"
else
    log_warn "Firewall not enabled. Enable manually with: ufw enable"
    exit 0
fi

###############################################
# 13. Verify configuration
###############################################
log_info "Verifying firewall configuration..."

echo ""
log_info "Current firewall status:"
ufw status verbose

echo ""
log_info "Numbered rules:"
ufw status numbered

###############################################
# 14. Create firewall management script
###############################################
log_info "Creating firewall management script..."

cat > /usr/local/bin/axis-guardian-firewall <<'EOF'
#!/bin/bash
# Axis-Guardian Firewall Management

case "$1" in
    status)
        ufw status verbose
        ;;
    logs)
        tail -f /var/log/ufw.log
        ;;
    blocked)
        grep -i "BLOCK" /var/log/ufw.log | tail -20
        ;;
    allow-ip)
        if [ -z "$2" ]; then
            echo "Usage: $0 allow-ip <IP_ADDRESS>"
            exit 1
        fi
        ufw allow from "$2" comment "Manually allowed IP"
        echo "Allowed IP: $2"
        ;;
    deny-ip)
        if [ -z "$2" ]; then
            echo "Usage: $0 deny-ip <IP_ADDRESS>"
            exit 1
        fi
        ufw deny from "$2" comment "Manually denied IP"
        echo "Denied IP: $2"
        ;;
    reset)
        echo "WARNING: This will reset all firewall rules!"
        read -p "Continue? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            ufw reset
            echo "Firewall reset. Re-run setup script: bash scripts/ufw-setup.sh"
        fi
        ;;
    *)
        echo "Axis-Guardian Firewall Management"
        echo ""
        echo "Usage: $0 {status|logs|blocked|allow-ip|deny-ip|reset}"
        echo ""
        echo "Commands:"
        echo "  status      - Show firewall status"
        echo "  logs        - Tail firewall logs"
        echo "  blocked     - Show recently blocked connections"
        echo "  allow-ip    - Allow specific IP address"
        echo "  deny-ip     - Deny specific IP address"
        echo "  reset       - Reset firewall to defaults"
        exit 1
        ;;
esac
EOF

chmod +x /usr/local/bin/axis-guardian-firewall

log_info "Management script created: axis-guardian-firewall"

###############################################
# 15. Print summary
###############################################
log_info "========================================="
log_info "Firewall Configuration Complete!"
log_info "========================================="
echo ""
log_info "Allowed Ports:"
echo "  SSH:              $SSH_PORT/tcp (rate limited)"
echo "  HTTP:             80/tcp (Let's Encrypt)"
echo "  HTTPS:            443/tcp (main application)"
echo "  WebRTC Signal:    8080/tcp (HTTPS)"
echo "  WebRTC Media:     8189/udp"
echo ""
log_info "Security Features:"
echo "  ✓ Default deny incoming"
echo "  ✓ SSH rate limiting (prevents brute force)"
echo "  ✓ Logging enabled (medium level)"
echo "  ✓ Localhost allowed"
echo ""
log_info "Firewall Management:"
echo "  View status:      ufw status verbose"
echo "  View logs:        axis-guardian-firewall logs"
echo "  Check blocked:    axis-guardian-firewall blocked"
echo "  Allow IP:         axis-guardian-firewall allow-ip <IP>"
echo "  Deny IP:          axis-guardian-firewall deny-ip <IP>"
echo ""
log_warn "Important Security Notes:"
echo "  1. SSH is protected with rate limiting"
echo "  2. Only essential ports are open"
echo "  3. All other incoming connections are blocked"
echo "  4. Fail2ban provides additional SSH protection"
echo "  5. Monitor logs regularly: tail -f /var/log/ufw.log"
echo ""
log_info "Optional Hardening:"
echo "  - Restrict HTTPS to specific IPs: ufw allow from <IP> to any port 443"
echo "  - Change SSH port: Edit /etc/ssh/sshd_config, then update firewall"
echo "  - Add VPN: Install WireGuard and restrict access through VPN only"
echo ""
log_info "========================================="
