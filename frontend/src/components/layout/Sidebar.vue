<script setup lang="ts">
  import { ref } from 'vue'
  import { useRoute } from 'vue-router'
  import {
    Sun,
    Moon,
    ChevronDown,
    Focus,
    Clock,
    Palette,
    Cctv,
    Map,
    MapPin,
    MapPinned,
    Bell,
    Settings,
    Archive,
    Layers,
    Box,
    Code,
    Film,
    Crosshair,
  } from 'lucide-vue-next'
  import { useTheme } from '@/composables/useTheme'

  const route = useRoute()
  const { currentTheme, setTheme, themes } = useTheme()
  const isThemeMenuOpen = ref(false)
  const expandedMenus = ref<Set<string>>(new Set())

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
      name: 'Site Maps',
      icon: Map,
      children: [
        {
          name: '2D Viewer',
          path: '/site-maps/map-auditorium/view-2d',
          icon: Layers,
        },
        {
          name: '3D Viewer',
          path: '/site-maps/map-auditorium/view-3d',
          icon: Box,
        },
        {
          name: 'Editor',
          path: '/site-config',
          icon: MapPin,
        },
      ],
    },
    {
      name: 'Alarms',
      path: '/alarms',
      icon: Bell,
    },
    {
      name: 'Archive',
      path: '/archive',
      icon: Archive,
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: Settings,
    },
    {
      name: 'Dev',
      icon: Code,
      children: [
        {
          name: 'Frame Review',
          path: '/cameras/frame-review',
          icon: Film,
        },
        {
          name: 'Ground Truth Annotator',
          path: '/calibration/annotator',
          icon: Crosshair,
        },
      ],
    },
  ]

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
      <!-- <img src="/axis.png" alt="AXIS" class="h-8" /> -->
    </div>

    <!-- Navigation Items -->
    <nav class="flex-1 p-4 overflow-y-auto">
      <ul class="space-y-2">
        <li v-for="item in navigationItems" :key="item.name">
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

  </aside>
</template>
