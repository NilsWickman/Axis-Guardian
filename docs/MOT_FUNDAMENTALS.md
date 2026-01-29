# Multi-Object Tracking (MOT) Fundamentals

> This document explains the core concepts of Multi-Object Tracking as implemented in Axis-Guardian.

## What is Multi-Object Tracking?

**Multi-Object Tracking (MOT)** is the task of:
1. Detecting multiple objects (people) in each video frame
2. Associating detections across frames to form continuous trajectories (tracks)
3. Maintaining consistent identity as objects move, occlude each other, or leave/re-enter the scene

Unlike single-object tracking, MOT must handle:
- **Multiple identities** simultaneously
- **Occlusions** where objects temporarily disappear
- **ID switches** where the wrong identity is assigned
- **Fragmentation** where one trajectory becomes multiple tracks
- **Cross-camera handoff** where a person moves between camera views

---

## Track Lifecycle State Machine

```
                    ┌─────────────────────────────────────┐
                    │                                     │
                    ▼                                     │
┌──────────┐   3+ detections   ┌───────────┐   miss frames   ┌──────────┐
│UNCONFIRMED├─────────────────►│ CONFIRMED ├────────────────►│ OCCLUDED │
└──────────┘                   └───────────┘                 └──────────┘
     │                              │                              │
     │ < 3 detections               │ exit FOV                     │ timeout
     │ + timeout                    │ boundary exit                │ (5s default)
     ▼                              ▼                              ▼
┌──────────┐                   ┌──────────┐                   ┌──────────┐
│ DISCARDED│                   │  EXITED  │                   │ EXPIRED  │
└──────────┘                   └──────────┘                   └──────────┘
```

### States Explained

| State | Meaning | Entry Condition | Exit Condition |
|-------|---------|-----------------|----------------|
| **Unconfirmed** | New track, not yet validated | New detection doesn't match existing tracks | 3+ detections confirm it, OR timeout discards it |
| **Confirmed** | Active, validated track | Accumulated sufficient detections | Exits scene OR misses frames → Occluded |
| **Occluded** | Temporarily lost, predicted position | Missed detections but within timeout | Re-detection confirms OR timeout expires |
| **Exited** | Left the monitored area | Crossed FOV boundary or room boundary | Terminal state |
| **Expired** | Lost for too long | Occlusion timeout exceeded | Terminal state |
| **Discarded** | Never confirmed | Unconfirmed + timeout | Terminal state |

### Exit Reasons

When a track ends, it has one of these `ExitReason` values:

| Exit Reason | Meaning |
|-------------|---------|
| `fov_exit` | Left a camera's field of view |
| `boundary_exit` | Left the monitored room/area |
| `pillar_occlusion` | Hidden behind a pillar or obstacle |
| `partial_occlusion` | Partially hidden by another object |
| `timeout` | Lost without clear reason |

---

## The Detection-to-Track Assignment Problem

Each frame, we receive new detections and must decide:
- Which detection belongs to which existing track?
- Which detections are new people entering the scene?
- Which tracks have no matching detection (person left or occluded)?

### Why This is Hard

```
Frame N:                    Frame N+1:
  [D1] [D2] [D3]              [D4] [D5] [D6]
    │    │    │                 ?    ?    ?
    ▼    ▼    ▼
  [T1] [T2] [T3]            [T1] [T2] [T3]

Which detection matches which track?
- D4 could be T1, T2, or a new person
- T3 might have no detection (occluded? exited?)
```

### Greedy vs. Optimal Assignment

**Greedy approach (wrong):**
1. Find closest detection-track pair
2. Assign them
3. Repeat for remaining

**Problem:** Early assignments can prevent better global solutions.

**Hungarian algorithm (correct):**
- Finds globally optimal assignment that minimizes total cost
- Considers all possible assignments simultaneously
- Guarantees minimum total distance/cost

---

## Kalman Filter for Position Prediction

The Kalman filter maintains a probabilistic estimate of each track's position and velocity.

### State Vector

```
state = [x, y, vx, vy]
         │  │   │   │
         │  │   │   └── velocity in Y
         │  │   └────── velocity in X
         │  └────────── position Y
         └───────────── position X
```

### Predict-Update Cycle

```
              ┌────────────┐
              │ PREDICTION │ ◄── When no detection available
              │ state(t+1) │     (coasting during occlusion)
              └─────┬──────┘
                    │
                    ▼
              ┌────────────┐
   Detection ──► │   UPDATE   │
              │ state(t+1) │
              └────────────┘
```

**Prediction:** Project state forward using velocity estimate
**Update:** Correct prediction using actual measurement (detection)

### Why Kalman Helps MOT

