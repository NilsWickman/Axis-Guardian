# Quick Deployment Guide

**TL;DR** - Step-by-step commands to deploy Axis-Guardian on Hetzner VPS.

## Prerequisites

- Hetzner VPS running Ubuntu 22.04
- Domain name pointing to VPS IP
- SSH access to VPS

## One-Time Setup Commands

### 1. Connect and Clone

```bash
# Connect to VPS
ssh root@YOUR_VPS_IP

# Create deploy user
adduser deployuser
usermod -aG sudo deployuser
mkdir -p /home/deployuser/.ssh
cp ~/.ssh/authorized_keys /home/deployuser/.ssh/
chown -R deployuser:deployuser /home/deployuser/.ssh
chmod 700 /home/deployuser/.ssh
chmod 600 /home/deployuser/.ssh/authorized_keys

# Switch to deploy user (open new terminal)
ssh deployuser@YOUR_VPS_IP

# Clone repository
cd /tmp
git clone https://github.com/YOUR_USERNAME/Axis-Guardian.git
cd Axis-Guardian
```

### 2. Initial VPS Setup

```bash
# Run VPS setup (20-30 minutes)
sudo bash scripts/vps-setup.sh

# Move repo to production location
sudo mv /tmp/Axis-Guardian /var/www/axis-guardian
sudo chown -R www-data:www-data /var/www/axis-guardian
```

### 3. Configure Environment

```bash
cd /var/www/axis-guardian

# Generate secrets
JWT_SECRET=$(openssl rand -hex 32)
SESSION_SECRET=$(openssl rand -hex 32)
PG_PASSWORD=$(openssl rand -base64 24)
REDIS_PASSWORD=$(openssl rand -base64 24)
ADMIN_PASSWORD=$(openssl rand -base64 24)
GRAFANA_PASSWORD=$(openssl rand -base64 24)

# Edit .env.production
sudo vim .env.production

# Update these values:
# DOMAIN=your-domain.com
# VPS_PUBLIC_IP=your-vps-ip
# JWT_SECRET=<generated-above>
# SESSION_SECRET=<generated-above>
# POSTGRES_PASSWORD=<generated-above>
# REDIS_PASSWORD=<generated-above>
# ADMIN_PASSWORD=<generated-above>
# GRAFANA_ADMIN_PASSWORD=<generated-above>
```

### 4. Setup Firewall

```bash
sudo bash scripts/ufw-setup.sh
# Type 'y' when prompted to enable firewall
```

### 5. Restart SSH (Apply hardening)

**⚠️ Test SSH in new terminal first!**

```bash
sudo systemctl restart sshd
```

### 6. Setup SSL

```bash
# Wait for DNS propagation (check: dig +short your-domain.com)
sudo bash scripts/ssl-setup.sh your-domain.com your-email@example.com
```

### 7. Deploy Application

```bash
sudo bash scripts/deploy.sh
```

### 8. Verify

```bash
# Check services
sudo systemctl status mediamtx webrtc-detection auth-service nginx

# Open browser
https://your-domain.com

# Login with:
# Username: admin
# Password: <value from ADMIN_PASSWORD in .env.production>
```

## Common Issues

### DNS not propagating
```bash
# Check DNS
dig +short your-domain.com

# Wait and retry, or use IP temporarily
echo "YOUR_VPS_IP your-domain.com" | sudo tee -a /etc/hosts
```

### SSL certificate failed
```bash
# Ensure port 80 is accessible
sudo ufw allow 80/tcp

# Check Nginx
sudo systemctl status nginx

# Retry
sudo bash scripts/ssl-setup.sh your-domain.com
```

### Services not starting
```bash
# View logs
sudo journalctl -u SERVICE_NAME -n 50

# Common fixes:
sudo systemctl restart SERVICE_NAME
sudo systemctl restart postgresql
sudo systemctl restart redis-server
```

## Post-Deployment

1. **Change default password** immediately
2. **Configure backups**: Daily automatic at 2 AM
3. **Monitor logs**: `sudo journalctl -f`
4. **Access Grafana**: `http://YOUR_IP:3000` (admin/GRAFANA_PASSWORD)

## Update Application

```bash
cd /var/www/axis-guardian
git pull origin main
sudo bash scripts/deploy.sh
```

## Rollback

```bash
cd /var/www/axis-guardian
git checkout PREVIOUS_COMMIT_HASH
sudo bash scripts/deploy.sh
```

---

**For detailed instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)**
