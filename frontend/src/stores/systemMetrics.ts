/**
 * System metrics store
 * Loads static evaluation metrics from test run
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { evaluationMetrics, type EvaluationMetadata } from '@/data/evaluation-metrics'

// Metric type definitions
export interface PerformanceMetrics {
  processingLatency: { avg: number; p50: number; p95: number; p99: number; min: number; max: number }
  avgHungarianTimeMs: number
  avgKalmanUpdateTimeMs: number
  detectionsPerSecond: number
  tracksPerCamera: Record<string, number>
  totalDetectionsProcessed: number
}

export interface LifecycleMetrics {
  avgTimeToConfirmMs: number
  avgTrackDurationMs: number
  avgOcclusionDurationMs: number
  occlusionRecoveryRate: number
  ghostTrackRate: number
  totalTracksCreated: number
  totalTracksConfirmed: number
  totalTracksExpired: number
}

export interface ReIDMetrics {
  reidMatchAttempts: number
  reidMatchSuccesses: number
  reidMatchSuccessRate: number
  avgMatchSimilarity: number
  avgComparisonSimilarity: number
  similarityDistribution: {
    veryLow: number
    low: number
    medium: number
    high: number
    veryHigh: number
  }
  tracksWithEmbeddings: number
  detectionsWithEmbeddings: number
  avgEmbeddingQuality: number
  idSwitchCount: number
  embeddingBonusApplied: number
  embeddingPenaltyApplied: number
}

export interface SyncMetrics {
  batchesProcessed: number
  timeoutFlushes: number
  completeBatches: number
  batchCompletionRate: number
  avgCamerasPerBatch: number
  avgBatchSizeMs: number
  cameraSyncOffsets: Record<string, number>
  maxClockDriftMs: number
}

export interface DiagnosticMetrics {
  exclusionZoneBlocks: number
  velocitySanityRejects: number
  crossCameraExclusionBlocks: number
  costMatrixStats: { avgCost: number; minCost: number; maxCost: number }
  assignmentGateRejects: number
  projectionFailures: number
}

export interface QualityMetrics {
  idSwitchRate: number
  fragmentationRate: number
  trackPurity: number
  avgTrackCoverage: number
}

export const useSystemMetricsStore = defineStore('systemMetrics', () => {
  // Load static evaluation data
  const metadata = ref<EvaluationMetadata>(evaluationMetrics.metadata)
  const performance = ref<PerformanceMetrics>(evaluationMetrics.performance)
  const lifecycle = ref<LifecycleMetrics>(evaluationMetrics.lifecycle)
  const reid = ref<ReIDMetrics>(evaluationMetrics.reid)
  const sync = ref<SyncMetrics>(evaluationMetrics.sync)
  const diagnostic = ref<DiagnosticMetrics>(evaluationMetrics.diagnostic)
  const quality = ref<QualityMetrics>(evaluationMetrics.quality)

  const isOpen = ref(false)
  const isLoading = ref(false)

  // Computed: check if data is loaded
  const hasData = computed(() => performance.value !== null)

  // Computed: evaluation info string
  const evaluationInfo = computed(() => {
    if (!metadata.value) return null
    return {
      id: metadata.value.evaluationId,
      date: new Date(metadata.value.timestamp).toLocaleDateString(),
      duration: metadata.value.duration,
      source: metadata.value.videoSource,
      frames: metadata.value.frameCount,
      annotations: metadata.value.annotationCount,
    }
  })

  // Open/close the metrics drawer
  function openDrawer(): void {
    isOpen.value = true
  }

  function closeDrawer(): void {
    isOpen.value = false
  }

  function toggleDrawer(): void {
    isOpen.value = !isOpen.value
  }

  // No-op functions for API compatibility
  function fetchMetrics(): void {
    // Static data - no fetch needed
  }

  function startPolling(): void {
    // Static data - no polling needed
  }

  function stopPolling(): void {
    // Static data - no polling needed
  }

  return {
    // State
    metadata,
    performance,
    lifecycle,
    reid,
    sync,
    diagnostic,
    quality,
    isLoading,
    isOpen,

    // Computed
    hasData,
    evaluationInfo,

    // Actions
    fetchMetrics,
    startPolling,
    stopPolling,
    openDrawer,
    closeDrawer,
    toggleDrawer,
  }
})
