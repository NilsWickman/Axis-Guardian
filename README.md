# Site-Level Video Surveillance System

A comprehensive surveillance system integrating multiple cameras and loudspeakers for real-time site-level monitoring, intrusion detection, and automated deterrence.

> **Development Approach**: This project follows a **frontend-first workflow** where UI is developed with mock data for requirements elicitation, API contracts are defined based on frontend needs, and backend services implement those contracts.

## Architecture

This project uses a **hybrid TypeScript/Python stack**:

- **TypeScript**: Frontend (Vue 3) + Service Layer (7 microservices)
  - API Gateway, Alarm Service, Control Service, Config Service, Auth Service, Heatmap Service, WebRTC Signaling
- **Python**: Device Layer + Analytics Layer
  - Device integration (Axis cameras/speakers, RTSP, WebRTC)
  - Analytics (object tracking, geo-mapping, rule engine, alarm generation)

See [Architecture Document](shared/docs/architecture/notebook/v2-Architecture-Document.md) for detailed technical specifications.

## Project Structure

```
├── frontend/                    # Vue 3 + TypeScript UI
├── backend/
│   ├── services/               # TypeScript microservices
│   │   ├── api-gateway/
│   │   ├── alarm-service/
│   │   ├── control-service/
│   │   ├── config-service/
│   │   ├── auth-service/
│   │   ├── heatmap-service/
│   │   └── webrtc-signaling/
│   └── python/                 # Python services
│       ├── device-layer/
│       ├── collection-layer/
│       └── analytics-layer/
├── shared/
│   ├── types/                  # Shared TypeScript types
│   └── schemas/                # OpenAPI schemas
├── database/                   # Database migrations and seeds
└── infrastructure/             # Docker configs
```

## Quick Start

### Prerequisites

- Node.js 22.19.0
- Python 3.12
- Docker & Docker Compose (for database)

### Setup

```bash
# One-time setup (installs dependencies + initializes database)
make setup

# Start frontend development with mock data
make dev
```

## Development Workflow

### Frontend-First Approach

1. **Phase 1: Frontend Development**
   - Develop UI components with mock data
   - Elicit requirements through interactive prototypes
   - Identify data needs and user interactions
   - Command: `make dev-frontend`

2. **Phase 2: Contract Definition**
   - Define OpenAPI schemas in `shared/schemas/` based on frontend requirements
   - Document API endpoints, request/response models, error cases
   - Review contracts with stakeholders

3. **Phase 3: Type Generation**
   - Generate TypeScript types from OpenAPI schemas
   - Generate API clients for frontend consumption
   - Command: `make generate-openapi`

4. **Phase 4: Backend Implementation**
   - TypeScript services implement API contracts
   - Python services provide device integration and analytics
   - All services adhere to generated type definitions
   - Command: `make dev` (all services)

### Communication Between Layers

- **Frontend ↔ Service Layer**: REST APIs + WebSocket (alarms, device status)
- **Service Layer ↔ Python**: HTTP REST (control commands) + MQTT (detections, events)
- **Python Layers**: MQTT for event streaming (detections → alarms)

### Key Commands

```bash
# Initial Setup
make help               # Show all available commands
make setup              # Complete setup (install deps + initialize database)

# Database
make database           # Setup database (stops existing, starts fresh, runs migrations/seeds)

# Development
make dev                # Start frontend with mock server (Phase 1 development)
make dev-all            # Start ALL servers (frontend + 7 backend services)

# API Contracts
make api-contract       # Validate OpenAPI schemas and generate types/clients

# Code Quality & Build
make quality            # Check formatting and linting
make build              # Build all compilable services
```

## Services

### Infrastructure (Docker)
- **PostgreSQL + PostGIS**: `localhost:5432`
- **MQTT**: `localhost:1883`
- **MinIO**: `localhost:9000` (console: `localhost:9090`)

### TypeScript Services
- **API Gateway**: `localhost:3000`
- **Alarm Service**: `localhost:3001`
- **Control Service**: `localhost:3002`
- **Config Service**: `localhost:3003`
- **Auth Service**: `localhost:3004`
- **Heatmap Service**: `localhost:3005`
- **WebRTC Signaling**: `localhost:3006`

### Python Services
- **Device Layer**: `localhost:5000`
- **Collection Layer**: `localhost:5001`
- **Analytics Layer**: `localhost:5002`

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Key variables:
- `DATABASE_URL`: PostgreSQL connection
- `MQTT_BROKER`: MQTT broker URL
- `JWT_SECRET`: Authentication secret
- `AXIS_CAMERAS`: Comma-separated camera IPs
- `AXIS_SPEAKERS`: Comma-separated speaker IPs

## Development Tips

### Recommended Development Flow

```bash
# 1. First-time setup
make setup              # Install deps + initialize database

# 2. Frontend-first development (Phase 1)
make dev                # Develop UI with mock data

# 3. After defining API contracts (Phase 2-3)
make api-contract       # Validate schemas and generate types

# 4. Full-stack development (Phase 4)
make dev-all            # Run all services together

# 5. Before committing
make quality            # Check formatting and linting
make build              # Verify all services compile
```

### Troubleshooting

**Services won't start:**
```bash
make database           # Reset database completely
docker ps               # Check container status
docker compose -f infrastructure/docker-compose/docker-compose.dev.yml logs
```

**Dependency issues:**
```bash
rm -rf node_modules frontend/node_modules shared/types/node_modules
make setup              # Reinstall everything
```

**Type errors after schema changes:**
```bash
make api-contract       # Regenerate types from OpenAPI schemas
make build              # Verify compilation
```

## Documentation

- [Architecture Document](shared/docs/architecture/notebook/v2-Architecture-Document.md) - Complete system architecture and design decisions
- [Software Requirements Specification](shared/docs/project_management/requirements/SRS.md) - User stories and functional requirements

## Project Status

- ✅ Project structure established
- ✅ TypeScript/Python hybrid architecture defined
- ✅ Development tooling configured
- 🚧 Frontend mock development (Phase 1)
- ⏳ API contract definition (Phase 2)
- ⏳ Backend implementation (Phase 4)

## License

Proprietary - Axis Communications
