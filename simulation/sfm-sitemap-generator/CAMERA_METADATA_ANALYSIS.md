# Camera Metadata Analysis - Auditorium Cameras

## Camera Configuration Overview

The auditorium has **4 cameras** arranged in an **L-shaped two-room layout**:
- **2 cameras** in the lower room (HC3, HC4)
- **2 cameras** in the upper room (IP2, IP5)

---

## Individual Camera Metadata

### Camera 1 (HC3) - "view-HC3"
```yaml
Position:
  Local XYZ: [16.22m, 0.3m, 1.68m]
  GPS: [36.00329921, -78.93988946, 111.08m]
  Height: 1.68m above ground

Orientation:
  Pan (azimuth): 18° (pointing slightly NE)
  Tilt (elevation): 1° (nearly horizontal, slight up)
  Roll: 0°

Coverage:
  FOV: 92° horizontal × 50° vertical
  Direction: Looking northeast across lower room
```

**Location**: Far right (east) of lower room
**Looking**: Toward northwest (covers most of lower room)

---

### Camera 2 (HC4) - "view-HC4"
```yaml
Position:
  Local XYZ: [0.9m, 0.5m, 1.67m]
  GPS: [36.00321915, -78.93971508, 111.07m]
  Height: 1.67m above ground

Orientation:
  Pan (azimuth): 313° (pointing NW, -47° from north)
  Tilt (elevation): -5° (looking slightly down)
  Roll: 0°

Coverage:
  FOV: 92° horizontal × 50° vertical
  Direction: Looking northwest
```

**Location**: Far left (west) of lower room
**Looking**: Toward northwest (opposite corner from HC3)

---

### Camera 3 (IP2) - "view-IP2"
```yaml
Position:
  Local XYZ: [20.60m, 28.31m, 2.62m]
  GPS: [36.00313846, -78.94001529, 112.02m]
  Height: 2.62m above ground (HIGHEST camera)

Orientation:
  Pan (azimuth): 140° (pointing SE)
  Tilt (elevation): -9° (looking down)
  Roll: 0°

Coverage:
  FOV: 92° horizontal × 50° vertical
  Direction: Looking southeast from upper room
```

**Location**: Top-right of upper room (highest mount point)
**Looking**: Down toward the connection between rooms

---

### Camera 4 (IP5) - "view-IP5"
```yaml
Position:
  Local XYZ: [10.57m, 16.31m, 1.84m]
  GPS: [36.00319228, -78.93990929, 111.24m]
  Height: 1.84m above ground

Orientation:
  Pan (azimuth): 339° (pointing NNW, -21° from north)
  Tilt (elevation): 0° (looking at horizon)
  Roll: 0°

Coverage:
  FOV: 92° horizontal × 50° vertical
  Direction: Looking north-northwest across upper room
```

**Location**: Middle of upper room
**Looking**: Toward the north part of upper room

---

## Spatial Relationships

### Room Layout (L-Shape)

```
Upper Room (North)
┌─────────────────┐
│     IP2 →       │  Camera 3 (IP2): Top-right, looking SE
│        ↓        │  Camera 4 (IP5): Center, looking NNW
│    ← IP5        │
│                 │
└────┬────────────┘
     │ Connection
     │
┌────┴────────────┐
│ Lower Room      │  Camera 2 (HC4): Left, looking NW
│                 │  Camera 1 (HC3): Right, looking NE
│  HC4 →     ← HC3│
└─────────────────┘
      ~18m wide
```

### Distance Matrix (from local positions)

| From → To | HC4 | HC3 | IP5 | IP2 |
|-----------|-----|-----|-----|-----|
| **HC4** (0.9, 0.5) | - | **15.32m** | 16.38m | 30.12m |
| **HC3** (16.22, 0.3) | 15.32m | - | 16.75m | 28.46m |
| **IP5** (10.57, 16.31) | 16.38m | 16.75m | - | **12.70m** |
| **IP2** (20.60, 28.31) | 30.12m | 28.46m | 12.70m | - |

**Key observations**:
- **HC4 ↔ HC3**: 15.32m apart (same room, east-west separation)
- **IP5 ↔ IP2**: 12.70m apart (same room, upper room cameras)
- **Cross-room distances**: 28-30m (cameras in different rooms)

---

## Camera Pairing & Field of View Overlap

### Lower Room Cameras (HC3 + HC4)

**HC4 (left) → HC3 (right)**:
- Distance: 15.32m apart
- HC4 looking NW (313°), HC3 looking NE (18°)
- **Angular difference**: ~55° (moderate overlap)
- **Overlap zone**: Center of lower room
- **SfM result**: ✅ **171 matches** (best pair!)

