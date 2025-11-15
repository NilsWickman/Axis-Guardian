"""Tests for ONVIF Media Service."""

from unittest.mock import MagicMock

import pytest

from src.camera_config import CameraConfig
from src.services.media_service import MediaService


@pytest.fixture
def mock_camera_config():
    """Create mock camera configuration."""
    config = MagicMock(spec=CameraConfig)
    config.camera_id = "camera1"
    config.name = "Test Camera 1"
    config.resolution = {"width": 1920, "height": 1080}
    config.fps = 30
    return config


class TestMediaService:
    """Test cases for Media Service."""

    def test_get_profiles(self, mock_camera_config):
        """Test GetProfiles operation."""
        service = MediaService(mock_camera_config)

        response = service.get_profiles()

        assert "Profiles" in response
        profiles = response["Profiles"]

        # Should have at least 2 profiles (main and sub)
        assert len(profiles) >= 2

        # Verify profile structure
        for profile in profiles:
            assert "token" in profile
            assert "Name" in profile
            assert "VideoSourceConfiguration" in profile
            assert "VideoEncoderConfiguration" in profile

    def test_get_profile(self, mock_camera_config):
        """Test GetProfile operation for specific profile."""
        service = MediaService(mock_camera_config)

        response = service.get_profile("profile_1")

        assert "Profile" in response
        profile = response["Profile"]

        assert profile["token"] == "profile_1"
        assert "VideoEncoderConfiguration" in profile

    def test_get_profile_not_found(self, mock_camera_config):
        """Test GetProfile with invalid token."""
        service = MediaService(mock_camera_config)

        with pytest.raises(ValueError, match="Profile not found"):
            service.get_profile("invalid_token")

    def test_get_stream_uri(self, mock_camera_config):
        """Test GetStreamUri operation."""
        service = MediaService(mock_camera_config)

        response = service.get_stream_uri("profile_1", "RTSP")

        assert "MediaUri" in response
        media_uri = response["MediaUri"]

        assert "Uri" in media_uri
        assert "rtsp://" in media_uri["Uri"]
        assert "camera1" in media_uri["Uri"]
        assert media_uri["InvalidAfterConnect"] is False
        assert media_uri["InvalidAfterReboot"] is False

    def test_get_stream_uri_sub_profile(self, mock_camera_config):
        """Test GetStreamUri for sub-stream profile."""
        service = MediaService(mock_camera_config)

        response = service.get_stream_uri("profile_2", "RTSP")

        assert "MediaUri" in response
        # Sub-stream should have different URL suffix
        assert "camera1" in response["MediaUri"]["Uri"]

    def test_get_stream_uri_invalid_profile(self, mock_camera_config):
        """Test GetStreamUri with invalid profile."""
        service = MediaService(mock_camera_config)

        with pytest.raises(ValueError, match="Profile not found"):
            service.get_stream_uri("invalid_profile", "RTSP")

    def test_get_video_sources(self, mock_camera_config):
        """Test GetVideoSources operation."""
        service = MediaService(mock_camera_config)

        response = service.get_video_sources()

        assert "VideoSources" in response
        sources = response["VideoSources"]

        assert len(sources) > 0
        source = sources[0]

        assert "token" in source
        assert "Framerate" in source
        assert "Resolution" in source

        assert source["Resolution"]["Width"] == 1920
        assert source["Resolution"]["Height"] == 1080
        assert source["Framerate"] == 30.0

    def test_get_video_source_configurations(self, mock_camera_config):
        """Test GetVideoSourceConfigurations operation."""
        service = MediaService(mock_camera_config)

        response = service.get_video_source_configurations()

        assert "Configurations" in response
        configs = response["Configurations"]

        assert len(configs) > 0

        # Verify configuration structure
        config = configs[0]
        assert "token" in config
        assert "Name" in config
        assert "SourceToken" in config
        assert "Bounds" in config

    def test_get_video_encoder_configurations(self, mock_camera_config):
        """Test GetVideoEncoderConfigurations operation."""
        service = MediaService(mock_camera_config)

        response = service.get_video_encoder_configurations()

        assert "Configurations" in response
        configs = response["Configurations"]

        # Should have encoder configs for each profile
        assert len(configs) >= 2

        # Verify encoder structure
        for config in configs:
            assert "token" in config
            assert "Encoding" in config
            assert config["Encoding"] == "H264"
            assert "Resolution" in config
            assert "RateControl" in config
            assert "H264" in config

    def test_get_snapshot_uri(self, mock_camera_config):
        """Test GetSnapshotUri operation."""
        service = MediaService(mock_camera_config)

        response = service.get_snapshot_uri("profile_1")

        assert "MediaUri" in response
        media_uri = response["MediaUri"]

        assert "Uri" in media_uri
        assert "http" in media_uri["Uri"].lower()

    def test_get_video_encoder_configuration_options(self, mock_camera_config):
        """Test GetVideoEncoderConfigurationOptions operation."""
        service = MediaService(mock_camera_config)

        response = service.get_video_encoder_configuration_options()

        assert "Options" in response
        options = response["Options"]

        assert "QualityRange" in options
        assert "H264" in options

        h264_options = options["H264"]
        assert "ResolutionsAvailable" in h264_options
        assert "GovLengthRange" in h264_options
        assert "FrameRateRange" in h264_options
        assert "H264ProfilesSupported" in h264_options

        # Verify supported profiles
        supported_profiles = h264_options["H264ProfilesSupported"]
        assert "Baseline" in supported_profiles
        assert "Main" in supported_profiles
        assert "High" in supported_profiles
