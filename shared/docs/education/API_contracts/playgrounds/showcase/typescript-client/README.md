# TypeScript Client Demo

Interactive demo showing TypeScript client communicating with Python FastAPI server using OpenAPI-generated code.

## Features

- ✅ Uses generated **types** from `../../generated/typescript/`
- ✅ Full type safety with TypeScript
- ✅ Demonstrates all CRUD operations
- ✅ Simple fetch-based client functions
- ✅ ~150 lines of clean demo code

## Prerequisites

**The Python server must be running first!**

See `../python-server/README.md` for instructions.

## Running

```bash
# Install dependencies
npm install

# Run demo
npm run demo

# Watch mode (reruns on file changes)
npm run dev
```

## What It Does

The demo performs a complete workflow:

1. Lists existing cameras
2. Creates a new camera
3. Fetches it by ID
4. Updates its status
5. Filters by status
6. Deletes the test camera
7. Verifies final state

## Modifying the Demo

Edit `demo.ts` to experiment:

```typescript
// Try different operations
const camera = await createCamera({
  name: 'Your Custom Camera',
  location: 'Your Location'
});

// Filter by status
const onlineCams = await listCameras('online');
```

## Type Safety in Action

TypeScript catches errors at compile time thanks to generated types:

```typescript
// ✅ Valid - matches OpenAPI spec
await createCamera({ name: 'Camera' });

// ❌ Error - TypeScript catches missing 'name'
await createCamera({ location: 'Building' });
// Error: Argument of type '{ location: string; }' is not assignable...
//        Property 'name' is missing

// ❌ Error - TypeScript catches invalid status
await updateCamera('cam-001', { status: 'broken' });
// Error: Type '"broken"' is not assignable to type '"online" | "offline" | undefined'

// ✅ The Camera type is fully typed from the OpenAPI spec
const camera: Camera = await getCameraById('cam-001');
// IDE provides autocomplete for: camera.id, camera.name, camera.status, camera.location
```

This is the power of contract-first development!