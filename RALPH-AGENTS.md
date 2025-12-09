# Ralph Agent Setup

This document contains the commands to launch 5 parallel AI agents using the Ralph loop methodology for iterating on the tracking algorithm.

## Prerequisites

1. Git worktrees created for each developer:
```bash
git worktree add ../Axis-Guardian-dev1-projection site-tracking
git worktree add ../Axis-Guardian-dev2-correlation site-tracking
git worktree add ../Axis-Guardian-dev3-tracking site-tracking
git worktree add ../Axis-Guardian-dev4-kalman site-tracking
git worktree add ../Axis-Guardian-dev5-occlusion site-tracking
```

2. Dependencies installed in each worktree:
```bash
for dir in dev1-projection dev2-correlation dev3-tracking dev4-kalman dev5-occlusion; do
  cd ../Axis-Guardian-$dir && pnpm install
done
```

3. Create feature branches in each worktree:
```bash
cd ../Axis-Guardian-dev1-projection && git checkout -b dev1/projection-fix
cd ../Axis-Guardian-dev2-correlation && git checkout -b dev2/correlation-threshold
cd ../Axis-Guardian-dev3-tracking && git checkout -b dev3/track-association
cd ../Axis-Guardian-dev4-kalman && git checkout -b dev4/kalman-tuning
cd ../Axis-Guardian-dev5-occlusion && git checkout -b dev5/occlusion-handling
```

---

## Recommended Execution Order

**Developer 1 (Projection) is the critical path** - other agents may be blocked if projection isn't working.

**Option A: Sequential Start**
1. Run Dev1 first
2. Once projection tests pass, run Dev2-5 in parallel

**Option B: All Parallel**
- Run all 5 simultaneously
- Dev2-5 will document blockers if projection isn't working

---

## Agent Launch Commands

### Developer 1: Projection/Calibration

**Priority: CRITICAL (blocking others)**

```bash
cd ../Axis-Guardian-dev1-projection && claude --dangerously-skip-permissions "/ralph-wiggum:ralph-loop \"You are Developer 1: Projection/Calibration.

READ: TRACKING-ITERATION.md for full context.

FOCUS: Fix camera-to-ground projection (currently failing with no_ground_intersection).

KEY FILES:
- tracking-service/src/projection/ground-plane.ts
- tracking-service/tests/projection/ground-plane.test.ts
- shared/config/sitemap-rectangular-room.json (camera params)

CURRENT PROBLEM: groundIntersectionT: -1 means ray points AWAY from floor.
Check: azimuth/elevation sign conventions, coordinate system (Y-up vs Z-up).

WORKFLOW:
1. Read ground-plane.ts and understand the math
2. Run: cd tracking-service && pnpm test -- --run tests/projection/ground-plane.test.ts
3. Debug why rays don't intersect ground plane
4. Fix the projection math
5. Verify tests pass
6. Create evaluation: project ground-truth bboxes, measure error vs annotated positions

SUCCESS: Projection tests pass AND mean error < 1.0m on ground truth.

Output <promise>PROJECTION_FIXED</promise> when projection tests pass.\" --max-iterations 15 --completion-promise \"PROJECTION_FIXED\""
```

---

### Developer 2: Cross-Camera Correlation

```bash
cd ../Axis-Guardian-dev2-correlation && claude --dangerously-skip-permissions "/ralph-wiggum:ralph-loop \"You are Developer 2: Cross-Camera Correlation.

READ: TRACKING-ITERATION.md for full context.

FOCUS: Validate multi-camera position agreement using ground truth.

KEY FILES:
- tracking-service/src/correlation/hungarian-assignment.ts
- cross-camera-ground-truth-*.json (annotations with dual-camera links)

TASK:
1. Create tracking-service/src/evaluation/correlation-evaluator.ts
2. Load ground truth annotations that have linkedDetections from BOTH cameras
3. For each dual-camera annotation:
   - Project camera1 bbox to world coords
   - Project camera2 bbox to world coords
   - Measure distance between projections
   - Compare to annotated groundPosition
4. Report: % agreeing within 0.5m, 1m, 2m
5. Identify systematic biases per camera

NOTE: If projection is broken, document what you need from Dev1.

WORKFLOW:
1. Read the ground truth JSON structure
2. Write the evaluator
3. Run it and report metrics
4. Suggest threshold tuning for Hungarian assignment

Output <promise>CORRELATION_EVALUATED</promise> when evaluation complete with metrics documented.\" --max-iterations 15 --completion-promise \"CORRELATION_EVALUATED\""
```

---

### Developer 3: Track Association Quality

