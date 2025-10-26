"""
VAPIX API Simulator

Simulates Axis camera HTTP API (VAPIX) for testing and development.
Provides realistic responses for common camera operations.

Port: 8090 (configurable)
"""

import asyncio
from datetime import datetime
from typing import Optional, Dict, List
from fastapi import FastAPI, Request, Response, Query, HTTPException
from fastapi.responses import JSONResponse, PlainTextResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseSettings, Field
import uvicorn
from loguru import logger
import sys


class Settings(BaseSettings):
    """VAPIX API Simulator settings."""
    host: str = Field(default="0.0.0.0", env="VAPIX_HOST")
    port: int = Field(default=8090, env="VAPIX_PORT")
    log_level: str = Field(default="INFO", env="LOG_LEVEL")

    class Config:
        env_file = "../../../.env"
        env_file_encoding = "utf-8"


settings = Settings()

# Setup logging
logger.remove()
logger.add(
    sys.stderr,
    level=settings.log_level,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan> - <level>{message}</level>",
)

app = FastAPI(
    title="VAPIX API Simulator",
    description="Simulates Axis camera HTTP API for development",
    version="1.0.0",
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simulated camera database
CAMERAS = {
    "camera1": {
        "id": "camera1",
        "name": "Auditorium HC3",
        "model": "AXIS P3245-LVE",
        "serial": "ACCC8E8A0001",
        "firmware": "11.5.61",
        "mac_address": "AC:CC:8E:8A:00:01",
        "ip_address": "192.168.1.101",
        "location": "Auditorium - High Corner 3",
    },
    "camera2": {
        "id": "camera2",
        "name": "Auditorium HC4",
        "model": "AXIS P3245-LVE",
        "serial": "ACCC8E8A0002",
        "firmware": "11.5.61",
        "mac_address": "AC:CC:8E:8A:00:02",
        "ip_address": "192.168.1.102",
        "location": "Auditorium - High Corner 4",
    },
    "camera3": {
        "id": "camera3",
        "name": "Auditorium IP2",
        "model": "AXIS P1455-LE",
        "serial": "ACCC8E8A0003",
        "firmware": "11.5.61",
        "mac_address": "AC:CC:8E:8A:00:03",
        "ip_address": "192.168.1.103",
        "location": "Auditorium - IP Camera 2",
    },
    "camera4": {
        "id": "camera4",
        "name": "Auditorium IP5",
        "model": "AXIS P1455-LE",
        "serial": "ACCC8E8A0004",
        "firmware": "11.5.61",
        "mac_address": "AC:CC:8E:8A:00:04",
        "ip_address": "192.168.1.104",
        "location": "Auditorium - IP Camera 5",
    },
}


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "service": "VAPIX API Simulator",
        "version": "1.0.0",
        "cameras": list(CAMERAS.keys()),
    }


@app.get("/health")
@app.get("/vapix/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "vapix-api-simulator",
        "cameras_available": len(CAMERAS),
        "uptime": "active",
    }


@app.get("/axis-cgi/basicdeviceinfo.cgi")
async def basic_device_info(camera_id: str = Query(default="camera1", alias="camera")):
    """
    Basic device information endpoint.

    Simulates: GET /axis-cgi/basicdeviceinfo.cgi
    """
    if camera_id not in CAMERAS:
        raise HTTPException(status_code=404, detail=f"Camera {camera_id} not found")

    camera = CAMERAS[camera_id]

    response = f"""root.Brand=AXIS
root.ProdFullName={camera['model']}
root.ProdNbr={camera['model'].split()[-1]}
root.ProdType=Network Camera
root.ProdVariant=
root.SerialNumber={camera['serial']}
root.Version={camera['firmware']}
root.Architecture=armv7hf
root.BuildDate=Jul 12 2023 14:23
root.Soc=Artpec-8
root.SocSerialNumber=00000000
root.HardwareID=123
"""
    return PlainTextResponse(content=response)


