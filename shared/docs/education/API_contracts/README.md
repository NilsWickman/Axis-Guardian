# OpenAPI & Contract-Driven Development Workshop ⚡

**API Workshop for understanding CDD**

**Traditional (Code-First):**
```
Backend codes → Frontend waits → Integration issues → Rework
```

**Contract-First (Modern):**
```
Design contract → Both teams work in parallel → Zero integration surprises
```
## 📘 Core Concepts (Read This First!)

### What is OpenAPI?

**OpenAPI** = Machine-readable API blueprint (YAML/JSON format)

Think of it as architectural plans for a building, but for APIs.

### OpenAPI Structure (5-Minute Overview)

```yaml
openapi: 3.0.3
info:
  title: My API                # Name & description
  version: 1.0.0               # Version number

paths:                         # Your endpoints
  /cameras/{cameraId}:         # URL path
    get:                       # HTTP method
      summary: Get camera      # Brief description
      parameters:              # Inputs
        - name: cameraId
          in: path
          required: true
          schema:
            type: string
      responses:               # Outputs
        '200':
          description: Success
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Camera'
        '404':
          description: Not found

components:
  schemas:                     # Reusable data models
    Camera:
      type: object
      required:
        - id
        - name
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
        location:
          type: string
```

### Key Sections

**info:** Metadata (title, version, description)

**paths:** Your API endpoints
- HTTP methods: GET, POST, PUT, DELETE, PATCH
- Parameters: path, query, header, body
- Responses: success + errors

**components/schemas:** Reusable data models
- Define once, reference everywhere with `$ref`
- Validation rules: required, min/max, patterns, enums
- Used for code generation

**Tip:** Use AI to generate the boilerplate, then refine!

---

## 🔧 Essential Tools (Quick Reference)

### 🌐 Online Tools (No Install!)
**Swagger Editor** - https://editor.swagger.io/
- Instant validation
- Live documentation preview
- Interactive testing with "Try it out"
- **Best for:** Quick validation, learning, demos

### 💻 Local CLI Tools

**Validation:**
```bash
# Run from project root to use .spectral.yaml config
spectral lint api.yaml           # Find errors
spectral lint --verbose api.yaml # Detailed output

# Or specify ruleset explicitly from any directory
spectral lint --ruleset path/to/.spectral.yaml api.yaml
```

> **Note:** The `.spectral.yaml` configuration file is located at the project root. Run `spectral lint` from the project root, or use `--ruleset` to specify the config path.

**Documentation:**
```bash
# Swagger UI (interactive)
docker run -p 8080:8080 -e SWAGGER_JSON=/api/api.yaml -v $(pwd):/api swaggerapi/swagger-ui

# ReDoc (beautiful static)
npx redoc-cli bundle api.yaml -o docs.html
```

**Code Generation:**
```bash
# Python - Full HTTP client + Pydantic models
pip install openapi-python-client
openapi-python-client generate --path api.yaml --output-path generated/python

# TypeScript - Full HTTP client + types
npx @hey-api/openapi-ts -i api.yaml -o generated/typescript -c @hey-api/client-fetch

# TypeScript - Types only (lightweight)
npx openapi-typescript api.yaml --output types.ts
```

### 🤖 AI-Assisted Workflows

**Generate with AI:**
```
"Create an OpenAPI 3.0 spec based on these requirements
```

**Fix with AI:**
```
"This OpenAPI spec has errors: [paste error]
Fix it and explain what was wrong"
```

**Extend with AI:**
```
"Add new endpoints and schemas based on this Sprint Backlog"
```

---

## 🏆 Best Practices (Speed Edition)

### ✅ DO:
- **Use Swagger Editor** for instant feedback
- **Let AI generate** boilerplate, you refine
- **Copy good patterns** from working examples
- **Validate early, validate often**
- **Add examples** to every schema
- **Define errors** (400, 404, 500) for every endpoint
- **Use $refs** for reusable components

### ❌ DON'T:
- Manually type everything (use AI!)
- Skip validation (breaks integration)
- Forget error responses (production APIs need them)
- Use vague names (`getData` → `getCameraById`)
- Inline schemas (use `$ref` instead)

### Quick Checklist:
```yaml
✓ operationId on every endpoint (unique!)
✓ summary and description
✓ Request body schema (for POST/PUT)
✓ Response schemas (200, 400, 404, 500)
✓ Examples for every schema
✓ Validation rules (min, max, pattern, enum)
✓ No Spectral errors

```

## Hands on

### Option 1: Jump Straight In (fast and bad for designing, good for understanding)
No installation required - use online tools:

1. **Open Swagger Editor:** https://editor.swagger.io/
2. **Copy a playground API:** `playgrounds/camera-surveillance-api.yaml`
3. **Paste and explore** - See instant validation & interactive docs!
4. **Try the exercises:**

### Option 2: Full Local Setup
For code generation and CI/CD integration:

```bash
# Install validators and generators
npm install -g @stoplight/spectral-cli @redocly/cli
pip install datamodel-code-generator

# Optional: mock server
npm install -g @stoplight/prism-cli
```

