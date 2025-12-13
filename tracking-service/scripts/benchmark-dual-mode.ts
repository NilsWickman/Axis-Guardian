#!/usr/bin/env npx tsx
/**
 * Benchmark: Dual Tracking Mode Comparison
 *
 * Compares Spatial-only vs Re-ID tracking modes over a time period.
 *
 * Usage:
 *   npx tsx scripts/benchmark-dual-mode.ts [duration_seconds]
 */

const TRACKING_SERVICE_URL = 'http://localhost:3010'
const DEFAULT_DURATION_SEC = 30

interface DualTracksResponse {
  dualModeEnabled: boolean
  spatial: {
    activeCount: number
    totalCreated: number
    trackIds: string[]
  }
  reid: {
    activeCount: number
    totalCreated: number
    trackIds: string[]
  }
  comparison: {
    sameActiveCount: boolean
    sameTotalCreated: boolean
  }
}

interface MetricsResponse {
  handoff: {
    totalHandoffAttempts: number
    successfulHandoffs: number
    failedHandoffs: number
    avgHandoffLatencyMs: number
    avgHandoffDistanceM: number
    handoffSuccessRate: number
  }
  merger: {
    totalMergeCandidatesFound: number
    mergesExecuted: number
    mergesRejected: number
    avgMergeConfidence: number
    crossCameraMerges: number
    sameCameraMerges: number
    avgTimeToMergeMs: number
  }
  clustering: {
    totalClustersCreated: number
    singleDetectionClusters: number
    multiCameraClusters: number
    avgClusterSize: number
    clusteringDistance: { min: number; max: number; avg: number }
  }
  lifecycle: {
    avgTimeToConfirmMs: number
    avgTrackDurationMs: number
    avgOcclusionDurationMs: number
    occlusionRecoveryRate: number
    ghostTrackRate: number
    totalTracksCreated: number
    totalTracksConfirmed: number
    totalTracksExpired: number
  }
  performance: {
    processingLatency: { avg: number; p50: number; p95: number; p99: number; min: number; max: number }
    avgHungarianTimeMs: number
    avgKalmanUpdateTimeMs: number
    detectionsPerSecond: number
    tracksPerCamera: Record<string, number>
    totalDetectionsProcessed: number
  }
  diagnostic: {
    exclusionZoneBlocks: number
    velocitySanityRejects: number
    crossCameraExclusionBlocks: number
    costMatrixStats: { avgCost: number; minCost: number; maxCost: number }
    assignmentGateRejects: number
    projectionFailures: number
  }
  timestamp: number
  uptimeMs: number
}

interface BenchmarkSample {
  timestamp: number
  spatial: { activeCount: number; totalCreated: number; trackIds: string[] }
  reid: { activeCount: number; totalCreated: number; trackIds: string[] }
  trackIdDivergence: number  // Number of different track IDs between modes
}

async function fetchJSON<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }
  return response.json() as Promise<T>
}

async function resetMetrics(): Promise<void> {
  try {
    await fetch(`${TRACKING_SERVICE_URL}/api/metrics/reset`, { method: 'POST' })
    console.log('Metrics reset')
  } catch {
    console.log('Could not reset metrics (may be in read-only mode)')
  }
}

async function collectSample(): Promise<BenchmarkSample | null> {
  try {
    const dualTracks = await fetchJSON<DualTracksResponse>(`${TRACKING_SERVICE_URL}/api/dual-tracks`)

    if (!dualTracks.dualModeEnabled) {
      console.error('Dual mode is not enabled!')
      return null
    }

    // Calculate track ID divergence
    const spatialIds = new Set(dualTracks.spatial.trackIds)
    const reidIds = new Set(dualTracks.reid.trackIds)

    // IDs in spatial but not in reid
    const spatialOnly = dualTracks.spatial.trackIds.filter(id => !reidIds.has(id))
    // IDs in reid but not in spatial
    const reidOnly = dualTracks.reid.trackIds.filter(id => !spatialIds.has(id))

    return {
      timestamp: Date.now(),
      spatial: dualTracks.spatial,
      reid: dualTracks.reid,
      trackIdDivergence: spatialOnly.length + reidOnly.length,
    }
  } catch (error) {
    console.error('Failed to collect sample:', error)
    return null
  }
}

