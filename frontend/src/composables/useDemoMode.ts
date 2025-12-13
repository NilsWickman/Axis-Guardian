import { ref } from 'vue'

const DEMO_MODE_STORAGE_KEY = 'app-demo-mode'

const isDemoMode = ref<boolean>(true)

// Track if demo mode has been initialized
let initialized = false

function applyDemoMode(enabled: boolean) {
  isDemoMode.value = enabled
  localStorage.setItem(DEMO_MODE_STORAGE_KEY, String(enabled))
}

function initializeDemoMode() {
  if (initialized) return
  initialized = true

  const savedValue = localStorage.getItem(DEMO_MODE_STORAGE_KEY)

  if (savedValue !== null) {
    applyDemoMode(savedValue === 'true')
  } else {
    // Default to demo mode (true) when no saved preference exists
    applyDemoMode(true)
  }
}

// Initialize demo mode immediately when module loads
if (typeof window !== 'undefined') {
  initializeDemoMode()
}

export function useDemoMode() {
  const setDemoMode = (enabled: boolean) => {
    applyDemoMode(enabled)
  }

  const toggleDemoMode = () => {
    setDemoMode(!isDemoMode.value)
  }

  return {
    isDemoMode,
    setDemoMode,
    toggleDemoMode,
    initializeDemoMode,
  }
}
