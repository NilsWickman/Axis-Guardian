import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: {
      title: 'Dashboard',
    },
  },
  {
    path: '/cameras',
    name: 'Cameras',
    component: () => import('@/views/CameraGrid.vue'),
    meta: {
      title: 'Camera Grid',
    },
  },
  {
    path: '/detections',
    name: 'Detections',
    component: () => import('@/views/DetectionHistory.vue'),
    meta: {
      title: 'Detection History',
    },
  },
  {
    path: '/alarms',
    name: 'Alarms',
    component: () => import('@/views/AlarmCenter.vue'),
    meta: {
      title: 'Alarm Center',
    },
  },
  {
    path: '/site-config',
    name: 'SiteConfig',
    component: () => import('@/views/SiteConfiguration.vue'),
    meta: {
      title: 'Site Configuration',
    },
  },
  {
    path: '/users',
    name: 'Users',
    component: () => import('@/views/UserManagement.vue'),
    meta: {
      title: 'User Management',
    },
  },
  {
    path: '/analytics',
    name: 'Analytics',
    component: () => import('@/views/Analytics.vue'),
    meta: {
      title: 'Analytics',
    },
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/Placeholder.vue'),
    meta: {
      title: 'Settings',
    },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    // Handle scroll restoration for better UX
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  },
})

// Global navigation guards
router.beforeEach((to, _from, next) => {
  // Set document title based on route meta
  if (to.meta.title) {
    document.title = `${to.meta.title} | AXIS Surveillance`
  }

  // Handle authentication if needed
  if (to.meta.requiresAuth) {
    // TODO: Add authentication logic here
    // console.log('Route requires authentication')
  }

  next()
})

// TypeScript module augmentation for route meta
declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    requiresAuth?: boolean
    roles?: string[]
  }
}

export default router
