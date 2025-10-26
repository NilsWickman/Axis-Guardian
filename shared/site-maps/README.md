# Site Maps

This directory contains site map configurations for the surveillance system.

## Structure

- `generated/` - Auto-generated site maps from camera depth estimation (gitignored)
- `manual/` - Manually created or edited site maps (can be committed)

## Auto-Generation

Site maps can be automatically generated from camera depth estimation using:

```bash
# Start the generation service
make sitemap-service

# Or use the frontend UI
# Navigate to Site Map Editor and click "Generate from Cameras"
```

## Format

Site maps are stored as JSON files with the following structure:

```json
{
  "id": "map-xxx",
  "name": "Site Map Name",
  "width": 1260,
  "height": 1680,
  "scale": 60,
  "walls": [...],
  "cameras": [...],
  "fog_of_war_regions": [...]
}
```

Generated maps include:
- **walls**: Detected wall segments with confidence scores
- **cameras**: Camera placements in pixel coordinates
- **fog_of_war_regions**: Areas not visible to cameras (with assumed geometries)

Walls with confidence < 0.5 are rendered with dashed lines in the UI.
