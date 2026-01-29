/**
 * MOT Metrics Calculator
 *
 * Computes standard MOT Challenge metrics from frame-level matching results.
 * Follows the definitions from:
 * - MOT Challenge: https://motchallenge.net/results/MOT17/
 * - CLEAR MOT: https://cvhci.anthropomatik.kit.edu/~stiefel/papers/ECCV2006WorkshopCameraReady.pdf
 */

import type {
  MOTMetrics,
  PersonTrackingStats,
  GroundTruthEvaluationResult,
  FrameMatchResult,
  CameraReprojectionStats,
  GroundTruthPerson,
} from '../types/ground-truth.js'
import type { TrackMatcherState } from './track-matcher.js'

// ============================================================================
// MOT Metrics Computation
// ============================================================================

/**
 * Aggregate frame-level results into MOT metrics
 *
 * Standard CLEAR MOT metrics:
 * - MOTA = 1 - (FN + FP + IDSW) / GT_count
 * - MOTP = sum(match_distances) / match_count
 *
 * Extended metrics:
 * - IDF1 = 2 * IDTP / (2 * IDTP + IDFP + IDFN)
 * - MT/PT/ML = trajectory tracking ratios
 */
export function computeMOTMetrics(frameResults: FrameMatchResult[]): MOTMetrics {
  // Aggregate across all frames
  let totalGT = 0
  let truePositives = 0
  let falseNegatives = 0
  let falsePositives = 0
  let idSwitches = 0
  let totalMatchDistance = 0

  for (const frame of frameResults) {
    totalGT += frame.stats.gtCount
    truePositives += frame.stats.matchCount
    falseNegatives += frame.stats.fnCount
    falsePositives += frame.stats.fpCount
    idSwitches += frame.stats.idSwitchCount
    totalMatchDistance += frame.stats.avgMatchDistance * frame.stats.matchCount
  }

  // Compute metrics
  const MOTA = totalGT > 0 ? 1 - (falseNegatives + falsePositives + idSwitches) / totalGT : 0

  const MOTP = truePositives > 0 ? totalMatchDistance / truePositives : 0

  const recall = totalGT > 0 ? truePositives / totalGT : 0
  const precision =
    truePositives + falsePositives > 0 ? truePositives / (truePositives + falsePositives) : 0
  const f1Score = precision + recall > 0 ? (2 * (precision * recall)) / (precision + recall) : 0

  // Compute fragmentation from ID switches (approximation)
  // True fragmentation requires tracking person-specific gaps
  const fragmentations = idSwitches

  return {
    MOTA,
    MOTP,
    totalGT,
    truePositives,
    falseNegatives,
    falsePositives,
    idSwitches,
    fragmentations,
    recall,
    precision,
    f1Score,
  }
}

/**
 * Compute MOT metrics with fragmentation from state
 */
export function computeMOTMetricsWithState(
  frameResults: FrameMatchResult[],
  state: TrackMatcherState
): MOTMetrics {
  const baseMetrics = computeMOTMetrics(frameResults)

  // Get actual fragmentation count from state
  baseMetrics.fragmentations = state.getTotalFragmentations()

  return baseMetrics
}

/**
 * Compute extended MOT Challenge metrics including IDF1 and MT/PT/ML
 *
 * IDF1: Identity F1 score - measures how well identities are preserved
 * MT (Mostly Tracked): GT trajectories tracked >= 80% of lifetime
 * PT (Partially Tracked): GT trajectories tracked 20-80% of lifetime
 * ML (Mostly Lost): GT trajectories tracked < 20% of lifetime
 */
