# ⚡ Quick Start - 2 Minutes to Running Demo

## Prerequisites Check
```bash
python3 --version  # Need 3.10+
node --version     # Need 18+
```

## Terminal 1: Python Server

```bash
cd playgrounds/showcase/python-server
pip install -r requirements.txt
python main.py
```

**✅ Success looks like:**
```
🚀 Starting Python FastAPI server on http://localhost:8001
📋 Using OpenAPI-generated models for type safety
INFO:     Uvicorn running on http://0.0.0.0:8001
```

## Terminal 2: TypeScript Client

```bash
cd playgrounds/showcase/typescript-client
npm install
npm run demo
```

**✅ Success looks like:**
```
🎬 TypeScript Client Demo - Contract-First Development

1️⃣  Listing all cameras...
   Found 2 cameras
   • Front Entrance (cam-001) - online
   • Parking Lot (cam-002) - online

2️⃣  Creating new camera...
   ✅ Created: TypeScript Demo Camera (cam-003)

...

✨ Demo completed successfully!
```

## 🎯 What Just Happened?

1. **Python server** started using **Pydantic models** generated from OpenAPI
2. **TypeScript client** communicated using **types** generated from OpenAPI
3. **Same contract** = **Zero integration issues**
4. **Full type safety** on both sides

## 🔧 Troubleshooting

**Port 8001 already in use:**
```bash
# Find and kill process
lsof -ti:8001 | xargs kill -9
```

**Python imports failing:**
```bash
# Make sure you're in python-server directory
cd playgrounds/showcase/python-server
```

**TypeScript errors:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## 🎓 Next Steps

- Read [Full Showcase README](README.md) for detailed explanation
- Modify `demo.ts` to try different operations
- Check out `main.py` to see the Python implementation
- Edit `camera-surveillance-api.yaml` and regenerate both sides!