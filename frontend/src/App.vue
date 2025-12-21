<script setup lang="ts">
  import { onMounted } from 'vue'
  import Layout from '@/components/layout/Layout.vue'
  import Toast from '@/components/ui/Toast.vue'
  import MetricsDrawer from '@/components/features/metrics/MetricsDrawer.vue'
  import 'vue-sonner/style.css' // vue-sonner v2 requires this import
  import { useCameraConnectionManager } from '@/composables/useCameraConnectionManager'
  import { useCameraStore } from '@/stores/cameras'

  // Initialize camera connections immediately on app startup
  // This ensures connections are ready before any view needs them
  const connectionManager = useCameraConnectionManager()
  const cameraStore = useCameraStore()

  onMounted(async () => {
    // Initialize camera store from config first
    try {
      await cameraStore.initializeFromConfig()
    } catch (error) {
      console.error('[App] Failed to initialize camera store:', error)
    }

    // Initialize WebRTC connections (also reads from config)
    await connectionManager.initializeConnections()
  })
</script>

<template>
  <Layout />
  <Toast />
  <MetricsDrawer />
</template>
