<script setup lang="ts">
  import { ref } from 'vue'
  import Sidebar from './Sidebar.vue'
  import { Toaster } from '@/components/ui/sonner'
  import Toast from '@/components/ui/Toast.vue'

  // Sidebar state for mobile
  const isSidebarOpen = ref(false)

  const toggleSidebar = () => {
    isSidebarOpen.value = !isSidebarOpen.value
  }

  const closeSidebar = () => {
    isSidebarOpen.value = false
  }
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- Fixed Sidebar -->
    <Sidebar
      :is-open="isSidebarOpen"
      @toggle="toggleSidebar"
      @close="closeSidebar"
    />

    <!-- Scrollable Main Content Area -->
    <main class="overflow-auto h-screen ml-0 lg:ml-64 transition-[margin] duration-300">
      <!-- Page Content -->
      <router-view />
    </main>

    <!-- Toast notifications -->
    <Toaster />
    <Toast />
  </div>
</template>
