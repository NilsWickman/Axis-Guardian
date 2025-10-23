#!/usr/bin/env python3
"""Quick test script to verify detection timestamp configuration."""

import sys
import os
import time

# Add src directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from config import settings

def main():
    print("=" * 60)
    print("Detection Timestamp Configuration Test")
    print("=" * 60)
    print()

    # Load settings
    print("Current Configuration:")
    print(f"  DETECTION_DELAY_MS: {settings.detection_delay_ms}")
    print()

    # Test timestamp calculation
    print("Testing timestamp calculation:")
    print()

    current_time = time.time()
    print(f"  Current wall-clock time: {current_time:.3f}")

    # Simulate what happens in detector
    frame_timestamp = current_time
    detection_timestamp = frame_timestamp + (settings.detection_delay_ms / 1000.0)

    print(f"  Frame timestamp:        {frame_timestamp:.3f}")
    print(f"  Detection timestamp:    {detection_timestamp:.3f}")
    print(f"  Difference (seconds):   {detection_timestamp - frame_timestamp:.3f}")
    print()

    # Interpret the result
    delay_seconds = settings.detection_delay_ms / 1000.0

    if delay_seconds < 0:
        print(f"✓ Detections will appear {abs(delay_seconds):.1f} seconds OLDER (in the past)")
        print(f"  → Good for HLS video with {abs(delay_seconds):.1f}s+ latency")
    elif delay_seconds > 0:
        print(f"✓ Detections will appear {delay_seconds:.1f} seconds NEWER (in the future)")
        print(f"  → Use if video is ahead of detections")
    else:
        print("✓ No timestamp adjustment (detections use real-time)")
        print("  → Good for low-latency RTSP/WebRTC")

    print()

    # Recommendations
    print("Recommendations:")
    if settings.detection_delay_ms == 0:
        print("  ⚠ For HLS video player, try: DETECTION_DELAY_MS=-15000")
        print("     (makes detections 15 seconds older)")
    elif settings.detection_delay_ms > 0:
        print("  ⚠ Positive delay makes detections appear in the FUTURE")
        print("     For HLS video, you likely want NEGATIVE values")
    elif abs(settings.detection_delay_ms) < 5000:
        print("  ℹ Small negative delay (<5s) is good for WebRTC/RTSP")
        print("     For HLS, you may need -10000 to -30000")
    else:
        print("  ✓ Delay looks appropriate for HLS video player")
        print("     Fine-tune by watching camera + detection viewers")

    print()
    print("=" * 60)
    print()
    print("To adjust:")
    print(f"  1. Edit: backend/python/object-detection-service/.env")
    print(f"  2. Set: DETECTION_DELAY_MS=<value>")
    print(f"  3. Restart detection service")
    print()

if __name__ == "__main__":
    main()
