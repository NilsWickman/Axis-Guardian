import { ref } from 'vue'

export type Theme = 'light' | 'dark'

const THEME_STORAGE_KEY = 'app-theme'
const THEMES: Theme[] = ['light', 'dark']

const currentTheme = ref<Theme>('dark')

// Track if theme has been initialized
let initialized = false

function applyTheme(theme: Theme) {
  currentTheme.value = theme

  // Remove all theme classes
  THEMES.forEach(t => {
    document.documentElement.classList.remove(t)
  })

  // Add the selected theme class
  document.documentElement.classList.add(theme)

  // Persist to localStorage
  localStorage.setItem(THEME_STORAGE_KEY, theme)
}

function initializeTheme() {
  if (initialized) return
  initialized = true

  // Check localStorage first
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY)

  // Migrate old axis-dark to dark
  if (savedTheme === 'axis-dark') {
    applyTheme('dark')
    return
  }

  if (savedTheme && THEMES.includes(savedTheme as Theme)) {
    applyTheme(savedTheme as Theme)
  } else {
    // Default to dark (Axis theme)
    applyTheme('dark')
  }
}

// Initialize theme immediately when module loads
if (typeof window !== 'undefined') {
  initializeTheme()
}

export function useTheme() {
  const setTheme = (theme: Theme) => {
    applyTheme(theme)
  }

  const toggleTheme = () => {
    setTheme(currentTheme.value === 'light' ? 'dark' : 'light')
  }

  return {
    currentTheme,
    setTheme,
    toggleTheme,
    initializeTheme,
    themes: THEMES,
  }
}
