/**
 * Tracking Metrics - Comprehensive metrics collection for tracking system
 *
 * Collects and exposes metrics for:
 * - Cross-camera handoff performance
 * - Track merger effectiveness
 * - Pre-clustering statistics
 * - Track lifecycle
 * - Real-time performance
 * - Diagnostic data for tuning
 */

export interface HandoffMetrics {
  /** Total detections in camera overlap zones */
  totalHandoffAttempts: number
  /** Track maintained across cameras successfully */
  successfulHandoffs: number
  /** Track duplicated or lost during handoff */
  failedHandoffs: number
  /** Average time between camera1 last seen → camera2 first seen */
  avgHandoffLatencyMs: number
  /** Average spatial gap during handoffs */
  avgHandoffDistanceM: number
  /** Handoff success rate (0-1) */
  handoffSuccessRate: number
}

export interface MergerMetrics {
  /** Total merge candidates found */
  totalMergeCandidatesFound: number
  /** Merges actually executed */
  mergesExecuted: number
  /** Merges rejected (below confidence threshold) */
  mergesRejected: number
  /** Average merge confidence score */
  avgMergeConfidence: number
  /** Merges between tracks from different cameras */
  crossCameraMerges: number
  /** Same-camera fragmentation recovery merges */
  sameCameraMerges: number
  /** Average time from duplicate creation to merge */
  avgTimeToMergeMs: number
}

export interface ClusteringMetrics {
  /** Total detection clusters created */
  totalClustersCreated: number
  /** Clusters with single detection (no clustering needed) */
  singleDetectionClusters: number
  /** Clusters combining detections from multiple cameras */
  multiCameraClusters: number
  /** Average number of detections per cluster */
  avgClusterSize: number
  /** Clustering distance statistics */
  clusteringDistance: { min: number; max: number; avg: number }
}

export interface LifecycleMetrics {
  /** Average time from creation to confirmation (ms) */
  avgTimeToConfirmMs: number
  /** Average track duration from creation to expiry (ms) */
  avgTrackDurationMs: number
  /** Average time spent in occluded state (ms) */
  avgOcclusionDurationMs: number
  /** Percentage of occluded tracks that recovered */
  occlusionRecoveryRate: number
  /** Percentage of unconfirmed tracks that expired without confirming */
  ghostTrackRate: number
  /** Total tracks created */
  totalTracksCreated: number
  /** Total tracks confirmed */
  totalTracksConfirmed: number
  /** Total tracks expired */
  totalTracksExpired: number
}

export interface PerformanceMetrics {
  /** Processing latency per batch (ms) */
  processingLatency: { avg: number; p50: number; p95: number; p99: number; min: number; max: number }
  /** Hungarian assignment algorithm duration (ms) */
  avgHungarianTimeMs: number
  /** Kalman filter update duration (ms) */
  avgKalmanUpdateTimeMs: number
  /** Detections processed per second */
  detectionsPerSecond: number
  /** Active tracks per camera */
  tracksPerCamera: Record<string, number>
  /** Total detections processed */
  totalDetectionsProcessed: number
}

export interface DiagnosticMetrics {
  /** Track creations blocked by exclusion zone */
  exclusionZoneBlocks: number
  /** Associations rejected by velocity sanity check */
  velocitySanityRejects: number
  /** Cross-camera exclusion blocks (new) */
  crossCameraExclusionBlocks: number
  /** Cost matrix statistics from Hungarian assignment */
  costMatrixStats: { avgCost: number; minCost: number; maxCost: number }
  /** Assignments rejected for being above maxCost threshold */
  assignmentGateRejects: number
  /** Detections that failed projection */
  projectionFailures: number
}

export interface TrackingMetrics {
  handoff: HandoffMetrics
  merger: MergerMetrics
  clustering: ClusteringMetrics
  lifecycle: LifecycleMetrics
  performance: PerformanceMetrics
  diagnostic: DiagnosticMetrics
  /** Timestamp when metrics were collected */
  timestamp: number
  /** Uptime in milliseconds */
  uptimeMs: number
}

/**
 * Internal tracking for computing derived metrics
 */
interface MetricsState {
  // Handoff tracking
  handoffLatencies: number[]
  handoffDistances: number[]

  // Merger tracking
  mergeConfidences: number[]
  mergeTimings: number[]

  // Clustering tracking
  clusterSizes: number[]
  clusterDistances: number[]

  // Lifecycle tracking
  confirmationTimes: number[]
  trackDurations: number[]
  occlusionDurations: number[]
  occlusionRecoveries: number
  occlusionTotal: number
  ghostTracks: number

