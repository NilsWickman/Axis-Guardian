# Axis-Guardian VPS Deployment Files

Complete production deployment setup for Hetzner VPS with HTTPS, authentication, and enterprise-grade security.

## 📦 What's Included

This deployment package includes everything needed to deploy Axis-Guardian to a production VPS:

### 🔧 Configuration Files

| File | Purpose |
|------|---------|
| `.env.production` | Production environment variables |
| `simulation/mediamtx/mediamtx.production.yml` | MediaMTX production config with WebRTC |
| `nginx/axis-guardian.conf` | Nginx reverse proxy with SSL/TLS |
| `systemd/*.service` | 5 systemd service files for auto-start |

### 🚀 Deployment Scripts

| Script | Purpose |
|--------|---------|
| `scripts/vps-setup.sh` | Initial VPS hardening & dependency installation |
| `scripts/deploy.sh` | Application deployment & service installation |
| `scripts/ssl-setup.sh` | Let's Encrypt SSL certificate setup |
| `scripts/ufw-setup.sh` | Firewall configuration & security rules |

### 🔐 Authentication System

| Component | Technology |
|-----------|-----------|
| `backend/auth-service/` | Node.js JWT authentication service |
| `frontend/src/api/auth/authService.ts` | Frontend auth API client |
| `frontend/src/views/auth/LoginView.vue` | Beautiful login page |
| `frontend/src/middleware/auth.ts` | Vue Router authentication guards |

### 🐳 Docker Support

| File | Purpose |
|------|---------|
| `Dockerfile.frontend` | Frontend production build (Nginx + Vue.js) |
| `Dockerfile.webrtc` | WebRTC detection service |
| `Dockerfile.auth` | Authentication service |
| `docker-compose.prod.yml` | Complete production stack |

### 📚 Documentation

| File | Purpose |
|------|---------|
| `docs/DEPLOYMENT.md` | Complete step-by-step deployment guide |
| `docs/QUICK_DEPLOY.md` | Quick reference command list |
| `backend/auth-service/README.md` | Authentication API documentation |

## 🎯 Quick Start

### Option 1: Manual Deployment (Recommended for Production)

```bash
# 1. Clone repository on VPS
git clone https://github.com/YOUR_USERNAME/Axis-Guardian.git /var/www/axis-guardian

# 2. Initial VPS setup (one-time)
sudo bash scripts/vps-setup.sh

# 3. Configure environment
sudo vim .env.production  # Update domain, passwords, secrets

# 4. Setup firewall
sudo bash scripts/ufw-setup.sh

# 5. Setup SSL
sudo bash scripts/ssl-setup.sh your-domain.com

# 6. Deploy application
sudo bash scripts/deploy.sh

# 7. Access at https://your-domain.com
```

**Full instructions:** [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)

### Option 2: Docker Deployment

```bash
# 1. Clone and configure
git clone https://github.com/YOUR_USERNAME/Axis-Guardian.git
cd Axis-Guardian
cp .env.production.example .env.production
vim .env.production  # Configure

# 2. Build and run
docker-compose -f docker-compose.prod.yml up -d

# 3. Setup Nginx reverse proxy (see nginx/axis-guardian.conf)
```

## 🏗️ Architecture

### Production Stack

```
┌─────────────────────────────────────────────┐
│          Internet / Users                    │
└──────────────┬──────────────────────────────┘
               │
               │ HTTPS (443)
               │
┌──────────────▼──────────────────────────────┐
│  Nginx Reverse Proxy (SSL Termination)      │
│  - Let's Encrypt SSL/TLS                    │
│  - Security headers                          │
│  - Rate limiting                             │
└─┬────────────┬──────────────┬───────────────┘
  │            │              │
  │            │              │ WebSocket
  │            │              │
┌─▼────────┐ ┌─▼──────────┐ ┌─▼────────────┐
│ Frontend │ │ Auth       │ │ WebRTC       │
│ (Vue.js) │ │ Service    │ │ Detection    │
│          │ │ (JWT)      │ │ (YOLOv8)     │
└──────────┘ └─┬──────────┘ └─┬────────────┘
               │              │
         ┌─────┴───┬──────────┴─────┐
         │         │                │
      ┌──▼───┐  ┌──▼──────┐  ┌────▼──────┐
      │ PG   │  │ Redis   │  │ MediaMTX  │
      │ SQL  │  │ Cache   │  │ (RTSP/    │
      │      │  │         │  │  WebRTC)  │
      └──────┘  └─────────┘  └───────────┘
```

### Service Ports

| Service | Port | Exposed | Purpose |
|---------|------|---------|---------|
| Nginx | 80, 443 | ✅ Public | HTTPS frontend |
| Auth Service | 3000 | ❌ Internal | Authentication API |
| WebRTC Detection | 8080 | ✅ Public (HTTPS) | WebRTC signaling |
| WebRTC Media | 8189 UDP | ✅ Public | WebRTC media streams |
| MediaMTX API | 9997 | ❌ Internal | Media server API |
| PostgreSQL | 5432 | ❌ Internal | Database |
| Redis | 6379 | ❌ Internal | Cache/sessions |
| Prometheus | 9090 | ❌ Internal | Metrics |
| Grafana | 3000 | ❌ Internal | Monitoring |

## 🔒 Security Features

### Network Security
- ✅ **UFW Firewall** - Only essential ports exposed
- ✅ **Rate Limiting** - 5 login attempts per 15 minutes
- ✅ **Fail2ban** - Automatic IP blocking for suspicious activity
- ✅ **SSL/TLS** - Let's Encrypt with modern cipher suites
- ✅ **HSTS** - Force HTTPS with preload support

