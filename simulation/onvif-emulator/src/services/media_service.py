"""ONVIF Media Service implementation."""

from typing import Dict, Any, List

from loguru import logger

from ..camera_config import CameraConfig
from ..config import settings


class MediaService:
    """ONVIF Media Service (Profile S)."""

    def __init__(self, camera_config: CameraConfig):
        """Initialize media service.

        Args:
            camera_config: Camera configuration instance
        """
        self.camera_config = camera_config

        # Define media profiles
        self.profiles = self._create_profiles()

    def _create_profiles(self) -> List[Dict[str, Any]]:
        """Create media profiles for this camera.

        Returns:
            List of media profile configurations
        """
        resolution = self.camera_config.resolution
        fps = self.camera_config.fps

        # Main profile - high quality
        profile_main = {
            "token": "profile_1",
            "Name": "MainProfile",
            "fixed": True,
            "VideoSourceConfiguration": {
                "token": "video_source_config_1",
                "Name": "VideoSourceConfig",
                "UseCount": 1,
                "SourceToken": "video_source_1",
                "Bounds": {
                    "x": 0,
                    "y": 0,
                    "width": resolution["width"],
                    "height": resolution["height"],
                },
            },
            "VideoEncoderConfiguration": {
                "token": "video_encoder_config_1",
                "Name": "VideoEncoderConfig",
                "UseCount": 1,
                "Encoding": "H264",
                "Resolution": {
                    "Width": resolution["width"],
                    "Height": resolution["height"],
                },
                "Quality": 5.0,
                "RateControl": {
                    "FrameRateLimit": fps,
                    "EncodingInterval": 1,
                    "BitrateLimit": 4096,
                },
                "H264": {
                    "GovLength": fps * 2,  # 2 seconds GOP
                    "H264Profile": "High",
                },
                "Multicast": {
                    "Address": {
                        "Type": "IPv4",
                        "IPv4Address": "0.0.0.0",
                    },
                    "Port": 0,
                    "TTL": 0,
                    "AutoStart": False,
                },
                "SessionTimeout": "PT0S",
            },
            "PTZConfiguration": None,  # PTZ not implemented
            "MetadataConfiguration": None,
        }

        # Sub-stream profile - lower quality
        profile_sub = {
            "token": "profile_2",
            "Name": "SubProfile",
            "fixed": True,
            "VideoSourceConfiguration": {
                "token": "video_source_config_1",
                "Name": "VideoSourceConfig",
                "UseCount": 2,
                "SourceToken": "video_source_1",
                "Bounds": {
                    "x": 0,
                    "y": 0,
                    "width": resolution["width"],
                    "height": resolution["height"],
                },
            },
            "VideoEncoderConfiguration": {
                "token": "video_encoder_config_2",
                "Name": "VideoEncoderConfig2",
                "UseCount": 1,
                "Encoding": "H264",
                "Resolution": {
                    "Width": 640,
                    "Height": 360,
                },
                "Quality": 3.0,
                "RateControl": {
                    "FrameRateLimit": 15,
                    "EncodingInterval": 1,
                    "BitrateLimit": 512,
                },
                "H264": {
                    "GovLength": 30,
                    "H264Profile": "Baseline",
                },
                "Multicast": {
                    "Address": {
                        "Type": "IPv4",
                        "IPv4Address": "0.0.0.0",
                    },
                    "Port": 0,
                    "TTL": 0,
                    "AutoStart": False,
                },
                "SessionTimeout": "PT0S",
            },
            "PTZConfiguration": None,
            "MetadataConfiguration": None,
        }

        return [profile_main, profile_sub]

    def get_profiles(self) -> Dict[str, Any]:
        """Get all media profiles.

        Returns:
            Media profiles response
        """
        logger.debug(f"GetProfiles request for {self.camera_config.camera_id}")

        return {"Profiles": self.profiles}

    def get_profile(self, profile_token: str) -> Dict[str, Any]:
        """Get a specific media profile.

        Args:
            profile_token: Profile token

        Returns:
            Media profile response
        """
        logger.debug(f"GetProfile request: {profile_token}")

        for profile in self.profiles:
            if profile["token"] == profile_token:
                return {"Profile": profile}

        raise ValueError(f"Profile not found: {profile_token}")

    def get_stream_uri(
        self, profile_token: str, protocol: str = "RTSP"
    ) -> Dict[str, Any]:
        """Get stream URI for a media profile.

        Args:
            profile_token: Profile token
            protocol: Transport protocol (RTSP, HTTP, etc.)

        Returns:
            Stream URI response
        """
        logger.debug(
            f"GetStreamUri request: profile={profile_token}, protocol={protocol}"
        )

        # Validate profile exists
        profile = None
        for p in self.profiles:
            if p["token"] == profile_token:
                profile = p
                break

        if not profile:
            raise ValueError(f"Profile not found: {profile_token}")

        # Return RTSP URL pointing to MediaMTX
        rtsp_url = settings.rtsp_stream_url

        # Add profile suffix for sub-stream
        if profile_token == "profile_2":
            rtsp_url = rtsp_url.replace(
                settings.camera_id, f"{settings.camera_id}_sub"
            )

        return {
            "MediaUri": {
                "Uri": rtsp_url,
                "InvalidAfterConnect": False,
                "InvalidAfterReboot": False,
                "Timeout": "PT0S",
            }
        }

    def get_video_sources(self) -> Dict[str, Any]:
        """Get video source configurations.

        Returns:
            Video sources response
        """
        logger.debug("GetVideoSources request")

        resolution = self.camera_config.resolution

        return {
            "VideoSources": [
                {
                    "token": "video_source_1",
                    "Framerate": float(self.camera_config.fps),
                    "Resolution": {
                        "Width": resolution["width"],
                        "Height": resolution["height"],
                    },
                    "Imaging": {
                        "Brightness": 50.0,
                        "ColorSaturation": 50.0,
                        "Contrast": 50.0,
                        "Sharpness": 50.0,
                    },
                }
            ]
        }

    def get_video_source_configurations(self) -> Dict[str, Any]:
        """Get video source configurations.

        Returns:
            Video source configurations response
        """
        logger.debug("GetVideoSourceConfigurations request")

        resolution = self.camera_config.resolution

        return {
            "Configurations": [
                {
                    "token": "video_source_config_1",
                    "Name": "VideoSourceConfig",
                    "UseCount": 2,  # Used by both profiles
                    "SourceToken": "video_source_1",
                    "Bounds": {
                        "x": 0,
                        "y": 0,
                        "width": resolution["width"],
                        "height": resolution["height"],
                    },
                }
            ]
        }

    def get_video_encoder_configurations(self) -> Dict[str, Any]:
        """Get video encoder configurations.

        Returns:
            Video encoder configurations response
        """
        logger.debug("GetVideoEncoderConfigurations request")

        configs = []
        for profile in self.profiles:
            encoder_config = profile.get("VideoEncoderConfiguration")
            if encoder_config:
                configs.append(encoder_config)

        return {"Configurations": configs}

    def get_snapshot_uri(self, profile_token: str) -> Dict[str, Any]:
        """Get snapshot URI for a media profile.

        Args:
            profile_token: Profile token

        Returns:
            Snapshot URI response
        """
        logger.debug(f"GetSnapshotUri request: {profile_token}")

        # Validate profile exists
        profile_exists = any(p["token"] == profile_token for p in self.profiles)
        if not profile_exists:
            raise ValueError(f"Profile not found: {profile_token}")

        # Return snapshot URL (could integrate with MediaMTX or custom endpoint)
        snapshot_url = f"http://{settings.mediamtx_host}:{settings.mediamtx_api_port}/v3/paths/get/{settings.camera_id}"

        return {
            "MediaUri": {
                "Uri": snapshot_url,
                "InvalidAfterConnect": False,
                "InvalidAfterReboot": False,
                "Timeout": "PT5S",
            }
        }

    def get_video_encoder_configuration_options(
        self, configuration_token: str = None, profile_token: str = None
    ) -> Dict[str, Any]:
        """Get video encoder configuration options.

        Args:
            configuration_token: Configuration token (optional)
            profile_token: Profile token (optional)

        Returns:
            Video encoder configuration options
        """
        logger.debug(
            f"GetVideoEncoderConfigurationOptions: config={configuration_token}, profile={profile_token}"
        )

        resolution = self.camera_config.resolution

        return {
            "Options": {
                "QualityRange": {"Min": 1, "Max": 10},
                "H264": {
                    "ResolutionsAvailable": [
                        {"Width": resolution["width"], "Height": resolution["height"]},
                        {"Width": 1280, "Height": 720},
                        {"Width": 640, "Height": 360},
                    ],
                    "GovLengthRange": {"Min": 1, "Max": 255},
                    "FrameRateRange": {"Min": 1, "Max": self.camera_config.fps},
                    "EncodingIntervalRange": {"Min": 1, "Max": 1},
                    "H264ProfilesSupported": ["Baseline", "Main", "High"],
                },
                "Extension": None,
            }
        }
