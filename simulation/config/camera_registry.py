"""Camera Registry - Load and validate camera configurations from YAML."""

import os
from pathlib import Path
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from enum import Enum

import yaml


class CameraCapability(str, Enum):
    """Camera capabilities."""

    OBJECT_DETECTION = "object_detection"
    PEOPLE_COUNTING = "people_counting"
    VEHICLE_DETECTION = "vehicle_detection"
    LICENSE_PLATE_RECOGNITION = "license_plate_recognition"
    MOTION_DETECTION = "motion_detection"
    PTZ_CONTROL = "ptz_control"
    AUDIO_DETECTION = "audio_detection"
    TAMPERING_DETECTION = "tampering_detection"


@dataclass
class VapixProperties:
    """VAPIX camera properties (simulates real Axis camera)."""

    brand: str = "AXIS"
    model: str = "Generic"
    serial_number: str = "ACCC8E000000"
    firmware_version: str = "11.8.67"
    mac_address: str = "AC:CC:8E:00:00:00"


@dataclass
class CameraLocation:
    """Physical location of camera."""

    site: str
    zone: str
    coordinates: Dict[str, float] = field(default_factory=dict)


@dataclass
class CameraConfig:
    """Configuration for a single camera."""

    # Identity
    id: str
    name: str
    description: str = ""

    # Video sources (relative to project root or absolute)
    source_video: str = ""
    rendered_video: str = ""
    detections_json: str = ""

    # Stream configuration
    rtsp_url: str = ""
    resolution: str = "1920x1080"
    fps: int = 30
    bitrate: str = "3M"

    # Capabilities
    capabilities: List[CameraCapability] = field(default_factory=list)
    detection_classes: List[str] = field(default_factory=list)

    # VAPIX properties
    vapix: VapixProperties = field(default_factory=VapixProperties)

    # Location
    location: Optional[CameraLocation] = None

    def get_source_video_path(self, base_dir: Path) -> Path:
        """Get absolute path to source video."""
        cameras_dir = base_dir / "shared" / "cameras"
        return cameras_dir / self.source_video

    def get_rendered_video_path(self, base_dir: Path) -> Path:
        """Get absolute path to rendered video."""
        rendered_dir = base_dir / "shared" / "cameras" / "rendered"
        return rendered_dir / self.rendered_video

    def get_detections_json_path(self, base_dir: Path) -> Path:
        """Get absolute path to detections JSON."""
        rendered_dir = base_dir / "shared" / "cameras" / "rendered"
        return rendered_dir / self.detections_json

    def validate_files_exist(self, base_dir: Path, require_rendered: bool = False) -> List[str]:
        """
        Validate that required video files exist.

        Args:
            base_dir: Project root directory
            require_rendered: If True, require rendered video and detections JSON

        Returns:
            List of error messages (empty if all valid)
        """
        errors = []

        # Check source video
        source_path = self.get_source_video_path(base_dir)
        if not source_path.exists():
            errors.append(f"Camera {self.id}: Source video not found: {source_path}")

        # Check rendered files if required
        if require_rendered:
            rendered_path = self.get_rendered_video_path(base_dir)
            if not rendered_path.exists():
                errors.append(f"Camera {self.id}: Rendered video not found: {rendered_path}")

            detections_path = self.get_detections_json_path(base_dir)
            if not detections_path.exists():
                errors.append(
                    f"Camera {self.id}: Detections JSON not found: {detections_path}"
                )

        return errors


@dataclass
class DetectionDefaults:
    """Default detection settings."""

    confidence_threshold: float = 0.5
    iou_threshold: float = 0.45
    model: str = "yolov8n.pt"
    inference_resolution: int = 640
    frame_skip: int = 1
    max_fps: int = 30
    auto_scale: bool = True


@dataclass
class PathConfig:
    """Path configuration."""

    cameras_dir: str = "shared/cameras"
    rendered_dir: str = "shared/cameras/rendered"
    models_dir: str = "shared/models"


