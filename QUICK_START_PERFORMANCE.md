# Quick Start - High Performance WebRTC Streaming

## TL;DR - Get High FPS Now

```bash
# 1. Set resolution preference in .env (already set to 720p)
#    RENDER_RESOLUTION=720p

# 2. Re-render videos with H.264 codec
make prerender-videos-force

# 3. Wait ~10-15 minutes for all videos to render

# 4. Start the system
make dev

# 5. Open browser: http://localhost:5173
```

## What You Get

| Before (MPEG-4) | After (H.264 @ 720p) |
|----------------|---------------------|
| 5-10 FPS | 45-60 FPS |
| High CPU usage | Low CPU usage |
| Choppy playback | Smooth playback |
| Real-time re-encoding | Stream copy (instant) |

## Resolution Options

Edit `.env` to change the default resolution:

```bash
# In .env file:

# Best performance (recommended)
RENDER_RESOLUTION=720p

# Maximum FPS, lowest bandwidth
RENDER_RESOLUTION=480p

# Maximum quality (requires powerful hardware)
RENDER_RESOLUTION=1080p
```

## Codec Information

**Q: Is H.265 used automatically?**
A: No, H.264 is used. WebRTC in browsers requires H.264 - H.265 is not supported.

**Q: Why H.264 and not MPEG-4?**
A:
- H.264 can be streamed with "copy" mode (no re-encoding)
- MPEG-4 must be re-encoded in real-time (very CPU intensive)
- H.264 is required for WebRTC browser compatibility
- Better compression and quality

## Verify It's Working

After re-rendering and starting with `make dev`, check the camera stream output:

### Good (H.264 - Optimized):
```
✓ Using pre-rendered video (optimized)
Stream #0:0: Video: h264 (High)
```

### Bad (MPEG-4 - Slow):
```
⚠ Video is mpeg4, re-encoding to H.264 for RTSP compatibility
  Recommendation: Re-render with 'make prerender-videos-force'
```

## Troubleshooting

### Videos still slow after re-rendering?

Check the codec:
```bash
ffprobe shared/cameras/rendered/view-HC3-rendered.mp4 2>&1 | grep codec_name
```

Should show: `codec_name=h264`

If it shows `codec_name=mpeg4`, the re-rendering didn't work. Try:
```bash
# Make sure you have libx264 installed
sudo apt-get install ffmpeg libx264-dev

# Try again
make prerender-videos-force
```

### Not seeing 60 FPS?

1. Check `.env` has: `MAX_FPS=60`
2. Check browser dev tools (F12) → Network tab for frame timing
3. CPU might be bottleneck - try 480p resolution

### High CPU usage even with H.264?

This means videos aren't H.264. Re-render:
```bash
make prerender-videos-force
```

## Configuration Reference

### .env Settings

```bash
# Video rendering
RENDER_RESOLUTION=720p       # 480p, 720p, or 1080p

# WebRTC performance
MAX_FPS=60                   # Target FPS (default: 60)
DRAW_ON_FRAME=false          # Must be false for pre-rendered

# Detection (only for real-time mode)
CONFIDENCE_THRESHOLD=0.5
DETECTION_RESOLUTION=640
```

### Make Commands

```bash
# Re-render with current .env settings
make prerender-videos-force

# Check what videos exist
make list-videos

# Clean up and restart
make cleanup-ports
make dev
```

## Performance Tips

1. **Start with 720p** - Best balance for most systems
2. **Use H.264 videos** - Never use MPEG-4 for production
3. **Monitor CPU** - If >80%, drop to 480p
4. **Check network** - Use browser dev tools to verify stream quality
5. **Close other apps** - FFmpeg + WebRTC needs resources

## Expected Performance

### System Requirements

| Resolution | CPU (per camera) | RAM | Network |
|-----------|-----------------|-----|---------|
| 480p | 5-10% | 100MB | 1-2 Mbps |
| 720p | 10-15% | 150MB | 2-3 Mbps |
| 1080p | 15-25% | 200MB | 4-6 Mbps |

### Frame Rates

- 480p: 60 FPS sustained
- 720p: 50-60 FPS (recommended)
- 1080p: 30-45 FPS

## Next Steps

After getting high performance:

1. Optimize for your use case (adjust resolution in `.env`)
2. Monitor with `curl http://localhost:8080/metrics`
3. Consider GPU acceleration for even better performance (Phase 3)

---

**Need Help?** Check `PERFORMANCE_OPTIMIZATIONS.md` for detailed information.
