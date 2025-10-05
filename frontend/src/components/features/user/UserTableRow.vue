<template>
  <tr class="border-b last:border-b-0 hover:bg-muted/20 transition-colors">
    <td class="px-3 py-2">
      <div class="font-medium text-sm">{{ user.username }}</div>
    </td>
    <td class="px-3 py-2 text-sm text-muted-foreground">
      {{ user.email || 'N/A' }}
    </td>
    <td class="px-3 py-2">
      <span
        :class="getRoleBadgeColor(user.role)"
        class="px-2 py-0.5 text-xs font-medium rounded uppercase"
      >
        {{ user.role }}
      </span>
    </td>
    <td class="px-3 py-2">
      <div class="flex gap-1 justify-end">
        <slot name="actions" :user="user"></slot>
      </div>
    </td>
  </tr>
</template>

<script setup lang="ts">
import type { User } from '@/types/generated'

defineProps<{
  user: User
  getRoleBadgeColor: (role: string) => string
}>()
</script>