```
HC4 (313°)        HC3 (18°)
    ↘   ╱╲   ↙
       ╱  ╲
      ╱ ✓  ╲  <- Overlap zone (center)
     ╱      ╲
```

### Upper Room Cameras (IP2 + IP5)

**IP5 (center) → IP2 (top-right)**:
- Distance: 12.70m apart
- IP5 looking NNW (339°), IP2 looking SE (140°)
- **Angular difference**: ~161° (nearly opposite!)
- **Overlap zone**: Minimal (looking almost opposite directions)
- **SfM result**: ❌ **No matches** (as expected)

```
IP2 (140°) →

← IP5 (339°)

(Looking opposite directions - no overlap)
```

### Cross-Room Pairs

**HC3 (lower) → IP5 (upper)**:
- Distance: 16.75m (across room boundary)
- HC3 looking NE (18°), IP5 looking NNW (339°)
- **Angular difference**: ~39°
- **Overlap zone**: Room connection area
- **SfM result**: ✅ **52 matches** (weak but present)

**HC3 (lower) → IP2 (upper)**:
- Distance: 28.46m (far apart)
- HC3 looking NE (18°), IP2 looking SE (140°)
- **Angular difference**: ~122° (different directions)
- **Overlap zone**: Possible through doorway
- **SfM result**: ✅ **138 matches** (surprisingly good!)

**HC4 (lower) → IP5 (upper)**:
- Distance: 16.38m
- HC4 looking NW (313°), IP5 looking NNW (339°)
- **Angular difference**: ~26° (similar directions)
- **Overlap zone**: Connection between rooms
- **SfM result**: ✅ **77 matches**

**HC4 (lower) → IP2 (upper)**:
- Distance: 30.12m (furthest apart)
- HC4 looking NW (313°), IP2 looking SE (140°)
- **Angular difference**: ~147° (opposite-ish)
- **Overlap zone**: Unlikely
- **SfM result**: ❌ **No matches** (too far, wrong angles)

---

## Why SfM Feature Matching Worked/Failed

### ✅ Successful Matches

1. **HC4 ↔ HC3** (171 matches) - BEST
   - ✅ Same room (lower)
   - ✅ Moderate separation (15.32m)
   - ✅ Converging view directions (55° difference)
   - ✅ Similar heights (1.67m vs 1.68m)
   - **Result**: Strong overlap in center of lower room

2. **HC3 ↔ IP2** (138 matches) - GOOD
   - ✅ View through doorway/connection
   - ✅ Both looking "across" the space
   - ⚠️ Far apart (28.46m) but both see transition zone
   - **Result**: Doorway/hallway features matched

3. **HC4 ↔ IP5** (77 matches) - MODERATE
   - ✅ Similar directions (NW vs NNW)
   - ✅ See connection between rooms
   - **Result**: Hallway features visible to both

4. **HC3 ↔ IP5** (52 matches) - WEAK
   - ⚠️ Different rooms
   - ⚠️ Some angular mismatch
   - ✅ Both see transition area
   - **Result**: Minimal but sufficient overlap

### ❌ Failed Matches

1. **IP5 ↔ IP2** (no matches)
   - ❌ Looking nearly opposite directions (161° difference)
   - ❌ No overlapping field of view
   - **Cameras 339° and 140° don't see same features**

2. **HC4 ↔ IP2** (no matches)
   - ❌ Too far apart (30.12m)
   - ❌ Opposite viewing directions (147° difference)
   - ❌ Different rooms with no overlap

---

## Camera Height Differences

```
IP2:  2.62m  ████████████████ (highest - looking down)
IP5:  1.84m  ███████████
HC3:  1.68m  ██████████
HC4:  1.67m  ██████████ (lowest)

Height span: 0.95m (from 1.67m to 2.62m)
```

