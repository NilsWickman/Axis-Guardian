"""Unified IP Camera Emulator - ONVIF + WebRTC with Preprocessed Data.

This service emulates a complete IP camera with:
- ONVIF Protocol (Device Management, Media, Events)
- WebRTC Streaming (Video + Detection Metadata)
- Preprocessed video/detection playback for perfect synchronization
"""

import sys
import uuid
from pathlib import Path

from fastapi import FastAPI, Request, Response, WebSocket
from fastapi.responses import PlainTextResponse
from loguru import logger
import uvicorn

from .auth import ONVIFAuth
from .camera_config import CameraConfig
from .config import settings
from .services import DeviceManagementService, MediaService
from .services.events_service_preprocessed import EventsServicePreprocessed
from .webrtc import WebRTCSignalingHandler


# Configure logging
logger.remove()
logger.add(
    sys.stderr,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan> - <level>{message}</level>",
    level=settings.log_level,
)


class IPCameraEmulator:
    """Unified IP Camera Emulator with ONVIF + WebRTC."""

    def __init__(self):
        """Initialize IP camera emulator."""
        self.app = FastAPI(
            title="IP Camera Emulator",
            description=f"ONVIF + WebRTC camera emulator for {settings.camera_id}",
            version="1.0.0",
        )

        # Load camera configuration
        self.camera_config = CameraConfig(
            settings.camera_id, settings.camera_registry_path
        )

        # Initialize authentication
        self.auth = ONVIFAuth(
            settings.onvif_username,
            settings.onvif_password,
            settings.onvif_enable_auth,
        )

        # Preprocessed data paths
        self.video_path = self._get_video_path()
        self.metadata_path = self._get_metadata_path()

        # Initialize ONVIF services
        self.device_service = DeviceManagementService(self.camera_config)
        self.media_service = MediaService(self.camera_config)
        self.events_service = EventsServicePreprocessed(
            self.camera_config,
            self.video_path,
            self.metadata_path
        )

        # Initialize WebRTC handler
        self.webrtc_handler = WebRTCSignalingHandler(
            camera_id=settings.camera_id,
            video_path=self.video_path,
            metadata_path=self.metadata_path
        )

        # Register routes
        self._register_routes()

        logger.info(f"IP Camera Emulator initialized for: {settings.camera_id}")
        logger.info(f"Camera: {self.camera_config.name} ({self.camera_config.model})")
        logger.info(f"Video: {self.video_path.name}")
        logger.info(f"Metadata: {self.metadata_path.name}")
        logger.info(f"ONVIF Auth: {'enabled' if settings.onvif_enable_auth else 'disabled'}")
        logger.info(f"WebRTC: enabled on /ws/webrtc")

    def _get_video_path(self) -> Path:
        """Get preprocessed video path.

        Returns:
            Path to preprocessed video file
        """
        return settings.preprocessed_video_path

    def _get_metadata_path(self) -> Path:
        """Get preprocessed metadata path.

        Returns:
            Path to .detections.json file
        """
        return settings.preprocessed_metadata_path

    def _register_routes(self):
        """Register FastAPI routes for ONVIF and WebRTC."""

        @self.app.get("/")
        async def root():
            """Root endpoint."""
            return {
                "service": "IP Camera Emulator",
                "camera_id": settings.camera_id,
                "camera_name": self.camera_config.name,
                "model": self.camera_config.model,
                "protocols": {
                    "onvif": {
                        "device": "/onvif/device_service",
                        "media": "/onvif/media_service",
                        "events": "/onvif/events_service"
                    },
                    "webrtc": {
                        "signaling": "/ws/webrtc"
                    }
                },
                "data_source": {
                    "type": "preprocessed",
                    "video": str(self.video_path),
                    "metadata": str(self.metadata_path)
                }
            }

        @self.app.get("/health")
        async def health():
            """Health check endpoint."""
            return {
                "status": "healthy",
                "camera_id": settings.camera_id,
                "services": {
                    "onvif": True,
                    "webrtc": True
                }
            }

        # ===== ONVIF ENDPOINTS =====

        @self.app.post("/onvif/device_service")
        async def device_service(request: Request):
            """ONVIF Device Management Service SOAP endpoint."""
            return await self._handle_soap_request(request, "device")

        @self.app.post("/onvif/media_service")
        async def media_service(request: Request):
            """ONVIF Media Service SOAP endpoint."""
            return await self._handle_soap_request(request, "media")

        @self.app.post("/onvif/events_service")
        async def events_service(request: Request):
            """ONVIF Events Service SOAP endpoint."""
            return await self._handle_soap_request(request, "events")

        # WSDL files
        @self.app.get("/onvif/device_service.wsdl")
        async def device_wsdl():
            """Serve Device Management WSDL."""
            return await self._serve_wsdl("devicemgmt.wsdl")

        @self.app.get("/onvif/media_service.wsdl")
        async def media_wsdl():
            """Serve Media Service WSDL."""
            return await self._serve_wsdl("media.wsdl")

        @self.app.get("/onvif/events_service.wsdl")
        async def events_wsdl():
            """Serve Events Service WSDL."""
            return await self._serve_wsdl("events.wsdl")

        # ===== WEBRTC ENDPOINTS =====

        @self.app.websocket("/ws/webrtc")
        async def webrtc_signaling(websocket: WebSocket):
            """WebRTC signaling endpoint."""
            client_id = str(uuid.uuid4())
            await self.webrtc_handler.handle_websocket(websocket, client_id)

        @self.app.get("/webrtc/stats")
        async def webrtc_stats():
            """Get WebRTC connection statistics."""
            return {
                "active_connections": len(self.webrtc_handler.peer_connections),
                "playback_stats": self.webrtc_handler.synchronizer.get_statistics()
            }

    async def _serve_wsdl(self, filename: str) -> Response:
        """Serve WSDL file.

        Args:
            filename: WSDL filename

        Returns:
            WSDL file response
        """
        wsdl_path = settings.wsdl_dir / filename

        if not wsdl_path.exists():
            logger.warning(f"WSDL file not found: {wsdl_path}")
            return PlainTextResponse(
                content=f"WSDL file not found: {filename}",
                status_code=404,
            )

        with open(wsdl_path, "r") as f:
            wsdl_content = f.read()

        return Response(
            content=wsdl_content,
            media_type="application/xml",
        )

    async def _handle_soap_request(self, request: Request, service_type: str) -> Response:
        """Handle SOAP request for ONVIF services.

        Args:
            request: FastAPI request
            service_type: Service type ("device", "media", "events")

        Returns:
            SOAP response
        """
        # Read SOAP body
        soap_body = await request.body()
        soap_str = soap_body.decode("utf-8")

        logger.debug(f"SOAP request ({service_type}): {soap_str[:200]}...")

        # Authenticate request
        if not self.auth.authenticate_request(soap_str):
            logger.warning("Authentication failed")
            return Response(
                content=self._create_soap_fault("Sender", "Authentication failed"),
                media_type="application/soap+xml",
                status_code=401,
            )

        # Parse operation from SOAP body
        operation = self._extract_operation(soap_str)
        if not operation:
            logger.warning("Failed to extract operation from SOAP body")
            return Response(
                content=self._create_soap_fault("Sender", "Invalid SOAP request"),
                media_type="application/soap+xml",
                status_code=400,
            )

        logger.info(f"{service_type}.{operation}")

        # Route to appropriate service
        try:
            response_data = self._dispatch_operation(service_type, operation, soap_str)
            soap_response = self._create_soap_response(operation, response_data)

            return Response(
                content=soap_response,
                media_type="application/soap+xml",
            )

        except Exception as e:
            logger.error(f"Error processing {service_type}.{operation}: {e}")
            return Response(
                content=self._create_soap_fault("Receiver", str(e)),
                media_type="application/soap+xml",
                status_code=500,
            )

    def _extract_operation(self, soap_body: str) -> str:
        """Extract operation name from SOAP body.

        Args:
            soap_body: SOAP XML string

        Returns:
            Operation name or empty string
        """
        try:
            body_start = soap_body.find("<s:Body")
            if body_start == -1:
                body_start = soap_body.find("<soap:Body")
            if body_start == -1:
                return ""

            body_content_start = soap_body.find(">", body_start) + 1
            operation_start = soap_body.find("<", body_content_start) + 1
            operation_end = soap_body.find(" ", operation_start)
            if operation_end == -1:
                operation_end = soap_body.find(">", operation_start)

            operation = soap_body[operation_start:operation_end]

            # Remove namespace prefix
            if ":" in operation:
                operation = operation.split(":")[-1]

            return operation

        except Exception as e:
            logger.error(f"Failed to extract operation: {e}")
            return ""

    def _dispatch_operation(
        self, service_type: str, operation: str, soap_body: str
    ) -> dict:
        """Dispatch operation to appropriate service."""
        if service_type == "device":
            return self._dispatch_device_operation(operation, soap_body)
        elif service_type == "media":
            return self._dispatch_media_operation(operation, soap_body)
        elif service_type == "events":
            return self._dispatch_events_operation(operation, soap_body)
        else:
            raise ValueError(f"Unknown service type: {service_type}")

    def _dispatch_device_operation(self, operation: str, soap_body: str) -> dict:
        """Dispatch device management operation."""
        operations = {
            "GetDeviceInformation": self.device_service.get_device_information,
            "GetSystemDateAndTime": self.device_service.get_system_date_and_time,
            "GetCapabilities": self.device_service.get_capabilities,
            "GetServices": lambda: self.device_service.get_services(True),
            "GetHostname": self.device_service.get_hostname,
            "GetNetworkInterfaces": self.device_service.get_network_interfaces,
            "GetDNS": self.device_service.get_dns,
            "GetScopes": self.device_service.get_scopes,
        }

        handler = operations.get(operation)
        if not handler:
            raise ValueError(f"Unsupported operation: {operation}")

        return handler()

    def _dispatch_media_operation(self, operation: str, soap_body: str) -> dict:
        """Dispatch media service operation."""
        operations = {
            "GetProfiles": self.media_service.get_profiles,
            "GetProfile": lambda: self.media_service.get_profile("profile_1"),
            "GetStreamUri": lambda: self.media_service.get_stream_uri("profile_1"),
            "GetVideoSources": self.media_service.get_video_sources,
            "GetVideoSourceConfigurations": self.media_service.get_video_source_configurations,
            "GetVideoEncoderConfigurations": self.media_service.get_video_encoder_configurations,
            "GetSnapshotUri": lambda: self.media_service.get_snapshot_uri("profile_1"),
            "GetVideoEncoderConfigurationOptions": self.media_service.get_video_encoder_configuration_options,
        }

        handler = operations.get(operation)
        if not handler:
            raise ValueError(f"Unsupported operation: {operation}")

        return handler()

    def _dispatch_events_operation(self, operation: str, soap_body: str) -> dict:
        """Dispatch events service operation."""
        operations = {
            "GetEventProperties": self.events_service.get_event_properties,
            "CreatePullPointSubscription": lambda: self.events_service.create_pullpoint_subscription(),
        }

        handler = operations.get(operation)
        if not handler:
            raise ValueError(f"Unsupported operation: {operation}")

        return handler()

    def _create_soap_response(self, operation: str, data: dict) -> str:
        """Create SOAP response envelope."""
        response_body = f"<tds:{operation}Response>{self._dict_to_xml(data)}</tds:{operation}Response>"

        soap_envelope = f"""<?xml version="1.0" encoding="UTF-8"?>
<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope" xmlns:tds="http://www.onvif.org/ver10/device/wsdl" xmlns:tt="http://www.onvif.org/ver10/schema">
    <s:Body>
        {response_body}
    </s:Body>
</s:Envelope>"""

        return soap_envelope

    def _create_soap_fault(self, code: str, reason: str) -> str:
        """Create SOAP fault response."""
        return f"""<?xml version="1.0" encoding="UTF-8"?>
<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope">
    <s:Body>
        <s:Fault>
            <s:Code>
                <s:Value>s:{code}</s:Value>
            </s:Code>
            <s:Reason>
                <s:Text xml:lang="en">{reason}</s:Text>
            </s:Reason>
        </s:Fault>
    </s:Body>
</s:Envelope>"""

    def _dict_to_xml(self, data: dict, indent: int = 0) -> str:
        """Convert dictionary to XML string."""
        xml = ""
        indent_str = "  " * indent

        for key, value in data.items():
            if value is None:
                continue
            elif isinstance(value, dict):
                xml += f"{indent_str}<tt:{key}>\n"
                xml += self._dict_to_xml(value, indent + 1)
                xml += f"{indent_str}</tt:{key}>\n"
            elif isinstance(value, list):
                for item in value:
                    if isinstance(item, dict):
                        xml += f"{indent_str}<tt:{key}>\n"
                        xml += self._dict_to_xml(item, indent + 1)
                        xml += f"{indent_str}</tt:{key}>\n"
                    else:
                        xml += f"{indent_str}<tt:{key}>{item}</tt:{key}>\n"
            else:
                xml += f"{indent_str}<tt:{key}>{value}</tt:{key}>\n"

        return xml

    def run(self):
        """Run the IP camera emulator server."""
        try:
            uvicorn.run(
                self.app,
                host=settings.onvif_host,
                port=settings.onvif_port,
                log_level=settings.log_level.lower(),
            )
        except KeyboardInterrupt:
            logger.info("Shutting down IP camera emulator...")
        finally:
            self.events_service.shutdown()
            # Note: WebRTC shutdown handled by FastAPI lifecycle


def main():
    """Main entry point."""
    emulator = IPCameraEmulator()
    emulator.run()


if __name__ == "__main__":
    main()
