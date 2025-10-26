# Axis Guardian Monitoring Setup

Complete monitoring stack with Prometheus and Grafana for real-time observability.

## Overview

This monitoring setup provides:
- **Grafana Dashboards**: Pre-built dashboards for cameras and system resources
- **Prometheus Metrics**: Time-series data collection from all services
- **Alert Rules**: Automated alerting for critical issues
- **System Metrics**: CPU, memory, network via Node Exporter

## Quick Start

### Start Monitoring Stack

```bash
# Option 1: Full dev environment (recommended)
./scripts/dev-start.sh

# Option 2: Docker services only
docker compose -f docker-compose.dev.yml up -d

# Option 3: Monitoring services only
docker compose -f docker-compose.dev.yml up -d prometheus grafana node-exporter
```

### Access Dashboards

**Grafana**: http://localhost:3000
- Username: `admin`
- Password: `admin` (change on first login)
- Dashboards location: Axis Guardian folder

**Prometheus**: http://localhost:9090
- Query UI for exploring metrics
- Alerts: http://localhost:9090/alerts

## Dashboards

### 1. Camera Overview

**Path**: Axis Guardian > Camera Overview

**Metrics Tracked:**
- **FPS per camera**: Real-time frame rate
- **Frame Processing Latency**: P95 processing time
- **Detection Count**: Objects detected over time
- **Frame Errors**: Lost and corrupted frames
- **Current FPS Limit**: Adaptive throttling status
- **RTSP Buffer Size**: Connection health indicator
- **Average Processing Time**: Per-camera performance

**Refresh Rate**: 5 seconds

### 2. System Resources

**Path**: Axis Guardian > System Resources

**Metrics Tracked:**
- **CPU Usage**: System-wide CPU utilization
- **Memory Usage**: Available vs. total memory
- **Network Traffic**: RX/TX bytes per interface
- **Active Services**: Service count and status
- **Service Health**: Per-service up/down status

**Refresh Rate**: 10 seconds

## Prometheus Metrics

### Camera Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `frames_read_total` | Counter | Total frames successfully read |
| `frames_lost_total` | Counter | Total frames lost/dropped |
| `frames_corrupted_total` | Counter | Total corrupted frames detected |
| `detections_precomputed_total` | Counter | Detections from pre-computed cache |
| `detections_initiated_total` | Counter | Real-time detections started |
| `frame_processing_seconds` | Histogram | Frame processing time distribution |
| `detection_latency_seconds` | Histogram | Detection inference latency |
| `current_fps_limit` | Gauge | Current adaptive FPS limit |
| `buffer_size` | Gauge | RTSP buffer size |
| `avg_processing_time_seconds` | Gauge | Average processing time |

### System Metrics (via Node Exporter)

| Metric | Description |
|--------|-------------|
| `node_cpu_seconds_total` | CPU time by mode (idle, user, system) |
| `node_memory_MemAvailable_bytes` | Available memory |
| `node_memory_MemTotal_bytes` | Total system memory |
| `node_network_receive_bytes_total` | Network RX bytes |
| `node_network_transmit_bytes_total` | Network TX bytes |

## Alert Rules

### Camera Alerts

**Location**: `prometheus/alerts/camera_alerts.yml`

| Alert | Condition | Severity | Duration |
|-------|-----------|----------|----------|
| HighFrameLossRate | >10 frames/sec lost | Warning | 2 min |
| CriticalFrameLoss | >30 frames/sec lost | Critical | 1 min |
| LowCameraFPS | <15 FPS | Warning | 2 min |
| HighFrameProcessingLatency | P95 >500ms | Warning | 3 min |
| HighCorruptedFrameRate | >5 corrupted/sec | Warning | 2 min |
| BufferSizeIncreasing | +3 buffer size in 10min | Info | 5 min |
| FPSLimitThrottled | <20 FPS limit | Warning | 5 min |

### Service Alerts

**Location**: `prometheus/alerts/service_alerts.yml`

| Alert | Condition | Severity | Duration |
|-------|-----------|----------|----------|
| ServiceDown | Service unreachable | Critical | 1 min |
| MediaMTXDown | MediaMTX unavailable | Critical | 1 min |
| HighCPUUsage | CPU >85% | Warning | 5 min |
| HighMemoryUsage | Memory >90% | Warning | 3 min |
| CriticalMemoryUsage | Memory >95% | Critical | 1 min |
| HighNetworkTraffic | TX >100MB/s | Info | 5 min |

## Configuration

### Prometheus

**Config File**: `prometheus/prometheus.yml`

**Scrape Intervals:**
- WebRTC Detection: 5 seconds
- VAPIX API: 10 seconds
- MediaMTX: 10 seconds
- Node Exporter: 10 seconds

**Retention**: 30 days

### Grafana

