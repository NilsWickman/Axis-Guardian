/**
 * Zones Store - Restricted zone configuration and violation tracking
 *
 * Manages restricted zones for the site map and tracks violations in-memory.
 * Violations reset on camera restart or manual reset.
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { config } from '../config/environment'
import { useToast } from '../composables/useToast'

// ============================================================================
// Types
// ============================================================================

export type ZoneType = 'restricted' | 'entry' | 'exit' | 'monitored'
export type ZoneSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface ZoneVertex {
  x: number
  y: number
}

export interface ZoneConfig {
  id: string
  siteConfigId: string
  name: string
  type: ZoneType
  vertices: ZoneVertex[]
  enabled: boolean
  severity: ZoneSeverity
  color: string
  cooldownMs: number
  createdAt?: string
  updatedAt?: string
}

export interface ZoneViolation {
  id: string
  zoneId: string
  zoneName: string
  zoneType: ZoneType
  trackId: string
  violationType: 'entry' | 'exit' | 'present'
  position: { x: number; y: number }
  timestamp: number
  severity: ZoneSeverity
  cameraIds: string[]
}

export interface CreateZoneRequest {
  siteConfigId: string
  name: string
  type: ZoneType
  vertices: ZoneVertex[]
  enabled?: boolean
  severity?: ZoneSeverity
  color?: string
  cooldownMs?: number
}

export interface UpdateZoneRequest {
  name?: string
  type?: ZoneType
  vertices?: ZoneVertex[]
  enabled?: boolean
  severity?: ZoneSeverity
  color?: string
  cooldownMs?: number
}

export interface ZoneMetricsData {
  zoneId: string
  currentCount: number
  totalEntered: number
  crossedCount: number
}

// Resource limits
const MAX_VIOLATIONS = 100

// ============================================================================
// Store
// ============================================================================

export const useZoneStore = defineStore('zones', () => {
  // State
  const zones = ref<ZoneConfig[]>([])
  const violations = ref<ZoneViolation[]>([])
  const zoneMetrics = ref<Map<string, ZoneMetricsData>>(new Map())
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Toast cooldown tracking
  const lastToastTime = ref<Map<string, number>>(new Map())
  const toast = useToast()

  // Getters
  const enabledZones = computed(() => zones.value.filter(z => z.enabled))

  const restrictedZones = computed(() => zones.value.filter(z => z.type === 'restricted'))

  const entryZones = computed(() => zones.value.filter(z => z.type === 'entry'))

  const exitZones = computed(() => zones.value.filter(z => z.type === 'exit'))

  const monitoredZones = computed(() => zones.value.filter(z => z.type === 'monitored'))

  const recentViolations = computed(() =>
    [...violations.value].sort((a, b) => b.timestamp - a.timestamp).slice(0, 20)
  )

  const violationCount = computed(() => violations.value.length)

  const criticalViolations = computed(() =>
    violations.value.filter(v => v.severity === 'critical')
  )

  // Get API base URL
  function getApiUrl(): string {
    return config.trackingServiceApiUrl || 'http://localhost:3010'
  }

  // Actions

  /**
   * Fetch all zones from the API
   */
  async function fetchZones(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const response = await fetch(`${getApiUrl()}/api/zones`)
      if (!response.ok) {
        throw new Error(`Failed to fetch zones: ${response.statusText}`)
      }
      zones.value = await response.json()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch zones'
      console.error('[ZoneStore] Failed to fetch zones:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Create a new zone
   */
  async function createZone(data: CreateZoneRequest): Promise<ZoneConfig | null> {
    loading.value = true
    error.value = null

    try {
      const response = await fetch(`${getApiUrl()}/api/zones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to create zone: ${response.statusText}`)
      }

      const newZone = await response.json()
      zones.value.push(newZone)
      return newZone
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create zone'
      console.error('[ZoneStore] Failed to create zone:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Update an existing zone
   */
  async function updateZone(id: string, data: UpdateZoneRequest): Promise<ZoneConfig | null> {
    loading.value = true
    error.value = null

    try {
      const response = await fetch(`${getApiUrl()}/api/zones/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to update zone: ${response.statusText}`)
      }

      const updatedZone = await response.json()
      const index = zones.value.findIndex(z => z.id === id)
      if (index !== -1) {
        zones.value[index] = updatedZone
      }
      return updatedZone
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update zone'
      console.error('[ZoneStore] Failed to update zone:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete a zone
   */
  async function deleteZone(id: string): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      const response = await fetch(`${getApiUrl()}/api/zones/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to delete zone: ${response.statusText}`)
      }

      zones.value = zones.value.filter(z => z.id !== id)
      // Also remove violations for this zone
      violations.value = violations.value.filter(v => v.zoneId !== id)
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete zone'
      console.error('[ZoneStore] Failed to delete zone:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Toggle zone enabled state
   */
  async function toggleZone(id: string): Promise<boolean> {
    const zone = zones.value.find(z => z.id === id)
    if (!zone) return false

    const result = await updateZone(id, { enabled: !zone.enabled })
    return result !== null
  }

  /**
   * Reset all alarm states on the server (for camera restart)
   */
  async function resetAlarmStates(): Promise<boolean> {
    try {
      const response = await fetch(`${getApiUrl()}/api/zones/reset`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error(`Failed to reset alarm states: ${response.statusText}`)
      }

      // Clear local violations
      violations.value = []
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to reset alarm states'
      console.error('[ZoneStore] Failed to reset alarm states:', err)
      return false
    }
  }

  /**
   * Handle incoming zone violation from WebSocket
   */
  function handleZoneViolation(violation: ZoneViolation): void {
    // Add to beginning for most recent first
    violations.value.unshift(violation)

    // Trigger toast notification with cooldown
    triggerViolationToast(violation)

    // Trim to prevent unbounded growth
    if (violations.value.length > MAX_VIOLATIONS) {
      violations.value = violations.value.slice(0, MAX_VIOLATIONS)
    }
  }

  /**
   * Trigger toast notification for violation with cooldown
   */
  function triggerViolationToast(violation: ZoneViolation): void {
    const zone = zones.value.find(z => z.id === violation.zoneId)
    const cooldown = Math.max(zone?.cooldownMs ?? 3000, 3000)
    const lastTime = lastToastTime.value.get(violation.zoneId) ?? 0

    if (Date.now() - lastTime < cooldown) return

    lastToastTime.value.set(violation.zoneId, Date.now())

    const actionWord = violation.violationType === 'entry' ? 'entered' :
                       violation.violationType === 'exit' ? 'exited' : 'in'
    const message = `Alert: Person ${actionWord} ${violation.zoneName}`

    switch (violation.severity) {
      case 'critical':
        toast.error(message, 5000)
        break
      case 'high':
        toast.warning(message)
        break
      default:
        toast.info(message)
    }
  }

  /**
   * Handle zones_updated message from WebSocket
   */
  function handleZonesUpdated(updatedZones: ZoneConfig[]): void {
    zones.value = updatedZones
  }

  /**
   * Handle snapshot message with zones
   */
  function handleSnapshot(snapshotZones: ZoneConfig[] | undefined, snapshotMetrics?: ZoneMetricsData[]): void {
    if (snapshotZones) {
      zones.value = snapshotZones
    }
    if (snapshotMetrics) {
      zoneMetrics.value.clear()
      for (const metrics of snapshotMetrics) {
        zoneMetrics.value.set(metrics.zoneId, metrics)
      }
    }
  }

  /**
   * Handle zone metrics update from WebSocket
   */
  function handleZoneMetrics(metrics: ZoneMetricsData): void {
    zoneMetrics.value.set(metrics.zoneId, metrics)
  }

  /**
   * Handle zones reset from WebSocket (video restart)
   */
  function handleZonesReset(): void {
    violations.value = []
    zoneMetrics.value.clear()
    lastToastTime.value.clear()
  }

  /**
   * Get metrics for a specific zone
   */
  function getMetrics(zoneId: string): ZoneMetricsData | undefined {
    return zoneMetrics.value.get(zoneId)
  }

  /**
   * Clear all violations (local only)
   */
  function clearViolations(): void {
    violations.value = []
  }

  /**
   * Get a zone by ID
   */
  function getZoneById(id: string): ZoneConfig | undefined {
    return zones.value.find(z => z.id === id)
  }

  /**
   * Get violations for a specific zone
   */
  function getViolationsForZone(zoneId: string): ZoneViolation[] {
    return violations.value.filter(v => v.zoneId === zoneId)
  }

  /**
   * Get violations for a specific track
   */
  function getViolationsForTrack(trackId: string): ZoneViolation[] {
    return violations.value.filter(v => v.trackId === trackId)
  }

  return {
    // State
    zones,
    violations,
    zoneMetrics,
    loading,
    error,

    // Getters
    enabledZones,
    restrictedZones,
    entryZones,
    exitZones,
    monitoredZones,
    recentViolations,
    violationCount,
    criticalViolations,

    // Actions
    fetchZones,
    createZone,
    updateZone,
    deleteZone,
    toggleZone,
    resetAlarmStates,
    handleZoneViolation,
    handleZonesUpdated,
    handleSnapshot,
    handleZoneMetrics,
    handleZonesReset,
    clearViolations,
    getZoneById,
    getMetrics,
    getViolationsForZone,
    getViolationsForTrack,
  }
})
