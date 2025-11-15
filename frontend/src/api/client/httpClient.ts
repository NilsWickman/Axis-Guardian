/**
 * Unified HTTP client with interceptors, retry logic, and mock mode support
 */

import { config } from '@/config/environment'
import { ApiErrorHandler, type ApiError } from '@/types/errors'

export interface RequestOptions extends RequestInit {
  timeout?: number
  retries?: number
  params?: Record<string, string | number | boolean>
}

export interface HttpResponse<T = any> {
  data: T
  status: number
  statusText: string
  headers: Headers
}

export class HttpClient {
  private baseUrl: string
  private timeout: number
  private mockMode: boolean

  constructor(baseUrl?: string, mockMode?: boolean) {
    this.baseUrl = baseUrl || config.apiBaseUrl
    this.timeout = config.apiTimeout
    this.mockMode = mockMode ?? config.useMockData
  }

  /**
   * Make a GET request
   */
  async get<T = any>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }

  /**
   * Make a POST request
   */
  async post<T = any>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * Make a PUT request
   */
  async put<T = any>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * Make a PATCH request
   */
  async patch<T = any>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * Make a DELETE request
   */
  async delete<T = any>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }

  /**
   * Core request method with retry logic and error handling
   */
  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { retries = 3, timeout = this.timeout, params, ...fetchOptions } = options

    let lastError: ApiError | undefined
    let attemptNumber = 0

    while (attemptNumber < retries) {
      try {
        const url = this.buildUrl(endpoint, params)
        const headers = this.buildHeaders(fetchOptions.headers)
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)

        const response = await fetch(url, {
          ...fetchOptions,
          headers,
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        // Handle HTTP errors
        if (!response.ok) {
          const error = await this.handleErrorResponse(response)
          throw error
        }

        // Parse response
        const data = await this.parseResponse<T>(response)
        return data
      } catch (error) {
        lastError = ApiErrorHandler.handle(error)

        // Check if we should retry
        if (ApiErrorHandler.shouldRetry(lastError, attemptNumber, retries)) {
          attemptNumber++
          const delay = ApiErrorHandler.getRetryDelay(attemptNumber)
          await this.sleep(delay)
          continue
        }

        // No more retries, throw the error
        throw lastError
      }
    }

    // This should never be reached, but TypeScript doesn't know that
    throw lastError || new Error('Request failed after retries')
  }

  /**
   * Build full URL with query parameters
   */
  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean>): string {
    const url = new URL(endpoint, this.baseUrl)

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value))
      })
    }

    return url.toString()
  }

  /**
   * Build request headers
   */
  private buildHeaders(customHeaders?: HeadersInit): Headers {
    const headers = new Headers(customHeaders)

    // Add Content-Type if not present
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }

    return headers
  }

  /**
   * Parse response based on Content-Type
   */
  private async parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('Content-Type') || ''

    if (contentType.includes('application/json')) {
      return response.json()
    }

    if (contentType.includes('text/')) {
      return response.text() as T
    }

    // Default to JSON
    try {
      return response.json()
    } catch {
      return response.text() as T
    }
  }

  /**
   * Handle error responses
   */
  private async handleErrorResponse(response: Response): Promise<ApiError> {
    let message = response.statusText
    let details: any

    try {
      const body = await response.json()
      message = body.message || body.error || message
      details = body.details
    } catch {
      // Response body is not JSON
    }

    return ApiErrorHandler.handle({
      statusCode: response.status,
      message,
      details,
    })
  }

  /**
   * Sleep helper for retries
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Enable mock mode
   */
  setMockMode(enabled: boolean): void {
    this.mockMode = enabled
  }

  /**
   * Check if in mock mode
   */
  isMockMode(): boolean {
    return this.mockMode
  }
}

// Export singleton instance
export const httpClient = new HttpClient()
