<template>
  <div class="fixed top-4 right-4 z-50 flex flex-col items-end space-y-2 pointer-events-none">
    <div
      v-for="toast in toasts"
      :key="toast.id"
      class="pointer-events-auto animate-slide-down shadow-lg rounded-lg px-3 py-2 flex items-center space-x-2"
      :class="toastClasses(toast.type)"
    >
      <div class="flex-shrink-0">
        <CheckCircle v-if="toast.type === 'success'" class="w-4 h-4" />
        <XCircle v-else-if="toast.type === 'error'" class="w-4 h-4" />
        <AlertTriangle v-else-if="toast.type === 'warning'" class="w-4 h-4" />
        <Info v-else class="w-4 h-4" />
      </div>
      <p class="flex-1 text-xs font-medium">{{ toast.message }}</p>
      <button
        @click="removeToast(toast.id)"
        class="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
      >
        <X class="w-3 h-3" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-vue-next'
import { useToast } from '@/composables/useToast'

const { toasts, removeToast } = useToast()

const toastClasses = (type: string) => {
  switch (type) {
    case 'success':
      return 'bg-green-600 text-white border border-green-700'
    case 'error':
      return 'bg-red-600 text-white border border-red-700'
    case 'warning':
      return 'bg-yellow-600 text-white border border-yellow-700'
    case 'info':
    default:
      return 'bg-blue-600 text-white border border-blue-700'
  }
}
</script>

<style scoped>
@keyframes slide-down {
  from {
    opacity: 0;
    transform: translateY(-1rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-down {
  animation: slide-down 0.3s ease-out;
}
</style>
