# Kalman Filter Tuning Recommendations

## Overview

This document provides Kalman filter parameter recommendations for tracking human motion in the Axis Guardian tracking system. The recommendations are based on analysis of walking motion characteristics and prediction accuracy evaluation.

## Filter Model

The Kalman filter uses a **4-state constant velocity model**:

**State vector**: `[x, y, vx, vy]`
- `x, y`: Position in floor coordinates (meters)
- `vx, vy`: Velocity (meters/second)

**Motion model**: Constant velocity with process noise
```
x(k+1) = x(k) + vx(k) * dt
y(k+1) = y(k) + vy(k) * dt
vx(k+1) = vx(k) + w_vx
vy(k+1) = vy(k) + w_vy
```

**Measurement model**: Position-only observations from camera detections
```
z = [x_measured, y_measured] + v
```

## Recommended Parameters

### For Human Walking (~1.4 m/s)

| Parameter | Value | Description |
|-----------|-------|-------------|
| `q_pos` | 0.1 m² | Position process noise |
| `q_vel` | 1.0 (m/s)² | Velocity process noise |
| `r_pos` | 0.25 m² | Measurement noise (position) |

```python
from analytics.tracking.kalman_track_filter import KalmanFilterConfig, KalmanTrackFilter

config = KalmanFilterConfig(
    q_pos=0.1,     # Position process noise (m²)
    q_vel=1.0,     # Velocity process noise ((m/s)²)
    r_pos=0.25,    # Measurement noise (m²) - ~0.5m std
)

kf = KalmanTrackFilter(config)
```

### For Different Motion Types

| Motion Type | `q_vel` | `r_pos` | Notes |
|-------------|---------|---------|-------|
| Standing/slow | 0.1 | 0.1 | Very stable, minimal acceleration |
| Walking | 1.0 | 0.25 | Standard human walking 1.0-1.8 m/s |
| Running | 4.0 | 0.25 | Fast motion 3-8 m/s |
| Erratic | 8.0 | 0.5 | Unpredictable movements |

## Parameter Explanation

### Q (Process Noise Covariance)

Q models uncertainty in the motion model - how much the actual motion deviates from the constant-velocity assumption.

**`q_pos` (Position process noise)**:
- Controls position prediction stability
- Typically keep small (0.05-0.2) as velocity drives predictions
- Higher values make position more responsive but noisier

**`q_vel` (Velocity process noise)**:
- Controls how quickly velocity estimate can change
- Captures unmodeled accelerations (starting, stopping, turning)
- For walking: typical accelerations are 0.5-2.0 m/s²
- Setting: `q_vel ≈ (max_expected_acceleration)²`

### R (Measurement Noise Covariance)

R models uncertainty in position measurements from the camera system.

**`r_pos` (Measurement noise)**:
- Based on camera calibration accuracy
- Includes coordinate projection errors
- Typical surveillance cameras: 0.3-1.0 m position error
- Setting: `r_pos = (position_std)²`

## Supporting Data

Based on evaluation with synthetic walking trajectory (1.4 m/s, 10 Hz):

| Metric | Value |
|--------|-------|
| 1-step prediction RMSE | 0.43 m |
| Mean velocity estimation error | 5.08 m/s* |
| Estimated measurement noise | 0.29 m |
| Walking speed (true) | 1.4 m/s |
| Walking speed (estimated) | 1.37 m/s |

*Note: High velocity error is due to noise amplification in finite-difference calculation of "actual" velocity. The Kalman filter's speed estimate (1.37 m/s) is very close to true speed (1.4 m/s).

## Tuning Guidelines

### If tracks are too "jerky" (high-frequency noise)
- **Increase R** (trust measurements less)
- **Decrease Q** (trust motion model more)

### If tracks lag behind actual motion
- **Decrease R** (trust measurements more)
- **Increase Q** (allow faster state changes)

### If velocity estimates are unstable
- **Increase R** (smooth out measurements)
- Ensure `q_vel` is appropriate for motion type

### For varying detection rates
- Q parameters scale with `dt` in implementation
- No manual adjustment needed for different frame rates

## Implementation Files

| File | Purpose |
|------|---------|
| `analytics/tracking/kalman_track_filter.py` | Kalman filter implementation |
| `analytics/evaluation/motion_evaluator.py` | Evaluation tools and tuning utilities |
| `scripts/evaluate_kalman_tuning.py` | Standalone evaluation script |
| `tests/unit/analytics/test_kalman_track_filter.py` | Unit tests |

## Usage Example

```python
from analytics.tracking.kalman_track_filter import (
    KalmanTrackFilter,
    KalmanFilterConfig,
    create_walking_filter
)

# Option 1: Use factory function
kf = create_walking_filter()

# Option 2: Custom configuration
config = KalmanFilterConfig(
    q_pos=0.1,
    q_vel=1.0,
    r_pos=0.25
)
kf = KalmanTrackFilter(config)

# Process measurements
kf.update(x=10.5, y=20.3, timestamp=0.0)
kf.update(x=10.6, y=20.4, timestamp=0.1)

# Get state
x, y, vx, vy = kf.get_state()
speed = kf.get_speed()

# Get prediction for future time
pred_x, pred_y, pred_vx, pred_vy = kf.predict(timestamp=0.2)
```

## Grid Search Results

Optimal parameters found via grid search on walking trajectory:

| Parameter | Optimal Value |
|-----------|---------------|
| `q_pos` | 0.05 |
| `q_vel` | 0.5 |
| `r_pos` | 1.0 |

However, the **recommended default values** (q_pos=0.1, q_vel=1.0, r_pos=0.25) are preferred for general use as they:
1. Provide good velocity responsiveness
2. Balance smoothing vs. tracking lag
3. Work well across walking speed variations

## References

- Welch, G., & Bishop, G. (2006). "An Introduction to the Kalman Filter"
- Bar-Shalom, Y., Li, X. R., & Kirubarajan, T. (2001). "Estimation with Applications to Tracking and Navigation"
