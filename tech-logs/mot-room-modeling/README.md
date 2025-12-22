# MOT Room Modeling

This folder contains artifacts and tooling used while iterating on the 2D room model (sitemap) used for MOT.

## Render The Sitemap

Generate a quick PNG preview from the current sitemap:

- `make render-sitemap`

Defaults:

- Input: `frontend/public/sitemap-rectangular-room.json` (symlink to `shared/config/sitemap-rectangular-room.json`)
- Output: `tech-logs/mot-room-modeling/sitemap-render.png`

Overrides:

- `make render-sitemap SITEMAP=shared/config/sitemap-rectangular-room.json SITEMAP_RENDER_OUT=tech-logs/mot-room-modeling/tmp.png`
- `make render-sitemap SITEMAP_RENDER_SCALE=35 SITEMAP_RENDER_PAD=40`

Renderer implementation: `scripts/render-sitemap.py`.

## Legend (Render Colors)

- Black: `walls`
- Green: `doors` (openings / passages)
- Blue: `cameras`
- Gray shapes: `obstacles` (e.g. pillars, tables, seating)

## Generated Files

### Working Preview

- `sitemap-render.png`
  - Latest sitemap preview (overwritten by `make render-sitemap`)
  - Rendered from: `frontend/public/sitemap-rectangular-room.json`

### Reference Floor Plan

- `floor-plan-1.png`
  - Rasterized floor plan used for visual comparison
  - Generated from: `shared/cameras/Auditorium/floor-plan.pdf`

### Camera Frame Stills

These are representative single frames used to sanity-check camera placement/orientation and visible occluders.

- `HC3.jpg`: extracted from `shared/cameras/Auditorium/view-HC3.mp4` (atrium/prefunction-facing view)
- `HC4.jpg`: extracted from `shared/cameras/Auditorium/view-HC4.mp4` (atrium/prefunction-facing view)
- `IP2.jpg`: extracted from `shared/cameras/Auditorium/view-IP2.mp4` (auditorium-facing view)
- `IP5.jpg`: extracted from `shared/cameras/Auditorium/view-IP5.mp4` (auditorium-facing view)

### Timestamped Bundles

- `regen-*/`
  - Bundles created during manual regen runs
  - Typically includes: `floor-plan-1.png`, `sitemap-render.png`, and the 4 camera stills at the time of generation