### Quick Commands
```bash
# Validate - run from project root to use .spectral.yaml config
spectral lint playgrounds/camera-surveillance-api.yaml

# Or specify the config file explicitly
cd playgrounds
spectral lint --ruleset ../.spectral.yaml camera-surveillance-api.yaml

# Generate docs (modern Redocly CLI)
npx @redocly/cli build-docs camera-surveillance-api.yaml -o docs.html

# Generate Python client + models (full production-ready client)
openapi-python-client generate --path camera-surveillance-api.yaml --output-path generated/python

# Generate TypeScript client + types (full production-ready client)
npx @hey-api/openapi-ts -i camera-surveillance-api.yaml -o generated/typescript -c @hey-api/client-fetch

# Generate TypeScript types only (lightweight, no client)
npx openapi-typescript camera-surveillance-api.yaml -o types.ts
```

## 📖 Example API & Exercises

### 📹 Camera Surveillance API
**Real-world example** from the AXIS project
- Camera CRUD operations
- Detection event processing
- Object tracking across cameras
- Alarm management
- Health monitoring

**👉 [Browse Playgrounds](playgrounds/README.md)**

### 🎯 Generated Code Examples

The camera surveillance API includes **production-ready generated clients** in both Python and TypeScript!

**Location:** `playgrounds/generated/`

**Python Client Example:**
```python
from camera_surveillance_api_client import Client
from camera_surveillance_api_client.models import Camera
from camera_surveillance_api_client.api.cameras import list_cameras, create_camera

# Initialize client
client = Client(base_url="http://localhost:4010")

# List all cameras
cameras = list_cameras.sync(client=client)

# Create a new camera
new_camera = create_camera.sync(
    client=client,
    body={"name": "Warehouse Camera", "location": "Building B"}
)

# Async support included!
async with AsyncClient(base_url="http://localhost:4010") as client:
    cameras = await list_cameras.asyncio(client=client)
```

**TypeScript Client Example:**
```typescript
import type { Camera } from './generated/typescript/types.gen';

// Simple type-safe functions using generated types
async function createCamera(body: { name: string; location?: string }): Promise<Camera> {
  const response = await fetch('http://localhost:8001/cameras', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return response.json();
}

// Full type safety from OpenAPI contract!
const newCamera: Camera = await createCamera({
  name: 'Warehouse Camera',
  location: 'Building B'
});
// TypeScript knows: newCamera.id, .name, .status, .location
```

**What's Generated:**

Python (`generated/python/`):
- ✅ Fully typed client with sync/async support
- ✅ Pydantic models with validation
- ✅ Type hints throughout
- ✅ Error handling
- ✅ Poetry/pip installable package

TypeScript (`generated/typescript/`):
- ✅ Type-safe interfaces for all models
- ✅ Request/response type definitions
- ✅ Path/query/body parameter types
- ✅ Error response types
- ✅ Full TypeScript type safety

### 🎬 Live Demo: Cross-Language Communication

**See it in action!** The `showcase/` directory contains a complete working example:
- **Python FastAPI server** using generated Pydantic models
- **TypeScript client** using generated types
- **Full CRUD operations** demonstrating type-safe cross-language communication

**👉 [Run the Showcase](playgrounds/showcase/README.md)** - Start the Python server and watch the TypeScript client communicate seamlessly!

### 🎓 Fast Track Exercises
**AI-powered hands-on practice** (40 min total)
1. Fix broken contracts using AI + Swagger Editor
2. Extend APIs with AI-generated endpoints
3. Validate and iterate rapidly

**👉 [Start Exercises](playgrounds/exercises/README.md)**

## 🎓 Choose Your Path

### 🚀 Fast Track (Recommended for Workshop)
**Time:** 2 hours | **Tools:** Online Swagger Editor + AI
1. Complete Exercise 1: Fix broken contract (15 min)
2. Complete Exercise 2: Extend Camera API (25 min)
3. Try Swagger UI generation (10 min)
4. Try code generation (10 min)

### 📚 Deep Dive (Self-Paced Learning)
**Time:** 4-6 hours | **Tools:** Full local setup
1. Read all documentation sections below
2. Complete all exercises
3. Design your own API from scratch
4. Build integration with generated code

---

## 📚 Resources & Next Steps

### 🎓 Workshop Materials
- **[Fast Track Exercises](playgrounds/exercises/README.md)** - Start here!
- **[Playground APIs](playgrounds/README.md)** - Example contracts
- **[Quick Start Guide](QUICK_START.md)** - 5-minute intro (if available)
- **[Documentation Generation](DOCUMENTATION_GENERATION.md)** - Swagger/ReDoc setup (if available)

### 🌐 External Resources
- **[OpenAPI 3.0 Spec](https://spec.openapis.org/oas/v3.0.3)** - Official reference
- **[Swagger Editor](https://editor.swagger.io/)** - Online playground
- **[Spectral Docs](https://stoplight.io/open-source/spectral)** - Validation rules
- **[OpenAPI Generator](https://openapi-generator.tech/)** - Multi-language code gen

### 🏢 AXIS Project References
- `shared/contracts/shared/models.yaml` - Core domain models
- `shared/contracts/gateway/auth.yaml` - Authentication API
- `shared/contracts/communications/camera.yaml` - Camera API
- `shared/docs/architecture/decisions/0001-contract-first-api.md` - Why we chose this

### 🤖 AI Tools for OpenAPI
- **Claude Code / ChatGPT** - Generate, fix, extend contracts
- **GitHub Copilot** - Inline YAML suggestions
- **Cursor** - AI-powered code editor

---

## 🆘 Getting Help

**Common Issues:**
- **Validation errors?** Spectral CLI through AI calls
- **$ref not resolving?** Check path and that schema exists using AI
- **Generation failing?** Validate contract first and debug with AI

---

Remember: **AI helps you move fast!**