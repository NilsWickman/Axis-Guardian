import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/cameras/focus',
  },
  {
    path: '/cameras/focus',
    name: 'FocusView',
    component: () => import('@/views/camera-views/FocusView.vue'),
    meta: {
      title: 'Camera View',
    },
  },
  {
    path: '/cameras/timeline',
    name: 'TimelineView',
    component: () => import('@/views/camera-views/TimelineView.vue'),
    meta: {
      title: 'Timeline',
    },
  },
  {
    path: '/cameras/manage',
    name: 'CameraManagement',
    component: () => import('@/views/camera-views/CameraManagement.vue'),
    meta: {
      title: 'Manage Cameras',
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
    name: 'SiteMapViewer',
    component: () => import('@/views/SiteMapViewer.vue'),
    meta: {
      title: 'Site Maps',
    },
  },
  {
    path: '/site-config/editor',
    name: 'SiteMapEditor',
    component: () => import('@/views/SiteMapEditor.vue'),
    meta: {
      title: 'Site Map Editor',
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

  next()
})

// TypeScript module augmentation for route meta
declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    roles?: string[]
  }
}

export default router
