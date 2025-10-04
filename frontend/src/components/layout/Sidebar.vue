<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  Home,
  Camera,
  Shield,
  Users,
  Settings,
  Activity,
  User as UserIcon,
  LogOut as LogOutIcon,
} from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()

const user = {
  name: 'John Doe',
  role: 'Administrator',
  email: 'john@example.com',
}

const userInitials = computed(() => {
  return user.name
    .split(' ')
    .map((name) => name.charAt(0))
    .join('')
    .toUpperCase()
})

const navigationItems = [
  {
    name: 'Dashboard',
    path: '/',
    icon: Home,
  },
  {
    name: 'Cameras',
    path: '/cameras',
    icon: Camera,
  },
  {
    name: 'Detections',
    path: '/detections',
    icon: Activity,
  },
  {
    name: 'Alarms',
    path: '/alarms',
    icon: Shield,
  },
  {
    name: 'Users',
    path: '/users',
    icon: Users,
  },
  {
    name: 'Settings',
    path: '/settings',
    icon: Settings,
  },
]

const isActiveRoute = (path: string): boolean => {
  if (path === '/' && route.path === '/') return true
  if (path !== '/' && route.path.startsWith(path)) return true
  return false
}

const goToProfile = () => {
  router.push('/profile')
}

const logout = () => {
  // TODO: Implement actual logout logic
  // alert('Logout clicked - implement authentication logic here')
  // console.log('Logout action triggered')
  router.push('/')
}
</script>
<template>
  <aside class="w-64 bg-card border-r border-border flex flex-col h-screen flex-shrink-0 fixed left-0 top-0">
    <!-- Header -->
    <div class="p-6 border-b border-border">
      <h1 class="text-xl font-bold text-card-foreground">AXIS Surveillance</h1>
      <p class="text-sm text-muted-foreground mt-1">Security System</p>
    </div>

    <!-- Navigation Items -->
    <nav class="flex-1 p-4 overflow-y-auto">
      <ul class="space-y-2">
        <li v-for="item in navigationItems" :key="item.name">
          <router-link
            :to="item.path"
            class="flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors"
            :class="
              isActiveRoute(item.path)
                ? 'bg-accent text-accent-foreground border border-accent'
                : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'
            "
          >
            <component :is="item.icon" class="w-5 h-5 mr-3" />
            {{ item.name }}
          </router-link>
        </li>
      </ul>
    </nav>

    <!-- User Section -->
    <div class="p-4 border-t border-border flex-shrink-0">
      <!-- User Avatar and Info -->
      <div class="flex items-center mb-4">
        <div class="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
          <span class="text-primary-foreground font-medium text-sm">{{ userInitials }}</span>
        </div>
        <div class="ml-3 flex-1 min-w-0">
          <p class="text-sm font-medium text-card-foreground truncate">{{ user.name }}</p>
          <p class="text-xs text-muted-foreground truncate">{{ user.role }}</p>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="space-y-2">
        <button
          class="w-full flex items-center px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground rounded-lg transition-colors"
          @click="goToProfile"
        >
          <UserIcon class="w-4 h-4 mr-2" />
          My Profile
        </button>
        <button
          class="w-full flex items-center px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
          @click="logout"
        >
          <LogOutIcon class="w-4 h-4 mr-2" />
          Logout
        </button>
      </div>
    </div>
  </aside>
</template>
