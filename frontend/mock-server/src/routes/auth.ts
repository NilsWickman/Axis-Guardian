import express from 'express'
import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'

const router = express.Router()
const prisma = new PrismaClient()

// Mock JWT tokens for development
const createMockToken = (user: any) => ({
  accessToken: `mock-access-${user.id}-${Date.now()}`,
  refreshToken: `mock-refresh-${user.id}-${Date.now()}`,
  expiresIn: 3600
})

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password, rememberMe } = req.body

    // Find user
    const user = await prisma.user.findUnique({
      where: { username }
    })

    if (!user) {
      return res.status(401).json({
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid username or password',
        timestamp: new Date().toISOString()
      })
    }

    // In real app, verify password hash
    // For mock server, accept any password
    const tokens = createMockToken(user)

    res.json({
      ...tokens,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role.toLowerCase(),
        permissions: user.permissions
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Login failed',
      timestamp: new Date().toISOString()
    })
  }
})

// POST /auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body

    // In real app, validate refresh token
    // For mock server, generate new tokens
    const mockUser = { id: 'user-1' }
    const tokens = createMockToken(mockUser)

    res.json({
      accessToken: tokens.accessToken,
      expiresIn: tokens.expiresIn
    })
  } catch (error) {
    console.error('Refresh error:', error)
    res.status(401).json({
      error: 'INVALID_TOKEN',
      message: 'Token refresh failed',
      timestamp: new Date().toISOString()
    })
  }
})

// POST /auth/logout
router.post('/logout', (req, res) => {
  // In real app, invalidate tokens
  res.status(204).send()
})

// GET /auth/me
router.get('/me', async (req, res) => {
  try {
    // Extract user from mock token (in real app, from JWT)
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Missing or invalid authorization header',
        timestamp: new Date().toISOString()
      })
    }

    // Mock user for development
    const mockUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (!mockUser) {
      return res.status(404).json({
        error: 'USER_NOT_FOUND',
        message: 'User not found',
        timestamp: new Date().toISOString()
      })
    }

    res.json({
      id: mockUser.id,
      username: mockUser.username,
      email: mockUser.email,
      role: mockUser.role.toLowerCase(),
      permissions: mockUser.permissions
    })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to get user',
      timestamp: new Date().toISOString()
    })
  }
})

export default router