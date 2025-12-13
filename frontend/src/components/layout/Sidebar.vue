<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { useRoute } from 'vue-router'
  import {
    Sun,
    Moon,
    ChevronDown,
    Focus,
    MapPinned,
    ShieldAlert,
    Code,
    Crosshair,
    Users,
    Menu,
    X,
    GitGraph,
    MapPin,
    Fingerprint,
  } from 'lucide-vue-next'
  import { useTheme } from '@/composables/useTheme'
  import { useDemoMode } from '@/composables/useDemoMode'
  import { useTrackingMode } from '@/composables/useTrackingMode'
  import { Switch } from '@/components/ui/switch'

  defineProps<{
    isOpen: boolean
  }>()

  const emit = defineEmits<{
    (e: 'toggle'): void
    (e: 'close'): void
  }>()

  const route = useRoute()
  const { currentTheme, toggleTheme } = useTheme()
  const { isDemoMode, toggleDemoMode } = useDemoMode()
  const { isSpatialMode, isReIDMode, toggleMode, dualModeEnabled, spatialTrackCount, reidTrackCount, activeTrackCount } = useTrackingMode()
  const expandedMenus = ref<Set<string>>(new Set())

  const isDarkMode = computed(() => currentTheme.value === 'dark')

  interface NavigationItem {
    name: string
    path?: string
    icon: any
    children?: NavigationItem[]
  }

  const navigationItems: NavigationItem[] = [
    {
      name: 'Video',
      path: '/cameras/focus',
      icon: Focus,
    },
    {
      name: 'Site Tracking',
      path: '/site-tracking',
      icon: MapPinned,
    },
    {
      name: 'Zones',
      path: '/zones',
      icon: ShieldAlert,
    },
    {
      name: 'Dev',
      icon: Code,
      children: [
        {
          name: 'Ground Truth Annotator',
          path: '/calibration/annotator',
          icon: Crosshair,
        },
        {
          name: 'Track Annotator',
          path: '/dev/track-annotator',
          icon: Users,
        },
        {
          name: 'Architecture',
          path: '/dev/architecture',
          icon: GitGraph,
        },
      ],
    },
  ]

  // Filter out Dev menu when in demo mode
  const filteredNavigationItems = computed(() => {
    if (isDemoMode.value) {
      return navigationItems.filter(item => item.name !== 'Dev')
    }
    return navigationItems
  })

  const toggleMenu = (itemName: string) => {
    if (expandedMenus.value.has(itemName)) {
      expandedMenus.value.delete(itemName)
    } else {
      expandedMenus.value.add(itemName)
    }
  }

  const isActiveRoute = (path: string): boolean => {
    if (path === '/' && route.path === '/') return true
    if (path !== '/' && route.path.startsWith(path)) return true
    return false
  }

  const isMenuActive = (item: NavigationItem): boolean => {
    if (item.path) {
      return isActiveRoute(item.path)
    }
    if (item.children) {
      return item.children.some(child => child.path && isActiveRoute(child.path))
    }
    return false
  }

