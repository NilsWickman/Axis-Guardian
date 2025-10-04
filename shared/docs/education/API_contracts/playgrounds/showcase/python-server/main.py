"""
Minimal FastAPI server using OpenAPI-generated models.
Demonstrates contract-first development with type safety.
"""
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import sys
from pathlib import Path

# Add generated client to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "generated" / "python"))

from camera_surveillance_api_client.models.camera import Camera
from camera_surveillance_api_client.models.camera_status import CameraStatus
from camera_surveillance_api_client.types import UNSET

app = FastAPI(title="Camera Surveillance API", version="1.0.0")

# Enable CORS for cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage
cameras_db: dict[str, Camera] = {
    "cam-001": Camera(
        id="cam-001",
        name="Front Entrance",
        location="Building A",
        status=CameraStatus.ONLINE
    ),
    "cam-002": Camera(
        id="cam-002",
        name="Parking Lot",
        location="Building A",
        status=CameraStatus.ONLINE
    ),
}

camera_counter = 3


@app.get("/cameras", response_model=list[dict])
async def list_cameras(status: Optional[str] = Query(None)):
    """List all cameras, optionally filtered by status"""
    result = list(cameras_db.values())

    if status:
        result = [c for c in result if c.status.value == status]

    return [c.to_dict() for c in result]


@app.post("/cameras", response_model=dict, status_code=201)
async def create_camera(body: dict):
    """Create a new camera"""
    global camera_counter

    if not body.get("name"):
        raise HTTPException(status_code=400, detail={"code": "INVALID_INPUT", "message": "Name is required"})

    new_id = f"cam-{camera_counter:03d}"
    camera_counter += 1

    camera = Camera(
        id=new_id,
        name=body["name"],
        location=body.get("location", UNSET),
        status=CameraStatus.ONLINE
    )

    cameras_db[new_id] = camera
    return camera.to_dict()


@app.get("/cameras/{cameraId}", response_model=dict)
async def get_camera_by_id(cameraId: str):
    """Get a specific camera by ID"""
    camera = cameras_db.get(cameraId)

    if not camera:
        raise HTTPException(
            status_code=404,
            detail={"code": "CAMERA_NOT_FOUND", "message": f"Camera with ID '{cameraId}' not found"}
        )

    return camera.to_dict()


@app.put("/cameras/{cameraId}", response_model=dict)
async def update_camera(cameraId: str, body: dict):
    """Update an existing camera"""
    camera = cameras_db.get(cameraId)

    if not camera:
        raise HTTPException(
            status_code=404,
            detail={"code": "CAMERA_NOT_FOUND", "message": f"Camera with ID '{cameraId}' not found"}
        )

    # Update fields
    if "name" in body:
        camera.name = body["name"]
    if "location" in body:
        camera.location = body["location"]
    if "status" in body:
        camera.status = CameraStatus(body["status"])

    return camera.to_dict()


@app.delete("/cameras/{cameraId}", status_code=204)
async def delete_camera(cameraId: str):
    """Delete a camera"""
    if cameraId not in cameras_db:
        raise HTTPException(
            status_code=404,
            detail={"code": "CAMERA_NOT_FOUND", "message": f"Camera with ID '{cameraId}' not found"}
        )

    del cameras_db[cameraId]
    return None


if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Python FastAPI server on http://localhost:8001")
    print("📋 Using OpenAPI-generated models for type safety")
    uvicorn.run(app, host="0.0.0.0", port=8001)