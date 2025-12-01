/**
 * Global Cleanup Registry
 *
 * Provides a centralized way to register cleanup functions that should run
 * on HMR updates, page unload, or manual cleanup triggers.
 *
 * This helps prevent memory leaks by ensuring all resources are properly
 * cleaned up even during hot module replacement.
 */

type CleanupFunction = () => void

const cleanupFunctions = new Set<CleanupFunction>()
let isCleanupRegistered = false

/**
 * Register a cleanup function that will be called during cleanup events
 * @returns An unregister function to remove the cleanup
 */
export function registerCleanup(fn: CleanupFunction): () => void {
  cleanupFunctions.add(fn)

  // Set up global cleanup handlers once
  if (!isCleanupRegistered) {
    setupGlobalHandlers()
    isCleanupRegistered = true
  }

  // Return unregister function
  return () => {
    cleanupFunctions.delete(fn)
  }
}

/**
 * Run all registered cleanup functions
 */
export function runAllCleanups(): void {
  console.log(`[CleanupRegistry] Running ${cleanupFunctions.size} cleanup functions`)

  cleanupFunctions.forEach((fn) => {
    try {
      fn()
    } catch (error) {
      console.error('[CleanupRegistry] Cleanup function error:', error)
    }
  })
}

/**
 * Clear all registered cleanup functions without running them
 */
export function clearRegistry(): void {
  cleanupFunctions.clear()
}

/**
 * Get the number of registered cleanup functions
 */
export function getRegisteredCount(): number {
  return cleanupFunctions.size
}

/**
 * Set up global event handlers for cleanup
 */
function setupGlobalHandlers(): void {
  // Handle page unload
  window.addEventListener('beforeunload', () => {
    runAllCleanups()
  })

  // Handle Vite HMR (Hot Module Replacement)
  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      console.log('[CleanupRegistry] HMR dispose - running cleanups')
      runAllCleanups()
    })
  }
}

/**
 * Create a cleanup scope that automatically unregisters on unmount
 * Use in Vue composables with onUnmounted
 */
export function createCleanupScope(): {
  register: (fn: CleanupFunction) => void
  cleanup: () => void
} {
  const scopedCleanups: CleanupFunction[] = []
  const unregisters: (() => void)[] = []

  return {
    register(fn: CleanupFunction) {
      scopedCleanups.push(fn)
      unregisters.push(registerCleanup(fn))
    },
    cleanup() {
      // Run all scoped cleanups
      scopedCleanups.forEach((fn) => {
        try {
          fn()
        } catch (error) {
          console.error('[CleanupScope] Cleanup error:', error)
        }
      })

      // Unregister from global registry
      unregisters.forEach((unregister) => unregister())

      // Clear local references
      scopedCleanups.length = 0
      unregisters.length = 0
    },
  }
}
