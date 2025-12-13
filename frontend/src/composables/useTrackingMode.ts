/**
 * Tracking Mode Composable
 *
 * Provides reactive access to the tracking mode state (spatial vs re-ID)
 * for use in UI components.
 */

import { computed } from 'vue'
import { useGlobalTrackStore, type TrackingMode } from '@/stores/globalTracks'

export function useTrackingMode() {
  const store = useGlobalTrackStore()

  /** Current tracking mode ('spatial' or 'reid') */
  const trackingMode = computed<TrackingMode>(() => store.trackingMode)

  /** Whether spatial-only mode is selected */
  const isSpatialMode = computed(() => store.trackingMode === 'spatial')

  /** Whether re-ID mode is selected */
  const isReIDMode = computed(() => store.trackingMode === 'reid')

  /** Whether dual mode is enabled (server sending both track sets) */
  const dualModeEnabled = computed(() => store.dualModeEnabled)

  /** Track count in spatial mode */
  const spatialTrackCount = computed(() => store.spatialTrackCount)

  /** Track count in re-ID mode */
  const reidTrackCount = computed(() => store.reidTrackCount)

  /** Active track count (based on current mode) */
  const activeTrackCount = computed(() => store.activeTrackCount)

  /**
   * Set the tracking mode
   */
  function setMode(mode: TrackingMode): void {
    store.setTrackingMode(mode)
  }

  /**
   * Toggle between spatial and re-ID modes
   */
  function toggleMode(): void {
    store.toggleTrackingMode()
  }

  return {
    // State
    trackingMode,
    isSpatialMode,
    isReIDMode,
    dualModeEnabled,
    spatialTrackCount,
    reidTrackCount,
    activeTrackCount,

    // Actions
    setMode,
    toggleMode,
  }
}
