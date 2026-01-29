# Development Patterns Analysis

> Analysis of git history patterns and development workflow issues

## Summary Statistics

| Metric | Value |
|--------|-------|
| Total commits | 129 |
| Contributors | 2 (NilsWickman: 124, Claude: 5) |
| Recent focus | Algorithm tuning, ground truth pipeline |

---

## 1. Algorithm Churn Pattern (Concerning)

### Evidence

11 commits in recent history with "algorithm" or "optimization" in message:

```
c3d5aa0 Algorithm optimization
e272b18 Algorithm optimization
3a0ff1c Algorithm optimization
59f74a2 Algorithm optimization, focus on long lived tracks
1e9671b reID only and optimization
ea8018c Algortihm optimization (typo)
de1c1ee Tracking optimization
4a468ea Algortihm optimizaiton (two typos)
336d663 Algorithm improvements
1cddc6f Tracking optimization
9427d2a Cleanup and optimization
```

### Analysis

This pattern suggests:
- Algorithm design is not stabilizing
- Changes made iteratively without clear metrics guiding decisions
- `algorithm-constants.ts` being tweaked frequently without documented rationale

### Recommendation

1. Define acceptance criteria before making changes
2. Document WHY each constant has its value
3. Run metrics (MOTA/MOTP/IDF1) before and after changes
4. Commit message should include metric improvement: "Optimization: MOTA 0.65→0.72"

---

## 2. Large Deletion Events (Major Cleanups)

### Commit `72c91d8` - "Camera positions calibrated, removed old tests"

Deleted 70+ files including:
- `optimize-v2.ts`, `optimize-v3.ts`, `optimize-v4.ts`, `optimize-v5.ts`
- `analyze-failures.ts`, `analyze-outliers.ts`, `analyze-spatial.ts`
- `debug-merge.ts`, `krt-debug.ts`, `krt-debug2.ts`
- Multiple test files

**Indicates:** Heavy experimentation with calibration, multiple approaches tried

### Commit `d8f912f` - "New ground truths pipeline"

- 72 files changed
- +9,807 lines / -18,824 lines
- Deleted entire test suites:
  - `mot-challenge-metrics.test.ts`
  - `physics-validation.test.ts`
  - `tracking-quality-metrics.test.ts`
- Replaced annotation tools

**Indicates:** Ground truth system rewritten from scratch

---

## 3. Commit Message Quality Issues

### Problematic Messages

| Commit | Message | Issue |
|--------|---------|-------|
| `edaaa45` | "asdsa" | Meaningless |
| `3c98d76` | "Oh mama" | Non-descriptive |
| `360d34f` | "fix" | Too vague |
| `618ed31` | "fixes" | Too vague |
| `644329c` | "fixes" | Too vague |
| `e448cb2` | "TMP restart" | Unclear purpose |

### Typos

| Commit | Message | Typo |
|--------|---------|------|
| `4a468ea` | "Algortihm optimizaiton" | Two typos |
| `ea8018c` | "Algortihm optimization" | One typo |
| `88b8e54` | "Build changes for deploymend" | One typo |

### Recommendation

Use conventional commit format:
```
<type>(<scope>): <description>

[optional body]

[optional metrics]
```

Examples:
- `feat(tracking): add occlusion handling for pillar shadows`
- `fix(kalman): correct velocity damping during coasting`
- `perf(hungarian): optimize cost matrix construction - MOTA +0.03`

---

## 4. No Reverts Found

Zero revert commits in history, despite significant churn.

**Interpretation:**
- Changes accumulated forward rather than rolled back
- Large cleanup commits used instead of reverts
- May indicate hesitancy to admit mistakes

**Recommendation:**
- Use reverts for clearly broken changes
- Don't batch multiple reversions into large cleanup commits

---

## 5. Areas of Frequent Modification

### Core Tracking Files (20+ commits each)

| File | Touches | Concern |
|------|---------|---------|
| `backend/src/tracks/track-manager.ts` | 20+ | God class, hard to isolate changes |
| `backend/src/detection/detection-processor.ts` | 20+ | Complex logic, needs refactoring |
| `backend/src/config/algorithm-constants.ts` | 15+ | Frequent tuning without documented rationale |

### Current Uncommitted Changes

60+ modified/deleted files in working directory, suggesting another major refactoring in progress.

---

## 6. Positive Patterns

### Recent Structural Improvements

```
1b27a15 Naming standardization
4109830 Recording Feature, License, Cleanup
dce6c14 Websocket nginx security, reduced logging, consolidated views
```

### Active Documentation

CLAUDE.md shows regular maintenance and updates.

---

## 7. Development Workflow Recommendations

### Establish Test Baseline

1. Create "golden" tests that should never be deleted without explicit approval
2. Run MOT metrics on reference dataset before/after changes
3. Block merges that decrease metrics without justification

### Improve Commit Discipline

1. Use conventional commit format
2. Include metric changes in commit message
3. Avoid committing experimental code to main branch

### Consider Feature Branches

Large cleanup commits suggest work done directly on development branch.

**Recommended workflow:**
```
main ←── development ←── feature/kalman-improvements
                    ←── feature/reid-integration
                    ←── experiment/gnn-assignment (can be deleted)
```

### Document Algorithm Rationale

For each constant in `algorithm-constants.ts`, add:
```typescript
/**
 * Maximum distance for valid detection-to-track assignment
 *
 * Rationale: Average walking speed is 1.4 m/s. At 10 FPS, maximum
 * displacement per frame is 0.14m. With prediction error margin,
 * 1.5m allows for ~10 frames of coasting.
 *
 * Tuning history:
 * - 2024-01: 2.0m (too permissive, caused ID switches)
 * - 2024-02: 1.0m (too strict, caused fragmentation)
 * - 2024-03: 1.5m (current, MOTA 0.72)
 */
correlationDistanceM: 1.5,
```

---

## 8. Technical Debt Indicators

| Indicator | Evidence | Severity |
|-----------|----------|----------|
| Multiple experimental versions | `optimize-v2/v3/v4/v5` deleted | High |
| Debug code in main branch | `krt-debug.ts`, `debug-merge.ts` deleted | Medium |
| Test deletion | Multiple test files removed | High |
| Typos in commits | 3 commits with typos | Low |
| Vague commit messages | 6 non-descriptive commits | Medium |

---

## 9. Metrics to Track Going Forward

### Code Quality
- [ ] Lines per file (target: < 500)
- [ ] Cyclomatic complexity (target: < 15 per function)
- [ ] Test coverage (target: > 70%)

### MOT Performance
- [ ] MOTA on reference dataset
- [ ] MOTP on reference dataset
- [ ] IDF1 on reference dataset
- [ ] ID switches per minute

### Development Velocity
- [ ] Features completed per sprint
- [ ] Bug fix time
- [ ] Time to onboard new developer
