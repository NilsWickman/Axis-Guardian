<template>
  <div
    v-if="open"
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    @click.self="onCancel"
  >
    <div class="bg-card rounded-lg shadow-xl w-full max-w-md mx-4">
      <div class="p-4 border-b">
        <h2 class="font-bold text-sm" :class="variant === 'destructive' ? 'text-destructive' : ''">
          {{ title }}
        </h2>
      </div>
      <div class="p-4">
        <p class="text-sm mb-3" v-html="message"></p>
        <p v-if="description" class="text-xs text-muted-foreground">{{ description }}</p>
      </div>
      <div class="p-4 border-t flex justify-end gap-2">
        <button
          @click="onCancel"
          class="px-3 py-1.5 text-xs border rounded-lg hover:bg-accent transition-colors"
        >
          {{ cancelText }}
        </button>
        <button
          @click="onConfirm"
          :disabled="loading"
          class="px-3 py-1.5 text-xs rounded-lg transition-colors"
          :class="variant === 'destructive'
            ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
            : 'bg-primary text-primary-foreground hover:bg-primary/90'"
        >
          {{ loading ? loadingText : confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  open: boolean
  title: string
  message: string
  description?: string
  confirmText?: string
  cancelText?: string
  loadingText?: string
  loading?: boolean
  variant?: 'default' | 'destructive'
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const onConfirm = () => emit('confirm')
const onCancel = () => emit('cancel')
</script>
