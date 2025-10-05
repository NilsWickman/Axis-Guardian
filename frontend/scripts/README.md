# Site Map Rendering Script

This script renders all site maps to PNG images, enabling rapid iteration on site map configurations.

## Quick Start

```bash
npm run render-maps
```

This will generate rendered site maps in `output/rendered-maps/`.

## Iteration Workflow

1. **View Original Floorplans** (Optional Reference)
   - Check `src/mocks/floorplans/` for the original floorplan images
   - Use these as reference when defining walls

2. **Run Rendering Script**
   ```bash
   npm run render-maps
   ```
   - Generates images showing exactly what users see in the app:
     - Dark background
     - Grid lines with meter labels
     - Wall overlays (from mock data)
     - Camera placements with FOV cones
     - Scale reference ruler

3. **Review Rendered Output**
   - Open `output/rendered-maps/` to view generated images
   - These match exactly what's displayed in the app
   - Verify wall layouts and camera coverage

4. **Modify Mock Data**
   - Edit `src/stores/siteMaps.ts` to adjust:
     - Wall coordinates
     - Camera positions, rotations, FOV
     - Colors and labels

5. **Re-render & Iterate**
   - Run `npm run render-maps` again
   - Review changes in output images
   - Repeat until satisfied

## What Gets Rendered

Each site map image shows exactly what users see in the app:

- **Dark Background** (#1a1a2e)
  - Matches the app's canvas background

- **Grid Lines**
  - Major lines every 5 meters
  - Minor lines every meter
  - Labeled with distances

- **Walls**
  - External walls (white, thicker)
  - Internal walls (gray, medium)
  - Doors (blue, dashed)

- **Cameras**
  - Camera icons with rotation indicator
  - FOV cones with wall occlusion (realistic visibility)
  - Color-coded by camera type
  - Labels with camera names
  - Down-angle indicators

- **Scale Reference**
  - Bottom ruler showing distance in meters

## Output Location

Rendered images are saved to:
```
output/rendered-maps/
├── site-map-1.png
├── site-map-2.png
└── site-map-3.png
```

Filenames are generated from the site map display names (e.g., "Site Map 1" → "site-map-1.png").

## Customization

Edit `scripts/render-site-maps.ts` to customize rendering options:

```typescript
const renderOptions = {
  showGrid: true,              // Show grid lines
  showScaleReference: true,    // Show bottom scale ruler
  showCameraLabels: true,      // Show camera name labels
  showBackgroundImage: false,  // Set to true to overlay floorplan images
}
```

**Note**: By default, images render without floorplan backgrounds to match the app view. Set `showBackgroundImage: true` to overlay the original floorplan images for comparison.

## Technical Details

- **Rendering Engine**: `@napi-rs/canvas` (server-side Canvas API)
- **Ray-casting**: Implements wall occlusion for realistic FOV visualization
- **Color Mapping**: Converts Tailwind color classes to hex values
- **Image Format**: PNG with lossless compression

## Site Map Data Structure

Site maps are defined in `src/stores/siteMaps.ts`:

```typescript
interface SiteMap {
  id: string
  name: string
  description?: string
  imagePath?: string              // Path to background floorplan
  width: number                   // Canvas width in pixels
  height: number                  // Canvas height in pixels
  scale: number                   // Pixels per meter
  walls: Wall[]                   // Array of wall line segments
  cameras: CameraPlacement[]      // Array of camera configurations
}
```

## Tips for Iteration

1. **Use Grid Lines**: Grid lines help align walls to meter boundaries
2. **Reference Scale**: Bottom scale ruler verifies distances
3. **Iterate Quickly**: Run render script after each change to see results immediately
4. **Compare with Floorplans**: Keep original floorplans open for reference when adjusting walls
5. **Enable Background** (optional): Set `showBackgroundImage: true` to overlay floorplans for accuracy checking
6. **Check Camera Coverage**: Verify FOV cones cover intended areas

## Troubleshooting

**Images not generating?**
- Ensure `output/rendered-maps/` directory exists (created automatically)
- Check console for errors

**Want to see floorplan backgrounds?**
- Set `showBackgroundImage: true` in render options
- Verify `imagePath` in site map configuration
- Ensure floorplan files exist in `src/mocks/floorplans/`

**Walls don't match your expectations?**
- Adjust wall coordinates in `src/stores/siteMaps.ts`
- Re-run script to see changes immediately
- Use grid lines for alignment
- Enable background images temporarily to verify accuracy

**Camera FOV looks wrong?**
- Check `rotation` (0° = right, 90° = down, 180° = left, 270° = up)
- Adjust `fov` (field of view angle in degrees)
- Modify `viewDistance` for range in pixels
- Verify `angle` (down-tilt angle) is appropriate for camera height
