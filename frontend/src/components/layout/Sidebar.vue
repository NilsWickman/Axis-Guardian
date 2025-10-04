<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import {
    Camera,
    Map,
    UserIcon,
    LogOut as LogOutIcon,
    Sun,
    Moon,
    ChevronDown,
    Focus,
    Clock,
    Palette,
    Cctv,
    Users,
  } from 'lucide-vue-next'
  import { useTheme } from '@/composables/useTheme'
  import { useAuthStore } from '@/stores/auth'

  const router = useRouter()
  const route = useRoute()
  const authStore = useAuthStore()
  const { currentTheme, setTheme, themes } = useTheme()
  const isThemeMenuOpen = ref(false)

  const user = computed(() => authStore.currentUser)

  const userInitials = computed(() => {
    if (!user.value) return 'U'
    return user.value.username
      .substring(0, 2)
      .toUpperCase()
  })

  const userDisplayName = computed(() => {
    if (!user.value) return 'Guest'
    return user.value.username.charAt(0).toUpperCase() + user.value.username.slice(1)
  })

  const userRole = computed(() => {
    if (!user.value) return 'Guest'
    return user.value.role.charAt(0).toUpperCase() + user.value.role.slice(1)
  })

  const navigationItems = [
    {
      name: 'Camera View',
      path: '/cameras/focus',
      icon: Focus,
    },
    {
      name: 'Timeline',
      path: '/cameras/timeline',
      icon: Clock,
    },
    {
      name: 'Manage Cameras',
      path: '/cameras/manage',
      icon: Cctv,
    },
    {
      name: 'Site Map',
      path: '/site-config',
      icon: Map,
    },
    {
      name: 'Users',
      path: '/users',
      icon: Users,
    },
  ]

  const isActiveRoute = (path: string): boolean => {
    if (path === '/' && route.path === '/') return true
    if (path !== '/' && route.path.startsWith(path)) return true
    return false
  }

  const logout = async () => {
    await authStore.logout()
    router.push('/login')
  }

  const formatThemeName = (theme: string): string => {
    return theme
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const toggleThemeMenu = () => {
    isThemeMenuOpen.value = !isThemeMenuOpen.value
  }

  const selectTheme = (theme: typeof currentTheme.value) => {
    setTheme(theme)
    isThemeMenuOpen.value = false
  }
</script>
<template>
  <aside
    class="w-64 bg-sidebar border-r border-sidebar-border flex flex-col h-screen flex-shrink-0 fixed left-0 top-0"
  >
    <!-- Header -->
    <div class="p-6 border-b border-sidebar-border flex items-center justify-center">
      <img src="/axis.png" alt="AXIS" class="h-8" />
    </div>

    <!-- Navigation Items -->
    <nav class="flex-1 p-4 overflow-y-auto">
      <ul class="space-y-2">
        <li v-for="item in navigationItems" :key="item.name">
          <router-link
            :to="item.path"
            class="flex items-center px-3 py-2 text-xs font-medium rounded-lg transition-colors"
            :class="
              isActiveRoute(item.path)
                ? 'bg-accent text-accent-foreground border border-accent'
                : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground border border-transparent'
            "
          >
            <component :is="item.icon" class="w-5 h-5 mr-3" />
            {{ item.name }}
          </router-link>
        </li>
      </ul>
    </nav>

    <!-- Theme Switcher -->
    <div class="px-4 pb-4 relative">
      <button
        @click="toggleThemeMenu"
        class="w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
        :title="`Select Theme (Current: ${formatThemeName(currentTheme)})`"
      >
        <div class="flex items-center">
          <Palette class="w-4 h-4 mr-2" />
          {{ formatThemeName(currentTheme) }}
        </div>
        <ChevronDown
          class="w-4 h-4 transition-transform"
          :class="{ 'rotate-180': isThemeMenuOpen }"
        />
      </button>

      <!-- Theme Dropdown -->
      <div
        v-show="isThemeMenuOpen"
        class="absolute bottom-full left-4 right-4 mb-2 bg-popover border border-border rounded-lg shadow-lg overflow-hidden"
      >
        <div class="py-1">
          <button
            v-for="theme in themes"
            :key="theme"
            @click="selectTheme(theme)"
            class="w-full px-3 py-2 text-xs font-medium text-left transition-colors flex items-center justify-between"
            :class="
              currentTheme === theme
                ? 'bg-accent text-accent-foreground'
                : 'text-popover-foreground hover:bg-accent/50 hover:text-accent-foreground'
            "
          >
            <span>{{ formatThemeName(theme) }}</span>
            <Sun v-if="theme === 'light'" class="w-3 h-3" />
            <Moon v-else-if="theme === 'dark'" class="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>

    <!-- User Section -->
    <div class="p-4 border-t border-sidebar-border flex-shrink-0">
      <!-- User Avatar and Info -->
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
          <span class="text-primary-foreground font-medium text-xs">{{ userInitials }}</span>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-xs font-medium text-sidebar-foreground truncate">{{ userDisplayName }}</p>
          <p class="text-xs text-muted-foreground truncate">{{ userRole }}</p>
        </div>
        <!-- Action Buttons (Icon Only) -->
        <div class="flex items-center gap-1 flex-shrink-0">
          <button
            class="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
            @click="logout"
            title="Logout"
          >
            <LogOutIcon class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </aside>
</template>