**Impact on SfM**:
- IP2 at 2.62m provides different perspective (bird's eye)
- Similar heights (HC3, HC4, IP5) see similar perspectives
- Height differences help with scale estimation

---

## Orientation Analysis

### Pan (Azimuth) Angles

```
         N (0°)
         ↑
         |
W ←------+------→ E
(270°)   |      (90°)
         |
         S (180°)

Camera directions:
HC3:  18°  (NNE)  ↗
HC4: 313°  (NW)   ↖
IP5: 339°  (NNW)  ↑↖
IP2: 140°  (SE)   ↘
```

### Tilt (Elevation) Angles

```
Looking up:   +1° (HC3 - nearly horizontal)
Horizontal:    0° (IP5 - at horizon)
Looking down: -5° (HC4 - slight down)
              -9° (IP2 - looking down from height)
```

---

## SfM Results Interpretation

### Camera Positioning in Generated Map

**SfM Output**:
```
camera1 (HC3):  (205, 148) - Separated
camera2 (HC4):  ( 59,  56) - Clustered ┐
camera3 (IP2):  ( 70,  56) - Clustered ┤ Same location
camera4 (IP5):  ( 69,  63) - Clustered ┘
```

**Why the clustering?**

1. **HC4, IP2, IP5 appear at nearly same location**:
   - SfM uses **relative positioning** from feature matches
   - Cameras 2, 3, 4 didn't match with each other directly
   - All matched through camera 1 (HC3) as intermediary
   - Without strong inter-connections, they collapse to similar positions

2. **HC3 is separated correctly**:
   - Has strong matches with all other cameras
   - Acts as "anchor" camera
   - Positioned relative to multiple views

### The "Chain" Problem

```
Current SfM graph:
           HC4
            ↓ (77 matches)
HC3 ←────→ IP5
    (52)    ↑
    (138)   × (no direct match)
    ↓       ↑
   IP2 ─────┘ (no direct match)

Should be:
HC4 ←─→ HC3 ←─→ IP5 ←─→ IP2
   (171)   (52)    (need)
```

**Missing connections**:
- IP5 ↔ IP2 should match (same room) but cameras look opposite ways
- More cross-connections would improve positioning

---

## Ground Truth vs SfM Comparison

### Actual Layout
```
Upper Room (20.60, 28.31)
    IP2 (highest, 2.62m)
    IP5 (10.57, 16.31)

Lower Room
    HC4 (0.9, 0.5)
    HC3 (16.22, 0.3)

Dimensions: ~18m × 32m (L-shaped)
```

### SfM Detected
```
Grid: 10.93m × 8.88m (~60% of actual size)

Camera clustering:
  Group 1: HC3 alone (acts as reference)
  Group 2: HC4, IP2, IP5 together (collapsed)
```

**Scale Issue**: Generated map is about 60% of true size
- **Cause**: Scale recovered from triangulation may be incorrect
- **Solution**: Use known camera heights more directly for calibration

---

## Recommendations for Better SfM Results

### 1. **Improve Camera Overlap** (Hardware - future)
- Add cameras at L-shaped corner to connect upper/lower rooms
- Reorient IP2 and IP5 to have more overlap
- Current IP2 (140°) and IP5 (339°) = 161° apart (nearly opposite)

### 2. **Scale Calibration** (Software - immediate)
```python
# Use known camera heights and positions directly
known_distances = {
    ('HC3', 'HC4'): 15.32,  # meters
    ('IP5', 'IP2'): 12.70   # meters
}

# Calibrate SfM scale to match known distances
scale_factor = compute_scale_from_known_distances(
    sfm_cameras, known_distances
)
```

### 3. **Bundle Adjustment** (Software - medium term)
- Jointly optimize all camera poses
- Use known camera heights as constraints
- Minimize reprojection error across all views

### 4. **Use GPS as Initialization** (Hybrid approach)
```python
# Use GPS for initial camera positions
initial_poses = from_gps_coordinates(cameras)

# Refine with SfM feature matching
refined_poses = sfm_refinement(initial_poses, feature_matches)
```

---

## Summary

### Camera Relationships

| Pair | Distance | Direction Match | Overlap | Matches | Quality |
|------|----------|----------------|---------|---------|---------|
| HC4 ↔ HC3 | 15.32m | ✅ Converging | ✅ High | 171 | ⭐⭐⭐ Best |
| HC3 ↔ IP2 | 28.46m | ⚠️ Partial | ✅ Doorway | 138 | ⭐⭐ Good |
| HC4 ↔ IP5 | 16.38m | ✅ Similar | ⚠️ Partial | 77 | ⭐ OK |
| HC3 ↔ IP5 | 16.75m | ⚠️ Different | ⚠️ Minimal | 52 | ⚠️ Weak |
| IP5 ↔ IP2 | 12.70m | ❌ Opposite | ❌ None | 0 | ❌ Failed |
| HC4 ↔ IP2 | 30.12m | ❌ Opposite | ❌ None | 0 | ❌ Failed |

### Key Insights

1. **Lower room cameras (HC3, HC4)** have excellent overlap → strong matches
2. **Upper room cameras (IP5, IP2)** look opposite ways → no matches
3. **Cross-room matches** depend on doorway/connection visibility
4. **Camera clustering** in SfM result is due to weak inter-connectivity
5. **Scale estimation** needs improvement using known heights/distances

The L-shaped layout and camera orientations create a **challenging SfM scenario** where not all cameras see each other, leading to positioning ambiguities that require additional constraints (known distances, heights, or GPS) to resolve accurately.
