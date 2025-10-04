<template>
  <div class="h-screen w-screen flex items-center justify-center bg-background">
    <div class="w-full max-w-md p-8 space-y-6">
      <!-- Logo -->
      <div class="flex justify-center mb-8">
        <img src="/axis.png" alt="AXIS" class="h-12" />
      </div>

      <!-- Title -->
      <div class="text-center space-y-2">
        <h1 class="text-2xl font-bold text-foreground">Surveillance System</h1>
        <p class="text-sm text-muted-foreground">Sign in to your account</p>
      </div>

      <!-- Error Message -->
      <div
        v-if="error"
        class="p-3 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive"
      >
        {{ error }}
      </div>

      <!-- Login Form -->
      <form @submit.prevent="handleLogin" class="space-y-4">
        <div class="space-y-2">
          <label for="username" class="text-sm font-medium text-foreground">Username</label>
          <input
            id="username"
            v-model="username"
            type="text"
            required
            class="w-full px-3 py-2 border rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Enter username"
          />
        </div>

        <div class="space-y-2">
          <label for="password" class="text-sm font-medium text-foreground">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            class="w-full px-3 py-2 border rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Enter password"
          />
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {{ loading ? 'Signing in...' : 'Sign In' }}
        </button>
      </form>

      <!-- Demo Accounts -->
      <div class="space-y-3">
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-border"></div>
          </div>
          <div class="relative flex justify-center text-xs">
            <span class="px-2 bg-background text-muted-foreground">Demo Accounts</span>
          </div>
        </div>

        <div class="grid gap-2">
          <button
            v-for="account in demoAccounts"
            :key="account.username"
            @click="fillCredentials(account.username)"
            type="button"
            class="w-full p-3 border rounded hover:bg-accent transition-colors text-left"
          >
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <div class="text-sm font-medium text-foreground">{{ account.username }}</div>
                <div class="text-xs text-muted-foreground">{{ account.email }}</div>
              </div>
              <span
                :class="getRoleBadgeColor(account.role)"
                class="px-2 py-0.5 text-xs font-medium rounded uppercase"
              >
                {{ account.role }}
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref<string | null>(null)

const demoAccounts = [
  { username: 'admin', email: 'admin@axis.local', role: 'admin' },
  { username: 'operator', email: 'operator@axis.local', role: 'operator' },
  { username: 'viewer', email: 'viewer@axis.local', role: 'viewer' },
  { username: 'security_chief', email: 'chief@axis.local', role: 'admin' },
]

const getRoleBadgeColor = (role: string) => {
  switch (role) {
    case 'admin':
      return 'bg-destructive/10 text-destructive border border-destructive/20'
    case 'operator':
      return 'bg-primary/10 text-primary border border-primary/20'
    case 'viewer':
      return 'bg-accent text-accent-foreground border border-accent'
    default:
      return 'bg-muted text-muted-foreground border border-border'
  }
}

const fillCredentials = (user: string) => {
  username.value = user
  password.value = 'demo' // Any password works in demo
}

const handleLogin = async () => {
  error.value = null
  loading.value = true

  try {
    await authStore.login({
      username: username.value,
      password: password.value,
    })
    // Page will reload automatically via main.ts listener
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>