```bash
cd ../Axis-Guardian-dev3-tracking && claude --dangerously-skip-permissions "/ralph-wiggum:ralph-loop \"You are Developer 3: Track Association Quality.

READ: TRACKING-ITERATION.md for full context.

FOCUS: Evaluate Hungarian assignment using ground truth trajectories.

KEY FILES:
- tracking-service/src/correlation/hungarian-assignment.ts
- tracking-service/src/tracks/track-manager.ts
- cross-camera-ground-truth-*.json

TASK:
1. Create tracking-service/src/evaluation/track-evaluator.ts
2. Extract trajectories from ground truth:
   - Group annotations by trackId
   - Track 229/483 appears multiple times - verify positions form consistent path
3. Measure:
   - Fragmentation rate (global tracks per unique person)
   - ID switch rate (incorrect reassignments)
   - Correct association rate
4. Test assignment threshold sensitivity

GROUND TRUTH TRAJECTORIES:
- Track 229 (cam1) / 483 (cam2): Multiple annotations
- Track 244 (cam1): 6 annotations
- Track 493 (cam2): 5 annotations

Output <promise>TRACKING_EVALUATED</promise> when evaluation complete with metrics.\" --max-iterations 15 --completion-promise \"TRACKING_EVALUATED\""
```

---

### Developer 4: Kalman Filter Tuning

```bash
cd ../Axis-Guardian-dev4-kalman && claude --dangerously-skip-permissions "/ralph-wiggum:ralph-loop \"You are Developer 4: Kalman Filter Tuning.

READ: TRACKING-ITERATION.md for full context.

FOCUS: Motion model accuracy and prediction quality.

KEY FILES:
- tracking-service/src/filters/kalman-track-filter.ts
- tracking-service/tests/filters/kalman-track-filter.test.ts

TASK:
1. Create tracking-service/src/evaluation/motion-evaluator.ts
2. Reconstruct trajectories from ground truth (timestamps 170.87s to 181.01s)
3. For sequential annotations of same person:
   - Feed position N to Kalman filter
   - Get prediction for position N+1
   - Compare to actual position N+1
4. Calculate:
   - 1-step prediction error
   - Velocity estimation accuracy
   - Appropriate Q (process noise) for walking (~1.4 m/s)
   - Appropriate R (measurement noise) based on projection error

CURRENT MODEL: 4-state [x, y, vx, vy]
Human walking: 1.0-1.8 m/s typical

Output <promise>KALMAN_TUNED</promise> when Q/R recommendations documented with supporting data.\" --max-iterations 15 --completion-promise \"KALMAN_TUNED\""
```

---

### Developer 5: Obstacle/Occlusion Handling

```bash
cd ../Axis-Guardian-dev5-occlusion && claude --dangerously-skip-permissions "/ralph-wiggum:ralph-loop \"You are Developer 5: Obstacle/Blind Spot Handling.

READ: TRACKING-ITERATION.md for full context.

FOCUS: Track continuity through occlusions.

KEY FILES:
- tracking-service/src/geometry/obstacles.ts
- tracking-service/src/tracks/track-manager.ts
- shared/config/sitemap-rectangular-room.json (obstacle positions)

OBSTACLES:
- Pillars at (6,3), (12,3), (6,9), (12,9) - radius 0.25m
- Table at (14, 1.8) - 1.0m x 0.5m

TASK:
1. Create tracking-service/src/evaluation/occlusion-evaluator.ts
2. Map which ground truth annotations are near obstacles (<1m)
3. Analyze track behavior when person passes near pillar
4. Evaluate track timeout (5s) vs typical occlusion duration
5. Consider 'coast' mode: Use Kalman prediction during occlusion
6. Analyze camera blind spots (FOV edges)

ANNOTATIONS NEAR OBSTACLES:
- (12.69, 3.66) - near pillar at (12, 3)
- (6.52, 7.36) - near pillar at (6, 9)

Output <promise>OCCLUSION_ANALYZED</promise> when analysis complete with recommendations.\" --max-iterations 15 --completion-promise \"OCCLUSION_ANALYZED\""
```

---

## Quick Launch Script

Save as `launch-agents.sh` in the repo root:

