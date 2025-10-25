"""
VAPIX HTTP API Simulator for Axis Cameras.

Simulates the HTTP API endpoints that real Axis cameras expose:
- /axis-cgi/param.cgi - Parameter management
- /axis-cgi/event.cgi - Event subscriptions
- /axis-cgi/applications/control.cgi - Application control
- /axis-cgi/basicdeviceinfo.cgi - Device information
"""

import asyncio
import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional, List
from urllib.parse import parse_qs

from fastapi import FastAPI, Request, Response, HTTPException, Query
from fastapi.responses import PlainTextResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Import camera registry
import sys
sys.path.append(str(Path(__file__).parent.parent / "config"))
from camera_registry import get_camera_registry, CameraConfig


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("vapix-api")

app = FastAPI(
    title="VAPIX API Simulator",
    description="Simulates Axis camera HTTP API endpoints",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load camera registry
registry = get_camera_registry()

# In-memory storage for camera parameters
# Structure: {camera_id: {group.param_name: value}}
camera_params: Dict[str, Dict[str, str]] = {}

# Event subscriptions
# Structure: {subscription_id: {camera_id, topics, ...}}
event_subscriptions: Dict[str, Dict] = {}
subscription_counter = 0


def get_camera_from_request(request: Request) -> Optional[CameraConfig]:
    """
    Extract camera ID from request path or host header.

    Examples:
        http://localhost:8090/camera1/axis-cgi/param.cgi
        http://camera1.local:8090/axis-cgi/param.cgi
    """
    # Try path-based routing first
    path_parts = request.url.path.strip("/").split("/")
    if path_parts and path_parts[0] in registry.get_camera_ids():
        return registry.get_camera(path_parts[0])

    # Try host-based routing
    host = request.headers.get("host", "").split(":")[0]
    for camera_id in registry.get_camera_ids():
        if camera_id in host:
            return registry.get_camera(camera_id)

    # Default to camera1 if no match
    return registry.get_camera("camera1")


def init_camera_params(camera: CameraConfig) -> None:
    """Initialize default parameters for a camera."""
    if camera.id not in camera_params:
        width, height = camera.resolution.split("x")
        camera_params[camera.id] = {
            # Image settings
            "Image.I0.Appearance.Resolution": camera.resolution,
            "Image.I0.Appearance.Compression": "30",
            "Image.I0.Appearance.ColorEnabled": "yes",
            "Image.I0.Appearance.MirrorEnabled": "no",
            "Image.I0.Appearance.Rotation": "0",

            # Stream settings
            "Image.I0.Stream.FPS": str(camera.fps),
            "Image.I0.Stream.Duration": "0",
            "Image.I0.Stream.NBR": "0",

            # Network settings
            "Network.HostName": camera.id,
            "Network.eth0.MACAddress": camera.vapix.mac_address,

            # System info
            "Brand.Brand": camera.vapix.brand,
            "Brand.ProdNbr": camera.vapix.model,
            "Properties.System.SerialNumber": camera.vapix.serial_number,
            "Properties.Firmware.Version": camera.vapix.firmware_version,

            # Motion detection
            "MotionDetection.M0.Enabled": "yes",
            "MotionDetection.M0.ObjectType": "1",  # 1=person, 2=vehicle, 3=all

            # Event settings
            "Events.Alarms.Enabled": "yes",
        }


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "service": "VAPIX API Simulator",
        "cameras": registry.get_camera_ids(),
        "endpoints": [
            "/axis-cgi/param.cgi",
            "/axis-cgi/basicdeviceinfo.cgi",
            "/axis-cgi/applications/control.cgi",
            "/axis-cgi/event.cgi",
        ]
    }


@app.get("/{camera_id}/axis-cgi/param.cgi")
@app.post("/{camera_id}/axis-cgi/param.cgi")
async def param_cgi(camera_id: str, request: Request, action: str = Query("list")):
    """
    VAPIX param.cgi endpoint - Parameter management.

    Actions:
        list - List all parameters or specific group
        update - Update parameters
    """
    camera = registry.get_camera(camera_id)
    if not camera:
        raise HTTPException(status_code=404, detail=f"Camera {camera_id} not found")

    init_camera_params(camera)

    if request.method == "GET":
        # List parameters
        group = request.query_params.get("group")

        if group:
            # Filter by group
            filtered = {
                k: v for k, v in camera_params[camera_id].items()
                if k.startswith(f"{group}.")
            }
        else:
            filtered = camera_params[camera_id]

        # Format as VAPIX response
        lines = [f"{k}={v}" for k, v in sorted(filtered.items())]
        return PlainTextResponse("\n".join(lines))

    elif request.method == "POST":
        # Update parameters
        body = await request.body()
        params_str = body.decode("utf-8")

        # Parse parameters (format: param=value&param2=value2)
        updates = {}
        for pair in params_str.split("&"):
            if "=" in pair:
                key, value = pair.split("=", 1)
                updates[key] = value

        # Update stored parameters
        camera_params[camera_id].update(updates)

        logger.info(f"Camera {camera_id}: Updated {len(updates)} parameters")

        return PlainTextResponse("OK")


