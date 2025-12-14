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

export interface ReIDMetrics {
  /** Total re-ID match attempts (detection vs occluded track) */
  reidMatchAttempts: number
  /** Successful re-ID matches */
  reidMatchSuccesses: number
  /** Re-ID match success rate (0-1) */
  reidMatchSuccessRate: number
  /** Average embedding similarity for successful matches */
  avgMatchSimilarity: number
  /** Average embedding similarity for all comparisons */
  avgComparisonSimilarity: number
  /** Embedding similarity distribution buckets */
  similarityDistribution: {
    veryLow: number    // < 0.3
    low: number        // 0.3-0.5
    medium: number     // 0.5-0.7
    high: number       // 0.7-0.9
    veryHigh: number   // > 0.9
  }
  /** Tracks with valid embeddings */
  tracksWithEmbeddings: number
  /** Detections with valid embeddings */
  detectionsWithEmbeddings: number
  /** Average embedding quality score */
  avgEmbeddingQuality: number
  /** ID switches detected (track ID changed for same person) */
  idSwitchCount: number
  /** Hungarian assignment embedding bonus applications */
  embeddingBonusApplied: number
  /** Hungarian assignment embedding penalty applications */
  embeddingPenaltyApplied: number
}

export interface SyncMetrics {
  /** Total synchronized batches processed */
  batchesProcessed: number
  /** Batches released due to timeout (not all cameras reported) */
  timeoutFlushes: number
  /** Batches released with all cameras reporting */
  completeBatches: number
  /** Batch completion rate (0-1) */
  batchCompletionRate: number
  /** Average cameras per synchronized batch */
  avgCamerasPerBatch: number
  /** Average detections per synchronized batch */
  avgDetectionsPerBatch: number
  /** Maximum frame skew between cameras (ms) */
  maxFrameSkewMs: number
  /** Average sync wait time before flush (ms) */
  avgSyncWaitMs: number
  /** Frames dropped because they were too stale */
  droppedStaleFrames: number
  /** Current number of frames in sync buffer */
  currentBufferSize: number
  /** Registered camera count */
  registeredCameras: number
  /** Per-camera clock offsets (ms) */
  cameraClockOffsets: Record<string, number>
}

export interface QualityMetrics {
  /** Average time to re-acquire track after occlusion (ms) */
  avgReacquisitionTimeMs: number
  /** Median re-acquisition time (ms) */
  medianReacquisitionTimeMs: number
  /** Total re-acquisition attempts */
  totalReacquisitionAttempts: number
  /** Successful re-acquisitions */
  successfulReacquisitions: number
  /** Re-acquisition success rate (0-1) */
  reacquisitionSuccessRate: number
  /** Average track purity (% of track with correct ID) - estimated via embedding consistency */
  avgTrackPurity: number
  /** Tracks with high purity (>0.9) */
  highPurityTracks: number
  /** Average camera contribution per track */
  avgCameraContribution: number
  /** Tracks with multi-camera coverage */
  multiCameraTracks: number
  /** Single-camera only tracks */
  singleCameraTracks: number
  /** Kalman prediction accuracy - average error (meters) */
  avgPredictionErrorM: number
  /** Kalman prediction accuracy - 90th percentile error (meters) */
  p90PredictionErrorM: number
  /** Total predictions evaluated */
  totalPredictionsEvaluated: number
  /** Crossing events detected (tracks in close proximity) */
  crossingEventsDetected: number
  /** Crossing events where ID was maintained */
  crossingEventsResolved: number
  /** Crossing resolution rate (0-1) */
  crossingResolutionRate: number
}

export interface TrackingMetrics {
  handoff: HandoffMetrics
  merger: MergerMetrics
  clustering: ClusteringMetrics
  lifecycle: LifecycleMetrics
  performance: PerformanceMetrics
  diagnostic: DiagnosticMetrics
  reid: ReIDMetrics
  sync: SyncMetrics
  quality: QualityMetrics
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

  // ReID tracking
  matchSimilarities: number[]
  comparisonSimilarities: number[]
  embeddingQualities: number[]

