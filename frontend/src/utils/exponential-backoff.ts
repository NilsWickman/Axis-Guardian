/**
 * Exponential backoff utility for reconnection logic
 * Implements exponential backoff with jitter to prevent thundering herd
 */

export interface BackoffConfig {
  /** Initial delay in milliseconds (default: 1000) */
  initialMs: number
  /** Maximum delay in milliseconds (default: 30000) */
  maxMs: number
  /** Multiplier for each attempt (default: 1.5) */
  multiplier: number
  /** Jitter factor 0-1 to randomize delay (default: 0.2) */
  jitterFactor: number
}

export const DEFAULT_BACKOFF_CONFIG: BackoffConfig = {
  initialMs: 1000,
  maxMs: 30000,
  multiplier: 1.5,
  jitterFactor: 0.2,
}

/**
 * Calculate the next backoff delay with exponential growth and jitter
 *
 * @param attempt - Current attempt number (0-indexed)
 * @param config - Backoff configuration
 * @returns Delay in milliseconds
 */
export function getNextBackoff(
  attempt: number,
  config: Partial<BackoffConfig> = {}
): number {
  const { initialMs, maxMs, multiplier, jitterFactor } = {
    ...DEFAULT_BACKOFF_CONFIG,
    ...config,
  }

  // Calculate base delay: initial * multiplier^attempt
  const baseDelay = Math.min(
    initialMs * Math.pow(multiplier, attempt),
    maxMs
  )

  // Add jitter: random value between -jitterFactor and +jitterFactor of base
  const jitterRange = baseDelay * jitterFactor
  const jitter = (Math.random() * 2 - 1) * jitterRange

  // Ensure we don't go below 0 or above max
  return Math.max(0, Math.min(baseDelay + jitter, maxMs))
}

/**
 * Create a backoff calculator with preset configuration
 */
export function createBackoffCalculator(config: Partial<BackoffConfig> = {}) {
  const mergedConfig = { ...DEFAULT_BACKOFF_CONFIG, ...config }
  let currentAttempt = 0

  return {
    /** Get the next backoff delay and increment attempt counter */
    next(): number {
      const delay = getNextBackoff(currentAttempt, mergedConfig)
      currentAttempt++
      return delay
    },

    /** Reset the attempt counter (call on successful connection) */
    reset(): void {
      currentAttempt = 0
    },

    /** Get current attempt number */
    getAttempt(): number {
      return currentAttempt
    },

    /** Check if max attempts reached (if limit is set) */
    isMaxAttempts(maxAttempts: number): boolean {
      return maxAttempts > 0 && currentAttempt >= maxAttempts
    },
  }
}

/**
 * Format backoff delay for display
 */
export function formatBackoffDelay(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`
  }
  return `${(ms / 1000).toFixed(1)}s`
}