async function runBenchmark(durationSec: number): Promise<void> {
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('          DUAL TRACKING MODE BENCHMARK')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log(`Duration: ${durationSec} seconds`)
  console.log('')

  // Reset metrics at start
  await resetMetrics()

  // Collect initial state
  const startMetrics = await fetchJSON<MetricsResponse>(`${TRACKING_SERVICE_URL}/api/metrics`)
  const startDual = await fetchJSON<DualTracksResponse>(`${TRACKING_SERVICE_URL}/api/dual-tracks`)

  if (!startDual.dualModeEnabled) {
    console.error('ERROR: Dual mode is not enabled. Run tracking service with --dual-mode')
    process.exit(1)
  }

  console.log('Initial State:')
  console.log(`  Spatial: ${startDual.spatial.activeCount} active, ${startDual.spatial.totalCreated} total`)
  console.log(`  Re-ID:   ${startDual.reid.activeCount} active, ${startDual.reid.totalCreated} total`)
  console.log('')

  // Collect samples over time
  const samples: BenchmarkSample[] = []
  const sampleIntervalMs = 1000  // Sample every second
  const endTime = Date.now() + durationSec * 1000

  console.log('Collecting samples...')
  let maxDivergence = 0
  let divergenceEvents = 0

  while (Date.now() < endTime) {
    const sample = await collectSample()
    if (sample) {
      samples.push(sample)
      if (sample.trackIdDivergence > 0) {
        divergenceEvents++
        maxDivergence = Math.max(maxDivergence, sample.trackIdDivergence)
        process.stdout.write(`\r  Samples: ${samples.length} | Divergence events: ${divergenceEvents} | Max divergence: ${maxDivergence}  `)
      } else {
        process.stdout.write(`\r  Samples: ${samples.length} | Tracks: S=${sample.spatial.activeCount} R=${sample.reid.activeCount}       `)
      }
    }
    await new Promise(resolve => setTimeout(resolve, sampleIntervalMs))
  }

  console.log('\n')

  // Collect final state
  const endMetrics = await fetchJSON<MetricsResponse>(`${TRACKING_SERVICE_URL}/api/metrics`)
  const endDual = await fetchJSON<DualTracksResponse>(`${TRACKING_SERVICE_URL}/api/dual-tracks`)

  // Calculate statistics
  const totalSamples = samples.length
  const avgSpatialActive = samples.reduce((sum, s) => sum + s.spatial.activeCount, 0) / totalSamples
  const avgReidActive = samples.reduce((sum, s) => sum + s.reid.activeCount, 0) / totalSamples
  const avgDivergence = samples.reduce((sum, s) => sum + s.trackIdDivergence, 0) / totalSamples

  // Track creation difference
  const spatialCreatedDelta = endDual.spatial.totalCreated - startDual.spatial.totalCreated
  const reidCreatedDelta = endDual.reid.totalCreated - startDual.reid.totalCreated

  // Metrics delta
  const detectionsProcessed = endMetrics.performance.totalDetectionsProcessed - startMetrics.performance.totalDetectionsProcessed
  const handoffAttempts = endMetrics.handoff.totalHandoffAttempts - startMetrics.handoff.totalHandoffAttempts
  const successfulHandoffs = endMetrics.handoff.successfulHandoffs - startMetrics.handoff.successfulHandoffs
  const mergesExecuted = endMetrics.merger.mergesExecuted - startMetrics.merger.mergesExecuted
  const occlusionsStarted = (endMetrics.lifecycle as any).occlusionsStarted ?? 0

  // Print report
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('                      BENCHMARK RESULTS')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('')

  console.log('┌─────────────────────────────────────────────────────────────┐')
  console.log('│                    TRACK COMPARISON                         │')
  console.log('├─────────────────────────────────────────────────────────────┤')
  console.log(`│  Metric                    │  Spatial-Only  │  Re-ID Mode  │`)
  console.log('├────────────────────────────┼────────────────┼──────────────┤')
  console.log(`│  Tracks Created (delta)    │  ${String(spatialCreatedDelta).padStart(12)}  │  ${String(reidCreatedDelta).padStart(10)}  │`)
  console.log(`│  Final Active Tracks       │  ${String(endDual.spatial.activeCount).padStart(12)}  │  ${String(endDual.reid.activeCount).padStart(10)}  │`)
  console.log(`│  Avg Active Tracks         │  ${avgSpatialActive.toFixed(2).padStart(12)}  │  ${avgReidActive.toFixed(2).padStart(10)}  │`)
  console.log('└────────────────────────────┴────────────────┴──────────────┘')
  console.log('')

  console.log('┌─────────────────────────────────────────────────────────────┐')
  console.log('│                    DIVERGENCE ANALYSIS                      │')
  console.log('├─────────────────────────────────────────────────────────────┤')
  console.log(`│  Total Samples Collected:          ${String(totalSamples).padStart(20)}  │`)
  console.log(`│  Samples with Divergence:          ${String(divergenceEvents).padStart(20)}  │`)
  console.log(`│  Divergence Rate:                  ${(divergenceEvents / totalSamples * 100).toFixed(1).padStart(18)}%  │`)
  console.log(`│  Max Track ID Divergence:          ${String(maxDivergence).padStart(20)}  │`)
  console.log(`│  Avg Track ID Divergence:          ${avgDivergence.toFixed(3).padStart(20)}  │`)
  console.log('└─────────────────────────────────────────────────────────────┘')
  console.log('')

  console.log('┌─────────────────────────────────────────────────────────────┐')
  console.log('│                    SHARED METRICS                           │')
  console.log('├─────────────────────────────────────────────────────────────┤')
  console.log(`│  Detections Processed:             ${String(detectionsProcessed).padStart(20)}  │`)
  console.log(`│  Detections/Second:                ${endMetrics.performance.detectionsPerSecond.toFixed(1).padStart(20)}  │`)
  console.log(`│  Handoff Attempts:                 ${String(handoffAttempts).padStart(20)}  │`)
  console.log(`│  Successful Handoffs:              ${String(successfulHandoffs).padStart(20)}  │`)
  console.log(`│  Handoff Success Rate:             ${(endMetrics.handoff.handoffSuccessRate * 100).toFixed(1).padStart(18)}%  │`)
  console.log(`│  Merges Executed:                  ${String(mergesExecuted).padStart(20)}  │`)
  console.log(`│  Occlusion Recovery Rate:          ${(endMetrics.lifecycle.occlusionRecoveryRate * 100).toFixed(1).padStart(18)}%  │`)
  console.log('└─────────────────────────────────────────────────────────────┘')
  console.log('')

  console.log('┌─────────────────────────────────────────────────────────────┐')
  console.log('│                    PERFORMANCE                              │')
  console.log('├─────────────────────────────────────────────────────────────┤')
  console.log(`│  Avg Processing Latency:           ${endMetrics.performance.processingLatency.avg.toFixed(3).padStart(17)} ms  │`)
  console.log(`│  P95 Processing Latency:           ${endMetrics.performance.processingLatency.p95.toFixed(3).padStart(17)} ms  │`)
  console.log(`│  P99 Processing Latency:           ${endMetrics.performance.processingLatency.p99.toFixed(3).padStart(17)} ms  │`)
  console.log('└─────────────────────────────────────────────────────────────┘')
  console.log('')

  console.log('┌─────────────────────────────────────────────────────────────┐')
  console.log('│                    LIFECYCLE                                │')
  console.log('├─────────────────────────────────────────────────────────────┤')
  console.log(`│  Tracks Created (total):           ${String(endMetrics.lifecycle.totalTracksCreated).padStart(20)}  │`)
  console.log(`│  Tracks Confirmed:                 ${String(endMetrics.lifecycle.totalTracksConfirmed).padStart(20)}  │`)
  console.log(`│  Tracks Expired:                   ${String(endMetrics.lifecycle.totalTracksExpired).padStart(20)}  │`)
  console.log(`│  Ghost Track Rate:                 ${(endMetrics.lifecycle.ghostTrackRate * 100).toFixed(1).padStart(18)}%  │`)
  console.log(`│  Avg Time to Confirm:              ${endMetrics.lifecycle.avgTimeToConfirmMs.toFixed(0).padStart(17)} ms  │`)
  console.log(`│  Avg Track Duration:               ${(endMetrics.lifecycle.avgTrackDurationMs / 1000).toFixed(1).padStart(18)} s  │`)
  console.log(`│  Avg Occlusion Duration:           ${(endMetrics.lifecycle.avgOcclusionDurationMs / 1000).toFixed(1).padStart(18)} s  │`)
  console.log('└─────────────────────────────────────────────────────────────┘')
  console.log('')

  console.log('┌─────────────────────────────────────────────────────────────┐')
  console.log('│                    DIAGNOSTIC                               │')
  console.log('├─────────────────────────────────────────────────────────────┤')
  console.log(`│  Exclusion Zone Blocks:            ${String(endMetrics.diagnostic.exclusionZoneBlocks).padStart(20)}  │`)
  console.log(`│  Velocity Sanity Rejects:          ${String(endMetrics.diagnostic.velocitySanityRejects).padStart(20)}  │`)
  console.log(`│  Cross-Camera Exclusion Blocks:    ${String(endMetrics.diagnostic.crossCameraExclusionBlocks).padStart(20)}  │`)
  console.log(`│  Assignment Gate Rejects:          ${String(endMetrics.diagnostic.assignmentGateRejects).padStart(20)}  │`)
  console.log(`│  Projection Failures:              ${String(endMetrics.diagnostic.projectionFailures).padStart(20)}  │`)
  console.log('└─────────────────────────────────────────────────────────────┘')
  console.log('')

  // Summary
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('                         SUMMARY')
  console.log('═══════════════════════════════════════════════════════════════')

  if (spatialCreatedDelta !== reidCreatedDelta) {
    console.log(`✓ DIVERGENCE DETECTED: Spatial created ${spatialCreatedDelta} tracks, Re-ID created ${reidCreatedDelta}`)
    if (reidCreatedDelta < spatialCreatedDelta) {
      console.log(`  → Re-ID mode created ${spatialCreatedDelta - reidCreatedDelta} fewer tracks (better identity preservation)`)
    } else {
      console.log(`  → Spatial mode created ${reidCreatedDelta - spatialCreatedDelta} fewer tracks`)
    }
  } else {
    console.log('○ No track creation divergence during this period')
    console.log('  This may occur if:')
    console.log('  - No occlusions or crossings happened')
    console.log('  - The video segment had simple motion patterns')
    console.log('  - Both algorithms made the same assignment decisions')
  }

  if (divergenceEvents > 0) {
    console.log(`✓ Track ID divergence detected in ${divergenceEvents}/${totalSamples} samples (${(divergenceEvents/totalSamples*100).toFixed(1)}%)`)
  }

  console.log('')
  console.log('═══════════════════════════════════════════════════════════════')
}

// Main
const duration = parseInt(process.argv[2] || String(DEFAULT_DURATION_SEC), 10)
runBenchmark(duration).catch(console.error)
