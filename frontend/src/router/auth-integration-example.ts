/**
 * Example of how to integrate authentication into your Vue Router
 *
 * Add this to your existing router configuration in frontend/src/router/index.ts
 */

import { createRouter, createWebHistory } from 'vue-router'
import { authGuard, guestOnlyGuard } from '@/middleware/auth'
import LoginView from '@/views/auth/LoginView.vue'

// Example router configuration with authentication
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // Public routes
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { requiresAuth: false },
      beforeEnter: guestOnlyGuard, // Redirect if already logged in
    },

    // Protected routes (require authentication)
    {
      path: '/',
      redirect: '/cameras/webrtc-detection',
    },
    {
      path: '/cameras',
      name: 'cameras',
      meta: { requiresAuth: true },
      children: [
        {
          path: 'webrtc-detection',
          name: 'webrtc-detection',
          component: () => import('@/views/camera-views/WebRTCDetectionView.vue'),
          meta: { requiresAuth: true },
        },
        {
          path: 'focus',
          name: 'focus',
          component: () => import('@/views/camera-views/FocusView.vue'),
          meta: { requiresAuth: true },
        },
        {
          path: 'timeline',
          name: 'timeline',
          component: () => import('@/views/camera-views/TimelineView.vue'),
          meta: { requiresAuth: true },
        },
      ],
    },
    {
      path: '/site-maps',
      name: 'site-maps',
      meta: { requiresAuth: true },
      children: [
        {
          path: 'viewer',
          name: 'site-map-viewer',
          component: () => import('@/views/SiteMapViewer.vue'),
          meta: { requiresAuth: true },
        },
        {
          path: 'editor',
          name: 'site-map-editor',
          component: () => import('@/views/SiteMapEditor.vue'),
          meta: { requiresAuth: true },
        },
      ],
    },
    {
      path: '/alarms',
      name: 'alarms',
      component: () => import('@/views/alarms/AlarmKanbanBySiteMap.vue'),
      meta: { requiresAuth: true },
    },

    // 404 Not Found
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFound.vue'),
    },
  ],
})

// Global navigation guard for authentication
router.beforeEach(authGuard)

export default router
