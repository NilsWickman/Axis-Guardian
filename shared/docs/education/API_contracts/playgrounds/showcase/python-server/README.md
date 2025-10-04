# Python FastAPI Server

Minimal FastAPI server demonstrating OpenAPI-generated Pydantic models.

## Features

- ✅ Uses generated models from `../../generated/python/`
- ✅ Full CRUD operations
- ✅ In-memory storage (resets on restart)
- ✅ Type-safe with Pydantic validation
- ✅ ~130 lines of code

## Running

```bash
# Install dependencies
pip install -r requirements.txt

# Start server
python main.py
```

Server runs on **http://localhost:8001**

## Endpoints

- `GET /cameras` - List all cameras (optional ?status filter)
- `POST /cameras` - Create new camera
- `GET /cameras/{cameraId}` - Get specific camera
- `PUT /cameras/{cameraId}` - Update camera
- `DELETE /cameras/{cameraId}` - Delete camera

## Testing

```bash
# List cameras
curl http://localhost:8001/cameras

# Create camera
curl -X POST http://localhost:8001/cameras \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Camera", "location": "Building D"}'

# Get camera
curl http://localhost:8001/cameras/cam-001
```

## Interactive Docs

FastAPI provides automatic interactive documentation:

- **Swagger UI**: http://localhost:8001/docs
- **ReDoc**: http://localhost:8001/redoc