  // Sync tracking
  syncCameraCounts: number[]
  syncDetectionCounts: number[]
  syncWaitTimes: number[]
  syncFrameSkews: number[]

  // Quality tracking
  reacquisitionTimes: number[]
  trackPurities: number[]
  cameraContributions: number[]
  predictionErrors: number[]

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
  private reid: ReIDMetrics
  private sync: SyncMetrics
  private quality: QualityMetrics

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
    this.reid = this.createEmptyReIDMetrics()
    this.sync = this.createEmptySyncMetrics()
    this.quality = this.createEmptyQualityMetrics()

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
      matchSimilarities: [],
      comparisonSimilarities: [],
      embeddingQualities: [],
      syncCameraCounts: [],
      syncDetectionCounts: [],
      syncWaitTimes: [],
      syncFrameSkews: [],
      reacquisitionTimes: [],
      trackPurities: [],
      cameraContributions: [],
      predictionErrors: [],
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

  // ========== REID METRICS ==========

  /**
   * Record a re-ID match attempt (detection compared against occluded track)
   */
  recordReIDMatchAttempt(): void {
    this.reid.reidMatchAttempts++
  }

  /**
   * Record a successful re-ID match
   */
  recordReIDMatchSuccess(similarity: number): void {
    this.reid.reidMatchSuccesses++
    this.addToWindow(this.state.matchSimilarities, similarity)
    this.reid.avgMatchSimilarity = this.average(this.state.matchSimilarities)
    this.updateReIDSuccessRate()
  }

  /**
   * Record an embedding comparison (for similarity distribution tracking)
   */
  recordEmbeddingComparison(similarity: number): void {
    this.addToWindow(this.state.comparisonSimilarities, similarity)
    this.reid.avgComparisonSimilarity = this.average(this.state.comparisonSimilarities)
    this.updateSimilarityDistribution(similarity)
  }

  /**
   * Record a detection with valid embedding
   */
  recordDetectionWithEmbedding(quality: number): void {
    this.reid.detectionsWithEmbeddings++
    this.addToWindow(this.state.embeddingQualities, quality)
    this.reid.avgEmbeddingQuality = this.average(this.state.embeddingQualities)
  }

  /**
   * Update count of tracks with valid embeddings
   */
  updateTracksWithEmbeddings(count: number): void {
    this.reid.tracksWithEmbeddings = count
  }

  /**
   * Record an ID switch event
   */
  recordIDSwitch(): void {
    this.reid.idSwitchCount++
  }

  /**
   * Record embedding bonus applied in Hungarian assignment
   */
  recordEmbeddingBonus(): void {
    this.reid.embeddingBonusApplied++
  }

  /**
   * Record embedding penalty applied in Hungarian assignment
   */
  recordEmbeddingPenalty(): void {
    this.reid.embeddingPenaltyApplied++
  }

  private updateReIDSuccessRate(): void {
    const total = this.reid.reidMatchAttempts
    this.reid.reidMatchSuccessRate = total > 0 ? this.reid.reidMatchSuccesses / total : 0
  }

  private updateSimilarityDistribution(similarity: number): void {
    if (similarity < 0.3) {
      this.reid.similarityDistribution.veryLow++
    } else if (similarity < 0.5) {
      this.reid.similarityDistribution.low++
    } else if (similarity < 0.7) {
      this.reid.similarityDistribution.medium++
    } else if (similarity < 0.9) {
      this.reid.similarityDistribution.high++
    } else {
      this.reid.similarityDistribution.veryHigh++
    }
  }

  // ========== SYNC METRICS ==========

  /**
   * Record a synchronized batch being processed
   */
  recordSyncBatch(
    cameraCount: number,
    detectionCount: number,
    waitTimeMs: number,
    wasComplete: boolean
  ): void {
    this.sync.batchesProcessed++
    if (wasComplete) {
      this.sync.completeBatches++
    } else {
      this.sync.timeoutFlushes++
    }

    this.addToWindow(this.state.syncCameraCounts, cameraCount)
    this.addToWindow(this.state.syncDetectionCounts, detectionCount)
    this.addToWindow(this.state.syncWaitTimes, waitTimeMs)

    this.updateSyncStats()
  }