@app.get("/axis-cgi/param.cgi")
async def param_cgi(
    action: str = Query(default="list"),
    group: Optional[str] = Query(default=None),
    camera_id: str = Query(default="camera1", alias="camera"),
):
    """
    Parameter management endpoint.

    Simulates: GET /axis-cgi/param.cgi?action=list&group=<group>
    """
    if camera_id not in CAMERAS:
        raise HTTPException(status_code=404, detail=f"Camera {camera_id} not found")

    camera = CAMERAS[camera_id]

    if action == "list":
        if group == "Brand":
            params = {
                "Brand.Brand": "AXIS",
                "Brand.ProdFullName": camera["model"],
                "Brand.ProdNbr": camera["model"].split()[-1],
                "Brand.ProdShortName": camera["model"].split()[1],
                "Brand.ProdType": "Network Camera",
                "Brand.ProdVariant": "",
                "Brand.WebURL": "http://www.axis.com",
            }
        elif group == "Properties":
            params = {
                "Properties.API.HTTP.Version": "3",
                "Properties.API.Metadata.Version": "1.0",
                "Properties.API.PACS.Version": "1.1",
                "Properties.EmbeddedDevelopment.Version": "2.16",
                "Properties.Firmware.BuildDate": "Jul 12 2023 14:23",
                "Properties.Firmware.BuildNumber": "61",
                "Properties.Firmware.Version": camera["firmware"],
                "Properties.Image.Format": "jpeg,mjpeg,h264,h265",
                "Properties.Image.NbrOfViews": "1",
                "Properties.Image.Resolution": "1920x1080,1280x720,640x480",
                "Properties.Image.Rotation": "0,90,180,270",
                "Properties.System.Architecture": "armv7hf",
                "Properties.System.SerialNumber": camera["serial"],
                "Properties.System.Soc": "Artpec-8",
            }
        elif group == "Network":
            params = {
                "Network.BootProto": "dhcp",
                "Network.eth0.Enabled": "yes",
                "Network.eth0.IPAddress": camera["ip_address"],
                "Network.eth0.MACAddress": camera["mac_address"],
                "Network.eth0.SubnetMask": "255.255.255.0",
                "Network.Hostname": camera["name"].lower().replace(" ", "-"),
            }
        elif group == "PTZ":
            params = {
                "PTZ.Support": "yes",
                "PTZ.Various.V1.MaxPanSpeed": "450",
                "PTZ.Various.V1.MaxTiltSpeed": "450",
                "PTZ.Various.V1.MaxZoomSpeed": "100",
                "PTZ.Various.V1.MinPanSpeed": "1",
                "PTZ.Various.V1.MinTiltSpeed": "1",
                "PTZ.Various.V1.MinZoomSpeed": "1",
            }
        elif group == "StreamProfile":
            params = {
                "StreamProfile.MaxGroups": "20",
                "StreamProfile.S0.Description": "Default profile",
                "StreamProfile.S0.Name": "profile_1",
                "StreamProfile.S0.Parameters": "videocodec=h264&resolution=1920x1080&fps=30&compression=30",
            }
        else:
            # Return all parameters for unknown group
            params = {
                "root.Brand.Brand": "AXIS",
                "root.Brand.ProdFullName": camera["model"],
                "root.Properties.Firmware.Version": camera["firmware"],
                "root.Properties.System.SerialNumber": camera["serial"],
                "root.Network.eth0.IPAddress": camera["ip_address"],
                "root.Network.eth0.MACAddress": camera["mac_address"],
            }

        # Format as VAPIX parameter response
        response_lines = [f"{key}={value}" for key, value in params.items()]
        return PlainTextResponse(content="\n".join(response_lines))

    elif action == "update":
        # Simulated update (doesn't actually persist)
        return PlainTextResponse(content="OK")

    else:
        raise HTTPException(status_code=400, detail=f"Unknown action: {action}")


@app.post("/axis-cgi/param.cgi")
async def param_cgi_post(request: Request, camera_id: str = Query(default="camera1", alias="camera")):
    """Handle POST requests for parameter updates."""
    if camera_id not in CAMERAS:
        raise HTTPException(status_code=404, detail=f"Camera {camera_id} not found")

    # Parse form data
    form = await request.form()
    logger.info(f"Parameter update request for {camera_id}: {dict(form)}")

    # Simulate successful update
    return PlainTextResponse(content="OK")


@app.get("/axis-cgi/applications/control.cgi")
async def applications_control(
    action: str = Query(...),
    package: Optional[str] = Query(default=None),
    camera_id: str = Query(default="camera1", alias="camera"),
):
    """
    Application management endpoint.

    Simulates: GET /axis-cgi/applications/control.cgi?action=list
    """
    if camera_id not in CAMERAS:
        raise HTTPException(status_code=404, detail=f"Camera {camera_id} not found")

    if action == "list":
        # Return list of installed applications
        apps = {
            "applications": [
                {
                    "ApplicationID": "1",
                    "ApplicationName": "AXIS Object Analytics",
                    "ApplicationVersion": "1.0.0",
                    "Status": "Running",
                },
                {
                    "ApplicationID": "2",
                    "ApplicationName": "AXIS Fence Guard",
                    "ApplicationVersion": "2.1.5",
                    "Status": "Running",
                },
            ]
        }
        return JSONResponse(content=apps)

    elif action == "start" or action == "stop":
        if not package:
            raise HTTPException(status_code=400, detail="Package name required")
        return PlainTextResponse(content="OK")

    else:
        raise HTTPException(status_code=400, detail=f"Unknown action: {action}")