@app.get("/{camera_id}/axis-cgi/basicdeviceinfo.cgi")
async def basic_device_info(camera_id: str):
    """VAPIX basicdeviceinfo.cgi endpoint - Device information in JSON format."""
    camera = registry.get_camera(camera_id)
    if not camera:
        raise HTTPException(status_code=404, detail=f"Camera {camera_id} not found")

    return JSONResponse({
        "apiVersion": "1.0",
        "data": {
            "propertyList": {
                "ProdNbr": camera.vapix.model,
                "ProdType": "Network Camera",
                "SerialNumber": camera.vapix.serial_number,
                "Version": camera.vapix.firmware_version,
                "ProdVariant": "Standard",
                "Brand": camera.vapix.brand,
                "Architecture": "armv7hf",
                "Soc": "Ambarella S5L",
            }
        }
    })


@app.get("/{camera_id}/axis-cgi/applications/list.cgi")
async def applications_list(camera_id: str):
    """List installed applications (ACAP)."""
    camera = registry.get_camera(camera_id)
    if not camera:
        raise HTTPException(status_code=404, detail=f"Camera {camera_id} not found")

    # Simulate installed applications based on capabilities
    applications = []

    if "object_detection" in [c.value for c in camera.capabilities]:
        applications.append({
            "Name": "objectdetection",
            "NiceName": "Object Detection",
            "Vendor": "Axis Communications",
            "Version": "1.0.0",
            "Status": "Running",
            "LicenseStatus": "Valid",
        })

    if "people_counting" in [c.value for c in camera.capabilities]:
        applications.append({
            "Name": "peoplecounter",
            "NiceName": "People Counter",
            "Vendor": "Axis Communications",
            "Version": "1.0.0",
            "Status": "Running",
            "LicenseStatus": "Valid",
        })

    return JSONResponse({"applications": applications})


@app.post("/{camera_id}/axis-cgi/event.cgi")
async def event_subscribe(camera_id: str, request: Request):
    """
    VAPIX event.cgi endpoint - Event subscriptions.

    Supports long-polling for event notifications.
    """
    global subscription_counter

    camera = registry.get_camera(camera_id)
    if not camera:
        raise HTTPException(status_code=404, detail=f"Camera {camera_id} not found")

    body = await request.body()
    params_str = body.decode("utf-8")

    # Parse event subscription request
    params = parse_qs(params_str)

    # Create subscription
    subscription_id = f"sub_{subscription_counter}"
    subscription_counter += 1

    topics = params.get("topics", [""])[0].split(",")

    event_subscriptions[subscription_id] = {
        "camera_id": camera_id,
        "topics": topics,
        "created_at": datetime.now(),
    }

    logger.info(f"Camera {camera_id}: Created event subscription {subscription_id} for topics: {topics}")

    # For now, return empty event stream
    # In a real implementation, this would be a long-polling connection
    return PlainTextResponse(
        f"--myboundary\r\n"
        f"Content-Type: application/xml\r\n\r\n"
        f'<?xml version="1.0" encoding="UTF-8"?>\r\n'
        f'<tt:MetadataStream xmlns:tt="http://www.onvif.org/ver10/schema">\r\n'
        f'</tt:MetadataStream>\r\n'
        f"--myboundary--\r\n",
        media_type="multipart/x-mixed-replace; boundary=myboundary"
    )


@app.get("/{camera_id}/axis-cgi/io/output.cgi")
async def io_output(
    camera_id: str,
    action: str = Query("get"),
    port: int = Query(1)
):
    """
    VAPIX I/O port control.

    Used for controlling relays, lights, etc.
    """
    camera = registry.get_camera(camera_id)
    if not camera:
        raise HTTPException(status_code=404, detail=f"Camera {camera_id} not found")

    if action == "get":
        # Return current state
        return PlainTextResponse(f"active=no")
    elif action == "set":
        # Set state (would trigger relay)
        logger.info(f"Camera {camera_id}: I/O port {port} activated")
        return PlainTextResponse("OK")

    raise HTTPException(status_code=400, detail=f"Invalid action: {action}")


@app.get("/{camera_id}/axis-cgi/systemready.cgi")
async def system_ready(camera_id: str):
    """Check if camera system is ready."""
    camera = registry.get_camera(camera_id)
    if not camera:
        raise HTTPException(status_code=404, detail=f"Camera {camera_id} not found")

    return PlainTextResponse("ready=yes")


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "cameras": len(registry.cameras)}


# Also support paths without camera_id prefix (using host-based routing)
@app.get("/axis-cgi/param.cgi")
@app.post("/axis-cgi/param.cgi")
async def param_cgi_host_based(request: Request, action: str = Query("list")):
    """Host-based routing version of param.cgi."""
    camera = get_camera_from_request(request)
    if not camera:
        raise HTTPException(status_code=404, detail="No camera found")

    # Delegate to path-based handler
    return await param_cgi(camera.id, request, action)


@app.get("/axis-cgi/basicdeviceinfo.cgi")
async def basic_device_info_host_based(request: Request):
    """Host-based routing version of basicdeviceinfo.cgi."""
    camera = get_camera_from_request(request)
    if not camera:
        raise HTTPException(status_code=404, detail="No camera found")

    return await basic_device_info(camera.id)


def main():
    """Run the VAPIX API simulator."""
    logger.info("Starting VAPIX API Simulator")
    logger.info(f"Loaded {len(registry.cameras)} cameras from config")

    for camera_id in registry.get_camera_ids():
        camera = registry.get_camera(camera_id)
        logger.info(f"  - {camera_id}: {camera.name} ({camera.vapix.model})")

    # Run server
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8090,
        log_level="info",
        access_log=True,
    )


if __name__ == "__main__":
    main()