  /**
   * Record frame skew between cameras in a batch
   */
  recordFrameSkew(skewMs: number): void {
    this.addToWindow(this.state.syncFrameSkews, skewMs)
    if (skewMs > this.sync.maxFrameSkewMs) {
      this.sync.maxFrameSkewMs = skewMs
    }
  }

  /**
   * Record a stale frame being dropped
   */
  recordDroppedStaleFrame(): void {
    this.sync.droppedStaleFrames++
  }

  /**
   * Update sync buffer size
   */
  updateSyncBufferSize(size: number): void {
    this.sync.currentBufferSize = size
  }

  /**
   * Update registered camera count
   */
  updateRegisteredCameras(count: number): void {
    this.sync.registeredCameras = count
  }

  /**
   * Record a camera clock offset
   */
  recordCameraClockOffset(cameraId: string, offsetMs: number): void {
    this.sync.cameraClockOffsets[cameraId] = offsetMs
  }

  private updateSyncStats(): void {
    if (this.state.syncCameraCounts.length > 0) {
      this.sync.avgCamerasPerBatch = this.average(this.state.syncCameraCounts)
    }
    if (this.state.syncDetectionCounts.length > 0) {
      this.sync.avgDetectionsPerBatch = this.average(this.state.syncDetectionCounts)
    }
    if (this.state.syncWaitTimes.length > 0) {
      this.sync.avgSyncWaitMs = this.average(this.state.syncWaitTimes)
    }
    if (this.sync.batchesProcessed > 0) {
      this.sync.batchCompletionRate = this.sync.completeBatches / this.sync.batchesProcessed
    }
  }

  // ========== QUALITY METRICS ==========

  /**
   * Record a re-acquisition attempt (track recovering from occlusion)
   */
  recordReacquisitionAttempt(): void {
    this.quality.totalReacquisitionAttempts++
  }

  /**
   * Record a successful re-acquisition
   */
  recordSuccessfulReacquisition(timeMs: number): void {
    this.quality.successfulReacquisitions++
    this.addToWindow(this.state.reacquisitionTimes, timeMs)
    this.updateReacquisitionStats()
  }

  private updateReacquisitionStats(): void {
    if (this.state.reacquisitionTimes.length > 0) {
      this.quality.avgReacquisitionTimeMs = this.average(this.state.reacquisitionTimes)
      const sorted = [...this.state.reacquisitionTimes].sort((a, b) => a - b)
      this.quality.medianReacquisitionTimeMs = this.percentile(sorted, 0.5)
    }
    if (this.quality.totalReacquisitionAttempts > 0) {
      this.quality.reacquisitionSuccessRate =
        this.quality.successfulReacquisitions / this.quality.totalReacquisitionAttempts
    }
  }

  /**
   * Record track purity (embedding consistency score)
   */
  recordTrackPurity(purity: number): void {
    this.addToWindow(this.state.trackPurities, purity)
    this.quality.avgTrackPurity = this.average(this.state.trackPurities)
    if (purity > 0.9) {
      this.quality.highPurityTracks++
    }
  }

  /**
   * Record camera contribution for a track
   */
  recordCameraContribution(cameraCount: number): void {
    this.addToWindow(this.state.cameraContributions, cameraCount)
    this.quality.avgCameraContribution = this.average(this.state.cameraContributions)
    if (cameraCount > 1) {
      this.quality.multiCameraTracks++
    } else {
      this.quality.singleCameraTracks++
    }
  }

  /**
   * Record Kalman prediction accuracy
   */
  recordPredictionError(errorM: number): void {
    this.addToWindow(this.state.predictionErrors, errorM)
    this.quality.totalPredictionsEvaluated++
    this.updatePredictionStats()
  }

  private updatePredictionStats(): void {
    if (this.state.predictionErrors.length > 0) {
      this.quality.avgPredictionErrorM = this.average(this.state.predictionErrors)
      const sorted = [...this.state.predictionErrors].sort((a, b) => a - b)
      this.quality.p90PredictionErrorM = this.percentile(sorted, 0.9)
    }
  }

