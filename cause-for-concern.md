# Cause for Concern: Overfitting Risks in Camera Calibration

## Summary

The tracking system has a hybrid approach - solid foundations with concerning signs of overfitting to the training dataset.

---

## Well-Founded Components (Generalizable)

| Component | Source | Assessment |
|-----------|--------|------------|
| **K/R/T Matrices** | Auditorium dataset `cam_param.mat` | ✅ Professional calibration |
| **Projection Math** | Standard photogrammetry (Cramer's rule) | ✅ Textbook correct |
| **Hungarian Assignment** | Munkres algorithm | ✅ Well-established |
| **Kalman Filtering** | 4-state [x, y, vx, vy] | ✅ Standard state estimation |

---

## Overfitting Concerns

### 1. Hardcoded Regional Preferences

```typescript
// track-matcher.ts:87-115
function getRegionCameraPreference(centroid: Point2D): 'camera1' | 'camera2' | 'weighted'
```

- Left side (x < 6m): Camera2 preferred
- Right side (x > 12m): Camera1 preferred
- **Problem**: Thresholds tuned to this specific room layout

### 2. Magic Number Weights

```typescript
// camera-registry.ts:151-154
camera1: 1.15  // "73.2% pass rate"
camera2: 0.85  // "62% pass rate"
```

- Derived from **148 ground truth annotations** in this dataset
- Won't generalize to different lighting, camera positions, or environments

### 3. Quintic Polynomial Transform (High Risk)

- **Degree 5 polynomial** with 21 coefficients per dimension
- Trained on only **211 data points**
- Classic overfitting risk: polynomial can memorize training data rather than learn generalizable patterns
- Lower degree (3-4) would likely generalize better

### 4. Tuned Thresholds

| Threshold | Value | Location |
|-----------|-------|----------|
| Divergence threshold | 0.6m | track-matcher.ts |
| Regional boost | 1.3x | track-matcher.ts |
| Base weights | 1.2/0.8 | track-matcher.ts |

All tuned to this specific camera setup.

---

## Generalizability Matrix

| Component | Portable? | Notes |
|-----------|-----------|-------|
| K/R/T projection math | ✅ Yes | Just needs correct matrices per-site |
| Hungarian assignment | ✅ Yes | Algorithm is universal |
| Kalman filtering | ✅ Yes | Standard estimation |
| Camera reliability weights | ❌ No | Room-specific |
| Regional preferences | ❌ No | Room-specific |
| Quintic polynomial | ⚠️ Risk | May overfit with 21 coefficients |
| Divergence threshold | ⚠️ Risk | Tuned to this setup |

---

## Recommendations for Production

1. **Per-site recalibration required** - Hardcoded weights and regional preferences need retuning for each deployment

2. **Reduce polynomial degree** - Degree 3 or 4 would generalize better with less overfitting risk

3. **Consider online learning** - Self-calibrate camera reliability based on cross-camera consistency rather than hardcoded values

4. **Parameterize thresholds** - Move magic numbers to configuration files with clear documentation

---

## Conclusion

The core architecture (KRT projection + Hungarian + Kalman) is solid and portable. The room-specific tuning in weights, regional preferences, and polynomial coefficients is what limits deployment to new environments without recalibration.
