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
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/timeline/AnalyticsDashboard.vue'),
    meta: {
      title: 'Dashboard',
      roles: ['admin'],
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
    path: '/site-config',
    name: 'SiteMapViewer',
    component: () => import('@/views/SiteMapViewer.vue'),
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
  // Alarms
  {
    path: '/alarms',
    name: 'Alarms',
    component: () => import('@/views/alarms/AlarmKanbanBySiteMap.vue'),
    meta: {
      title: 'Alarms',
    },
  },
  {
    path: '/alarms/:alarmId',
    name: 'AlarmDetail',
    component: () => import('@/views/alarms/AlarmDetail.vue'),
    meta: {
      title: 'Alarm Details',
    },
  },
  {
    path: '/archive',
    name: 'Archive',
    component: () => import('@/views/alarms/AlarmArchive.vue'),
    meta: {
      title: 'Alarm Archive',
      roles: ['admin'],
    },
  },
  // Settings
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/Settings.vue'),
    meta: {
      title: 'System Settings',
      roles: ['admin'],
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

  // Check role-based access
  if (to.meta.roles) {
    // Import auth store dynamically to avoid circular dependencies
    import('@/stores/auth').then(({ useAuthStore }) => {
      const authStore = useAuthStore()
      const userRole = authStore.userRole

      if (!userRole || !to.meta.roles?.includes(userRole)) {
        // User doesn't have required role, redirect to home
        next({ path: '/cameras/focus' })
      } else {
        next()
      }
    })
  } else {
    next()
  }
})

// TypeScript module augmentation for route meta
declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    roles?: string[]
  }
}

export default router