  /**
   * Record a crossing event detected
   */
  recordCrossingEvent(): void {
    this.quality.crossingEventsDetected++
  }

  /**
   * Record a crossing event resolved (IDs maintained)
   */
  recordCrossingResolved(): void {
    this.quality.crossingEventsResolved++
    this.updateCrossingStats()
  }

  private updateCrossingStats(): void {
    if (this.quality.crossingEventsDetected > 0) {
      this.quality.crossingResolutionRate =
        this.quality.crossingEventsResolved / this.quality.crossingEventsDetected
    }
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
      reid: { ...this.reid, similarityDistribution: { ...this.reid.similarityDistribution } },
      sync: { ...this.sync, cameraClockOffsets: { ...this.sync.cameraClockOffsets } },
      quality: { ...this.quality },
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

  getReIDMetrics(): ReIDMetrics {
    return { ...this.reid, similarityDistribution: { ...this.reid.similarityDistribution } }
  }

  getSyncMetrics(): SyncMetrics {
    return { ...this.sync, cameraClockOffsets: { ...this.sync.cameraClockOffsets } }
  }

  getQualityMetrics(): QualityMetrics {
    return { ...this.quality }
  }

  // ========== RESET ==========

  reset(): void {
    this.handoff = this.createEmptyHandoffMetrics()
    this.merger = this.createEmptyMergerMetrics()
    this.clustering = this.createEmptyClusteringMetrics()
    this.lifecycle = this.createEmptyLifecycleMetrics()
    this.performance = this.createEmptyPerformanceMetrics()
    this.diagnostic = this.createEmptyDiagnosticMetrics()
    this.reid = this.createEmptyReIDMetrics()
    this.sync = this.createEmptySyncMetrics()
    this.quality = this.createEmptyQualityMetrics()

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
      matchSimilarities: [],
      comparisonSimilarities: [],
      embeddingQualities: [],
      syncCameraCounts: [],
      syncDetectionCounts: [],
      syncWaitTimes: [],
      syncFrameSkews: [],
      reacquisitionTimes: [],
      trackPurities: [],
      cameraContributions: [],
      predictionErrors: [],
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

  private createEmptyReIDMetrics(): ReIDMetrics {
    return {
      reidMatchAttempts: 0,
      reidMatchSuccesses: 0,
      reidMatchSuccessRate: 0,
      avgMatchSimilarity: 0,
      avgComparisonSimilarity: 0,
      similarityDistribution: {
        veryLow: 0,
        low: 0,
        medium: 0,
        high: 0,
        veryHigh: 0,
      },
      tracksWithEmbeddings: 0,
      detectionsWithEmbeddings: 0,
      avgEmbeddingQuality: 0,
      idSwitchCount: 0,
      embeddingBonusApplied: 0,
      embeddingPenaltyApplied: 0,
    }
  }

  private createEmptySyncMetrics(): SyncMetrics {
    return {
      batchesProcessed: 0,
      timeoutFlushes: 0,
      completeBatches: 0,
      batchCompletionRate: 0,
      avgCamerasPerBatch: 0,
      avgDetectionsPerBatch: 0,
      maxFrameSkewMs: 0,
      avgSyncWaitMs: 0,
      droppedStaleFrames: 0,
      currentBufferSize: 0,
      registeredCameras: 0,
      cameraClockOffsets: {},
    }
  }

  private createEmptyQualityMetrics(): QualityMetrics {
    return {
      avgReacquisitionTimeMs: 0,
      medianReacquisitionTimeMs: 0,
      totalReacquisitionAttempts: 0,
      successfulReacquisitions: 0,
      reacquisitionSuccessRate: 0,
      avgTrackPurity: 0,
      highPurityTracks: 0,
      avgCameraContribution: 0,
      multiCameraTracks: 0,
      singleCameraTracks: 0,
      avgPredictionErrorM: 0,
      p90PredictionErrorM: 0,
      totalPredictionsEvaluated: 0,
      crossingEventsDetected: 0,
      crossingEventsResolved: 0,
      crossingResolutionRate: 0,
    }
  }
}

// Export singleton getter for convenience
export const getMetrics = () => MetricsCollector.getInstance()