</script>
<template>
  <!-- Mobile Toggle Button -->
  <button
    @click="emit('toggle')"
    class="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-sidebar border border-sidebar-border text-sidebar-foreground hover:bg-accent/50 transition-colors"
    :class="{ 'left-[17rem]': isOpen }"
  >
    <X v-if="isOpen" class="w-5 h-5" />
    <Menu v-else class="w-5 h-5" />
  </button>

  <!-- Overlay for mobile -->
  <div
    v-if="isOpen"
    @click="emit('close')"
    class="lg:hidden fixed inset-0 bg-black/50 z-30"
  />

  <aside
    class="w-64 bg-sidebar border-r border-sidebar-border flex flex-col h-screen flex-shrink-0 fixed left-0 top-0 z-40 transition-transform duration-300 ease-in-out"
    :class="[
      isOpen ? 'translate-x-0' : '-translate-x-full',
      'lg:translate-x-0'
    ]"
  >
    <!-- Header -->
    <div class="p-6 border-b border-sidebar-border flex items-center justify-center">
      <img src="/Logo.png" alt="Site Sentinel" class="h-16" />
    </div>

    <!-- Navigation Items -->
    <nav class="flex-1 p-4 overflow-y-auto">
      <ul class="space-y-2">
        <li v-for="item in filteredNavigationItems" :key="item.name">
          <!-- Item with children (expandable) -->
          <template v-if="item.children">
            <button
              @click="toggleMenu(item.name)"
              class="w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors"
              :class="
                isMenuActive(item)
                  ? 'bg-accent text-accent-foreground border border-accent'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground border border-transparent'
              "
            >
              <div class="flex items-center">
                <component :is="item.icon" class="w-5 h-5 mr-3" />
                {{ item.name }}
              </div>
              <ChevronDown
                class="w-4 h-4 transition-transform"
                :class="{ 'rotate-180': expandedMenus.has(item.name) }"
              />
            </button>

            <!-- Children -->
            <ul
              v-show="expandedMenus.has(item.name)"
              class="mt-1 ml-4 space-y-1 border-l border-border pl-2"
            >
              <li v-for="child in item.children" :key="child.name">
                <router-link
                  :to="child.path!"
                  @click="emit('close')"
                  class="flex items-center px-3 py-2 text-xs font-medium rounded-lg transition-colors"
                  :class="
                    isActiveRoute(child.path!)
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'
                  "
                >
                  <component :is="child.icon" class="w-4 h-4 mr-2" />
                  {{ child.name }}
                </router-link>
              </li>
            </ul>
          </template>

          <!-- Item without children (regular link) -->
          <router-link
            v-else
            :to="item.path!"
            @click="emit('close')"
            class="flex items-center px-3 py-2 text-xs font-medium rounded-lg transition-colors"
            :class="
              isActiveRoute(item.path!)
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

    <!-- Settings -->
    <div class="px-4 pb-4 space-y-3">
      <!-- Tracking Mode Toggle (only shown when dual mode enabled) -->
      <div v-if="dualModeEnabled" class="px-3 py-2 rounded-lg bg-accent/30 border border-accent/50">
        <div class="flex items-center justify-between">
          <span class="text-xs text-muted-foreground">Tracking Mode</span>
          <div class="flex items-center gap-1.5">
            <MapPin class="w-3 h-3" :class="isSpatialMode ? 'text-primary' : 'text-muted-foreground'" />
            <Switch :model-value="isReIDMode" @update:model-value="toggleMode" />
            <Fingerprint class="w-3 h-3" :class="isReIDMode ? 'text-primary' : 'text-muted-foreground'" />
          </div>
        </div>
        <div class="flex items-center justify-between mt-1">
          <p class="text-[10px] text-muted-foreground">
            {{ isReIDMode ? 'Spatial + Re-ID' : 'Spatial Only' }}
          </p>
          <!-- Active track count for current mode -->
          <p class="text-[10px] font-medium" :class="isSpatialMode ? 'text-primary' : 'text-purple-500'">
            {{ activeTrackCount }} tracks
          </p>
        </div>
        <!-- Side-by-side comparison of both modes -->
        <div class="flex items-center gap-2 mt-1 text-[9px] text-muted-foreground">
          <span :class="isSpatialMode ? 'font-medium text-primary' : ''">
            Spatial: {{ spatialTrackCount }}
          </span>
          <span class="opacity-50">|</span>
          <span :class="isReIDMode ? 'font-medium text-purple-500' : ''">
            Re-ID: {{ reidTrackCount }}
          </span>
        </div>
      </div>

      <div class="flex items-center justify-center gap-4 px-3 py-2 text-xs font-medium text-muted-foreground">
        <!-- Theme Switcher -->
        <div class="flex items-center gap-1.5">
          <Sun class="w-3 h-3" />
          <Switch :model-value="isDarkMode" @update:model-value="toggleTheme" />
          <Moon class="w-3 h-3" />
        </div>
        <!-- Demo/Debug Mode Switcher -->
        <div class="flex items-center gap-1.5">
          <span>Debug</span>
          <Switch :model-value="isDemoMode" @update:model-value="toggleDemoMode" />
          <span>Demo</span>
        </div>
      </div>
    </div>

  </aside>
</template>
