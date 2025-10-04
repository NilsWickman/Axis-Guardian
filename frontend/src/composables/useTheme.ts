import { ref, onMounted } from 'vue'

export type Theme = 'light' | 'dark' | 'axis-dark'

const THEME_STORAGE_KEY = 'app-theme'
const THEMES: Theme[] = ['light', 'dark', 'axis-dark']

const currentTheme = ref<Theme>('axis-dark')

export function useTheme() {
  const setTheme = (theme: Theme) => {
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

  const toggleTheme = () => {
    const currentIndex = THEMES.indexOf(currentTheme.value)
    const nextIndex = (currentIndex + 1) % THEMES.length
    setTheme(THEMES[nextIndex])
  }

  const initializeTheme = () => {
    // Check localStorage first
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null

    if (savedTheme && THEMES.includes(savedTheme)) {
      setTheme(savedTheme)
    } else {
      // Default to axis-dark
      setTheme('axis-dark')
    }
  }

  onMounted(() => {
    initializeTheme()
  })

  return {
    currentTheme,
    setTheme,
    toggleTheme,
    initializeTheme,
    themes: THEMES,
  }
}
