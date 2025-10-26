# Architecture Documentation

## Overview

The Geometric Site Map Generator uses **multi-view geometry** and **semantic segmentation** to automatically reconstruct 2D site maps from camera metadata and images.

## Key Innovation

Instead of trying to estimate depth from monocular images (inherently ambiguous), we leverage:

1. **Known camera extrinsics** (GPS, mount height, pan/tilt/roll)
2. **Multi-view geometry** (cameras are calibrated sensors in 3D space)
3. **Ground plane projection** (accurate pixel-to-meter mapping)
4. **Semantic understanding** (what IS walkable/wall, not just WHERE)

## Pipeline Stages

### Phase 1: World Coordinate System

**Input:** Camera GPS coordinates
**Output:** UTM-based world frame with metric coordinates

```
GPS (lat/lon/elevation) → UTM Projection → World Frame (X, Y, Z in meters)
```

- Origin at scene center
- Z=0 at average ground level
- Handles Earth curvature via proper UTM projection

### Phase 2: Camera Calibration

**Input:** Camera intrinsics + extrinsics
**Output:** Projection matrices, homographies

For each camera:
1. Build intrinsic matrix K from focal length and sensor size
2. Build rotation matrix R from pan/tilt/roll
3. Compute translation vector t from GPS position
4. Form projection matrix P = K[R|t]
5. Compute ground plane homography H (image ↔ ground)

### Phase 3: Semantic Segmentation

**Input:** Camera images
**Output:** Pixel-wise semantic labels

Uses SegFormer (transformer-based) trained on ADE20K:
- Segments: walkable, walls, obstacles, vegetation, etc.
- Provides confidence scores per pixel
- Maps ADE20K classes to our semantic taxonomy

### Phase 4: Ground Plane Mapping

**Input:** Segmentation masks + homography
**Output:** 3D ground points with semantic labels

For each camera:
1. Extract pixels of each semantic class
2. Apply homography H to map pixels → ground coordinates
3. Weight by distance and viewing angle
4. Associate confidence based on segmentation scores

### Phase 5: Multi-View Fusion

**Input:** Multiple camera observations
**Output:** Occupancy grid with fused beliefs

Bayesian probabilistic fusion:
```python
# For each cell
for observation in observations:
    # Likelihood: P(observation | state)
    likelihood = 0.9 if occupied else 0.1

    # Posterior: P(state | observation)
    posterior = (likelihood * prior) / normalization

    # Weighted update
    cell.probability = confidence * posterior + (1 - confidence) * prior
```

Confidence weighting considers:
- Distance from camera (exponential decay)
- Viewing angle (perpendicular is best)
- Segmentation confidence
- Number of observations

### Phase 6: Wall Extraction

**Input:** Occupancy grid
**Output:** Wall line segments

RANSAC-based line fitting:
1. Get occupied cells with high confidence
2. Iteratively fit lines (RANSAC):
   - Sample 2 points
   - Find inliers (points near line)
   - Keep best line
   - Remove inliers, repeat
3. Merge collinear segments
4. Filter by minimum length

### Phase 7: Rendering

**Input:** Occupancy grid + walls + cameras
**Output:** Visualizations

Render layers:
- Occupancy grid (color-coded by probability)
- Wall segments (thickness by confidence)
- Camera positions and FOV cones
- Grid and labels

## Mathematical Foundations

### Ground Plane Homography

For a camera viewing a plane Z=0:

```
s [u, v, 1]ᵀ = K[r₁ r₂ t][X, Y, 1]ᵀ
```

Where:
- (u, v) = image coordinates
- (X, Y) = ground plane coordinates
- K = camera intrinsic matrix
- r₁, r₂ = first two columns of rotation matrix R
- t = translation vector
- s = scale factor

The homography H = K[r₁ r₂ t] maps ground ↔ image.

### Bayesian Occupancy Update

Grid cells maintain occupancy probability via Bayesian updates:

```
P(occupied | observation) = P(observation | occupied) × P(occupied) / P(observation)
```

Using log-odds for numerical stability:
```
log_odds = log(p / (1-p))
log_odds_new = log_odds_old + log(likelihood_ratio)
```

