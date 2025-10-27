/**
 * Authentication Middleware for Vue Router
 *
 * Protects routes that require authentication
 */

import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { authService } from '@/api/auth/authService'

/**
 * Check if user is authenticated before accessing protected routes
 */
export async function authGuard(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
): Promise<void> {
  // Check if route requires authentication
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)

  if (!requiresAuth) {
    // Route doesn't require auth, allow access
    next()
    return
  }

  // Check if user has a token
  if (!authService.isAuthenticated()) {
    // No token, redirect to login
    next({
      name: 'login',
      query: { redirect: to.fullPath }, // Save intended destination
    })
    return
  }

  // Verify token is still valid
  const isValid = await authService.verifyToken()

  if (!isValid) {
    // Token is invalid or expired, clear auth and redirect to login
    authService.clearAuth()
    next({
      name: 'login',
      query: { redirect: to.fullPath },
    })
    return
  }

  // User is authenticated, allow access
  next()
}

/**
 * Redirect to main app if already logged in
 * Used on login page
 */
export async function guestOnlyGuard(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
): Promise<void> {
  if (authService.isAuthenticated()) {
    const isValid = await authService.verifyToken()

    if (isValid) {
      // Already logged in, redirect to main app
      next({ name: 'webrtc-detection' })
      return
    } else {
      // Token expired, clear auth and show login
      authService.clearAuth()
    }
  }

  next()
}

/**
 * Check if user has required role
 */
export function roleGuard(allowedRoles: string[]) {
  return async (
    to: RouteLocationNormalized,
    from: RouteLocationNormalized,
    next: NavigationGuardNext
  ): Promise<void> => {
    const user = authService.getUser()

    if (!user) {
      next({ name: 'login', query: { redirect: to.fullPath } })
      return
    }

    if (!allowedRoles.includes(user.role)) {
      // User doesn't have required role
      next({ name: 'unauthorized' })
      return
    }

    next()
  }
}
