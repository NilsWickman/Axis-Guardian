// Authentication API client implementation
import type { LoginRequest, LoginResponse, RefreshRequest, TokenResponse, User } from '../../types/generated'

export class AuthApiClient {
  private baseUrl = 'http://localhost:8000'

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    })

    if (!response.ok) {
      throw new Error('Login failed')
    }

    return response.json()
  }

  async refreshToken(request: RefreshRequest): Promise<TokenResponse> {
    const response = await fetch(`${this.baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getStoredToken()}`,
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      throw new Error('Token refresh failed')
    }

    return response.json()
  }

  async logout(): Promise<void> {
    const response = await fetch(`${this.baseUrl}/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.getStoredToken()}`,
      },
    })

    if (!response.ok) {
      throw new Error('Logout failed')
    }

    this.clearStoredToken()
  }

  async getCurrentUser(): Promise<User> {
    const response = await fetch(`${this.baseUrl}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${this.getStoredToken()}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to get current user')
    }

    return response.json()
  }

  private getStoredToken(): string | null {
    return localStorage.getItem('accessToken')
  }

  private clearStoredToken(): void {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
  }

  public storeTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
  }

  public isAuthenticated(): boolean {
    return !!this.getStoredToken()
  }
}