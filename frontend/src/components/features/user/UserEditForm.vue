<template>
  <div v-if="user" class="space-y-4 py-4">
    <div class="space-y-2">
      <label class="text-xs font-medium">Username</label>
      <Input v-model="user.username" placeholder="Username" />
    </div>
    <div class="space-y-2">
      <label class="text-xs font-medium">Email</label>
      <Input v-model="user.email" type="email" placeholder="Email" />
    </div>
    <div class="space-y-2">
      <label class="text-xs font-medium">Role</label>
      <Select v-model="user.role" :disabled="!canChangeRole">
        <SelectTrigger :class="{ 'opacity-50 cursor-not-allowed': !canChangeRole }">
          <SelectValue placeholder="Select role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="admin">Admin</SelectItem>
          <SelectItem value="operator">Operator</SelectItem>
          <SelectItem value="viewer">Viewer</SelectItem>
        </SelectContent>
      </Select>
      <p v-if="!canChangeRole" class="text-xs text-muted-foreground">
        {{ canChangeRoleMessage }}
      </p>
    </div>
    <div class="space-y-2">
      <label class="text-xs font-medium">New Password (optional)</label>
      <Input
        :modelValue="newPassword"
        @update:modelValue="emit('update:newPassword', $event)"
        type="password"
        placeholder="Leave blank to keep current password"
      />
    </div>
    <div class="space-y-2">
      <label class="text-xs font-medium">Repeat Password</label>
      <Input
        :modelValue="repeatPassword"
        @update:modelValue="emit('update:repeatPassword', $event)"
        type="password"
        placeholder="Repeat new password"
        :class="{ 'border-destructive': passwordError }"
      />
      <p v-if="passwordError" class="text-xs text-destructive">{{ passwordError }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { User } from '@/types/generated'

defineProps<{
  user: User | null
  newPassword: string
  repeatPassword: string
  passwordError: string
  canChangeRole: boolean
  canChangeRoleMessage?: string
}>()

const emit = defineEmits<{
  'update:newPassword': [value: string]
  'update:repeatPassword': [value: string]
}>()
</script>
