import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/cameras/focus',
  },
  {
    path: '/cameras/live-detection',
    name: 'LiveDetectionView',
    component: () => import('@/views/camera-views/LiveDetectionView.vue'),
    meta: {
      title: 'Live Detection (HLS)',
    },
  },
  {
    path: '/cameras/snapshot',
    name: 'SnapshotView',
    component: () => import('@/views/camera-views/SnapshotView.vue'),
    meta: {
      title: 'Snapshots (Low Bandwidth)',
    },
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
    path: '/site-tracking',
    name: 'SiteTracking',
    component: () => import('@/views/site-tracking/SiteTrackingView.vue'),
    meta: {
      title: 'Site Tracking',
    },
  },
  {
    path: '/zones',
    name: 'Zones',
    component: () => import('@/views/zones/ZonesView.vue'),
    meta: {
      title: 'Zone Management',
    },
  },
  {
    path: '/replay/:recordingId',
    name: 'Replay',
    component: () => import('@/views/replay/ReplayView.vue'),
    meta: {
      title: 'Replay',
    },
  },
  // Calibration
  {
    path: '/calibration/annotator',
    name: 'CalibrationAnnotator',
    component: () => import('@/views/calibration/CalibrationAnnotator.vue'),
    meta: {
      title: 'Ground Truth Annotator',
    },
  },
  // Dev Tools
  {
    path: '/dev/track-annotator',
    name: 'TrackAnnotator',
    component: () => import('@/views/dev/TrackAnnotator.vue'),
    meta: {
      title: 'Track Identity Annotator',
    },
  },
  {
    path: '/dev/architecture',
    name: 'Architecture',
    component: () => import('@/views/dev/ArchitectureView.vue'),
    meta: {
      title: 'Architecture',
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

// Demo mode configuration
const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true'

// Routes allowed in demo mode (read-only deployment)
const isRouteAllowedInDemoMode = (path: string): boolean => {
  return path.startsWith('/cameras/') || path === '/site-tracking' || path === '/zones' || path.startsWith('/replay/')
}

// Global navigation guards
router.beforeEach((to, _from, next) => {
  // Demo mode: restrict to cameras and site-tracking only
  if (isDemoMode && !isRouteAllowedInDemoMode(to.path)) {
    console.log(`[Demo Mode] Redirecting ${to.path} to /cameras/focus`)
    return next('/cameras/focus')
  }

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
  }
}

export default router