export function computeExtendedMOTMetrics(
  frameResults: FrameMatchResult[],
  state: TrackMatcherState,
  persons: Map<number, GroundTruthPerson>
): MOTMetrics {
  const baseMetrics = computeMOTMetricsWithState(frameResults, state)

  // Compute per-person tracking ratios for MT/PT/ML
  const personStats = computePersonStats(frameResults, persons, state)

  let mostlyTracked = 0
  let partiallyTracked = 0
  let mostlyLost = 0
  const totalGTIdentities = personStats.filter((s) => s.totalAnnotations > 0).length

  for (const stats of personStats) {
    if (stats.totalAnnotations === 0) continue

    const trackRatio = stats.matchedAnnotations / stats.totalAnnotations

    if (trackRatio >= 0.8) {
      mostlyTracked++
    } else if (trackRatio >= 0.2) {
      partiallyTracked++
    } else {
      mostlyLost++
    }
  }

  // Compute IDF1 (Identity F1)
  // IDF1 = 2 * IDTP / (2 * IDTP + IDFP + IDFN)
  //
  // For simplicity, we approximate:
  // - IDTP = matches where the correct identity is assigned (TP - ID switches)
  // - IDFP = FP + extra tracks for same person (ID switches contribute here)
  // - IDFN = FN + missed identifications due to ID switches
  //
  // A more precise IDF1 requires tracking identity associations across the entire
  // sequence, which is complex. This approximation gives a reasonable estimate.
  const idtp = Math.max(0, baseMetrics.truePositives - baseMetrics.idSwitches)
  const idfp = baseMetrics.falsePositives + baseMetrics.idSwitches
  const idfn = baseMetrics.falseNegatives + baseMetrics.idSwitches

  const idf1 =
    2 * idtp + idfp + idfn > 0 ? (2 * idtp) / (2 * idtp + idfp + idfn) : 0

  // Add extended metrics
  baseMetrics.idf1 = idf1
  baseMetrics.idtp = idtp
  baseMetrics.idfp = idfp
  baseMetrics.idfn = idfn
  baseMetrics.mostlyTracked = mostlyTracked
  baseMetrics.partiallyTracked = partiallyTracked
  baseMetrics.mostlyLost = mostlyLost
  baseMetrics.totalGTIdentities = totalGTIdentities

  return baseMetrics
}

// ============================================================================
// Per-Person Statistics
// ============================================================================

/**
 * Compute per-person tracking statistics
 */
export function computePersonStats(
  frameResults: FrameMatchResult[],
  persons: Map<number, GroundTruthPerson>,
  state: TrackMatcherState
): PersonTrackingStats[] {
  const statsMap = new Map<
    number,
    {
      annotations: number
      matched: number
      missed: number
      positionErrors: number[]
      idSwitchCount: number
    }
  >()

  // Aggregate per-person stats from frame results
  for (const frame of frameResults) {
    for (const match of frame.matches) {
      const personId = match.annotation.personId
      let stats = statsMap.get(personId)
      if (!stats) {
        stats = {
          annotations: 0,
          matched: 0,
          missed: 0,
          positionErrors: [],
          idSwitchCount: 0,
        }
        statsMap.set(personId, stats)
      }

      stats.annotations++
      if (match.matchedTrackId !== null) {
        stats.matched++
        if (match.matchDistance !== null) {
          stats.positionErrors.push(match.matchDistance)
        }
      } else {
        stats.missed++
      }
      if (match.isIdSwitch) {
        stats.idSwitchCount++
      }
    }
  }

  // Convert to output format
  return Array.from(statsMap.entries())
    .map(([personId, stats]) => {
      const person = persons.get(personId)
      const trackIds = state.getTrackIdsForPerson(personId)
      const fragmentCount = state.countFragmentations(personId)

      return {
        personId,
        label: person?.label ?? `Person ${personId}`,
        totalAnnotations: stats.annotations,
        matchedAnnotations: stats.matched,
        missedAnnotations: stats.missed,
        trackIds,
        idSwitchCount: stats.idSwitchCount,
        fragmentCount,
        avgPositionError:
          stats.positionErrors.length > 0
            ? stats.positionErrors.reduce((a, b) => a + b, 0) / stats.positionErrors.length
            : 0,
      }
    })
    .sort((a, b) => a.personId - b.personId)
}

// ============================================================================
// Complete Evaluation Result
// ============================================================================

/**
 * Compile complete evaluation result
 */
export function compileEvaluationResult(
  frameResults: FrameMatchResult[],
  persons: Map<number, GroundTruthPerson>,
  state: TrackMatcherState,
  config: { matchDistanceThreshold: number; keyframeInterval: number },
  datasetVersion: string,
  cameraStats?: CameraReprojectionStats[]
): GroundTruthEvaluationResult {
  return {
    datasetVersion,
    evaluatedAt: new Date().toISOString(),
    keyframesEvaluated: frameResults.length,
    mot: computeMOTMetricsWithState(frameResults, state),
    cameraStats,
    personStats: computePersonStats(frameResults, persons, state),
    config,
  }
}

// ============================================================================
// Output Formatting
// ============================================================================

/**
 * Format MOT metrics for console output
 */
