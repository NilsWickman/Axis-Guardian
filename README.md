# AXIS Surveillance System

### Project Management Resources

Project documentation live in [`shared/docs/`]

### Service Responsibilities

- **Frontend Team**: Interface Layer, Services Layer, 
- **Communications Team**: Device Layer, Collection Layer
- **Intelligence Team**: Analytics Layer

### Key Development Principles

- **Contract-First Development**: OpenAPI specifications drive implementation and team coordination
- **Team Autonomy**: Each team owns complete service lifecycles with independent deployment

## 📁 Repository Structure

```
axis-prototype/
├── README.md                           # This file
├── shared/                             # Contract-driven development hub
├── interface/                  # Frontend service (Vue/TypeScript)
├── communication/              # Communications service (Python)
└── intelligence/               # Intelligence service (Python)
```