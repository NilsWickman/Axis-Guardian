<script setup lang="ts">
  import { onMounted } from 'vue'
  import Layout from '@/components/layout/Layout.vue'
  import Toast from '@/components/ui/Toast.vue'
  import 'vue-sonner/style.css' // vue-sonner v2 requires this import
  import { useCameraConnectionManager } from '@/composables/useCameraConnectionManager'
  import { useCameraStore } from '@/stores/cameras'

  // Initialize camera connections immediately on app startup
  // This ensures connections are ready before any view needs them
  const connectionManager = useCameraConnectionManager()
  const cameraStore = useCameraStore()

  onMounted(async () => {
    console.log('[App] Initializing from JSON config (single source of truth)')

    // Initialize camera store from config first
    try {
      await cameraStore.initializeFromConfig()
      console.log('[App] Camera store initialized from config')
    } catch (error) {
      console.error('[App] Failed to initialize camera store:', error)
    }

    // Initialize WebRTC connections (also reads from config)
    console.log('[App] Initializing global camera connections')
    await connectionManager.initializeConnections()
    console.log('[App] Camera connections initialized')
  })
</script>

<template>
  <Layout />
  <Toast />
</template>
