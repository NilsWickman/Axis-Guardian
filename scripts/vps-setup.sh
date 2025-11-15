#!/bin/bash
###############################################
# Axis-Guardian VPS Setup Script
#
# This script performs initial VPS setup including:
# - System updates and security hardening
# - User creation and SSH configuration
# - Firewall setup
# - Dependency installation
# - Directory structure creation
#
# Usage:
#   Run as root: sudo bash vps-setup.sh
###############################################

set -e  # Exit on error
set -u  # Exit on undefined variable

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
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

log_info "Starting Axis-Guardian VPS setup..."

###############################################
# 1. System Update
###############################################
log_info "Updating system packages..."
apt-get update
apt-get upgrade -y
apt-get dist-upgrade -y

###############################################
# 2. Install Essential Packages
###############################################
log_info "Installing essential packages..."
apt-get install -y \
    curl \
    wget \
    git \
    vim \
    htop \
    ufw \
    fail2ban \
    unattended-upgrades \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    software-properties-common

###############################################
# 3. Create Application User
###############################################
log_info "Creating application user (www-data already exists, ensuring proper setup)..."
# Ensure www-data has proper shell (optional)
usermod -s /bin/bash www-data || true

###############################################
# 4. SSH Hardening
###############################################
log_info "Hardening SSH configuration..."

# Backup original SSH config
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup

# SSH hardening settings
cat >> /etc/ssh/sshd_config.d/axis-guardian-hardening.conf <<'EOF'
# Axis-Guardian SSH Hardening

# Disable root login
PermitRootLogin no

# Disable password authentication (use SSH keys only)
PasswordAuthentication no
ChallengeResponseAuthentication no
UsePAM yes

# Only allow specific users (adjust as needed)
# AllowUsers your-username

# Limit authentication attempts
MaxAuthTries 3
MaxSessions 5

# Disable empty passwords
PermitEmptyPasswords no

# Protocol and cipher hardening
Protocol 2
Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com,aes128-gcm@openssh.com
MACs hmac-sha2-512-etm@openssh.com,hmac-sha2-256-etm@openssh.com
KexAlgorithms curve25519-sha256,curve25519-sha256@libssh.org,diffie-hellman-group16-sha512,diffie-hellman-group18-sha512

# Timeout settings
ClientAliveInterval 300
ClientAliveCountMax 2
LoginGraceTime 60
EOF

log_warn "SSH configuration updated. IMPORTANT: Test SSH connection before logging out!"
log_warn "SSH will NOT be restarted automatically. Run: systemctl restart sshd"

###############################################
# 5. Configure Fail2Ban
###############################################
log_info "Configuring Fail2Ban..."

