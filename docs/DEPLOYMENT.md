# Axis-Guardian VPS Deployment Guide

Complete guide to deploying Axis-Guardian on a Hetzner VPS with HTTPS, authentication, and production-grade security.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Domain Setup](#domain-setup)
3. [VPS Setup (Hetzner)](#vps-setup-hetzner)
4. [Initial Server Configuration](#initial-server-configuration)
5. [Application Deployment](#application-deployment)
6. [SSL/TLS Setup](#ssltls-setup)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Accounts
- **Hetzner Account** - For VPS hosting
- **Domain Registrar** - For domain name (Namecheap, Cloudflare, etc.)
- **GitHub Account** - For code repository (if using Git)

### Local Requirements
- SSH client (OpenSSH, PuTTY, etc.)
- Git
- SSH key pair (we'll create this)

### Recommended VPS Specs
- **CPU:** 2 vCPUs minimum (4 vCPUs recommended)
- **RAM:** 4 GB minimum (8 GB recommended for real-time detection)
- **Storage:** 50 GB SSD minimum
- **Location:** Choose nearest to your location
- **OS:** Ubuntu 22.04 LTS (recommended)

### Estimated Costs
- **Hetzner VPS:** €4-20/month (depending on specs)
- **Domain Name:** $10-15/year
- **Let's Encrypt SSL:** Free

---

## Domain Setup

### 1. Register a Domain

**Recommended Registrars:**
- **Namecheap** - Good balance of price and features
- **Cloudflare** - Best if using Cloudflare DNS
- **Google Domains** - Simple and reliable
- **Porkbun** - Cheapest option

**Steps:**
1. Visit your chosen registrar
2. Search for available domain (e.g., `surveillance-demo.com`)
3. Purchase domain (usually $10-15/year)
4. Keep registrar login credentials safe

### 2. Configure DNS (After VPS is Created)

You'll add these DNS records after creating your VPS:

```
Type    Name    Value                   TTL
A       @       YOUR_VPS_IP_ADDRESS    3600
A       www     YOUR_VPS_IP_ADDRESS    3600
```

**Don't configure DNS yet** - we'll do this after creating the VPS.

---

## VPS Setup (Hetzner)

### 1. Create Hetzner Account

1. Go to [Hetzner Cloud Console](https://console.hetzner.cloud/)
2. Sign up for a new account
3. Verify your email address
4. Add payment method

### 2. Create a New Project

1. Click "New Project"
2. Name: `Axis-Guardian` (or your preferred name)
3. Click "Create Project"

### 3. Create SSH Key Pair (Local Machine)

On your local computer, generate an SSH key:

```bash
# Generate SSH key (if you don't have one)
ssh-keygen -t ed25519 -C "your-email@example.com"

# Save to default location: ~/.ssh/id_ed25519
# Set a strong passphrase (optional but recommended)

# Display public key (we'll need this)
cat ~/.ssh/id_ed25519.pub
```

**Copy the entire public key output** (starts with `ssh-ed25519`).

### 4. Add SSH Key to Hetzner

1. In Hetzner console, go to "Security" → "SSH Keys"
2. Click "Add SSH Key"
3. Paste your public key
4. Name: `my-laptop` (or descriptive name)
5. Click "Add SSH Key"

### 5. Create the VPS (Server)

1. Click "Add Server"
2. **Location:** Choose closest to you (e.g., Nuremberg, Germany or Ashburn, USA)
3. **Image:** Ubuntu 22.04
4. **Type:** Select based on your needs:
   - **CX21** (€5.83/month) - 2 vCPU, 4GB RAM - Minimum for demo
   - **CPX21** (€8.21/month) - 3 vCPU, 4GB RAM - Recommended
   - **CPX31** (€13.90/month) - 4 vCPU, 8GB RAM - Best for real-time detection
5. **Volume:** None (use server storage)
6. **Network:** Default (no changes needed)
7. **SSH Keys:** Select the key you just added
8. **Name:** `axis-guardian-prod`
9. **Firewall:** We'll configure this later with UFW
10. Click "Create & Buy Now"

### 6. Wait for Server Creation

Server creation takes 1-2 minutes. Once ready, you'll see:
- **IP Address** (e.g., `65.108.123.456`)
- **Status:** Running (green)

**Copy the IP address** - you'll need this for DNS and SSH.

---

## Initial Server Configuration

### 1. Update DNS Records

Now that you have your VPS IP address, add DNS records:

1. Go to your domain registrar
2. Find "DNS Management" or "DNS Settings"
3. Add these records:

```
Type    Name    Value               TTL
A       @       65.108.123.456     3600
A       www     65.108.123.456     3600
```

Replace `65.108.123.456` with your actual VPS IP.

**DNS propagation takes 5-60 minutes.** You can check status at: https://dnschecker.org

### 2. Connect to VPS via SSH

```bash
# Connect to VPS (replace with your IP)
ssh root@65.108.123.456

# Accept the host key fingerprint (type 'yes')
```

If connection fails:
- Check firewall on your local network
- Verify SSH key was added to Hetzner
- Try with verbose mode: `ssh -v root@65.108.123.456`

### 3. Create Non-Root User

```bash
# Create new user
adduser deployuser

# Add to sudo group
usermod -aG sudo deployuser

# Copy SSH key to new user
mkdir -p /home/deployuser/.ssh
cp ~/.ssh/authorized_keys /home/deployuser/.ssh/
chown -R deployuser:deployuser /home/deployuser/.ssh
chmod 700 /home/deployuser/.ssh
chmod 600 /home/deployuser/.ssh/authorized_keys
```

### 4. Test New User Access

**Open a NEW terminal** (keep root session open as backup):

```bash
# Test SSH with new user
ssh deployuser@65.108.123.456

# Test sudo access
sudo apt update
```

If successful, you can now use `deployuser` for all operations.

---

## Application Deployment

### Step 1: Run VPS Setup Script

```bash
# Connect as deploy user
ssh deployuser@65.108.123.456

# Clone repository
cd /tmp
git clone https://github.com/YOUR_USERNAME/Axis-Guardian.git
cd Axis-Guardian

# Run VPS setup (installs dependencies, hardens security)
sudo bash scripts/vps-setup.sh
```

**This script will:**
- Update system packages
- Install Node.js, Python, FFmpeg, PostgreSQL, Redis, Nginx
- Configure SSH hardening
- Enable Fail2ban
- Create application directories
- Set up automatic security updates

**⚠️ IMPORTANT:** After script completes, test SSH in a new terminal before closing current session!

### Step 2: Move Repository to Production Location

```bash
# Move cloned repo to production directory
sudo mv /tmp/Axis-Guardian /var/www/axis-guardian

# Set ownership
sudo chown -R www-data:www-data /var/www/axis-guardian
```

### Step 3: Configure Environment Variables

```bash
cd /var/www/axis-guardian

# Copy production environment template
sudo cp .env.production .env.production.backup

# Edit production environment
sudo vim .env.production
```

**Update these critical values:**

```bash
# Domain
DOMAIN=your-actual-domain.com

# VPS Public IP (for WebRTC)
VPS_PUBLIC_IP=65.108.123.456

# Generate strong secrets:
# Run: openssl rand -hex 32
JWT_SECRET=PASTE_RANDOM_HEX_HERE
SESSION_SECRET=PASTE_RANDOM_HEX_HERE

# Generate strong passwords:
# Run: openssl rand -base64 24
POSTGRES_PASSWORD=PASTE_RANDOM_PASSWORD_HERE
REDIS_PASSWORD=PASTE_RANDOM_PASSWORD_HERE
ADMIN_PASSWORD=PASTE_RANDOM_PASSWORD_HERE
GRAFANA_ADMIN_PASSWORD=PASTE_RANDOM_PASSWORD_HERE
```

**To generate secrets:**

```bash
# Generate JWT/Session secrets
openssl rand -hex 32

# Generate passwords
openssl rand -base64 24
```

Save and exit (`:wq` in vim).

### Step 4: Configure Firewall

```bash
cd /var/www/axis-guardian
sudo bash scripts/ufw-setup.sh
```

**Review firewall rules, then type 'y' to enable.**

### Step 5: Restart SSH (Apply Security Hardening)

**⚠️ CRITICAL:** Only do this if you've tested SSH connection with new user!

```bash
# Restart SSH to apply hardening
sudo systemctl restart sshd
```

Test connection in a new terminal. If it fails, you can still use your existing session.

---

## SSL/TLS Setup

### Step 1: Verify DNS Propagation

Before obtaining SSL certificate, verify DNS is working:

```bash
# Check if domain resolves to your VPS IP
dig +short your-domain.com

# Should return your VPS IP address
```

If not, wait longer and check https://dnschecker.org

### Step 2: Obtain SSL Certificate

```bash
cd /var/www/axis-guardian

# Run SSL setup script (replace with your domain)
sudo bash scripts/ssl-setup.sh your-domain.com your-email@example.com
```

**This script will:**
- Verify DNS is pointing to your server
- Configure temporary Nginx for ACME challenge
- Obtain Let's Encrypt SSL certificate
- Set up automatic renewal
- Update `.env.production` with domain

**If certificate fails:**
- Check DNS is fully propagated
- Verify port 80 is open (firewall)
- Check Nginx error logs: `sudo tail -f /var/log/nginx/error.log`

---

## Application Deployment

### Run Deployment Script

```bash
cd /var/www/axis-guardian
sudo bash scripts/deploy.sh
```

**This script will:**
1. Pull latest code from Git
2. Install Node.js dependencies
3. Build frontend (Vue.js)
4. Set up Python virtual environments
5. Download YOLOv8 models
6. Build MediaMTX
7. Configure PostgreSQL database
8. Install systemd services
9. Configure Nginx with SSL
10. Start all services

**The deployment takes 5-10 minutes** depending on VPS speed.

---

## Testing

### 1. Check Service Status

```bash
# Check all services
sudo systemctl status mediamtx webrtc-detection camera-streams auth-service nginx

# Or check individually
sudo systemctl status nginx
sudo systemctl status mediamtx
sudo systemctl status auth-service
```

All should show **active (running)** in green.

### 2. Test Web Access

Open your browser and visit:

```
https://your-domain.com
```

You should see the **Axis-Guardian login page**.

### 3. Test Login

Default credentials (as set in `.env.production`):
- **Username:** admin
- **Password:** (value of `ADMIN_PASSWORD` in `.env.production`)

**⚠️ Change this password immediately** after first login!

### 4. Test Camera Streams

After logging in:
1. Navigate to "Cameras" → "WebRTC Detection"
2. You should see 4 mock camera streams with object detection

### 5. Test WebRTC Connection

If cameras show "loading" or black screen:
- Check browser console for errors (F12)
- Verify WebRTC media port is open: `sudo ufw status`
- Check WebRTC service logs: `sudo journalctl -u webrtc-detection -f`

---

## Post-Deployment

### 1. Change Default Password

1. Log in to application
2. Go to Settings (or User Profile)
3. Change password to a strong, unique password

### 2. Monitor Services

```bash
# View all logs in real-time
sudo journalctl -f

# View specific service
sudo journalctl -u auth-service -f
sudo journalctl -u webrtc-detection -f

# View Nginx access logs
sudo tail -f /var/log/nginx/axis-guardian-access.log

# View Nginx error logs
sudo tail -f /var/log/nginx/axis-guardian-error.log
```

### 3. Access Monitoring Dashboards

**Grafana** (System & Application Metrics):
```
http://YOUR_VPS_IP:3000
Username: admin
Password: (value of GRAFANA_ADMIN_PASSWORD)
```

**Prometheus** (Metrics Query):
```
http://YOUR_VPS_IP:9090
```

**⚠️ Note:** These are not exposed via domain/HTTPS by default for security.

### 4. Set Up Backups

```bash
# Manual backup
sudo /usr/local/bin/axis-guardian-backup.sh

# Backups are automatically scheduled daily at 2 AM
# Check cron: sudo crontab -l

# Backup location
ls /var/backups/axis-guardian/
```

### 5. Security Checklist

- [ ] Changed default admin password
- [ ] Verified SSH key-only authentication
- [ ] Confirmed root login disabled
- [ ] Checked Fail2ban is running: `sudo systemctl status fail2ban`
- [ ] Reviewed firewall rules: `sudo ufw status`
- [ ] SSL certificate obtained and valid
- [ ] All services running
- [ ] Monitoring dashboards accessible
- [ ] Daily backups configured

---

## Troubleshooting

### Issue: Cannot connect to VPS via SSH

**Solution:**
```bash
# Check if SSH service is running on VPS (from Hetzner console)
systemctl status sshd

# Reset SSH config if needed (from Hetzner console)
sudo cp /etc/ssh/sshd_config.backup /etc/ssh/sshd_config
sudo systemctl restart sshd

# Check firewall
sudo ufw status
sudo ufw allow 22/tcp
```

### Issue: SSL certificate failed

**Solution:**
```bash
# Check DNS propagation
dig +short your-domain.com

# Check port 80 is accessible
sudo ufw allow 80/tcp
sudo netstat -tlnp | grep :80

# Check Nginx is running
sudo systemctl status nginx

# View Certbot logs
sudo journalctl -u certbot -f

# Try manual certificate request
sudo certbot certonly --standalone -d your-domain.com
```

### Issue: Services not starting

**Solution:**
```bash
# Check service status
sudo systemctl status SERVICE_NAME

# View logs
sudo journalctl -u SERVICE_NAME -n 50 --no-pager

# Check environment file
sudo cat /var/www/axis-guardian/.env.production

# Restart service
sudo systemctl restart SERVICE_NAME

# Check dependency services
sudo systemctl status postgresql redis-server mediamtx
```

### Issue: Frontend shows blank page

**Solution:**
```bash
# Check Nginx error logs
sudo tail -f /var/log/nginx/axis-guardian-error.log

# Verify frontend is built
ls -la /var/www/axis-guardian/frontend/dist/

# Rebuild frontend
cd /var/www/axis-guardian/frontend
sudo -u www-data yarn build

# Restart Nginx
sudo systemctl restart nginx
```

### Issue: Camera streams not loading

**Solution:**
```bash
# Check MediaMTX is running
sudo systemctl status mediamtx

# Check camera streams service
sudo systemctl status camera-streams

# View MediaMTX logs
sudo journalctl -u mediamtx -f

# Check MediaMTX API
curl http://localhost:9997/v3/paths/list

# Restart camera streams
sudo systemctl restart camera-streams
```

### Issue: Authentication not working

**Solution:**
```bash
# Check auth service
sudo systemctl status auth-service

# View auth logs
sudo journalctl -u auth-service -f

# Check database
sudo -u postgres psql -c "\l"
sudo -u postgres psql surveillance -c "\dt"

# Reset admin password
sudo -u postgres psql surveillance -c "UPDATE users SET password_hash = crypt('newpassword', gen_salt('bf')) WHERE username = 'admin';"
```

---

## Useful Commands

### Service Management
```bash
# Start/stop/restart a service
sudo systemctl start SERVICE_NAME
sudo systemctl stop SERVICE_NAME
sudo systemctl restart SERVICE_NAME

# Enable/disable service on boot
sudo systemctl enable SERVICE_NAME
sudo systemctl disable SERVICE_NAME

# View service logs
sudo journalctl -u SERVICE_NAME -f

# View all services status
sudo systemctl status mediamtx webrtc-detection camera-streams auth-service nginx
```

### Firewall Management
```bash
# View firewall status
sudo ufw status verbose

# Allow/deny port
sudo ufw allow 8080/tcp
sudo ufw deny 3000/tcp

# Allow specific IP
sudo ufw allow from 123.45.67.89

# Delete rule
sudo ufw status numbered
sudo ufw delete [NUMBER]

# Firewall management tool
sudo axis-guardian-firewall status
```

### SSL Certificate Management
```bash
# Renew certificates (manual)
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run

# View certificate details
sudo certbot certificates

# Revoke certificate
sudo certbot revoke --cert-path /etc/letsencrypt/live/your-domain.com/cert.pem
```

### Database Management
```bash
# Connect to PostgreSQL
sudo -u postgres psql surveillance

# Backup database
sudo -u postgres pg_dump surveillance > backup.sql

# Restore database
sudo -u postgres psql surveillance < backup.sql

# View users
sudo -u postgres psql surveillance -c "SELECT * FROM users;"
```

### Log Management
```bash
# View Nginx logs
sudo tail -f /var/log/nginx/axis-guardian-access.log
sudo tail -f /var/log/nginx/axis-guardian-error.log

# View application logs
sudo tail -f /var/log/axis-guardian/*.log

# View system logs
sudo journalctl -xe

# View logs for specific service
sudo journalctl -u SERVICE_NAME -f
```

---

## Support & Resources

- **Hetzner Documentation:** https://docs.hetzner.com/
- **Let's Encrypt:** https://letsencrypt.org/docs/
- **Nginx Documentation:** https://nginx.org/en/docs/
- **UFW Guide:** https://help.ubuntu.com/community/UFW

---

## Next Steps

After successful deployment:

1. **Customize the application** with your branding
2. **Connect real cameras** (replace mock feeds)
3. **Set up email notifications** for alarms
4. **Configure advanced monitoring** (alerting, logging)
5. **Implement additional security** (VPN, 2FA)
6. **Scale infrastructure** as needed

**Congratulations! Your Axis-Guardian surveillance system is now live! 🎉**
