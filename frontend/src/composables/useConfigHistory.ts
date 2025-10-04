import { ref, computed } from 'vue'

export interface HistoryState<T> {
  state: T
  timestamp: number
}

export function useConfigHistory<T>(maxHistory: number = 50) {
  const history = ref<HistoryState<T>[]>([])
  const currentIndex = ref(-1)

  const canUndo = computed(() => currentIndex.value > 0)
  const canRedo = computed(() => currentIndex.value < history.value.length - 1)

  const addToHistory = (state: T) => {
    // Remove any future states if we're not at the end
    if (currentIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, currentIndex.value + 1)
    }

    // Add new state
    history.value.push({
      state: JSON.parse(JSON.stringify(state)), // Deep clone
      timestamp: Date.now()
    })

    // Limit history size
    if (history.value.length > maxHistory) {
      history.value.shift()
    } else {
      currentIndex.value++
    }
  }

  const undo = (): T | null => {
    if (!canUndo.value) return null

    currentIndex.value--
    return JSON.parse(JSON.stringify(history.value[currentIndex.value].state))
  }

  const redo = (): T | null => {
    if (!canRedo.value) return null

    currentIndex.value++
    return JSON.parse(JSON.stringify(history.value[currentIndex.value].state))
  }

  const getCurrentState = (): T | null => {
    if (currentIndex.value === -1) return null
    return JSON.parse(JSON.stringify(history.value[currentIndex.value].state))
  }

  const clear = () => {
    history.value = []
    currentIndex.value = -1
  }

  const initialize = (initialState: T) => {
    clear()
    addToHistory(initialState)
  }

  return {
    canUndo,
    canRedo,
    addToHistory,
    undo,
    redo,
    getCurrentState,
    clear,
    initialize
  }
}
