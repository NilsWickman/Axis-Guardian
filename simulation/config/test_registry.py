#!/usr/bin/env python3
"""
Quick test script to verify camera registry is working correctly.

Usage:
    python test_registry.py
"""

import sys
from pathlib import Path

# Add parent directory to path to import camera_registry
sys.path.insert(0, str(Path(__file__).parent))

from camera_registry import get_camera_registry, CameraCapability


def main():
    """Test camera registry functionality."""
    print("=" * 60)
    print("Camera Registry Test")
    print("=" * 60)

    # Load registry
    print("\n1. Loading camera registry...")
    try:
        registry = get_camera_registry()
        print(f"   ✓ Loaded registry from: {registry.config_path}")
        print(f"   ✓ Project root: {registry.project_root}")
    except Exception as e:
        print(f"   ✗ Failed to load registry: {e}")
        return 1

    # List cameras
    print(f"\n2. Found {len(registry.cameras)} cameras:")
    for camera_id in registry.get_camera_ids():
        camera = registry.get_camera(camera_id)
        print(f"   - {camera_id}: {camera.name}")
        print(f"     Model: {camera.vapix.model}")
        print(f"     Resolution: {camera.resolution} @ {camera.fps} FPS")
        print(f"     Capabilities: {', '.join(c.value for c in camera.capabilities)}")

    # Test RTSP URLs
    print("\n3. RTSP URLs:")
    rtsp_urls = registry.get_rtsp_urls()
    for cam_id, url in rtsp_urls.items():
        print(f"   - {cam_id}: {url}")

    # Validate files
    print("\n4. Validating source video files...")
    errors = registry.validate_all_cameras(require_rendered=False)
    if errors:
        print("   ✗ Errors found:")
        for error in errors:
            print(f"     - {error}")
    else:
        print("   ✓ All source videos found")

    print("\n5. Validating rendered video files (optional)...")
    errors = registry.validate_all_cameras(require_rendered=True)
    if errors:
        print("   ⚠ Some rendered videos missing (run 'make prerender-videos'):")
        for error in errors:
            print(f"     - {error}")
    else:
        print("   ✓ All rendered videos and detection JSONs found")

    # Test detection defaults
    print("\n6. Detection defaults:")
    defaults = registry.detection_defaults
    print(f"   - Model: {defaults.model}")
    print(f"   - Confidence threshold: {defaults.confidence_threshold}")
    print(f"   - IOU threshold: {defaults.iou_threshold}")
    print(f"   - Inference resolution: {defaults.inference_resolution}")
    print(f"   - Max FPS: {defaults.max_fps}")

    # Test camera lookup
    print("\n7. Testing camera lookup...")
    test_camera = registry.get_camera("camera1")
    if test_camera:
        print(f"   ✓ Found camera1: {test_camera.name}")
        print(f"     Location: {test_camera.location.site} / {test_camera.location.zone}")
        print(f"     Coordinates: x={test_camera.location.coordinates.get('x')}, "
              f"y={test_camera.location.coordinates.get('y')}, "
              f"z={test_camera.location.coordinates.get('z')}")
    else:
        print("   ✗ camera1 not found")

    # Test RTSP path lookup
    print("\n8. Testing RTSP path lookup...")
    camera_by_path = registry.get_camera_by_rtsp_path("camera2")
    if camera_by_path:
        print(f"   ✓ Found camera by RTSP path 'camera2': {camera_by_path.name}")
    else:
        print("   ✗ Camera not found by RTSP path")

    print("\n" + "=" * 60)
    print("✓ All tests passed!")
    print("=" * 60)
    return 0


if __name__ == "__main__":
    sys.exit(main())