### Application Security
- ✅ **JWT Authentication** - Secure token-based auth
- ✅ **Password Hashing** - bcrypt with 10 rounds
- ✅ **Session Management** - Redis-backed sessions
- ✅ **CORS** - Restricted to your domain only
- ✅ **Helmet.js** - Security headers (CSP, X-Frame-Options, etc.)

### System Security
- ✅ **SSH Hardening** - Key-only auth, root login disabled
- ✅ **Auto Security Updates** - Unattended upgrades enabled
- ✅ **Principle of Least Privilege** - Services run as www-data
- ✅ **Systemd Sandboxing** - NoNewPrivileges, ProtectSystem, PrivateTmp
- ✅ **Log Rotation** - Automatic cleanup of old logs

## 🎨 Authentication UI

The included authentication system features:
- **Beautiful login page** with gradient background
- **Real-time validation** and helpful error messages
- **Password visibility toggle**
- **Loading states** and smooth animations
- **Responsive design** for mobile/tablet/desktop
- **Remember me** functionality
- **Automatic token refresh**

## 📊 Monitoring

### Included Dashboards

**Grafana** (Port 3000):
- Camera stream health
- System metrics (CPU, RAM, disk)
- Application performance
- Network bandwidth

**Prometheus** (Port 9090):
- Custom metrics queries
- Alert rules configuration

## 🔄 Maintenance

### Backup
```bash
# Manual backup
sudo /usr/local/bin/axis-guardian-backup.sh

# Automatic: Daily at 2 AM
# Retention: 30 days
# Location: /var/backups/axis-guardian/
```

### Updates
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update application
cd /var/www/axis-guardian
git pull origin main
sudo bash scripts/deploy.sh

# Restart services
sudo systemctl restart mediamtx webrtc-detection auth-service nginx
```

### Logs
```bash
# View all logs
sudo journalctl -f

# Service-specific logs
sudo journalctl -u auth-service -f
sudo journalctl -u webrtc-detection -f

# Nginx logs
sudo tail -f /var/log/nginx/axis-guardian-access.log
sudo tail -f /var/log/nginx/axis-guardian-error.log
```

## 🐛 Troubleshooting

### Services Won't Start
```bash
# Check service status
sudo systemctl status SERVICE_NAME

# View detailed logs
sudo journalctl -u SERVICE_NAME -n 50 --no-pager

# Check environment
sudo cat /var/www/axis-guardian/.env.production

# Verify dependencies
sudo systemctl status postgresql redis-server mediamtx
```

### SSL Certificate Issues
```bash
# Check certificate
sudo certbot certificates

# Test renewal
sudo certbot renew --dry-run

# Force renewal
sudo certbot renew --force-renewal

# Check Nginx config
sudo nginx -t
```

### Database Connection Failed
```bash
# Check PostgreSQL
sudo systemctl status postgresql

# Test connection
sudo -u postgres psql -c "\l"

# Reset password
sudo -u postgres psql
ALTER USER axis_guardian_prod WITH PASSWORD 'new_password';
```

### WebRTC Not Connecting
```bash
# Check MediaMTX
sudo systemctl status mediamtx
curl http://localhost:9997/v3/paths/list

# Verify firewall
sudo ufw status | grep 8189

# Check VPS_PUBLIC_IP in .env.production
grep VPS_PUBLIC_IP /var/www/axis-guardian/.env.production
```

## 📝 Configuration Checklist

Before deploying, ensure you've updated:

- [ ] `.env.production` - All passwords and secrets
- [ ] `.env.production` - Domain name
- [ ] `.env.production` - VPS public IP
- [ ] DNS A records pointing to VPS
- [ ] SSH keys added to VPS
- [ ] Firewall rules reviewed
- [ ] SSL certificate obtained
- [ ] Default admin password changed

## 🌐 Environment Variables

### Critical Variables (Must Change)

```bash
DOMAIN=your-domain.com
VPS_PUBLIC_IP=123.45.67.89
JWT_SECRET=<openssl rand -hex 32>
SESSION_SECRET=<openssl rand -hex 32>
POSTGRES_PASSWORD=<openssl rand -base64 24>
REDIS_PASSWORD=<openssl rand -base64 24>
ADMIN_PASSWORD=<openssl rand -base64 24>
GRAFANA_ADMIN_PASSWORD=<openssl rand -base64 24>
```

### Optional Variables

```bash
# Camera settings
CONFIDENCE_THRESHOLD=0.5
CAMERA_INTERFACE_MODE=video_boxes
USE_PREPROCESSED_VIDEOS=true

# Video quality (720p recommended for VPS)
PREPROCESSED_QUALITY=720p

# Rate limiting
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000
```

## 📞 Support

For issues:
1. Check [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) troubleshooting section
2. Review service logs: `sudo journalctl -xe`
3. Verify all services running: `sudo systemctl status mediamtx webrtc-detection auth-service nginx`
4. Check Nginx config: `sudo nginx -t`
5. Test database: `sudo -u postgres psql surveillance -c "\dt"`

## 📄 License

See [LICENSE](./LICENSE) file for details.

---

## 🚀 Ready to Deploy?

1. **Read the full guide:** [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)
2. **Quick reference:** [docs/QUICK_DEPLOY.md](./docs/QUICK_DEPLOY.md)
3. **Auth API docs:** [backend/auth-service/README.md](./backend/auth-service/README.md)

**Estimated deployment time:** 30-45 minutes (including DNS propagation)

**Happy deploying! 🎉**