class CameraRegistry:
    """Registry of all configured cameras."""

    def __init__(self, config_path: Optional[Path] = None):
        """
        Initialize camera registry.

        Args:
            config_path: Path to cameras.yaml. If None, uses default location.
        """
        if config_path is None:
            # Default to simulation/config/cameras.yaml
            config_path = Path(__file__).parent / "cameras.yaml"

        self.config_path = config_path
        self.project_root = self._find_project_root()
        self.cameras: Dict[str, CameraConfig] = {}
        self.detection_defaults = DetectionDefaults()
        self.paths = PathConfig()

        self._load_config()

    def _find_project_root(self) -> Path:
        """Find project root by looking for Makefile."""
        current = Path(__file__).parent
        while current != current.parent:
            if (current / "Makefile").exists():
                return current
            current = current.parent
        raise RuntimeError("Could not find project root (no Makefile found)")

    def _load_config(self) -> None:
        """Load configuration from YAML file."""
        if not self.config_path.exists():
            raise FileNotFoundError(f"Camera config not found: {self.config_path}")

        with open(self.config_path, "r") as f:
            config = yaml.safe_load(f)

        # Load cameras
        for camera_data in config.get("cameras", []):
            camera = self._parse_camera_config(camera_data)
            self.cameras[camera.id] = camera

        # Load detection defaults
        if "detection_defaults" in config:
            defaults = config["detection_defaults"]
            self.detection_defaults = DetectionDefaults(
                confidence_threshold=defaults.get("confidence_threshold", 0.5),
                iou_threshold=defaults.get("iou_threshold", 0.45),
                model=defaults.get("model", "yolov8n.pt"),
                inference_resolution=defaults.get("inference_resolution", 640),
                frame_skip=defaults.get("frame_skip", 1),
                max_fps=defaults.get("max_fps", 30),
                auto_scale=defaults.get("auto_scale", True),
            )

        # Load paths
        if "paths" in config:
            paths = config["paths"]
            self.paths = PathConfig(
                cameras_dir=paths.get("cameras_dir", "shared/cameras"),
                rendered_dir=paths.get("rendered_dir", "shared/cameras/rendered"),
                models_dir=paths.get("models_dir", "shared/models"),
            )

    def _parse_camera_config(self, data: Dict[str, Any]) -> CameraConfig:
        """Parse camera configuration from dict."""
        # Parse capabilities
        capabilities = [
            CameraCapability(cap) for cap in data.get("capabilities", [])
        ]

        # Parse VAPIX properties
        vapix_data = data.get("vapix", {})
        vapix = VapixProperties(
            brand=vapix_data.get("brand", "AXIS"),
            model=vapix_data.get("model", "Generic"),
            serial_number=vapix_data.get("serial_number", "ACCC8E000000"),
            firmware_version=vapix_data.get("firmware_version", "11.8.67"),
            mac_address=vapix_data.get("mac_address", "AC:CC:8E:00:00:00"),
        )

        # Parse location
        location = None
        if "location" in data:
            loc_data = data["location"]
            location = CameraLocation(
                site=loc_data.get("site", "Unknown"),
                zone=loc_data.get("zone", "Unknown"),
                coordinates=loc_data.get("coordinates", {}),
            )

        return CameraConfig(
            id=data["id"],
            name=data["name"],
            description=data.get("description", ""),
            source_video=data.get("source_video", ""),
            rendered_video=data.get("rendered_video", ""),
            detections_json=data.get("detections_json", ""),
            rtsp_url=data.get("rtsp_url", f"rtsp://localhost:8554/{data['id']}"),
            resolution=data.get("resolution", "1920x1080"),
            fps=data.get("fps", 30),
            bitrate=data.get("bitrate", "3M"),
            capabilities=capabilities,
            detection_classes=data.get("detection_classes", []),
            vapix=vapix,
            location=location,
        )

    def get_camera(self, camera_id: str) -> Optional[CameraConfig]:
        """Get camera configuration by ID."""
        return self.cameras.get(camera_id)

    def get_all_cameras(self) -> List[CameraConfig]:
        """Get all camera configurations."""
        return list(self.cameras.values())

    def get_camera_ids(self) -> List[str]:
        """Get list of all camera IDs."""
        return list(self.cameras.keys())

    def validate_all_cameras(self, require_rendered: bool = False) -> List[str]:
        """
        Validate all cameras have required files.

        Args:
            require_rendered: If True, require rendered videos and detections

        Returns:
            List of error messages (empty if all valid)
        """
        errors = []
        for camera in self.cameras.values():
            errors.extend(camera.validate_files_exist(self.project_root, require_rendered))
        return errors

    def get_rtsp_urls(self) -> Dict[str, str]:
        """Get mapping of camera IDs to RTSP URLs."""
        return {camera_id: camera.rtsp_url for camera_id, camera in self.cameras.items()}

    def get_camera_by_rtsp_path(self, rtsp_path: str) -> Optional[CameraConfig]:
        """
        Get camera by RTSP path (e.g., 'camera1' from 'rtsp://localhost:8554/camera1').

        Args:
            rtsp_path: RTSP path component (e.g., 'camera1')

        Returns:
            CameraConfig if found, None otherwise
        """
        for camera in self.cameras.values():
            if camera.rtsp_url.endswith(f"/{rtsp_path}"):
                return camera
        return None


# Global registry instance (lazy loaded)
_registry: Optional[CameraRegistry] = None


def get_camera_registry(config_path: Optional[Path] = None) -> CameraRegistry:
    """
    Get global camera registry instance.

    Args:
        config_path: Optional path to cameras.yaml. Only used on first call.

    Returns:
        CameraRegistry singleton
    """
    global _registry
    if _registry is None:
        _registry = CameraRegistry(config_path)
    return _registry


def reload_camera_registry(config_path: Optional[Path] = None) -> CameraRegistry:
    """
    Reload camera registry from config file.

    Args:
        config_path: Optional path to cameras.yaml

    Returns:
        New CameraRegistry instance
    """
    global _registry
    _registry = CameraRegistry(config_path)
    return _registry
