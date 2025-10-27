# Quick Start: New Site Map Views

## Start the Development Server

```bash
cd frontend
yarn dev
```

Server will start at: http://localhost:5173

## View the New Pages

### 1. Site Map Library
**URL:** http://localhost:5173/site-maps

**What You'll See:**
- Grid of site map cards
- 1 sample SfM-generated map
- Filter buttons: All / SfM / GPS / Manual
- "Generate New Map" button

**Try This:**
- Click "View 3D" to see the 3D point cloud viewer
- Click "View 2D" to see the traditional 2D view
- Try the filter buttons

---

### 2. Site Map Generator (Wizard)
**URL:** http://localhost:5173/site-maps/generate

**What You'll See:**
- 4-step wizard with progress indicators
- Step 1: Choose between SfM or GPS-based generation

**Try This:**

**Step 1 - Method Selection:**
1. Click "Structure from Motion (SfM)" card
2. Notice the feature highlights and requirements
3. Click "Next"

**Step 2 - Camera Selection:**
1. You'll see 4 mock cameras with metadata
2. Click on cameras to select them (need at least 2)
3. Notice the validation message until you have 2+
4. Click "Next"

**Step 3 - Settings:**
1. Try the sliders:
   - Max Features: 1k-20k
   - Grid Resolution: 1-20cm
   - Wall Detection: 10-100%
   - Min Wall Length: 0.1-3m
2. Try the dropdowns (feature type)
3. Toggle export formats (2D/3D/JSON)
4. Click "Next"

**Step 4 - Generate:**
1. Review the summary
2. Click "Generate Site Map"
3. Watch the progress bar go through 8 stages (~12 seconds)
4. See the success screen with stats
5. Click "View Site Map" → redirects to 3D viewer

---

### 3. 3D Point Cloud Viewer
**URL:** http://localhost:5173/site-maps/sfm-auditorium-001/view-3d

**What You'll See:**
- Left panel with controls
- Center canvas with 120k+ point cloud
- 4 camera frustums (cones)
- Grid and stats overlay

**Try This:**

**Mouse Controls:**
- **Left click + drag:** Rotate the view
- **Right click + drag:** Pan the view
- **Scroll wheel:** Zoom in/out

**Display Toggles (Left Panel):**
- Toggle "Show Point Cloud" on/off
- Toggle "Show Cameras" to hide camera frustums
- Toggle "Show Grid" to remove the floor grid
- Toggle "Wireframe Mode" for different rendering
- Adjust "Point Size" slider to change point sizes

**View Presets:**
- Click "Top View" for bird's eye perspective
- Click "Side View" for side perspective
- Click "Reset View" to return to default

**Stats:**
- Check FPS counter (bottom left)
- See point count (bottom left)
- Review quality metrics (left panel)

**Switch to 2D:**
- Click "View 2D" button in header

---

## Navigation Flow

```
Site Map Library (/site-maps)
  │
  ├─> Click "Generate New Map"
  │     └─> Generator Wizard (/site-maps/generate)
  │           └─> After generation → 3D Viewer
  │
  ├─> Click "View 3D" on existing map
  │     └─> 3D Viewer (/site-maps/:id/view-3d)
  │           └─> Can switch to 2D View
  │
  └─> Click "View 2D" on existing map
        └─> 2D Viewer (/site-maps/:id/view-2d)
              └─> Legacy viewer (existing)
```

## Understanding the Mock Data

### Site Map Library
- **1 sample map:** "Auditorium Site Map"
- **Source:** SfM-generated
- **Stats:** 24 walls, 4 cameras, 576m² area
- **3D Data:** Point cloud with 124k vertices

### Generator Wizard
- **4 mock cameras:**
  - Camera 1: Auditorium North (1.68m height)
  - Camera 2: Auditorium South (1.67m height)
  - Camera 3: Auditorium East (2.62m height)
  - Camera 4: Auditorium West (1.84m height)

### 3D Viewer
- **Point cloud:** Procedurally generated (18m × 32m × 3m room)
- **120k+ vertices** with height-based coloring
- **4 camera frustums** showing SfM-computed positions
- **Quality metrics:**
  - 87% coverage
  - 2,456 feature matches
  - 0.043 reconstruction error

## Testing Different Scenarios

### Scenario 1: Full Generation Flow
1. Start at library
2. Click "Generate New Map"
3. Select SfM method
4. Choose 4 cameras
5. Adjust settings (try max features = 15,000)
6. Generate and watch progress
7. View result in 3D

### Scenario 2: 3D Exploration
1. Go directly to 3D viewer
2. Try all mouse controls
3. Toggle different display options
4. Use view presets
5. Check stats and quality metrics
6. Switch to 2D view

### Scenario 3: Minimal Camera Selection
1. Start generator wizard
2. Select only 2 cameras (minimum for SfM)
3. Complete wizard
4. See how it handles fewer cameras

## Keyboard Shortcuts (3D Viewer)

While the 3D viewer is focused:
- **Left click + drag:** Rotate
- **Right click + drag:** Pan
- **Scroll:** Zoom
- **ESC:** (Future) Exit fullscreen

## Performance Tips

### If 3D Viewer is Slow:
1. Reduce point size (left panel slider)
2. Disable "Show Grid"
3. Close other browser tabs
4. Check FPS counter (should be 60)

### If Wizard Takes Too Long:
- Mock generation is 12 seconds
- Can't be sped up (simulates real backend)
- Use browser dev tools Network tab to see progress

## Troubleshooting

### "No site maps found" in library
- **Expected:** Only 1 mock map exists
- **Action:** Click "Generate New Map" to create more (mocks)

### 3D viewer shows blank screen
- **Check:** Console for Three.js errors
- **Action:** Hard refresh (Ctrl+Shift+R)
- **Fallback:** Use 2D view instead

### Generator wizard stuck on step
- **Check:** Current step requirements
  - Step 1: Must select a method
  - Step 2: Must select 2+ cameras (for SfM)
  - Step 3: Must have 1+ export format
- **Action:** "Next" button disables until requirements met

### Camera controls not working
- **Check:** Canvas has focus (click on it)
- **Try:** Use button controls instead (Top View, etc.)

## Next Steps (After Testing)

1. **Review the code:**
   - `frontend/src/views/site-maps/`
   - `frontend/src/types/sitemap.ts`
   - `frontend/src/composables/useSfMGeneration.ts`

2. **Understand the architecture:**
   - Read `SITE_MAP_VIEWS.md`
   - Check `SITE_MAP_IMPLEMENTATION_COMPLETE.md`

3. **Plan backend integration:**
   - Connect to SfM service (port 8091)
   - Implement VAPIX snapshot capture
   - Add .ply file serving
   - Database persistence

## Questions?

Check the documentation:
- `SITE_MAP_VIEWS.md` - Full implementation guide
- `SITE_MAP_IMPLEMENTATION_COMPLETE.md` - Summary
- Type definitions have JSDoc comments

Enjoy exploring the new site map system! 🗺️✨