@app.get("/axis-cgi/eventlog.cgi")
async def event_log(
    action: str = Query(default="list"),
    page: int = Query(default=0),
    limit: int = Query(default=100),
    camera_id: str = Query(default="camera1", alias="camera"),
):
    """
    Event log endpoint.

    Simulates: GET /axis-cgi/eventlog.cgi?action=list
    """
    if camera_id not in CAMERAS:
        raise HTTPException(status_code=404, detail=f"Camera {camera_id} not found")

    if action == "list":
        # Generate simulated event log entries
        events = [
            {
                "ID": "1234",
                "DateTime": datetime.now().isoformat(),
                "SourceID": "Image",
                "EventID": "1",
                "Message": "Day mode activated",
            },
            {
                "ID": "1235",
                "DateTime": datetime.now().isoformat(),
                "SourceID": "Network",
                "EventID": "2",
                "Message": "Network connection established",
            },
        ]
        return JSONResponse(content={"events": events[page*limit:(page+1)*limit]})

    else:
        raise HTTPException(status_code=400, detail=f"Unknown action: {action}")


@app.get("/axis-cgi/io/portmanagement.cgi")
async def port_management(
    action: str = Query(default="list"),
    camera_id: str = Query(default="camera1", alias="camera"),
):
    """
    I/O port management endpoint.

    Simulates: GET /axis-cgi/io/portmanagement.cgi?action=list
    """
    if camera_id not in CAMERAS:
        raise HTTPException(status_code=404, detail=f"Camera {camera_id} not found")

    if action == "list":
        ports = {
            "ports": [
                {
                    "port": "1",
                    "name": "Input 1",
                    "direction": "input",
                    "status": "active",
                },
                {
                    "port": "2",
                    "name": "Output 1",
                    "direction": "output",
                    "status": "inactive",
                },
            ]
        }
        return JSONResponse(content=ports)

    else:
        raise HTTPException(status_code=400, detail=f"Unknown action: {action}")


@app.get("/axis-cgi/lightcontrol.cgi")
async def light_control(
    action: str = Query(...),
    light_id: Optional[str] = Query(default=None),
    camera_id: str = Query(default="camera1", alias="camera"),
):
    """IR light control endpoint."""
    if camera_id not in CAMERAS:
        raise HTTPException(status_code=404, detail=f"Camera {camera_id} not found")

    if action == "get":
        return JSONResponse(content={
            "mode": "auto",
            "status": "on",
            "intensity": "100",
        })
    elif action == "set":
        return PlainTextResponse(content="OK")
    else:
        raise HTTPException(status_code=400, detail=f"Unknown action: {action}")


@app.get("/axis-cgi/pwdgrp.cgi")
async def password_group(
    action: str = Query(...),
    camera_id: str = Query(default="camera1", alias="camera"),
):
    """User management endpoint (returns mock data)."""
    if camera_id not in CAMERAS:
        raise HTTPException(status_code=404, detail=f"Camera {camera_id} not found")

    if action == "get":
        return PlainTextResponse(content="root:admin:Administrator\noperator:operator:Operator\nviewer:viewer:Viewer")
    else:
        return PlainTextResponse(content="OK")


@app.get("/axis-cgi/systemready.cgi")
async def system_ready(camera_id: str = Query(default="camera1", alias="camera")):
    """System ready check endpoint."""
    if camera_id not in CAMERAS:
        raise HTTPException(status_code=404, detail=f"Camera {camera_id} not found")

    return PlainTextResponse(content="yes")


@app.get("/vapix/cameras")
async def list_cameras():
    """List all available cameras (custom endpoint for easy discovery)."""
    return JSONResponse(content={
        "cameras": list(CAMERAS.values()),
        "count": len(CAMERAS),
    })


@app.get("/vapix/cameras/{camera_id}")
async def get_camera(camera_id: str):
    """Get specific camera details."""
    if camera_id not in CAMERAS:
        raise HTTPException(status_code=404, detail=f"Camera {camera_id} not found")

    return JSONResponse(content=CAMERAS[camera_id])


if __name__ == "__main__":
    logger.info("=" * 60)
    logger.info("VAPIX API Simulator")
    logger.info("=" * 60)
    logger.info(f"Server: {settings.host}:{settings.port}")
    logger.info(f"Cameras: {', '.join(CAMERAS.keys())}")
    logger.info("=" * 60)

    uvicorn.run(
        app,
        host=settings.host,
        port=settings.port,
        log_level=settings.log_level.lower(),
    )
