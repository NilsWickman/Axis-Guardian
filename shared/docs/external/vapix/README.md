# VAPIX API Documentation

This directory contains scraped documentation from the official Axis VAPIX API documentation.

**Source:** https://developer.axis.com/vapix/
**Scraped on:** 2025-10-04
**Total Pages:** 176

## Overview

VAPIX is an open application programming interface (API) developed by Axis that uses standard protocols to provide direct access and control of Axis devices. You can use these reliable and functional interfaces to integrate with other systems and customize solutions to fit your needs.

## Documentation Structure

The documentation is organized in the same tree structure as the official website:

```
vapix/
├── index.md (VAPIX Overview)
│
├── applications/
│   ├── applications.md (category index)
│   ├── application-api.md
│   ├── application-configuration-api.md
│   ├── axis-object-analytics-api.md
│   ├── cross-line-detection-1.1-api.md
│   ├── demographic-identifier-api.md
│   ├── digital-autotracking-api.md
│   ├── fence-guard.md
│   ├── license-plate-verifier-api.md
│   ├── loitering-guard.md
│   ├── motion-guard.md
│   ├── p8815-2-3d-people-counter-api.md
│   ├── people-counter-api.md
│   ├── queue-monitor-api.md
│   ├── video-motion-detection-2.1-api.md
│   ├── video-motion-detection-3-api.md
│   └── video-motion-detection-4-api.md
│
├── audio-systems/
│   ├── audio-systems.md (category index)
│   ├── audio-analytics.md
│   ├── audio-api.md
│   ├── audio-control-service-api.md
│   ├── audio-device-control.md
│   ├── audio-mixer-api.md
│   ├── audio-multicast-controller.md
│   ├── audio-relay-service-api.md
│   ├── auto-speaker-test-service-api.md
│   ├── axis-audio-manager-edge-api.md
│   ├── axis-audio-manager-pro-api.md
│   └── media-clip-api.md
│
├── body-worn-systems.md
│
├── device-configuration/
│   ├── device-configuration.md (category index)
│   ├── analytics-mqtt-api.md
│   ├── basic-device-info-api.md
│   ├── best-snapshot-configuration.md
│   ├── certificate-management.md
│   ├── client-credential-grants-configuration.md
│   ├── device-configuration-apis.md
│   ├── edge-to-edge-camera-pairing-api.md
│   ├── firewall-configuration-api.md
│   ├── lldp-configuration-api.md
│   ├── log-api.md
│   ├── network-settings-api.md
│   ├── openid-connect-setup.md
│   ├── param-api.md
│   ├── recording-group.md
│   ├── snmp-api.md
│   ├── speaker-display-notification.md
│   ├── speaker-display-settings.md
│   ├── ssh-management.md
│   ├── time-api.md
│   └── virtual-host.md
│
├── intercom/
│   ├── intercom.md (category index)
│   ├── call-service-api.md
│   └── intercom-service.md
│
├── network-video/
│   ├── network-video.md (category index)
│   ├── analytics-metadata-producer-configuration.md
│   ├── api-discovery-service.md
│   ├── basic-device-information.md
│   ├── video-streaming.md
│   ├── event-data-streaming.md
│   ├── event-streaming-over-websocket.md
│   ├── parameter-management.md
│   ├── system-settings.md
│   ├── siren-and-light.md
│   └── ... (84 files total)
│
├── physical-access-control/
│   ├── physical-access-control.md (category index)
│   ├── access-control-service.md
│   ├── connection-service.md
│   ├── door-control-service.md
│   ├── event-logger-service.md
│   ├── idpoint-service.md
│   ├── io-assignment-service.md
│   ├── keystore-service.md
│   ├── peripherals.md
│   ├── schedule-service.md
│   ├── system-integration-examples.md
│   ├── third-party-credential-service.md
│   └── user-service.md
│
└── radar/
    ├── radar.md (category index)
    ├── geolocation-api.md
    ├── network-radar-pairing.md
    ├── radar-autotracking.md
    ├── radar-configuration.md
    ├── radar-image.md
    └── radar-properties.md
```

## Key Documentation for Virtual Camera Development

For developing against a virtual Axis camera, focus on these key APIs:

### 1. **Video Streaming & Metadata**
- [Video Streaming](./network-video/video-streaming.md) - RTSP, HTTP streaming, Motion JPEG
- [Analytics Metadata Producer Configuration](./network-video/analytics-metadata-producer-configuration.md) - Configure ONVIF Scene Description metadata
- [Event Data Streaming](./network-video/event-data-streaming.md) - Stream events and metadata

### 2. **Device Configuration**
- [Parameter Management](./network-video/parameter-management.md) - Get/set device parameters
- [Basic Device Information](./network-video/basic-device-information.md) - Device info and capabilities
- [System Settings](./network-video/system-settings.md) - System configuration

### 3. **Audio & Control**
- [Siren and Light](./network-video/siren-and-light.md) - Speaker/siren control
- [Audio API](./audio-systems/audio-api.md) - Audio configuration and control
- [Media Clip API](./audio-systems/media-clip-api.md) - Play audio clips

### 4. **Integration Essentials**
- [API Discovery Service](./network-video/api-discovery-service.md) - Discover available APIs
- [Event and Action Services](./network-video/event-and-action-services.md) - Event system

## RTSP Integration Examples

### Metadata Stream URL
```
rtsp://<device-ip>/axis-media/media.amp?camera=1&audio=0&video=0&analytics=polygon
```

### Configure Metadata Producer
```bash
curl -X POST "http://<device-ip>/axis-cgi/analyticsmetadataconfig.cgi" \
  -u username:password \
  --data '{"apiVersion":"1.0","method":"setProducerConfiguration","params":{"producer":"Analytics Scene Description","channel":1,"enabled":true}}'
```

### Play Audio Clip
```bash
curl "http://<device-ip>/axis-cgi/playclip.cgi?clip=/path/to/audio.wav" \
  -u username:password
```

## Categories

- **[Applications](./applications/applications.md)** (17 pages) - Analytics applications and APIs
- **[Audio Systems](./audio-systems/audio-systems.md)** (11 pages) - Audio configuration and control
- **[Body Worn Systems](./body-worn-systems.md)** - Body worn camera systems
- **[Device Configuration](./device-configuration/device-configuration.md)** (20 pages) - Device setup and management
- **[Intercom](./intercom/intercom.md)** (2 pages) - Intercom services
- **[Network Video](./network-video/network-video.md)** (84 pages) - Video streaming, metadata, camera control
- **[Physical Access Control](./physical-access-control/physical-access-control.md)** (12 pages) - Access control services
- **[Radar](./radar/radar.md)** (6 pages) - Radar configuration and control
