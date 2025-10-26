"""Tests for camera interface mode configuration."""

import os
import pytest
from config import Settings, InterfaceMode


class TestInterfaceModeConfiguration:
    """Test camera interface mode configuration."""

    def test_default_interface_mode(self):
        """Test default interface mode is VIDEO_BOXES."""
        settings = Settings()
        assert settings.camera_interface_mode == InterfaceMode.VIDEO_BOXES

    def test_get_interface_mode_default(self):
        """Test get_interface_mode returns default when no override."""
        settings = Settings(camera_interface_mode=InterfaceMode.VIDEO_METADATA)
        assert settings.get_interface_mode("camera1") == InterfaceMode.VIDEO_METADATA
        assert settings.get_interface_mode("camera2") == InterfaceMode.VIDEO_METADATA

    def test_get_interface_mode_with_override(self):
        """Test get_interface_mode returns per-camera override."""
        settings = Settings(
            camera_interface_mode=InterfaceMode.VIDEO_BOXES,
            camera1_interface_mode=InterfaceMode.METADATA_ONLY,
            camera2_interface_mode=InterfaceMode.VIDEO_METADATA,
        )

        assert settings.get_interface_mode("camera1") == InterfaceMode.METADATA_ONLY
        assert settings.get_interface_mode("camera2") == InterfaceMode.VIDEO_METADATA
        assert settings.get_interface_mode("camera3") == InterfaceMode.VIDEO_BOXES  # Uses default
        assert settings.get_interface_mode("camera4") == InterfaceMode.VIDEO_BOXES  # Uses default

    def test_interface_mode_enum_values(self):
        """Test all interface mode enum values."""
        assert InterfaceMode.RTSP_ONLY.value == "rtsp_only"
        assert InterfaceMode.METADATA_ONLY.value == "metadata_only"
        assert InterfaceMode.VIDEO_METADATA.value == "video_metadata"
        assert InterfaceMode.VIDEO_BOXES.value == "video_boxes"

    def test_interface_mode_from_string(self):
        """Test creating interface mode from string value."""
        settings = Settings(camera_interface_mode="video_metadata")
        assert settings.camera_interface_mode == InterfaceMode.VIDEO_METADATA

    @pytest.mark.parametrize("mode,expected", [
        ("rtsp_only", InterfaceMode.RTSP_ONLY),
        ("metadata_only", InterfaceMode.METADATA_ONLY),
        ("video_metadata", InterfaceMode.VIDEO_METADATA),
        ("video_boxes", InterfaceMode.VIDEO_BOXES),
    ])
    def test_all_interface_modes(self, mode, expected):
        """Test all valid interface mode configurations."""
        settings = Settings(camera_interface_mode=mode)
        assert settings.camera_interface_mode == expected


class TestInterfaceModeLogic:
    """Test interface mode behavior logic."""

    def test_rtsp_only_should_skip_detection(self):
        """RTSP_ONLY mode should skip all detection processing."""
        mode = InterfaceMode.RTSP_ONLY
        should_process = mode in [
            InterfaceMode.METADATA_ONLY,
            InterfaceMode.VIDEO_METADATA,
            InterfaceMode.VIDEO_BOXES
        ]
        assert should_process is False

    def test_metadata_only_should_process_detection(self):
        """METADATA_ONLY mode should process detections."""
        mode = InterfaceMode.METADATA_ONLY
        should_process = mode in [
            InterfaceMode.METADATA_ONLY,
            InterfaceMode.VIDEO_METADATA,
            InterfaceMode.VIDEO_BOXES
        ]
        assert should_process is True

    def test_video_boxes_should_draw_boxes(self):
        """VIDEO_BOXES mode should draw bounding boxes."""
        mode = InterfaceMode.VIDEO_BOXES
        should_draw = mode == InterfaceMode.VIDEO_BOXES
        assert should_draw is True

    def test_video_metadata_should_not_draw_boxes(self):
        """VIDEO_METADATA mode should not draw bounding boxes."""
        mode = InterfaceMode.VIDEO_METADATA
        should_draw = mode == InterfaceMode.VIDEO_BOXES
        assert should_draw is False

    @pytest.mark.parametrize("mode,should_process,should_draw", [
        (InterfaceMode.RTSP_ONLY, False, False),
        (InterfaceMode.METADATA_ONLY, True, False),
        (InterfaceMode.VIDEO_METADATA, True, False),
        (InterfaceMode.VIDEO_BOXES, True, True),
    ])
    def test_mode_processing_matrix(self, mode, should_process, should_draw):
        """Test the complete processing matrix for all modes."""
        # Detection processing check
        actual_process = mode in [
            InterfaceMode.METADATA_ONLY,
            InterfaceMode.VIDEO_METADATA,
            InterfaceMode.VIDEO_BOXES
        ]
        assert actual_process == should_process

        # Box drawing check
        actual_draw = mode == InterfaceMode.VIDEO_BOXES
        assert actual_draw == should_draw
