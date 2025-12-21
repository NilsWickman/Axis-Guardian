import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/tracking',
  },
  {
    path: '/recordings',
    name: 'Recordings',
    component: () => import('@/views/replay/RecordingsView.vue'),
    meta: {
      title: 'Recordings',
    },
  },
  {
    path: '/replay',
    redirect: '/recordings',
  },
  {
    path: '/tracking',
    name: 'Tracking',
    component: () => import('@/views/tracking/TrackingView.vue'),
    meta: {
      title: 'Tracking',
    },
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
    redirect: { path: '/tracking', query: { view: 'camera' } },
  },
  {
    path: '/site-tracking',
    redirect: { path: '/tracking', query: { view: 'map' } },
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
  // Ground Truth Annotator (moved to dev)
  {
    path: '/dev/ground-annotator',
    name: 'GroundAnnotator',
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
  }
}

export default router
