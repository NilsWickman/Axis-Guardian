<template>
  <div class="flex gap-2">
    <div class="flex-1 relative">
      <input
        :value="modelValue"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        type="text"
        :placeholder="placeholder"
        class="w-full px-3 py-2 pl-9 text-xs border rounded-lg bg-background"
      />
      <svg
        class="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    </div>
    <button
      v-if="showClear && modelValue"
      @click="emit('clear')"
      class="px-3 py-2 text-xs border rounded-lg hover:bg-accent transition-colors whitespace-nowrap"
    >
      {{ clearText }}
    </button>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  modelValue: string
  placeholder?: string
  showClear?: boolean
  clearText?: string
}>(), {
  placeholder: 'Search...',
  showClear: true,
  clearText: 'Clear'
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'clear': []
}>()
</script>