# Create custom jail for SSH
cat > /etc/fail2ban/jail.d/axis-guardian.conf <<'EOF'
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/*error.log
maxretry = 10
findtime = 60
bantime = 3600
EOF

systemctl enable fail2ban
systemctl restart fail2ban

log_info "Fail2Ban configured and started"

###############################################
# 6. Enable Automatic Security Updates
###############################################
log_info "Enabling automatic security updates..."

cat > /etc/apt/apt.conf.d/50unattended-upgrades <<'EOF'
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}-security";
    "${distro_id}ESMApps:${distro_codename}-apps-security";
    "${distro_id}ESM:${distro_codename}-infra-security";
};
Unattended-Upgrade::AutoFixInterruptedDpkg "true";
Unattended-Upgrade::MinimalSteps "true";
Unattended-Upgrade::Remove-Unused-Kernel-Packages "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
Unattended-Upgrade::Automatic-Reboot-Time "03:00";
EOF

cat > /etc/apt/apt.conf.d/20auto-upgrades <<'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Download-Upgradeable-Packages "1";
APT::Periodic::AutocleanInterval "7";
APT::Periodic::Unattended-Upgrade "1";
EOF

###############################################
# 7. Install Node.js (LTS)
###############################################
log_info "Installing Node.js 20 LTS..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Install pnpm
npm install -g pnpm

node --version
pnpm --version

###############################################
# 8. Install Python 3.11
###############################################
log_info "Installing Python 3.11..."
add-apt-repository -y ppa:deadsnakes/ppa
apt-get update
apt-get install -y \
    python3.11 \
    python3.11-venv \
    python3.11-dev \
    python3-pip \
    build-essential

# Make Python 3.11 default (optional)
update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.11 1

python3 --version

###############################################
# 9. Install FFmpeg
###############################################
log_info "Installing FFmpeg..."
apt-get install -y ffmpeg

ffmpeg -version

###############################################
# 10. Install PostgreSQL
###############################################
log_info "Installing PostgreSQL..."
apt-get install -y postgresql postgresql-contrib

# Enable and start PostgreSQL
systemctl enable postgresql
systemctl start postgresql

log_info "PostgreSQL installed. Database setup will be done during deployment."

###############################################
# 11. Install Redis
###############################################
log_info "Installing Redis..."
apt-get install -y redis-server

# Configure Redis for production
cat >> /etc/redis/redis.conf <<'EOF'

# Axis-Guardian Redis Configuration
maxmemory 256mb
maxmemory-policy allkeys-lru
EOF

systemctl enable redis-server
systemctl restart redis-server

###############################################
# 12. Install Nginx
###############################################
log_info "Installing Nginx..."
apt-get install -y nginx

# Create log directory
mkdir -p /var/log/nginx

systemctl enable nginx
systemctl stop nginx  # Don't start yet (no SSL certs)

###############################################
# 13. Install Certbot (Let's Encrypt)
###############################################
log_info "Installing Certbot..."
apt-get install -y certbot python3-certbot-nginx

###############################################
# 14. Create Application Directory Structure
###############################################
log_info "Creating application directory structure..."

mkdir -p /var/www/axis-guardian
mkdir -p /var/log/axis-guardian
mkdir -p /var/backups/axis-guardian

# Set ownership
chown -R www-data:www-data /var/www/axis-guardian
chown -R www-data:www-data /var/log/axis-guardian
chown -R www-data:www-data /var/backups/axis-guardian

# Set permissions
chmod 755 /var/www/axis-guardian
chmod 755 /var/log/axis-guardian
chmod 755 /var/backups/axis-guardian

###############################################
# 15. Configure Log Rotation
###############################################
log_info "Configuring log rotation..."

cat > /etc/logrotate.d/axis-guardian <<'EOF'
/var/log/axis-guardian/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0644 www-data www-data
    sharedscripts
    postrotate
        systemctl reload mediamtx webrtc-detection camera-streams auth-service 2>/dev/null || true
    endscript
}
EOF

###############################################
# 16. System Tuning for Video Streaming
###############################################
log_info "Applying system tuning for video streaming..."

cat >> /etc/sysctl.d/99-axis-guardian.conf <<'EOF'
# Axis-Guardian System Tuning

# Increase network buffer sizes
net.core.rmem_max = 134217728
net.core.wmem_max = 134217728
net.core.rmem_default = 16777216
net.core.wmem_default = 16777216
net.ipv4.tcp_rmem = 4096 87380 67108864
net.ipv4.tcp_wmem = 4096 65536 67108864

# Increase connection tracking
net.netfilter.nf_conntrack_max = 262144

# Optimize for high-bandwidth, low-latency
net.ipv4.tcp_congestion_control = bbr
net.core.default_qdisc = fq

# File descriptor limits
fs.file-max = 1000000
EOF

sysctl -p /etc/sysctl.d/99-axis-guardian.conf

###############################################
# 17. Set File Descriptor Limits
###############################################
log_info "Setting file descriptor limits..."

cat >> /etc/security/limits.conf <<'EOF'
# Axis-Guardian file descriptor limits
www-data soft nofile 65536
www-data hard nofile 65536
* soft nofile 65536
* hard nofile 65536
EOF

###############################################
# 18. Create Backup Script
###############################################
log_info "Creating backup script..."

cat > /usr/local/bin/axis-guardian-backup.sh <<'EOF'
#!/bin/bash
# Axis-Guardian Backup Script

BACKUP_DIR="/var/backups/axis-guardian"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.tar.gz"

# Backup database
sudo -u postgres pg_dump surveillance > "$BACKUP_DIR/db_$TIMESTAMP.sql"

# Backup application data (excluding node_modules, venv, etc.)
cd /var/www/axis-guardian
tar -czf "$BACKUP_FILE" \
    --exclude='node_modules' \
    --exclude='venv' \
    --exclude='*.log' \
    --exclude='.git' \
    .env.production \
    simulation/mediamtx/mediamtx.production.yml \
    nginx/axis-guardian.conf

# Compress database dump
gzip "$BACKUP_DIR/db_$TIMESTAMP.sql"

# Remove backups older than 30 days
find "$BACKUP_DIR" -name "backup_*.tar.gz" -mtime +30 -delete
find "$BACKUP_DIR" -name "db_*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE"
EOF

chmod +x /usr/local/bin/axis-guardian-backup.sh

# Schedule daily backup at 2 AM
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/axis-guardian-backup.sh >> /var/log/axis-guardian/backup.log 2>&1") | crontab -

###############################################
# 19. Print Summary
###############################################
log_info "========================================="
log_info "VPS Setup Complete!"
log_info "========================================="
echo ""
log_info "Next steps:"
echo "  1. IMPORTANT: Add your SSH public key to ~/.ssh/authorized_keys"
echo "  2. Test SSH connection from another terminal BEFORE logging out"
echo "  3. Once SSH test succeeds, restart SSH: systemctl restart sshd"
echo "  4. Run firewall setup: bash scripts/ufw-setup.sh"
echo "  5. Clone your repository to /var/www/axis-guardian"
echo "  6. Run SSL setup: bash scripts/ssl-setup.sh your-domain.com"
echo "  7. Run deployment: bash scripts/deploy.sh"
echo ""
log_warn "Security Notes:"
echo "  - Root login disabled (not yet applied, restart SSH to apply)"
echo "  - Password authentication disabled (not yet applied)"
echo "  - Fail2ban monitoring SSH and Nginx"
echo "  - Automatic security updates enabled"
echo "  - Daily backups scheduled at 2 AM"
echo ""
log_info "Installed versions:"
echo "  Node.js: $(node --version)"
echo "  Python: $(python3 --version)"
echo "  FFmpeg: $(ffmpeg -version | head -n1)"
echo "  PostgreSQL: $(sudo -u postgres psql --version)"
echo "  Redis: $(redis-server --version)"
echo "  Nginx: $(nginx -v 2>&1)"
echo ""
log_info "========================================="
