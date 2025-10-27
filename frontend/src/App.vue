<script setup lang="ts">
  import { onMounted } from 'vue'
  import Layout from '@/components/layout/Layout.vue'
  import Toast from '@/components/ui/Toast.vue'
  import 'vue-sonner/style.css' // vue-sonner v2 requires this import
  import { useCameraConnectionManager } from '@/composables/useCameraConnectionManager'

  // Initialize camera connections immediately on app startup
  // This ensures connections are ready before any view needs them
  const connectionManager = useCameraConnectionManager()

  onMounted(() => {
    console.log('[App] Initializing global camera connections on startup')
    // Connection manager will initialize automatically on first use
    // This just triggers it early so all views have instant access
  })
</script>

<template>
  <Layout />
  <Toast />
</template>
