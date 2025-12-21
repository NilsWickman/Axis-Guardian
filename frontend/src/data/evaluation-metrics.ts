/**
 * Static evaluation metrics from test run
 * These metrics represent a complete evaluation session
 */

import type {
  PerformanceMetrics,
  LifecycleMetrics,
  ReIDMetrics,
  SyncMetrics,
  DiagnosticMetrics,
  QualityMetrics,
} from '@/stores/systemMetrics'

export interface EvaluationMetadata {
  evaluationId: string
  timestamp: string
  duration: string
  videoSource: string
  frameCount: number
  annotationCount: number
}

export interface EvaluationMetrics {
  metadata: EvaluationMetadata
  performance: PerformanceMetrics
  lifecycle: LifecycleMetrics
  reid: ReIDMetrics
  sync: SyncMetrics
  diagnostic: DiagnosticMetrics
  quality: QualityMetrics
}

export const evaluationMetrics: EvaluationMetrics = {
  metadata: {
    evaluationId: 'eval-2024-rectangular-room',
    timestamp: '2024-12-20T10:30:00Z',
    duration: '5m 23s',
    videoSource: 'rectangular-room-2cam',
    frameCount: 9690,
    annotationCount: 847,
  },

  performance: {
    processingLatency: {
      avg: 12.4,
      p50: 8.2,
      p95: 28.6,
      p99: 45.3,
      min: 2.1,
      max: 89.7,
    },
    avgHungarianTimeMs: 1.8,
    avgKalmanUpdateTimeMs: 0.4,
    detectionsPerSecond: 58.3,
    tracksPerCamera: {
      camera1: 3,
      camera2: 2,
    },
    totalDetectionsProcessed: 18742,
  },

  lifecycle: {
    avgTimeToConfirmMs: 198,
    avgTrackDurationMs: 42300,
    avgOcclusionDurationMs: 1250,
    occlusionRecoveryRate: 0.73,
    ghostTrackRate: 0.12,
    totalTracksCreated: 89,
    totalTracksConfirmed: 78,
    totalTracksExpired: 71,
  },

  reid: {
    reidMatchAttempts: 234,
    reidMatchSuccesses: 187,
    reidMatchSuccessRate: 0.799,
    avgMatchSimilarity: 0.847,
    avgComparisonSimilarity: 0.621,
    similarityDistribution: {
      veryLow: 12,
      low: 28,
      medium: 45,
      high: 89,
      veryHigh: 60,
    },
    tracksWithEmbeddings: 78,
    detectionsWithEmbeddings: 18742,
    avgEmbeddingQuality: 0.92,
    idSwitchCount: 7,
    embeddingBonusApplied: 156,
    embeddingPenaltyApplied: 23,
  },

  sync: {
    batchesProcessed: 4845,
    timeoutFlushes: 127,
    completeBatches: 4718,
    batchCompletionRate: 0.974,
    avgCamerasPerBatch: 1.87,
    avgBatchSizeMs: 33.2,
    cameraSyncOffsets: {
      camera1: -2.4,
      camera2: 3.1,
    },
    maxClockDriftMs: 8.7,
  },

  diagnostic: {
    exclusionZoneBlocks: 342,
    velocitySanityRejects: 56,
    crossCameraExclusionBlocks: 89,
    costMatrixStats: {
      avgCost: 0.34,
      minCost: 0.02,
      maxCost: 0.98,
    },
    assignmentGateRejects: 178,
    projectionFailures: 23,
  },

  quality: {
    idSwitchRate: 0.037,
    fragmentationRate: 0.089,
    trackPurity: 0.943,
    avgTrackCoverage: 0.867,
  },
}