export function formatMOTMetrics(metrics: MOTMetrics): string {
  const lines: string[] = []

  lines.push('=== MOT Metrics (CLEAR MOT) ===')
  lines.push(`MOTA:        ${(metrics.MOTA * 100).toFixed(1)}%`)
  lines.push(`MOTP:        ${metrics.MOTP.toFixed(3)}m`)
  lines.push('')
  lines.push(`Recall:      ${(metrics.recall * 100).toFixed(1)}%`)
  lines.push(`Precision:   ${(metrics.precision * 100).toFixed(1)}%`)
  lines.push(`F1 Score:    ${(metrics.f1Score * 100).toFixed(1)}%`)

  // Add IDF1 if computed
  if (metrics.idf1 !== undefined) {
    lines.push(`IDF1:        ${(metrics.idf1 * 100).toFixed(1)}%`)
  }

  lines.push('')
  lines.push(`Total GT:    ${metrics.totalGT}`)
  lines.push(`True Pos:    ${metrics.truePositives}`)
  lines.push(`False Neg:   ${metrics.falseNegatives}`)
  lines.push(`False Pos:   ${metrics.falsePositives}`)
  lines.push(`ID Switches: ${metrics.idSwitches}`)
  lines.push(`Fragments:   ${metrics.fragmentations}`)

  // Add MT/PT/ML if computed
  if (metrics.totalGTIdentities !== undefined) {
    lines.push('')
    lines.push('=== Trajectory Tracking ===')
    lines.push(`GT Identities: ${metrics.totalGTIdentities}`)
    lines.push(`Mostly Tracked (>=80%):  ${metrics.mostlyTracked ?? 0}`)
    lines.push(`Partially Tracked:       ${metrics.partiallyTracked ?? 0}`)
    lines.push(`Mostly Lost (<20%):      ${metrics.mostlyLost ?? 0}`)
  }

  return lines.join('\n')
}

/**
 * Format per-person stats for console output
 */
export function formatPersonStats(stats: PersonTrackingStats[]): string {
  const lines: string[] = []

  lines.push('=== Per-Person Tracking Stats ===')
  lines.push(
    'Person       | Total | Matched | Missed | Tracks | IDsw | Frags | Avg Err'
  )
  lines.push(
    '-------------|-------|---------|--------|--------|------|-------|--------'
  )

  for (const s of stats) {
    if (s.totalAnnotations === 0) continue

    const label = s.label.padEnd(12).slice(0, 12)
    const total = String(s.totalAnnotations).padStart(5)
    const matched = String(s.matchedAnnotations).padStart(7)
    const missed = String(s.missedAnnotations).padStart(6)
    const tracks = String(s.trackIds.length).padStart(6)
    const idsw = String(s.idSwitchCount).padStart(4)
    const frags = String(s.fragmentCount).padStart(5)
    const avgErr =
      s.avgPositionError > 0 ? `${s.avgPositionError.toFixed(2)}m`.padStart(6) : '   N/A'

    lines.push(`${label} | ${total} | ${matched} | ${missed} | ${tracks} | ${idsw} | ${frags} | ${avgErr}`)
  }

  return lines.join('\n')
}

/**
 * Print complete evaluation summary
 */
export function printEvaluationSummary(result: GroundTruthEvaluationResult): void {
  console.log('\n' + '='.repeat(60))
  console.log('GROUND TRUTH EVALUATION RESULTS')
  console.log('='.repeat(60))
  console.log(`Dataset Version: ${result.datasetVersion}`)
  console.log(`Evaluated At: ${result.evaluatedAt}`)
  console.log(`Keyframes Evaluated: ${result.keyframesEvaluated}`)
  console.log(`Match Threshold: ${result.config.matchDistanceThreshold}m`)
  console.log('')

  console.log(formatMOTMetrics(result.mot))
  console.log('')

  if (result.cameraStats && result.cameraStats.length > 0) {
    console.log('=== Camera Reprojection Stats ===')
    for (const cam of result.cameraStats) {
      console.log(
        `  ${cam.cameraId}: mean=${cam.meanError.toFixed(2)}m, ` +
          `median=${cam.medianError.toFixed(2)}m, max=${cam.maxError.toFixed(2)}m ` +
          `(${cam.sampleCount} samples)`
      )
    }
    console.log('')
  }

  console.log(formatPersonStats(result.personStats))
  console.log('='.repeat(60))
}

/**
 * Get summary statistics as single line
 */
export function getSummaryLine(metrics: MOTMetrics): string {
  return (
    `MOTA=${(metrics.MOTA * 100).toFixed(1)}% ` +
    `MOTP=${metrics.MOTP.toFixed(2)}m ` +
    `Recall=${(metrics.recall * 100).toFixed(1)}% ` +
    `Prec=${(metrics.precision * 100).toFixed(1)}% ` +
    `IDsw=${metrics.idSwitches}`
  )
}
