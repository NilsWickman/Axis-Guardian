import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './index.css'
import { useAuthStore } from './stores/auth'

// Initialize Pinia first to check auth state
const pinia = createPinia()
const tempApp = createApp({ template: '<div></div>' })
tempApp.use(pinia)
const authStore = useAuthStore()
authStore.restoreSession()

// Determine which app to load based on authentication
if (authStore.isAuthenticated) {
  // Load full SPA for authenticated users
  import('./App.vue').then(({ default: App }) => {
    import('./router').then(({ default: router }) => {
      const app = createApp(App)
      app.use(pinia)
      app.use(router)
      app.mount('#app')
    })
  })
} else {
  // Load minimal login app for unauthenticated users
  import('./views/Login.vue').then(({ default: Login }) => {
    const app = createApp(Login)
    app.use(pinia)
    app.mount('#app')

    // Listen for successful login to reload and mount full SPA
    const unwatch = authStore.$onAction(({ name, after }) => {
      if (name === 'login') {
        after(() => {
          if (authStore.isAuthenticated) {
            unwatch()
            window.location.reload()
          }
        })
      }
    })
  })
}