  // Performance tracking
  processingLatencies: number[]
  hungarianTimings: number[]
  kalmanTimings: number[]
  detectionTimestamps: number[]

  // Start time
  startTime: number
}

/**
 * Metrics Collector - Singleton for collecting tracking metrics
 */
export class MetricsCollector {
  private static instance: MetricsCollector | null = null

  private handoff: HandoffMetrics
  private merger: MergerMetrics
  private clustering: ClusteringMetrics
  private lifecycle: LifecycleMetrics
  private performance: PerformanceMetrics
  private diagnostic: DiagnosticMetrics

  private state: MetricsState

  // Rolling window size for latency calculations
  private readonly WINDOW_SIZE = 1000

  private constructor() {
    this.handoff = this.createEmptyHandoffMetrics()
    this.merger = this.createEmptyMergerMetrics()
    this.clustering = this.createEmptyClusteringMetrics()
    this.lifecycle = this.createEmptyLifecycleMetrics()
    this.performance = this.createEmptyPerformanceMetrics()
    this.diagnostic = this.createEmptyDiagnosticMetrics()

    this.state = {
      handoffLatencies: [],
      handoffDistances: [],
      mergeConfidences: [],
      mergeTimings: [],
      clusterSizes: [],
      clusterDistances: [],
      confirmationTimes: [],
      trackDurations: [],
      occlusionDurations: [],
      occlusionRecoveries: 0,
      occlusionTotal: 0,
      ghostTracks: 0,
      processingLatencies: [],
      hungarianTimings: [],
      kalmanTimings: [],
      detectionTimestamps: [],
      startTime: Date.now(),
    }
  }

