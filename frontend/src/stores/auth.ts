// User authentication store
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, LoginRequest, LoginResponse, Permission } from '../types/generated'
import { mockUsers, mockRoles } from '../mocks/data'

// Mock JWT utilities
interface JWTPayload {
  userId: string
  username: string
  role: string
  email?: string
  iat: number
  exp: number
}

function generateMockJWT(user: User, expiresIn: number = 3600): string {
  const payload: JWTPayload = {
    userId: user.id,
    username: user.username,
    role: user.role,
    email: user.email,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + expiresIn,
  }
  // In a real app, this would be properly signed
  return `mock.${btoa(JSON.stringify(payload))}.signature`
}

function decodeMockJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3 || parts[0] !== 'mock') return null
    return JSON.parse(atob(parts[1]))
  } catch {
    return null
  }
}

function isTokenExpired(token: string): boolean {
  const payload = decodeMockJWT(token)
  if (!payload) return true
  return payload.exp < Math.floor(Date.now() / 1000)
}

export const useAuthStore = defineStore('auth', () => {
  // State
  const currentUser = ref<User | null>(null)
  const accessToken = ref<string | null>(null)
  const refreshToken = ref<string | null>(null)
  const isAuthenticated = ref(false)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const userRole = computed(() => currentUser.value?.role)
  const userPermissions = computed<Permission[]>(() => {
    if (!currentUser.value?.role) return []
    const role = mockRoles.find((r) => r.name === currentUser.value?.role)
    return role?.permissions || []
  })
  const isAdmin = computed(() => currentUser.value?.role === 'admin')
  const isOperator = computed(() => currentUser.value?.role === 'operator')
  const isViewer = computed(() => currentUser.value?.role === 'viewer')

  // Actions
  async function login(credentials: LoginRequest): Promise<LoginResponse> {
    loading.value = true
    error.value = null

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Find user in mock data
      const user = mockUsers.find((u) => u.username === credentials.username)

      if (!user) {
        throw new Error('Invalid username or password')
      }

      // Generate JWT tokens
      const mockAccessToken = generateMockJWT(user, 3600) // 1 hour
      const mockRefreshToken = generateMockJWT(user, 604800) // 7 days

      currentUser.value = user
      accessToken.value = mockAccessToken
      refreshToken.value = mockRefreshToken
      isAuthenticated.value = true

      // Store in localStorage
      localStorage.setItem('accessToken', mockAccessToken)
      localStorage.setItem('refreshToken', mockRefreshToken)
      localStorage.setItem('currentUser', JSON.stringify(user))

      return {
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
        expiresIn: 3600,
        user,
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Login failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    currentUser.value = null
    accessToken.value = null
    refreshToken.value = null
    isAuthenticated.value = false

    // Clear localStorage
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('currentUser')
  }

  async function refreshSession() {
    loading.value = true
    error.value = null

    try {
      const storedRefreshToken = refreshToken.value || localStorage.getItem('refreshToken')

      if (!storedRefreshToken || isTokenExpired(storedRefreshToken)) {
        throw new Error('Refresh token expired')
      }

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 300))

      const payload = decodeMockJWT(storedRefreshToken)
      if (!payload || !currentUser.value) {
        throw new Error('Invalid refresh token')
      }

      // Generate new access token
      const newAccessToken = generateMockJWT(currentUser.value, 3600)
      accessToken.value = newAccessToken
      localStorage.setItem('accessToken', newAccessToken)

      return { accessToken: newAccessToken, expiresIn: 3600 }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Session refresh failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  function restoreSession() {
    const storedToken = localStorage.getItem('accessToken')
    const storedRefreshToken = localStorage.getItem('refreshToken')
    const storedUser = localStorage.getItem('currentUser')

    if (storedToken && storedUser) {
      try {
        // Verify token is not expired
        if (isTokenExpired(storedToken)) {
          // Try to refresh if we have a refresh token
          if (storedRefreshToken && !isTokenExpired(storedRefreshToken)) {
            refreshToken.value = storedRefreshToken
            currentUser.value = JSON.parse(storedUser)
            refreshSession().catch(() => logout())
            return
          }
          logout()
          return
        }

        accessToken.value = storedToken
        refreshToken.value = storedRefreshToken
        currentUser.value = JSON.parse(storedUser)
        isAuthenticated.value = true
      } catch (err) {
        console.error('Failed to restore session:', err)
        logout()
      }
    } else if (import.meta.env.DEV) {
      // AUTO-LOGIN AS ADMIN FOR DEVELOPMENT
      // If no session exists, automatically log in as admin (dev only)
      const adminUser = mockUsers.find((u) => u.username === 'admin')
      if (adminUser) {
        console.log('🔓 Auto-login as admin (development mode)')
        const mockAccessToken = generateMockJWT(adminUser, 3600)
        const mockRefreshToken = generateMockJWT(adminUser, 604800)

        currentUser.value = adminUser
        accessToken.value = mockAccessToken
        refreshToken.value = mockRefreshToken
        isAuthenticated.value = true

        // Store in localStorage
        localStorage.setItem('accessToken', mockAccessToken)
        localStorage.setItem('refreshToken', mockRefreshToken)
        localStorage.setItem('currentUser', JSON.stringify(adminUser))
      }
    }
  }

  function hasPermission(permission: Permission): boolean {
    return userPermissions.value.includes(permission)
  }

  function hasAnyPermission(permissions: Permission[]): boolean {
    return permissions.some((p) => userPermissions.value.includes(p))
  }

  function hasAllPermissions(permissions: Permission[]): boolean {
    return permissions.every((p) => userPermissions.value.includes(p))
  }

  function getRolePermissions(roleName?: 'admin' | 'operator' | 'viewer'): Permission[] {
    const role = mockRoles.find((r) => r.name === (roleName || currentUser.value?.role))
    return role?.permissions || []
  }

  // All users for user management
  const allUsers = ref<User[]>([...mockUsers])

  async function fetchUsers() {
    loading.value = true
    error.value = null
    try {
      await new Promise((resolve) => setTimeout(resolve, 300))
      allUsers.value = [...mockUsers]
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch users'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateUser(userId: string, updates: Partial<User>) {
    loading.value = true
    error.value = null
    try {
      await new Promise((resolve) => setTimeout(resolve, 400))

      const userIndex = mockUsers.findIndex((u) => u.id === userId)
      if (userIndex === -1) {
        throw new Error('User not found')
      }

      // Update in mock data
      mockUsers[userIndex] = { ...mockUsers[userIndex], ...updates }

      // Update in allUsers
      const allUserIndex = allUsers.value.findIndex((u) => u.id === userId)
      if (allUserIndex !== -1) {
        allUsers.value[allUserIndex] = { ...allUsers.value[allUserIndex], ...updates }
      }

      // If updating current user, update current user state
      if (currentUser.value?.id === userId) {
        currentUser.value = { ...currentUser.value, ...updates }
        localStorage.setItem('currentUser', JSON.stringify(currentUser.value))
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update user'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteUser(userId: string) {
    loading.value = true
    error.value = null
    try {
      await new Promise((resolve) => setTimeout(resolve, 400))

      const userIndex = mockUsers.findIndex((u) => u.id === userId)
      if (userIndex === -1) {
        throw new Error('User not found')
      }

      // Remove from mock data
      mockUsers.splice(userIndex, 1)

      // Remove from allUsers
      allUsers.value = allUsers.value.filter((u) => u.id !== userId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete user'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createUser(newUser: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) {
    loading.value = true
    error.value = null
    try {
      await new Promise((resolve) => setTimeout(resolve, 400))

      // Check if username already exists
      if (mockUsers.some((u) => u.username === newUser.username)) {
        throw new Error('Username already exists')
      }

      // Check if email already exists
      if (newUser.email && mockUsers.some((u) => u.email === newUser.email)) {
        throw new Error('Email already exists')
      }

      // Create new user
      const user: User = {
        id: `user-${Date.now()}`,
        ...newUser,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // Add to mock data
      mockUsers.push(user)

      // Add to allUsers
      allUsers.value.push(user)

      return user
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create user'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    currentUser,
    accessToken,
    refreshToken,
    isAuthenticated,
    loading,
    error,
    allUsers,
    // Getters
    userRole,
    userPermissions,
    isAdmin,
    isOperator,
    isViewer,
    // Actions
    login,
    logout,
    refreshSession,
    restoreSession,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getRolePermissions,
    fetchUsers,
    updateUser,
    deleteUser,
    createUser,
  }
})