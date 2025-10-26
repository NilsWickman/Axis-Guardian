/**
 * Structured error types for API error handling
 */

export type ErrorType = 'network' | 'validation' | 'auth' | 'server' | 'timeout' | 'unknown'

export interface ApiError {
  type: ErrorType
  message: string
  statusCode?: number
  field?: string // For validation errors
  retryable: boolean
  originalError?: unknown
  details?: Record<string, any>
}

export class ApiErrorHandler {
  /**
   * Transform any error into a structured ApiError
   */
  static handle(error: unknown): ApiError {
    // Handle fetch/network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        type: 'network',
        message: 'Network connection failed. Please check your internet connection.',
        retryable: true,
        originalError: error,
      }
    }

    // Handle timeout errors
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        type: 'timeout',
        message: 'Request timed out. Please try again.',
        retryable: true,
        originalError: error,
      }
    }

    // Handle HTTP error responses
    if (typeof error === 'object' && error !== null && 'statusCode' in error) {
      const httpError = error as { statusCode: number; message?: string; details?: any }

      if (httpError.statusCode === 401) {
        return {
          type: 'auth',
          message: 'Authentication required. Please log in.',
          statusCode: 401,
          retryable: false,
          originalError: error,
        }
      }

      if (httpError.statusCode === 403) {
        return {
          type: 'auth',
          message: 'You do not have permission to perform this action.',
          statusCode: 403,
          retryable: false,
          originalError: error,
        }
      }

      if (httpError.statusCode === 422) {
        return {
          type: 'validation',
          message: httpError.message || 'Validation error',
          statusCode: 422,
          retryable: false,
          originalError: error,
          details: httpError.details,
        }
      }

      if (httpError.statusCode >= 500) {
        return {
          type: 'server',
          message: 'Server error. Please try again later.',
          statusCode: httpError.statusCode,
          retryable: true,
          originalError: error,
        }
      }
    }

    // Generic error fallback
    const message = error instanceof Error ? error.message : 'An unexpected error occurred'
    return {
      type: 'unknown',
      message,
      retryable: false,
      originalError: error,
    }
  }

  /**
   * Check if an error should trigger a retry
   */
  static shouldRetry(error: ApiError, attemptNumber: number, maxAttempts = 3): boolean {
    if (attemptNumber >= maxAttempts) return false
    return error.retryable
  }

  /**
   * Calculate exponential backoff delay
   */
  static getRetryDelay(attemptNumber: number, baseDelay = 1000): number {
    return Math.min(baseDelay * Math.pow(2, attemptNumber), 10000)
  }
}
