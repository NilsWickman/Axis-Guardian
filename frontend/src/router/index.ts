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
    path: '/cameras/timeline',
    name: 'TimelineView',
    component: () => import('@/views/camera-views/TimelineView.vue'),
    meta: {
      title: 'Timeline',
    },
  },
  {
    path: '/cameras/frame-review',
    name: 'FrameReviewView',
    component: () => import('@/views/camera-views/FrameReviewView.vue'),
    meta: {
      title: 'Frame Review',
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
    path: '/site-tracking',
    name: 'SiteTracking',
    component: () => import('@/views/site-tracking/SiteTrackingView.vue'),
    meta: {
      title: 'Site Tracking',
    },
  },
  // Site Maps - New unified approach
  {
    path: '/site-maps',
    name: 'SiteMapIndex',
    component: () => import('@/views/site-maps/SiteMapIndex.vue'),
    meta: {
      title: 'Site Maps',
    },
  },
  {
    path: '/site-maps/viewer',
    redirect: '/site-maps',
  },
  {
    path: '/site-maps/generate',
    name: 'SiteMapGenerator',
    component: () => import('@/views/site-maps/SiteMapGenerator.vue'),
    meta: {
      title: 'Generate Site Map',
    },
  },
  {
    path: '/site-maps/:id/view-2d',
    name: 'SiteMap2DViewer',
    component: () => import('@/views/site-maps/viewers/SiteMap2DViewer.vue'),
    meta: {
      title: '2D Site Map',
    },
  },
  {
    path: '/site-maps/:id/view-3d',
    name: 'SiteMap3DViewer',
    component: () => import('@/views/site-maps/viewers/SiteMap3DViewer.vue'),
    meta: {
      title: '3D Site Map',
    },
  },
  {
    path: '/site-maps/3d-reconstruction',
    name: 'SiteMap3DReconstruction',
    component: () => import('@/views/SiteMap3D.vue'),
    meta: {
      title: '3D Site Map Reconstruction',
    },
  },
  {
    path: '/site-maps/:id/edit',
    name: 'SiteMapEditor',
    component: () => import('@/views/SiteMapEditor.vue'),
    meta: {
      title: 'Edit Site Map',
    },
  },
  // Legacy routes (deprecated, redirect to new)
  {
    path: '/site-config',
    redirect: '/site-maps',
  },
  {
    path: '/generated-site-map',
    redirect: '/site-maps',
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
    },
  },
  // Settings
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/Settings.vue'),
    meta: {
      title: 'System Settings',
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
  return path.startsWith('/cameras/') || path === '/site-tracking'
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
