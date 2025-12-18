// Polyfill Buffer for msgpack-lite (used by mediasoup)
import { Buffer } from 'buffer'
globalThis.Buffer = Buffer

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './index.css'
import App from './App.vue'
import router from './router'
import { configureConsoleLogging } from './utils/logging'

configureConsoleLogging({
  enableVerbose: import.meta.env.VITE_ENABLE_FRONTEND_LOGS === 'true',
})

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.mount('#app')
