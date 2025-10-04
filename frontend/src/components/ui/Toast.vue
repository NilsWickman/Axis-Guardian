<template>
  <div class="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center space-y-2 pointer-events-none">
    <div
      v-for="toast in toasts"
      :key="toast.id"
      class="pointer-events-auto animate-slide-down shadow-lg rounded-lg px-4 py-3 flex items-center space-x-3 min-w-[300px] max-w-md"
      :class="toastClasses(toast.type)"
    >
      <div class="flex-shrink-0">
        <CheckCircle v-if="toast.type === 'success'" class="w-5 h-5" />
        <XCircle v-else-if="toast.type === 'error'" class="w-5 h-5" />
        <AlertTriangle v-else-if="toast.type === 'warning'" class="w-5 h-5" />
        <Info v-else class="w-5 h-5" />
      </div>
      <p class="flex-1 text-sm font-medium">{{ toast.message }}</p>
      <button
        @click="removeToast(toast.id)"
        class="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
      >
        <X class="w-4 h-4" />
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
      return 'bg-toast-success text-toast-success-foreground border border-toast-success/50'
    case 'error':
      return 'bg-toast-error text-toast-error-foreground border border-toast-error/50'
    case 'warning':
      return 'bg-toast-warning text-toast-warning-foreground border border-toast-warning/50'
    case 'info':
    default:
      return 'bg-toast-info text-toast-info-foreground border border-toast-info/50'
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
