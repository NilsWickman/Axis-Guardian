# 🎯 Contract-First Development Showcase

**Live demonstration** of TypeScript and Python services communicating through OpenAPI-generated code.

## 🌟 What This Demonstrates

- ✅ **Type-safe cross-language communication** - TypeScript client talks to Python server
- ✅ **Generated code in action** - Both sides use code generated from the same OpenAPI spec
- ✅ **Zero integration surprises** - Contract guarantees compatibility
- ✅ **Minimal boilerplate** - Focus on business logic, not API plumbing

## 📁 Structure

```
showcase/
├── python-server/          # FastAPI server using generated Pydantic models
│   ├── main.py            # ~130 lines - Full CRUD implementation
│   └── requirements.txt
│
├── typescript-client/      # Node/TypeScript client using generated SDK
│   ├── demo.ts            # Full demo script with all operations
│   ├── package.json
│   └── tsconfig.json
│
└── README.md              # You are here!
```

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+

### Step 1: Start Python Server

```bash
# From playgrounds/showcase/python-server/
pip install -r requirements.txt
python main.py
```

The server will start on **http://localhost:8001**

You should see:
```
🚀 Starting Python FastAPI server on http://localhost:8001
📋 Using OpenAPI-generated models for type safety
```

### Step 2: Run TypeScript Client Demo

Open a **new terminal**:

```bash
# From playgrounds/showcase/typescript-client/
npm install
npm run demo
```

## 🎬 What the Demo Does

The TypeScript client performs a complete CRUD cycle:

1. **Lists** all cameras (shows initial state)
2. **Creates** a new camera
3. **Fetches** the created camera by ID
4. **Updates** camera status and location
5. **Filters** cameras by status
6. **Deletes** the demo camera
7. **Verifies** final state

### Expected Output

```
🎬 TypeScript Client Demo - Contract-First Development

📡 Connecting to Python FastAPI server at http://localhost:8001

1️⃣  Listing all cameras...
   Found 2 cameras
   • Front Entrance (cam-001) - online
   • Parking Lot (cam-002) - online

2️⃣  Creating new camera...
   ✅ Created: TypeScript Demo Camera (cam-003)

3️⃣  Fetching camera by ID...
   📹 TypeScript Demo Camera
      Location: Building C - Created by TS Client
      Status: online

4️⃣  Updating camera status...
   ✅ Updated: TypeScript Demo Camera -> offline
      New location: Building C - Updated!

5️⃣  Filtering online cameras...
   Found 2 online cameras

6️⃣  Cleaning up - deleting demo camera...
   ✅ Deleted camera cam-003

7️⃣  Final camera count...
   📊 Total cameras: 2

✨ Demo completed successfully!
🎯 Key takeaways:
   • TypeScript client talks to Python server seamlessly
   • Full type safety from OpenAPI contract
   • Both sides use generated code from same spec
   • Zero integration surprises!
```

## 🔍 Code Highlights

### Python Server (FastAPI)

**Uses generated Pydantic models:**
```python
from camera_surveillance_api_client.models.camera import Camera
from camera_surveillance_api_client.models.camera_status import CameraStatus

# Create camera with type safety
camera = Camera(
    id=new_id,
    name=body["name"],
    location=body.get("location", UNSET),
    status=CameraStatus.ONLINE
)
```

**Benefits:**
- Automatic validation from OpenAPI spec
- Type hints for IDE autocomplete
- Guaranteed to match contract

### TypeScript Client

**Uses generated SDK:**
```typescript
import { createCamera, getCameraById } from '../../generated/typescript/sdk.gen';

// Fully typed request and response
const { data: newCamera, error } = await createCamera({
  client,
  body: {
    name: 'Demo Camera',
    location: 'Building C'
  }
});
```

**Benefits:**
- Full TypeScript type safety
- IDE autocomplete for all fields
- Compile-time error checking
- Runtime error handling

## 🎓 Learning Points

### 1. Contract as Single Source of Truth
Both services reference the same OpenAPI spec → guaranteed compatibility

### 2. Generated Code Quality
- Python: Attrs-based models with validation
- TypeScript: Fetch-based client with full typing

### 3. Zero Manual Sync
Change the OpenAPI spec → regenerate → both sides update automatically

### 4. Production Ready
- Error handling included
- Type safety enforced
- Validation built-in

## 🔧 Customization Ideas

Try modifying the demo:

1. **Add authentication**: Update OpenAPI spec with security schemes
2. **Add new endpoints**: Extend camera-surveillance-api.yaml
3. **Add validation rules**: Update schema constraints
4. **Add new fields**: Modify Camera schema

After changes:
```bash
# Regenerate code
cd ../..
openapi-python-client generate --path camera-surveillance-api.yaml --output-path generated/python
npx @hey-api/openapi-ts -i camera-surveillance-api.yaml -o generated/typescript -c @hey-api/client-fetch

# Restart server and client - they'll automatically use new contract!
```

## 🆘 Troubleshooting

**Client can't connect to server:**
- Ensure Python server is running on port 8001
- Check for firewall/port conflicts

**Import errors in Python:**
- Make sure you're in the correct directory
- The script uses relative imports to find generated code

**TypeScript compilation errors:**
- Run `npm install` in typescript-client/
- Ensure generated code exists in `generated/typescript/`

## 🎯 Next Steps

1. **Explore generated code**: Look at `../generated/python/` and `../generated/typescript/`
2. **Modify the contract**: Edit `camera-surveillance-api.yaml` and regenerate
3. **Build your own**: Use this as a template for your APIs
4. **Add more features**: Pagination, filtering, authentication

---

**🏆 This is Contract-First Development in action!**

One spec → Multiple languages → Zero integration bugs