1. **Prediction for assignment:** Predict where track will be, match to closest detection
2. **Smooth trajectories:** Filter out detection noise
3. **Handle occlusion:** Continue predicting during brief occlusions
4. **Velocity estimation:** Know how fast and which direction person is moving

---

## Cross-Camera Tracking

When a person moves between cameras, we need to maintain the same global track ID.

### Challenges

1. **Temporal gaps:** Person may not be visible during transition
2. **Appearance changes:** Different camera angles, lighting
3. **No overlap:** Cameras may not share field of view

### Our Approach

1. **Spatial correlation:** When track exits Camera A near Camera B's entrance, look for new tracks in B
2. **Re-identification (ReID):** Use visual appearance embeddings to match across cameras
3. **Velocity prediction:** Predict where person would appear based on walking speed

### ReID Embeddings

Each detection includes a 512-dimensional embedding vector that encodes visual appearance:

```typescript
interface DetectionAttributes {
  embedding?: number[]        // 512-dim OSNet embedding
  embedding_quality?: number  // 0-1 confidence in embedding
  upper_clothing?: { colors, type }
  lower_clothing?: { colors, type }
}
```

**Matching:** Cosine similarity between embeddings indicates same person:
- `> 0.7`: Likely same person
- `0.5-0.7`: Possible match
- `< 0.5`: Different people

---

## Key Algorithm Parameters

### Assignment Parameters

| Parameter | Default | Effect |
|-----------|---------|--------|
| `maxCost` | 1.5m | Maximum distance for valid assignment |
| `associationBonus` | 0.15 | Reward for consistent track-detection pairs |
| `embeddingWeight` | 0.3 | How much ReID affects assignment cost |
| `sameCameraPenalty` | 0.5 | Discourage assigning to wrong camera's track |

### Track Lifecycle Parameters

| Parameter | Default | Effect |
|-----------|---------|--------|
| `minDetectionsToConfirm` | 3 | Detections needed to confirm track |
| `trackExpiryMs` | 5000 | Milliseconds before occluded track expires |
| `maxVelocityMs` | 3.0 | Maximum plausible walking speed (m/s) |

### Kalman Parameters

| Parameter | Default | Effect |
|-----------|---------|--------|
| `processNoise` | 0.5 | Trust in motion model (lower = trust predictions more) |
| `measurementNoise` | 0.3 | Trust in detections (lower = trust detections more) |

---

## Quality Metrics

### MOTA (Multiple Object Tracking Accuracy)

```
MOTA = 1 - (FN + FP + IDSW) / GT

FN = False Negatives (missed detections)
FP = False Positives (phantom detections)
IDSW = ID Switches (wrong identity assigned)
GT = Ground Truth detections
```

**Good MOTA:** > 0.6
**Excellent MOTA:** > 0.8

### MOTP (Multiple Object Tracking Precision)

Average distance between matched detection and ground truth position.

**Good MOTP:** < 0.5m
**Excellent MOTP:** < 0.2m

### IDF1 (ID F1 Score)

Measures how well track identities are maintained:

```
IDF1 = 2 * IDTP / (2 * IDTP + IDFP + IDFN)

IDTP = Correctly identified detections
IDFP = Detections with wrong ID
IDFN = Missed identifications
```

---

## Common Failure Modes

### ID Switch

Track identity jumps to wrong person:
```
Frame 1: Person A → Track 1, Person B → Track 2
Frame 2: Person A → Track 2, Person B → Track 1  ← WRONG!
```

**Causes:** Occlusion, crossing paths, similar appearance

### Fragmentation

One person becomes multiple tracks:
```
Track 1: ████████░░░░░░░░░░
Track 2: ░░░░░░░░████████░░
Track 3: ░░░░░░░░░░░░░░████

Should be: Track 1 continuous
```

**Causes:** Brief occlusion, low confidence detections

### Merge

Two people become one track:
```
Person A: ─────────┐
                   ├──► Track 1 (wrong!)
Person B: ─────────┘
```

**Causes:** People walking close together, poor detection separation

---

## Debugging Tips

### High ID Switches
- Increase `associationBonus` to reward consistent assignments
- Lower `maxCost` to prevent distant matches
- Check if Kalman predictions are accurate

### High Fragmentation
- Lower `minDetectionsToConfirm` threshold
- Increase `trackExpiryMs` to wait longer before giving up
- Check if confidence threshold is too high

### High False Positives
- Increase `minDetectionsToConfirm`
- Check obstacle/boundary filtering
- Verify camera calibration accuracy

### Poor Cross-Camera Tracking
- Verify camera positions and orientations
- Check ReID embedding quality scores
- Adjust `embeddingWeight` in assignment
