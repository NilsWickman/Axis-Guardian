# Multi-File API Contract Example 📁

**Minimal example showing how to organize APIs across multiple files using `$ref`**

## 🎯 Why Split Contracts?

**Single File Problems:**
- Hard to navigate large files
- Merge conflicts in teams
- Can't reuse models across services

**Multi-File Benefits:**
- ✅ Clean organization
- ✅ Reusable shared models
- ✅ Easier team collaboration
- ✅ Better maintainability

---

## 📂 Simple Structure

```
multi-file-example/
├── main.yaml                    # Entry point (references everything)
├── paths/                       # API endpoints
│   └── cameras.yaml             # Camera CRUD operations
└── schemas/                     # Data models
    ├── common.yaml              # Shared Error model
    └── camera-models.yaml       # Camera schemas
```

**Just 4 files!** Perfect for learning the concept.

---

## 🔗 How `$ref` Works

### Local Reference (Same File)
```yaml
$ref: '#/components/schemas/Camera'
```

### External Reference (Different File)
```yaml
$ref: './schemas/camera-models.yaml#/components/schemas/Camera'
```

### Pattern
```yaml
$ref: '<relative-path>#/<json-pointer>'
```

---

## 🚀 Quick Start

### Validate
```bash
# From project root (recommended)
spectral lint playgrounds/production_api_example/main.yaml

# Or from production_api_example directory with explicit ruleset
spectral lint --ruleset ../../.spectral.yaml main.yaml
```

### Generate Documentation
```bash
# Bundle all files into single spec
npx @redocly/cli bundle main.yaml -o bundled.yaml

# Generate beautiful ReDoc documentation
npx @redocly/cli build-docs bundled.yaml -o docs.html

# Or serve with Swagger UI
docker run -p 8080:8080 -e SWAGGER_JSON=/api/bundled.yaml -v $(pwd):/api swaggerapi/swagger-ui
```

### Generate Code
```bash
# Bundle first
npx @redocly/cli bundle main.yaml -o bundled.yaml

# Then generate
datamodel-codegen --input bundled.yaml --output models.py --output-model-type pydantic.BaseModel
```

---

## 📖 Example Files

### main.yaml
Entry point that references everything else:
- API metadata (title, version, description)
- Server configuration
- Security schemes
- References to paths and schemas

### paths/cameras.yaml
Camera endpoints:
- `GET /cameras` - List cameras
- `POST /cameras` - Create camera
- `GET /cameras/{id}` - Get camera by ID

References: `../schemas/camera-models.yaml#/components/schemas/Camera`

### schemas/camera-models.yaml
Camera data models:
- `Camera` - Main camera object
- `CameraStatus` - Status enum
- `CameraLocation` - Location details

References: `./common.yaml#/components/schemas/Timestamp`

### schemas/common.yaml
Shared types used across all domains:
- `Timestamp` - Standard ISO 8601 datetime
- `UUID` - Standard UUID format
- `PaginationResponse` - Standard pagination wrapper
- `ErrorResponse` - Standard error format

---

## 🤖 AI Prompt for Multi-File Structure

```
"Help me split this OpenAPI contract into multiple files:

1. Create main.yaml with API info
2. Put endpoints in paths/cameras.yaml
3. Put schemas in schemas/camera-models.yaml and schemas/common.yaml
4. Use $ref to link them

Show me how to reference camera-models.yaml from paths/cameras.yaml"
```

---

## 💡 Best Practices

### ✅ DO:
- **Group by domain** (not by HTTP method)
- **Share common models** in `schemas/common.yaml`
- **Use relative paths** for portability
- **Bundle before deploying** (single file for production)
- **Validate the main file** (it follows all refs)

### ❌ DON'T:
- Split too granularly (one file per endpoint = overkill)
- Use absolute paths (breaks when moved)
- Duplicate schemas (extract to common)
- Circular references (A refs B, B refs A)
- Deploy split files to production (bundle first)

---

## 🛠️ Tools

### Bundling (Combine Files)
```bash
# Redocly CLI (recommended)
npx @redocly/cli bundle main.yaml -o bundled.yaml

# Swagger CLI
npx swagger-cli bundle main.yaml -o bundled.yaml
```

### Validation
```bash
# From project root
spectral lint playgrounds/production_api_example/main.yaml

# Or specify ruleset explicitly
spectral lint --ruleset ../../.spectral.yaml main.yaml
```

### Dereferencing
```bash
# Replace all $refs with inline schemas
npx swagger-cli bundle main.yaml --dereference -o dereferenced.yaml
```

---

## 🔍 Real-World Example: AXIS Project

In the actual AXIS project (`/shared/contracts/`):

```
shared/contracts/
├── shared/
│   └── models.yaml              # Core domain models (Detection, Camera, Track)
├── gateway/
│   ├── auth.yaml                # Authentication API
│   └── websocket.yaml           # WebSocket events
└── communications/
    ├── camera.yaml              # Camera service API
    ├── rtsp.yaml                # RTSP streaming
    └── mqtt.yaml                # MQTT events

All reference: ../shared/models.yaml#/components/schemas/Detection
```

---

## 🎓 Learning Exercise

**Try this:**
1. Open `main.yaml`
2. Find a `$ref` to another file
3. Follow the reference to that file
4. Understand how they connect
5. Try adding a new endpoint in `paths/recordings.yaml`
6. Validate with `spectral lint main.yaml`

**AI Assist:**
```
"Add a new endpoint POST /recordings/{id}/download to paths/recordings.yaml
that references the Recording schema from schemas/recording-models.yaml.
Match the existing pattern."
```

---

## 📚 Additional Resources

- [OpenAPI Specification - Using $ref](https://spec.openapis.org/oas/v3.0.3#reference-object)
- [Redocly CLI Documentation](https://redocly.com/docs/cli/)
- [AXIS Project Contracts](../../../contracts/) - Real production example

---

**Complexity:** Intermediate | **Time:** 15 minutes | **Skills:** File organization, `$ref` usage