  static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector()
    }
    return MetricsCollector.instance
  }

  static resetInstance(): void {
    MetricsCollector.instance = null
  }

  // ========== HANDOFF METRICS ==========

  recordHandoffAttempt(): void {
    this.handoff.totalHandoffAttempts++
  }

  recordSuccessfulHandoff(latencyMs: number, distanceM: number): void {
    this.handoff.successfulHandoffs++
    this.addToWindow(this.state.handoffLatencies, latencyMs)
    this.addToWindow(this.state.handoffDistances, distanceM)
    this.updateHandoffAverages()
  }

  recordFailedHandoff(): void {
    this.handoff.failedHandoffs++
    this.updateHandoffSuccessRate()
  }

  private updateHandoffAverages(): void {
    this.handoff.avgHandoffLatencyMs = this.average(this.state.handoffLatencies)
    this.handoff.avgHandoffDistanceM = this.average(this.state.handoffDistances)
    this.updateHandoffSuccessRate()
  }

  private updateHandoffSuccessRate(): void {
    const total = this.handoff.successfulHandoffs + this.handoff.failedHandoffs
    this.handoff.handoffSuccessRate = total > 0 ? this.handoff.successfulHandoffs / total : 0
  }

  // ========== MERGER METRICS ==========

  recordMergeCandidate(confidence: number): void {
    this.merger.totalMergeCandidatesFound++
    this.addToWindow(this.state.mergeConfidences, confidence)
    this.merger.avgMergeConfidence = this.average(this.state.mergeConfidences)
  }

  recordMergeExecuted(isCrossCamera: boolean, timeToMergeMs: number): void {
    this.merger.mergesExecuted++
    if (isCrossCamera) {
      this.merger.crossCameraMerges++
    } else {
      this.merger.sameCameraMerges++
    }
    this.addToWindow(this.state.mergeTimings, timeToMergeMs)
    this.merger.avgTimeToMergeMs = this.average(this.state.mergeTimings)
  }

  recordMergeRejected(): void {
    this.merger.mergesRejected++
  }

  // ========== CLUSTERING METRICS ==========

  recordCluster(size: number, maxInternalDistance: number): void {
    this.clustering.totalClustersCreated++
    if (size === 1) {
      this.clustering.singleDetectionClusters++
    } else {
      this.clustering.multiCameraClusters++
    }
    this.addToWindow(this.state.clusterSizes, size)
    if (maxInternalDistance > 0) {
      this.addToWindow(this.state.clusterDistances, maxInternalDistance)
    }
    this.updateClusteringStats()
  }

  private updateClusteringStats(): void {
    this.clustering.avgClusterSize = this.average(this.state.clusterSizes)
    if (this.state.clusterDistances.length > 0) {
      this.clustering.clusteringDistance = {
        min: Math.min(...this.state.clusterDistances),
        max: Math.max(...this.state.clusterDistances),
        avg: this.average(this.state.clusterDistances),
      }
    }
  }

  // ========== LIFECYCLE METRICS ==========

  recordTrackCreated(): void {
    this.lifecycle.totalTracksCreated++
  }

  recordTrackConfirmed(timeToConfirmMs: number): void {
    this.lifecycle.totalTracksConfirmed++
    this.addToWindow(this.state.confirmationTimes, timeToConfirmMs)
    this.lifecycle.avgTimeToConfirmMs = this.average(this.state.confirmationTimes)
    this.updateGhostTrackRate()
  }

  recordTrackExpired(durationMs: number, wasConfirmed: boolean): void {
    this.lifecycle.totalTracksExpired++
    this.addToWindow(this.state.trackDurations, durationMs)
    this.lifecycle.avgTrackDurationMs = this.average(this.state.trackDurations)

    if (!wasConfirmed) {
      this.state.ghostTracks++
      this.updateGhostTrackRate()
    }
  }

  recordOcclusionStart(): void {
    this.state.occlusionTotal++
  }

  recordOcclusionEnd(durationMs: number, recovered: boolean): void {
    this.addToWindow(this.state.occlusionDurations, durationMs)
    this.lifecycle.avgOcclusionDurationMs = this.average(this.state.occlusionDurations)

    if (recovered) {
      this.state.occlusionRecoveries++
    }
    this.lifecycle.occlusionRecoveryRate =
      this.state.occlusionTotal > 0 ? this.state.occlusionRecoveries / this.state.occlusionTotal : 0
  }

  private updateGhostTrackRate(): void {
    const totalExpiredUnconfirmed = this.state.ghostTracks
    const totalCreated = this.lifecycle.totalTracksCreated
    this.lifecycle.ghostTrackRate = totalCreated > 0 ? totalExpiredUnconfirmed / totalCreated : 0
  }

  // ========== PERFORMANCE METRICS ==========

  recordBatchProcessing(latencyMs: number, detectionCount: number): void {
    this.addToWindow(this.state.processingLatencies, latencyMs)
    this.performance.totalDetectionsProcessed += detectionCount

    // Record detection timestamp for throughput calculation
    const now = Date.now()
    for (let i = 0; i < detectionCount; i++) {
      this.addToWindow(this.state.detectionTimestamps, now)
    }

    this.updatePerformanceStats()
  }

  recordHungarianTiming(durationMs: number): void {
    this.addToWindow(this.state.hungarianTimings, durationMs)
    this.performance.avgHungarianTimeMs = this.average(this.state.hungarianTimings)
  }

  recordKalmanTiming(durationMs: number): void {
    this.addToWindow(this.state.kalmanTimings, durationMs)
    this.performance.avgKalmanUpdateTimeMs = this.average(this.state.kalmanTimings)
  }

  updateTracksPerCamera(tracksPerCamera: Record<string, number>): void {
    this.performance.tracksPerCamera = { ...tracksPerCamera }
  }

  private updatePerformanceStats(): void {
    const latencies = this.state.processingLatencies
    if (latencies.length === 0) return

    const sorted = [...latencies].sort((a, b) => a - b)
    this.performance.processingLatency = {
      avg: this.average(latencies),
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p50: this.percentile(sorted, 0.5),
      p95: this.percentile(sorted, 0.95),
      p99: this.percentile(sorted, 0.99),
    }

    // Calculate detections per second (over last second)
    const now = Date.now()
    const oneSecondAgo = now - 1000
    const recentDetections = this.state.detectionTimestamps.filter((t) => t >= oneSecondAgo)
    this.performance.detectionsPerSecond = recentDetections.length
  }

  // ========== DIAGNOSTIC METRICS ==========

  recordExclusionZoneBlock(): void {
    this.diagnostic.exclusionZoneBlocks++
  }

  recordCrossCameraExclusionBlock(): void {
    this.diagnostic.crossCameraExclusionBlocks++
  }

  recordVelocitySanityReject(): void {
    this.diagnostic.velocitySanityRejects++
  }

  recordCostMatrixStats(avgCost: number, minCost: number, maxCost: number): void {
    this.diagnostic.costMatrixStats = { avgCost, minCost, maxCost }
  }

  recordAssignmentGateReject(): void {
    this.diagnostic.assignmentGateRejects++
  }

  recordProjectionFailure(): void {
    this.diagnostic.projectionFailures++
  }

  // ========== METRICS RETRIEVAL ==========

  getMetrics(): TrackingMetrics {
    return {
      handoff: { ...this.handoff },
      merger: { ...this.merger },
      clustering: { ...this.clustering },
      lifecycle: { ...this.lifecycle },
      performance: { ...this.performance },
      diagnostic: { ...this.diagnostic },
      timestamp: Date.now(),
      uptimeMs: Date.now() - this.state.startTime,
    }
  }

  getHandoffMetrics(): HandoffMetrics {
    return { ...this.handoff }
  }

  getMergerMetrics(): MergerMetrics {
    return { ...this.merger }
  }

  getClusteringMetrics(): ClusteringMetrics {
    return { ...this.clustering }
  }

  getLifecycleMetrics(): LifecycleMetrics {
    return { ...this.lifecycle }
  }

  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performance }
  }

  getDiagnosticMetrics(): DiagnosticMetrics {
    return { ...this.diagnostic }
  }

  // ========== RESET ==========

  reset(): void {
    this.handoff = this.createEmptyHandoffMetrics()
    this.merger = this.createEmptyMergerMetrics()
    this.clustering = this.createEmptyClusteringMetrics()
    this.lifecycle = this.createEmptyLifecycleMetrics()
    this.performance = this.createEmptyPerformanceMetrics()
    this.diagnostic = this.createEmptyDiagnosticMetrics()

    this.state = {
      handoffLatencies: [],
      handoffDistances: [],
      mergeConfidences: [],
      mergeTimings: [],
      clusterSizes: [],
      clusterDistances: [],
      confirmationTimes: [],
      trackDurations: [],
      occlusionDurations: [],
      occlusionRecoveries: 0,
      occlusionTotal: 0,
      ghostTracks: 0,
      processingLatencies: [],
      hungarianTimings: [],
      kalmanTimings: [],
      detectionTimestamps: [],
      startTime: Date.now(),
    }
  }

  // ========== HELPERS ==========

  private addToWindow(arr: number[], value: number): void {
    arr.push(value)
    if (arr.length > this.WINDOW_SIZE) {
      arr.shift()
    }
  }

  private average(arr: number[]): number {
    if (arr.length === 0) return 0
    return arr.reduce((sum, v) => sum + v, 0) / arr.length
  }

  private percentile(sortedArr: number[], p: number): number {
    if (sortedArr.length === 0) return 0
    const index = Math.ceil(sortedArr.length * p) - 1
    return sortedArr[Math.max(0, index)]
  }

  private createEmptyHandoffMetrics(): HandoffMetrics {
    return {
      totalHandoffAttempts: 0,
      successfulHandoffs: 0,
      failedHandoffs: 0,
      avgHandoffLatencyMs: 0,
      avgHandoffDistanceM: 0,
      handoffSuccessRate: 0,
    }
  }

  private createEmptyMergerMetrics(): MergerMetrics {
    return {
      totalMergeCandidatesFound: 0,
      mergesExecuted: 0,
      mergesRejected: 0,
      avgMergeConfidence: 0,
      crossCameraMerges: 0,
      sameCameraMerges: 0,
      avgTimeToMergeMs: 0,
    }
  }

  private createEmptyClusteringMetrics(): ClusteringMetrics {
    return {
      totalClustersCreated: 0,
      singleDetectionClusters: 0,
      multiCameraClusters: 0,
      avgClusterSize: 0,
      clusteringDistance: { min: 0, max: 0, avg: 0 },
    }
  }

  private createEmptyLifecycleMetrics(): LifecycleMetrics {
    return {
      avgTimeToConfirmMs: 0,
      avgTrackDurationMs: 0,
      avgOcclusionDurationMs: 0,
      occlusionRecoveryRate: 0,
      ghostTrackRate: 0,
      totalTracksCreated: 0,
      totalTracksConfirmed: 0,
      totalTracksExpired: 0,
    }
  }

  private createEmptyPerformanceMetrics(): PerformanceMetrics {
    return {
      processingLatency: { avg: 0, p50: 0, p95: 0, p99: 0, min: 0, max: 0 },
      avgHungarianTimeMs: 0,
      avgKalmanUpdateTimeMs: 0,
      detectionsPerSecond: 0,
      tracksPerCamera: {},
      totalDetectionsProcessed: 0,
    }
  }

  private createEmptyDiagnosticMetrics(): DiagnosticMetrics {
    return {
      exclusionZoneBlocks: 0,
      velocitySanityRejects: 0,
      crossCameraExclusionBlocks: 0,
      costMatrixStats: { avgCost: 0, minCost: 0, maxCost: 0 },
      assignmentGateRejects: 0,
      projectionFailures: 0,
    }
  }
}

// Export singleton getter for convenience
export const getMetrics = () => MetricsCollector.getInstance()
