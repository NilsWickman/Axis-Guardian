/**
 * Secure storage abstraction layer
 * Provides a unified interface for storing sensitive data
 * Future: Easy to migrate from localStorage to httpOnly cookies
 */

export class SecureStorage {
  /**
   * Store authentication token
   */
  static setToken(token: string): void {
    try {
      localStorage.setItem('auth_token', token)
    } catch (error) {
      console.error('Failed to store token:', error)
      // Handle quota exceeded or other localStorage errors
    }
  }

  /**
   * Retrieve authentication token
   */
  static getToken(): string | null {
    try {
      return localStorage.getItem('auth_token')
    } catch (error) {
      console.error('Failed to retrieve token:', error)
      return null
    }
  }

  /**
   * Remove authentication token
   */
  static removeToken(): void {
    try {
      localStorage.removeItem('auth_token')
    } catch (error) {
      console.error('Failed to remove token:', error)
    }
  }

  /**
   * Store refresh token
   */
  static setRefreshToken(token: string): void {
    try {
      localStorage.setItem('refresh_token', token)
    } catch (error) {
      console.error('Failed to store refresh token:', error)
    }
  }

  /**
   * Retrieve refresh token
   */
  static getRefreshToken(): string | null {
    try {
      return localStorage.getItem('refresh_token')
    } catch (error) {
      console.error('Failed to retrieve refresh token:', error)
      return null
    }
  }

  /**
   * Remove refresh token
   */
  static removeRefreshToken(): void {
    try {
      localStorage.removeItem('refresh_token')
    } catch (error) {
      console.error('Failed to remove refresh token:', error)
    }
  }

  /**
   * Store user data
   */
  static setUser(user: Record<string, any>): void {
    try {
      localStorage.setItem('user', JSON.stringify(user))
    } catch (error) {
      console.error('Failed to store user:', error)
    }
  }

  /**
   * Retrieve user data
   */
  static getUser<T = Record<string, any>>(): T | null {
    try {
      const user = localStorage.getItem('user')
      if (!user) return null

      // Parse JSON and validate result
      const parsed = JSON.parse(user)

      // If parse resulted in an object string (corrupted data), clear and return null
      if (typeof parsed === 'string' && parsed.startsWith('[object')) {
        console.warn('Corrupted user data detected, clearing storage')
        this.clearAuth()
        return null
      }

      return parsed
    } catch (error) {
      console.error('Failed to retrieve user:', error)
      // Clear corrupted data
      this.clearAuth()
      return null
    }
  }

  /**
   * Remove user data
   */
  static removeUser(): void {
    try {
      localStorage.removeItem('user')
    } catch (error) {
      console.error('Failed to remove user:', error)
    }
  }

  /**
   * Clear all authentication data
   */
  static clearAuth(): void {
    this.removeToken()
    this.removeRefreshToken()
    this.removeUser()
  }

  /**
   * Store any key-value pair
   */
  static set(key: string, value: any): void {
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value)
      localStorage.setItem(key, serialized)
    } catch (error) {
      console.error(`Failed to store ${key}:`, error)
    }
  }

  /**
   * Retrieve any key-value pair
   */
  static get<T = any>(key: string): T | null {
    try {
      const value = localStorage.getItem(key)
      if (!value) return null

      // Try to parse as JSON, fallback to raw string
      try {
        return JSON.parse(value)
      } catch {
        return value as T
      }
    } catch (error) {
      console.error(`Failed to retrieve ${key}:`, error)
      return null
    }
  }

  /**
   * Remove any key
   */
  static remove(key: string): void {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error(`Failed to remove ${key}:`, error)
    }
  }

  /**
   * Check if storage is available
   */
  static isAvailable(): boolean {
    try {
      const test = '__storage_test__'
      localStorage.setItem(test, test)
      localStorage.removeItem(test)
      return true
    } catch {
      return false
    }
  }
}