```bash
#!/bin/bash

# Launch all 5 agents in separate tmux panes
# Requires: tmux

SESSION="ralph-tracking"

tmux new-session -d -s $SESSION -n "dev1"
tmux send-keys -t $SESSION:dev1 "cd ../Axis-Guardian-dev1-projection && claude --dangerously-skip-permissions '/ralph-wiggum:ralph-loop \"You are Developer 1: Projection/Calibration. READ: TRACKING-ITERATION.md for full context. FOCUS: Fix camera-to-ground projection (currently failing with no_ground_intersection). KEY FILES: tracking-service/src/projection/ground-plane.ts, tracking-service/tests/projection/ground-plane.test.ts, shared/config/sitemap-rectangular-room.json. CURRENT PROBLEM: groundIntersectionT: -1 means ray points AWAY from floor. Check azimuth/elevation sign conventions, coordinate system. WORKFLOW: 1. Read ground-plane.ts 2. Run tests 3. Debug ray intersection 4. Fix projection math 5. Verify tests pass. SUCCESS: Projection tests pass. Output <promise>PROJECTION_FIXED</promise> when done.\" --max-iterations 15 --completion-promise \"PROJECTION_FIXED\"'" C-m

tmux new-window -t $SESSION -n "dev2"
tmux send-keys -t $SESSION:dev2 "cd ../Axis-Guardian-dev2-correlation && claude --dangerously-skip-permissions '/ralph-wiggum:ralph-loop \"You are Developer 2: Cross-Camera Correlation. READ: TRACKING-ITERATION.md. FOCUS: Validate multi-camera position agreement. Create tracking-service/src/evaluation/correlation-evaluator.ts. Load dual-camera annotations, project both cameras, measure agreement. Report % within 0.5m/1m/2m. Output <promise>CORRELATION_EVALUATED</promise> when done.\" --max-iterations 15 --completion-promise \"CORRELATION_EVALUATED\"'" C-m

tmux new-window -t $SESSION -n "dev3"
tmux send-keys -t $SESSION:dev3 "cd ../Axis-Guardian-dev3-tracking && claude --dangerously-skip-permissions '/ralph-wiggum:ralph-loop \"You are Developer 3: Track Association Quality. READ: TRACKING-ITERATION.md. FOCUS: Evaluate Hungarian assignment using ground truth. Create tracking-service/src/evaluation/track-evaluator.ts. Measure fragmentation rate, ID switches. Output <promise>TRACKING_EVALUATED</promise> when done.\" --max-iterations 15 --completion-promise \"TRACKING_EVALUATED\"'" C-m

tmux new-window -t $SESSION -n "dev4"
tmux send-keys -t $SESSION:dev4 "cd ../Axis-Guardian-dev4-kalman && claude --dangerously-skip-permissions '/ralph-wiggum:ralph-loop \"You are Developer 4: Kalman Filter Tuning. READ: TRACKING-ITERATION.md. FOCUS: Motion model accuracy. Create tracking-service/src/evaluation/motion-evaluator.ts. Calculate prediction error, recommend Q/R values. Output <promise>KALMAN_TUNED</promise> when done.\" --max-iterations 15 --completion-promise \"KALMAN_TUNED\"'" C-m

tmux new-window -t $SESSION -n "dev5"
tmux send-keys -t $SESSION:dev5 "cd ../Axis-Guardian-dev5-occlusion && claude --dangerously-skip-permissions '/ralph-wiggum:ralph-loop \"You are Developer 5: Obstacle/Occlusion Handling. READ: TRACKING-ITERATION.md. FOCUS: Track continuity through occlusions. Create tracking-service/src/evaluation/occlusion-evaluator.ts. Analyze near-obstacle annotations, recommend timeout values. Output <promise>OCCLUSION_ANALYZED</promise> when done.\" --max-iterations 15 --completion-promise \"OCCLUSION_ANALYZED\"'" C-m

tmux attach -t $SESSION
```

Usage:
```bash
chmod +x launch-agents.sh
./launch-agents.sh
```

Navigate tmux windows: `Ctrl+B` then `0-4` or `n`/`p` for next/previous.

---

## Monitoring Progress

Check each worktree's git status:
```bash
for dir in dev1-projection dev2-correlation dev3-tracking dev4-kalman dev5-occlusion; do
  echo "=== $dir ==="
  git -C ../Axis-Guardian-$dir status --short
  git -C ../Axis-Guardian-$dir log --oneline -3
  echo
done
```

---

## Merging Results

After agents complete:

```bash
# Return to main worktree
cd /home/nilwi971/projects/Axis-Guardian

# Review each branch
git log --oneline dev1/projection-fix
git log --oneline dev2/correlation-threshold
# ... etc

# Merge in order (projection first since it's foundational)
git merge dev1/projection-fix -m "Merge projection fixes from Dev1"
git merge dev2/correlation-threshold -m "Merge correlation evaluation from Dev2"
git merge dev3/track-association -m "Merge track evaluation from Dev3"
git merge dev4/kalman-tuning -m "Merge Kalman tuning from Dev4"
git merge dev5/occlusion-handling -m "Merge occlusion analysis from Dev5"
```

---

## Cleanup

Remove worktrees when done:
```bash
git worktree remove ../Axis-Guardian-dev1-projection
git worktree remove ../Axis-Guardian-dev2-correlation
git worktree remove ../Axis-Guardian-dev3-tracking
git worktree remove ../Axis-Guardian-dev4-kalman
git worktree remove ../Axis-Guardian-dev5-occlusion

# Clean up stale references
git worktree prune

# Delete feature branches if merged
git branch -d dev1/projection-fix dev2/correlation-threshold dev3/track-association dev4/kalman-tuning dev5/occlusion-handling
```
