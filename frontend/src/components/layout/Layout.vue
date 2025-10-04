<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Sidebar from './Sidebar.vue'
import { Toaster } from '@/components/ui/sonner'

const route = useRoute()

const pageTitle = computed(() => {
  return route.meta.title || route.name || 'Page'
})
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- Fixed Sidebar -->
    <Sidebar />

    <!-- Scrollable Main Content Area -->
    <main class="overflow-auto h-screen">
      <!-- Page Content -->
      <router-view />
    </main>

    <!-- Toast notifications -->
    <Toaster />
  </div>
</template>