### Multi-View Consistency

Points observed by multiple cameras get higher confidence:

```
confidence = exp(-distance/λ) × viewing_angle_weight × seg_confidence
final_value = Σ(weight_i × value_i) / Σ(weight_i)
```

## Design Patterns

### Separation of Concerns

- **Core**: Pure geometry (camera models, projections)
- **Vision**: Image understanding (segmentation, features)
- **Fusion**: Data integration (occupancy grid, Bayesian updates)
- **Rendering**: Visualization (matplotlib, OpenCV)

### Data Flow

```
CameraConfig → CameraCalibration → GroundPlaneMapper
                                          ↓
Image → SemanticSegmenter → SegmentationResult
                                          ↓
                              CameraObservation
                                          ↓
                                  MultiViewFusion
                                          ↓
                                   OccupancyGrid
                                          ↓
                                   WallExtractor
                                          ↓
                                 SiteMapRenderer
```

### Modularity

Each component can be:
- Tested independently
- Replaced with alternatives
- Extended with new features

Example: Swap SegFormer for a different segmentation model by implementing same interface.

## Performance Considerations

### Computational Complexity

- Segmentation: O(N × P) where N=cameras, P=pixels
  - Dominated by neural network inference
  - GPU acceleration critical

- Occupancy fusion: O(N × S) where S=sampled points
  - Subsampled to ~10k points per camera
  - Grid updates are O(1) per point

- Wall extraction: O(M × I) where M=occupied cells, I=RANSAC iterations
  - Typically M < 100k, I = 1000
  - Most expensive: line fitting

### Memory Usage

- Occupancy grid: ~4 bytes × width × height
  - For 200m × 200m at 5cm resolution: 16MB

- Segmentation: Full resolution kept in memory
  - 4 cameras × 1920×1080 × 4 bytes ≈ 32MB

- Models: SegFormer-B5 ≈ 350MB on GPU

### Optimization Opportunities

1. **Tile-based processing**: Split large areas into tiles
2. **Hierarchical grids**: Coarse-to-fine resolution
3. **Lazy evaluation**: Only process visible regions
4. **Caching**: Reuse segmentations across runs
5. **Parallel fusion**: Independent camera observations

## Comparison to Alternatives

| Approach | Accuracy | Auto | Scale | Complexity |
|----------|----------|------|-------|------------|
| Manual CAD | ⭐⭐⭐⭐⭐ | ❌ | ⭐ | Low |
| Monocular Depth | ⭐⭐ | ✅ | ⭐⭐⭐ | High |
| **Geometric (ours)** | ⭐⭐⭐⭐ | ✅ | ⭐⭐⭐⭐ | Medium |
| LiDAR SLAM | ⭐⭐⭐⭐⭐ | ✅ | ⭐⭐⭐ | High |
| Structure from Motion | ⭐⭐⭐⭐ | ✅ | ⭐⭐ | Very High |

Our approach balances accuracy with automation, leveraging existing camera infrastructure.

## Future Extensions

### Near-term

- [ ] Zone/room detection (graph-based polygon extraction)
- [ ] Temporal consistency (use video, not just frames)
- [ ] Occlusion reasoning (multi-view visibility)
- [ ] Confidence visualization (heatmaps)

### Medium-term

- [ ] Dynamic objects filtering (people, vehicles)
- [ ] 3D reconstruction (not just 2D projection)
- [ ] Change detection (monitor site modifications)
- [ ] Integration with building models (CAD fusion)

### Long-term

- [ ] Real-time updates (online SLAM)
- [ ] Active camera placement optimization
- [ ] Learned priors for specific sites
- [ ] Multi-modal fusion (thermal, depth sensors)

## References

1. Hartley & Zisserman, "Multiple View Geometry in Computer Vision"
2. Thrun et al., "Probabilistic Robotics" (Occupancy grids)
3. Xie et al., "SegFormer: Simple and Efficient Design for Semantic Segmentation"
4. Fischler & Bolles, "Random Sample Consensus: A Paradigm for Model Fitting"
