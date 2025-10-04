// Application settings store
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Zone, CameraPlacement } from '../types/generated'
import { mockZones } from '../mocks/data'

// Site configuration types
interface CameraPlacement {
  cameraId: string
  x: number
  y: number
  rotation: number
  angle: number
  height: number
  fov: number
  viewDistance: number
  autoCalculateDistance: boolean
  color: string
  notes?: string
}

interface SiteConfig {
  id: string
  name: string
  cameraPlacement: CameraPlacement[]
  zones: Zone[]
  mapSettings: {
    width: number
    height: number
    scale: number
  }
}

export const useSettingsStore = defineStore('settings', () => {
  // State
  const theme = ref<'light' | 'dark'>('dark')
  const sidebarCollapsed = ref(false)
  const notifications = ref(true)
  const soundEnabled = ref(true)
  const autoRefresh = ref(true)
  const refreshInterval = ref(5000) // ms

  // Site configuration
  const zones = ref<Zone[]>([...mockZones])
  const siteConfig = ref<SiteConfig>({
    id: 'site-001',
    name: 'Main Facility',
    cameraPlacement: [],
    zones: [...mockZones],
    mapSettings: {
      width: 1000,
      height: 800,
      scale: 50, // pixels per meter
    },
  })

  // Getters
  const isDarkMode = computed(() => theme.value === 'dark')

  // Actions
  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    localStorage.setItem('theme', theme.value)
    updateThemeClass()
  }

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
    localStorage.setItem('sidebarCollapsed', String(sidebarCollapsed.value))
  }

  function updateThemeClass() {
    if (theme.value === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  function toggleNotifications() {
    notifications.value = !notifications.value
    localStorage.setItem('notifications', String(notifications.value))
  }

  function toggleSound() {
    soundEnabled.value = !soundEnabled.value
    localStorage.setItem('soundEnabled', String(soundEnabled.value))
  }

  function toggleAutoRefresh() {
    autoRefresh.value = !autoRefresh.value
    localStorage.setItem('autoRefresh', String(autoRefresh.value))
  }

  function setRefreshInterval(interval: number) {
    refreshInterval.value = interval
    localStorage.setItem('refreshInterval', String(interval))
  }

  // Zone management
  async function fetchZones() {
    zones.value = [...mockZones]
  }

  function addZone(zone: Zone) {
    zones.value.push(zone)
    siteConfig.value.zones = [...zones.value]
  }

  function updateZone(zoneId: string, updates: Partial<Zone>) {
    const index = zones.value.findIndex((z) => z.id === zoneId)
    if (index !== -1) {
      zones.value[index] = { ...zones.value[index], ...updates }
      siteConfig.value.zones = [...zones.value]
    }
  }

  function deleteZone(zoneId: string) {
    zones.value = zones.value.filter((z) => z.id !== zoneId)
    siteConfig.value.zones = [...zones.value]
  }

  // Camera placement
  function saveCameraPlacement(placements: CameraPlacement[]) {
    siteConfig.value.cameraPlacement = placements
    localStorage.setItem('cameraPlacement', JSON.stringify(placements))
  }

  function loadCameraPlacement(): CameraPlacement[] {
    const stored = localStorage.getItem('cameraPlacement')
    if (stored) {
      try {
        const placements = JSON.parse(stored)
        siteConfig.value.cameraPlacement = placements
        return placements
      } catch (err) {
        console.error('Failed to load camera placement:', err)
      }
    }
    return []
  }

  // Restore settings from localStorage
  function restoreSettings() {
    const storedTheme = localStorage.getItem('theme')
    if (storedTheme === 'light' || storedTheme === 'dark') {
      theme.value = storedTheme
    }

    const storedSidebar = localStorage.getItem('sidebarCollapsed')
    if (storedSidebar) {
      sidebarCollapsed.value = storedSidebar === 'true'
    }

    const storedNotifications = localStorage.getItem('notifications')
    if (storedNotifications) {
      notifications.value = storedNotifications === 'true'
    }

    const storedSound = localStorage.getItem('soundEnabled')
    if (storedSound) {
      soundEnabled.value = storedSound === 'true'
    }

    const storedAutoRefresh = localStorage.getItem('autoRefresh')
    if (storedAutoRefresh) {
      autoRefresh.value = storedAutoRefresh === 'true'
    }

    const storedInterval = localStorage.getItem('refreshInterval')
    if (storedInterval) {
      refreshInterval.value = parseInt(storedInterval, 10)
    }

    updateThemeClass()
    loadCameraPlacement()
  }

  return {
    // State
    theme,
    sidebarCollapsed,
    notifications,
    soundEnabled,
    autoRefresh,
    refreshInterval,
    zones,
    siteConfig,
    // Getters
    isDarkMode,
    // Actions
    toggleTheme,
    toggleSidebar,
    toggleNotifications,
    toggleSound,
    toggleAutoRefresh,
    setRefreshInterval,
    fetchZones,
    addZone,
    updateZone,
    deleteZone,
    saveCameraPlacement,
    loadCameraPlacement,
    restoreSettings,
  }
})