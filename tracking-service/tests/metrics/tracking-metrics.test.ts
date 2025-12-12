/**
 * Tests for TrackingMetrics module
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { MetricsCollector, getMetrics } from '../../src/metrics/tracking-metrics.js'

describe('MetricsCollector', () => {
  beforeEach(() => {
    // Reset the singleton for each test
    MetricsCollector.resetInstance()
  })

  describe('Singleton behavior', () => {
    it('returns the same instance on multiple calls', () => {
      const instance1 = MetricsCollector.getInstance()
      const instance2 = MetricsCollector.getInstance()
      expect(instance1).toBe(instance2)
    })

    it('getMetrics helper returns singleton', () => {
      const instance = MetricsCollector.getInstance()
      const helper = getMetrics()
      expect(instance).toBe(helper)
    })

    it('resetInstance creates new instance', () => {
      const instance1 = MetricsCollector.getInstance()
      instance1.recordTrackCreated()
      MetricsCollector.resetInstance()
      const instance2 = MetricsCollector.getInstance()
      expect(instance2.getLifecycleMetrics().totalTracksCreated).toBe(0)
    })
  })

  describe('Handoff metrics', () => {
    it('records handoff attempts', () => {
      const metrics = getMetrics()
      metrics.recordHandoffAttempt()
      metrics.recordHandoffAttempt()
      expect(metrics.getHandoffMetrics().totalHandoffAttempts).toBe(2)
    })

    it('records successful handoffs with latency and distance', () => {
      const metrics = getMetrics()
      metrics.recordSuccessfulHandoff(100, 0.5)
      metrics.recordSuccessfulHandoff(200, 0.3)

      const handoff = metrics.getHandoffMetrics()
      expect(handoff.successfulHandoffs).toBe(2)
      expect(handoff.avgHandoffLatencyMs).toBe(150)
      expect(handoff.avgHandoffDistanceM).toBe(0.4)
    })

    it('calculates handoff success rate', () => {
      const metrics = getMetrics()
      metrics.recordSuccessfulHandoff(100, 0.5)
      metrics.recordSuccessfulHandoff(100, 0.5)
      metrics.recordFailedHandoff()

      const handoff = metrics.getHandoffMetrics()
      expect(handoff.handoffSuccessRate).toBeCloseTo(0.667, 2)
    })
  })

  describe('Merger metrics', () => {
    it('records merge candidates with confidence', () => {
      const metrics = getMetrics()
      metrics.recordMergeCandidate(0.8)
      metrics.recordMergeCandidate(0.6)

      const merger = metrics.getMergerMetrics()
      expect(merger.totalMergeCandidatesFound).toBe(2)
      expect(merger.avgMergeConfidence).toBe(0.7)
    })

    it('records executed merges distinguishing cross-camera', () => {
      const metrics = getMetrics()
      metrics.recordMergeExecuted(true, 500)  // cross-camera
      metrics.recordMergeExecuted(false, 300) // same-camera

      const merger = metrics.getMergerMetrics()
      expect(merger.mergesExecuted).toBe(2)
      expect(merger.crossCameraMerges).toBe(1)
      expect(merger.sameCameraMerges).toBe(1)
      expect(merger.avgTimeToMergeMs).toBe(400)
    })

    it('records rejected merges', () => {
      const metrics = getMetrics()
      metrics.recordMergeRejected()
      metrics.recordMergeRejected()

      expect(metrics.getMergerMetrics().mergesRejected).toBe(2)
    })
  })

  describe('Clustering metrics', () => {
    it('records single detection clusters', () => {
      const metrics = getMetrics()
      metrics.recordCluster(1, 0)

      const clustering = metrics.getClusteringMetrics()
      expect(clustering.totalClustersCreated).toBe(1)
      expect(clustering.singleDetectionClusters).toBe(1)
      expect(clustering.multiCameraClusters).toBe(0)
    })

    it('records multi-detection clusters with distance', () => {
      const metrics = getMetrics()
      metrics.recordCluster(2, 0.5)
      metrics.recordCluster(3, 0.7)

      const clustering = metrics.getClusteringMetrics()
      expect(clustering.totalClustersCreated).toBe(2)
      expect(clustering.multiCameraClusters).toBe(2)
      expect(clustering.avgClusterSize).toBe(2.5)
      expect(clustering.clusteringDistance.min).toBe(0.5)
      expect(clustering.clusteringDistance.max).toBe(0.7)
      expect(clustering.clusteringDistance.avg).toBe(0.6)
    })
  })

  describe('Lifecycle metrics', () => {
    it('records track creation', () => {
      const metrics = getMetrics()
      metrics.recordTrackCreated()
      metrics.recordTrackCreated()

      expect(metrics.getLifecycleMetrics().totalTracksCreated).toBe(2)
    })

    it('records track confirmation with time', () => {
      const metrics = getMetrics()
      metrics.recordTrackCreated()
      metrics.recordTrackConfirmed(500)
      metrics.recordTrackCreated()
      metrics.recordTrackConfirmed(300)

      const lifecycle = metrics.getLifecycleMetrics()
      expect(lifecycle.totalTracksConfirmed).toBe(2)
      expect(lifecycle.avgTimeToConfirmMs).toBe(400)
    })

    it('records track expiration and calculates ghost track rate', () => {
      const metrics = getMetrics()
      metrics.recordTrackCreated()
      metrics.recordTrackCreated()
      metrics.recordTrackCreated()
      metrics.recordTrackExpired(5000, true)  // confirmed
      metrics.recordTrackExpired(2000, false) // ghost

      const lifecycle = metrics.getLifecycleMetrics()
      expect(lifecycle.totalTracksExpired).toBe(2)
      expect(lifecycle.avgTrackDurationMs).toBe(3500)
      expect(lifecycle.ghostTrackRate).toBeCloseTo(0.333, 2)
    })

    it('records occlusion events and recovery rate', () => {
      const metrics = getMetrics()
      metrics.recordOcclusionStart()
      metrics.recordOcclusionStart()
      metrics.recordOcclusionStart()
      metrics.recordOcclusionEnd(1000, true)  // recovered
      metrics.recordOcclusionEnd(500, true)   // recovered
      metrics.recordOcclusionEnd(2000, false) // not recovered

      const lifecycle = metrics.getLifecycleMetrics()
      expect(lifecycle.avgOcclusionDurationMs).toBeCloseTo(1166.67, 0)
      expect(lifecycle.occlusionRecoveryRate).toBeCloseTo(0.667, 2)
    })
  })

  describe('Performance metrics', () => {
    it('records batch processing with latency and detection count', () => {
      const metrics = getMetrics()
      metrics.recordBatchProcessing(10, 5)
      metrics.recordBatchProcessing(20, 3)

      const perf = metrics.getPerformanceMetrics()
      expect(perf.totalDetectionsProcessed).toBe(8)
      expect(perf.processingLatency.avg).toBe(15)
      expect(perf.processingLatency.min).toBe(10)
      expect(perf.processingLatency.max).toBe(20)
    })

    it('calculates percentiles correctly', () => {
      const metrics = getMetrics()
      // Add 100 samples from 1 to 100
      for (let i = 1; i <= 100; i++) {
        metrics.recordBatchProcessing(i, 1)
      }

      const perf = metrics.getPerformanceMetrics()
      expect(perf.processingLatency.p50).toBe(50)
      expect(perf.processingLatency.p95).toBe(95)
      expect(perf.processingLatency.p99).toBe(99)
    })

    it('records Hungarian algorithm timing', () => {
      const metrics = getMetrics()
      metrics.recordHungarianTiming(5)
      metrics.recordHungarianTiming(10)

      expect(metrics.getPerformanceMetrics().avgHungarianTimeMs).toBe(7.5)
    })

    it('records Kalman update timing', () => {
      const metrics = getMetrics()
      metrics.recordKalmanTiming(2)
      metrics.recordKalmanTiming(4)

      expect(metrics.getPerformanceMetrics().avgKalmanUpdateTimeMs).toBe(3)
    })

    it('updates tracks per camera', () => {
      const metrics = getMetrics()
      metrics.updateTracksPerCamera({ camera1: 5, camera2: 3 })

      expect(metrics.getPerformanceMetrics().tracksPerCamera).toEqual({ camera1: 5, camera2: 3 })
    })
  })

  describe('Diagnostic metrics', () => {
    it('records exclusion zone blocks', () => {
      const metrics = getMetrics()
      metrics.recordExclusionZoneBlock()
      metrics.recordExclusionZoneBlock()

      expect(metrics.getDiagnosticMetrics().exclusionZoneBlocks).toBe(2)
    })

    it('records cross-camera exclusion blocks', () => {
      const metrics = getMetrics()
      metrics.recordCrossCameraExclusionBlock()

      expect(metrics.getDiagnosticMetrics().crossCameraExclusionBlocks).toBe(1)
    })

    it('records velocity sanity rejects', () => {
      const metrics = getMetrics()
      metrics.recordVelocitySanityReject()

      expect(metrics.getDiagnosticMetrics().velocitySanityRejects).toBe(1)
    })

    it('records cost matrix stats', () => {
      const metrics = getMetrics()
      metrics.recordCostMatrixStats(0.5, 0.1, 0.9)

      const diag = metrics.getDiagnosticMetrics()
      expect(diag.costMatrixStats.avgCost).toBe(0.5)
      expect(diag.costMatrixStats.minCost).toBe(0.1)
      expect(diag.costMatrixStats.maxCost).toBe(0.9)
    })

    it('records assignment gate rejects', () => {
      const metrics = getMetrics()
      metrics.recordAssignmentGateReject()
      metrics.recordAssignmentGateReject()

      expect(metrics.getDiagnosticMetrics().assignmentGateRejects).toBe(2)
    })

    it('records projection failures', () => {
      const metrics = getMetrics()
      metrics.recordProjectionFailure()

      expect(metrics.getDiagnosticMetrics().projectionFailures).toBe(1)
    })
  })

  describe('Full metrics retrieval', () => {
    it('returns all metrics with timestamp and uptime', () => {
      const metrics = getMetrics()
      metrics.recordTrackCreated()
      metrics.recordBatchProcessing(10, 1)

      const full = metrics.getMetrics()
      expect(full.handoff).toBeDefined()
      expect(full.merger).toBeDefined()
      expect(full.clustering).toBeDefined()
      expect(full.lifecycle).toBeDefined()
      expect(full.performance).toBeDefined()
      expect(full.diagnostic).toBeDefined()
      expect(full.timestamp).toBeGreaterThan(0)
      expect(full.uptimeMs).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Reset functionality', () => {
    it('resets all metrics to initial state', () => {
      const metrics = getMetrics()

      // Record various metrics
      metrics.recordTrackCreated()
      metrics.recordSuccessfulHandoff(100, 0.5)
      metrics.recordMergeExecuted(true, 500)
      metrics.recordCluster(2, 0.5)
      metrics.recordBatchProcessing(10, 5)
      metrics.recordExclusionZoneBlock()

      // Reset
      metrics.reset()

      // Verify all reset
      expect(metrics.getLifecycleMetrics().totalTracksCreated).toBe(0)
      expect(metrics.getHandoffMetrics().successfulHandoffs).toBe(0)
      expect(metrics.getMergerMetrics().mergesExecuted).toBe(0)
      expect(metrics.getClusteringMetrics().totalClustersCreated).toBe(0)
      expect(metrics.getPerformanceMetrics().totalDetectionsProcessed).toBe(0)
      expect(metrics.getDiagnosticMetrics().exclusionZoneBlocks).toBe(0)
    })
  })

  describe('Rolling window behavior', () => {
    it('maintains rolling window for latencies (prevents memory bloat)', () => {
      const metrics = getMetrics()

      // Add more than WINDOW_SIZE samples
      for (let i = 0; i < 1100; i++) {
        metrics.recordBatchProcessing(i, 1)
      }

      // Average should be based on last 1000 samples (100-1099)
      const perf = metrics.getPerformanceMetrics()
      expect(perf.processingLatency.avg).toBeGreaterThan(500)
      expect(perf.processingLatency.avg).toBeLessThan(600)
    })
  })
})
