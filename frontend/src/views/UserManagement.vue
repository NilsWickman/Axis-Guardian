<template>
  <div class="h-full flex flex-col">
    <div class="flex justify-between items-center mb-3 px-4 pt-4">
      <h1 class="text-xl font-semibold text-foreground">Users</h1>
      <div class="flex gap-2">
        <Button size="sm" @click="refreshUsers">Refresh</Button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex-1 space-y-2 px-4">
      <div v-for="i in 6" :key="i" class="bg-card border rounded p-2 animate-pulse">
        <div class="flex justify-between items-center">
          <div class="space-y-1.5 flex-1">
            <div class="h-3 bg-muted rounded w-1/4"></div>
            <div class="h-2 bg-muted rounded w-1/3"></div>
          </div>
          <div class="h-6 w-16 bg-muted rounded"></div>
        </div>
      </div>
    </div>

    <!-- Users Table -->
    <div v-else class="flex-1 bg-card border-x border-b overflow-auto">
      <table class="w-full text-sm">
        <thead class="bg-muted/30 sticky top-0">
          <tr class="border-b">
            <th class="text-left px-3 py-2 font-medium text-xs">Username</th>
            <th class="text-left px-3 py-2 font-medium text-xs">Email</th>
            <th class="text-left px-3 py-2 font-medium text-xs">Role</th>
            <th class="text-right px-3 py-2 font-medium text-xs">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="user in users"
            :key="user.id"
            class="border-b last:border-b-0 hover:bg-muted/20 transition-colors"
          >
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
                <Button
                  variant="ghost"
                  size="sm"
                  @click="editUser(user)"
                  title="Edit user"
                  :disabled="!canEdit(user)"
                >
                  <Pencil class="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  @click="deleteUser(user)"
                  title="Delete user"
                  :disabled="!canEdit(user)"
                >
                  <Trash2 class="h-4 w-4" />
                </Button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Empty State -->
      <div v-if="users.length === 0" class="text-center py-16">
        <div class="text-3xl mb-3">👥</div>
        <h3 class="text-lg font-medium mb-1">No Users Found</h3>
        <p class="text-sm text-muted-foreground">No users have been added yet.</p>
      </div>
    </div>

    <!-- Error Display -->
    <div v-if="error" class="mt-3 mx-4 p-3 bg-destructive/10 border border-destructive/20 rounded text-sm">
      <p class="text-destructive font-medium">Error: {{ error }}</p>
    </div>

    <!-- Edit User Dialog -->
    <Dialog v-model:open="editDialogOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user information and role
          </DialogDescription>
        </DialogHeader>
        <div v-if="editingUser" class="space-y-4 py-4">
          <div class="space-y-2">
            <label class="text-sm font-medium">Username</label>
            <Input v-model="editingUser.username" placeholder="Username" />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium">Email</label>
            <Input v-model="editingUser.email" type="email" placeholder="Email" />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium">Role</label>
            <Select v-model="editingUser.role">
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="operator">Operator</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="editDialogOpen = false">Cancel</Button>
          <Button @click="saveUser" :disabled="loading">
            {{ loading ? 'Saving...' : 'Save Changes' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Delete User Alert Dialog -->
    <AlertDialog v-model:open="deleteDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the user <strong>{{ deletingUser?.username }}</strong>.
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction @click="confirmDelete" :disabled="loading">
            {{ loading ? 'Deleting...' : 'Delete' }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Pencil, Trash2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { User } from '../types/generated'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()

const loading = computed(() => authStore.loading)
const error = computed(() => authStore.error)
const users = computed(() => authStore.allUsers)
const currentUser = computed(() => authStore.currentUser)

// Edit dialog state
const editDialogOpen = ref(false)
const editingUser = ref<User | null>(null)

// Delete dialog state
const deleteDialogOpen = ref(false)
const deletingUser = ref<User | null>(null)

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

const refreshUsers = async () => {
  try {
    await authStore.fetchUsers()
  } catch (err) {
    console.error('Failed to load users:', err)
  }
}

const canEdit = (user: User): boolean => {
  // Only admins can edit users, and they can't edit themselves in this demo
  return authStore.isAdmin && currentUser.value?.id !== user.id
}

const getUserPermissions = (user: User) => {
  return authStore.getRolePermissions(user.role)
}

const editUser = (user: User) => {
  editingUser.value = { ...user }
  editDialogOpen.value = true
}

const saveUser = async () => {
  if (!editingUser.value) return

  try {
    await authStore.updateUser(editingUser.value.id, {
      username: editingUser.value.username,
      email: editingUser.value.email,
      role: editingUser.value.role,
    })
    editDialogOpen.value = false
    editingUser.value = null
  } catch (err) {
    console.error('Failed to update user:', err)
  }
}

const deleteUser = (user: User) => {
  deletingUser.value = user
  deleteDialogOpen.value = true
}

const confirmDelete = async () => {
  if (!deletingUser.value) return

  try {
    await authStore.deleteUser(deletingUser.value.id)
    deleteDialogOpen.value = false
    deletingUser.value = null
  } catch (err) {
    console.error('Failed to delete user:', err)
  }
}

onMounted(() => {
  refreshUsers()
})
</script>