**Provisioning**:
- Datasources: `grafana/provisioning/datasources/`
- Dashboards: `grafana/provisioning/dashboards/`

**Default Settings**:
- Theme: Dark
- Sign-up: Disabled
- Home Dashboard: Camera Overview

## Querying Metrics

### Useful PromQL Queries

**Current FPS per camera:**
```promql
rate(frames_read_total[1m]) * 60
```

**Frame loss rate:**
```promql
rate(frames_lost_total[5m])
```

**P95 processing latency:**
```promql
histogram_quantile(0.95, rate(frame_processing_seconds_bucket[5m]))
```

**Total detections (5min):**
```promql
sum(rate(detections_precomputed_total[5m])) by (camera)
```

**Memory usage percentage:**
```promql
(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100
```

## Troubleshooting

### Grafana Shows "No Data"

1. Check Prometheus is running:
   ```bash
   curl http://localhost:9090/-/healthy
   ```

2. Verify targets are being scraped:
   - Open http://localhost:9090/targets
   - All targets should be "UP"

3. Check if metrics are being exported:
   ```bash
   curl http://localhost:8080/metrics
   ```

### Prometheus Not Scraping

1. Check service is reachable from Prometheus container:
   ```bash
   docker exec axis-guardian-prometheus wget -O- http://host.docker.internal:8080/metrics
   ```

2. Verify Prometheus config:
   ```bash
   docker exec axis-guardian-prometheus promtool check config /etc/prometheus/prometheus.yml
   ```

3. Check Prometheus logs:
   ```bash
   docker logs axis-guardian-prometheus
   ```

### Alerts Not Firing

1. Verify alert rules are loaded:
   - Open http://localhost:9090/alerts
   - Check "Inactive" section for syntax errors

2. Check alert rule syntax:
   ```bash
   docker exec axis-guardian-prometheus promtool check rules /etc/prometheus/alerts/*.yml
   ```

3. Ensure metric values meet alert conditions

## Adding Custom Dashboards

### Method 1: UI (Temporary)

1. Open Grafana: http://localhost:3000
2. Click "+" → "Dashboard"
3. Add panels with queries
4. Save dashboard

**Note**: Changes lost on container restart unless exported

### Method 2: Provisioning (Persistent)

1. Export dashboard JSON from Grafana UI
2. Save to `grafana/dashboards/my-dashboard.json`
3. Restart Grafana:
   ```bash
   docker compose -f docker-compose.dev.yml restart grafana
   ```

### Method 3: Import from Grafana.com

1. Browse dashboards: https://grafana.com/grafana/dashboards
2. Copy dashboard ID
3. In Grafana: "+" → "Import" → Enter ID

**Recommended:**
- Node Exporter Full: ID 1860
- Prometheus Stats: ID 2

## Exporting Data

### Export Metrics from Prometheus

```bash
# Query API
curl 'http://localhost:9090/api/v1/query?query=frames_read_total' | jq

# Export snapshot
docker exec axis-guardian-prometheus tar -czf /prometheus/snapshot.tar.gz /prometheus
docker cp axis-guardian-prometheus:/prometheus/snapshot.tar.gz ./backup/
```

### Export Grafana Dashboards

```bash
# Via UI: Dashboard Settings → JSON Model → Copy

# Via API:
curl -u admin:admin http://localhost:3000/api/dashboards/uid/axis-guardian-cameras | jq '.dashboard' > camera-overview-backup.json
```

## Performance Tuning

### Reduce Prometheus Storage

```yaml
# In prometheus.yml
global:
  scrape_interval: 30s  # Increase from 15s
storage:
  tsdb:
    retention.time: 15d  # Reduce from 30d
```

### Optimize Grafana Queries

- Use `rate()` instead of `increase()` for counters
- Add `[5m]` time ranges to reduce data points
- Use `avg()` or `sum()` to aggregate metrics

### Lower Scrape Frequency

```yaml
# In prometheus.yml
scrape_configs:
  - job_name: 'axis-guardian'
    scrape_interval: 10s  # Increase from 5s
```

## Integration with Alerting

### Alertmanager (Optional)

Add to `docker-compose.dev.yml`:

```yaml
alertmanager:
  image: prom/alertmanager
  ports:
    - "9093:9093"
  volumes:
    - ./monitoring/alertmanager:/etc/alertmanager
```

Configure receivers (email, Slack, PagerDuty) in `alertmanager/alertmanager.yml`

---

## Useful Links

- **Grafana Docs**: https://grafana.com/docs/grafana/latest/
- **Prometheus Docs**: https://prometheus.io/docs/
- **PromQL Cheatsheet**: https://promlabs.com/promql-cheat-sheet/
- **Dashboard Gallery**: https://grafana.com/grafana/dashboards/

---

**For development setup, see: `DOCKER_DEV_SETUP.md`**
