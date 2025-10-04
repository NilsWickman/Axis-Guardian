import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../../src'),
      '@/components': path.resolve(__dirname, '../../src/components'),
      '@/lib': path.resolve(__dirname, '../../src/lib'),
      '@/components/ui': path.resolve(__dirname, '../../src/components/ui'),
    },
  },
  css: {
    postcss: './config/build/postcss.config.js',
  },
  server: {
    port: 5173,
    host: true,
  },
})