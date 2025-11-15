"""Camera configuration loader from cameras.yaml registry."""

from pathlib import Path
from typing import Any, Dict, Optional

import yaml
from loguru import logger


class CameraConfig:
    """Camera configuration loaded from YAML registry."""

    def __init__(self, camera_id: str, registry_path: Path):
        """Initialize camera configuration.

        Args:
            camera_id: Camera identifier (e.g., "camera1")
            registry_path: Path to cameras.yaml file
        """
        self.camera_id = camera_id
        self.registry_path = registry_path
        self._config: Dict[str, Any] = {}
        self._load_config()

    def _load_config(self) -> None:
        """Load camera configuration from YAML file."""
        try:
            with open(self.registry_path, "r") as f:
                cameras_data = yaml.safe_load(f)

            # Find camera config by ID
            cameras = cameras_data.get("cameras", [])
            for camera in cameras:
                if camera.get("id") == self.camera_id:
                    self._config = camera
                    logger.info(f"Loaded configuration for camera: {self.camera_id}")
                    return

            # If not found, use default config
            logger.warning(
                f"Camera {self.camera_id} not found in registry, using defaults"
            )
            self._config = self._get_default_config()

        except FileNotFoundError:
            logger.error(f"Camera registry not found: {self.registry_path}")
            self._config = self._get_default_config()
        except Exception as e:
            logger.error(f"Failed to load camera registry: {e}")
            self._config = self._get_default_config()

    def _get_default_config(self) -> Dict[str, Any]:
        """Get default camera configuration."""
        return {
            "id": self.camera_id,
            "name": f"Camera {self.camera_id[-1]}",
            "model": "AXIS P3245-LVE",
            "brand": "Axis Communications",
            "serial_number": f"ACCC8E{self.camera_id[-1]}12345",
            "firmware_version": "11.11.77",
            "mac_address": f"AC:CC:8E:00:00:0{self.camera_id[-1]}",
            "resolution": {"width": 1920, "height": 1080},
            "fps": 30,
            "location": {
                "name": f"Location {self.camera_id[-1]}",
                "coordinates": {"x": 0, "y": 0, "z": 0},
            },
        }

    @property
    def name(self) -> str:
        """Get camera name."""
        return self._config.get("name", f"Camera {self.camera_id}")

    @property
    def model(self) -> str:
        """Get camera model."""
        return self._config.get("model", "AXIS P3245-LVE")

    @property
    def brand(self) -> str:
        """Get camera brand/manufacturer."""
        return self._config.get("brand", "Axis Communications")

    @property
    def serial_number(self) -> str:
        """Get camera serial number."""
        return self._config.get("serial_number", f"ACCC8E{self.camera_id[-1]}12345")

    @property
    def firmware_version(self) -> str:
        """Get firmware version."""
        return self._config.get("firmware_version", "11.11.77")

    @property
    def mac_address(self) -> str:
        """Get MAC address."""
        return self._config.get("mac_address", f"AC:CC:8E:00:00:0{self.camera_id[-1]}")

    @property
    def resolution(self) -> Dict[str, int]:
        """Get video resolution."""
        res = self._config.get("resolution", {"width": 1920, "height": 1080})

        # Handle string format like "1920x1080"
        if isinstance(res, str):
            try:
                width, height = res.split("x")
                return {"width": int(width), "height": int(height)}
            except (ValueError, AttributeError):
                logger.warning(f"Invalid resolution format: {res}, using default")
                return {"width": 1920, "height": 1080}

        return res

    @property
    def fps(self) -> int:
        """Get frames per second."""
        return self._config.get("fps", 30)

    @property
    def location_name(self) -> str:
        """Get location name."""
        location = self._config.get("location", {})
        return location.get("name", f"Location {self.camera_id}")

    @property
    def hardware_id(self) -> str:
        """Get hardware ID (MAC-based)."""
        return self.mac_address.replace(":", "")
