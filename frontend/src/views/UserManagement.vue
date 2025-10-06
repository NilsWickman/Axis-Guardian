<template>
  <div class="h-full flex flex-col">
    <div class="flex justify-between items-center p-4 border-b border-sidebar-border">
      <h1 class="text-base font-bold text-foreground">Users</h1>
      <div class="flex gap-2">
        <Button size="sm" variant="outline" @click="refreshUsers">Refresh</Button>
        <Button size="sm" @click="openAddUserDialog">Add User</Button>
      </div>
    </div>

    <!-- Users Table -->
    <div class="flex-1 bg-card border-x border-b overflow-auto">
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
          <!-- Skeleton row when saving this user -->
          <template v-for="user in users" :key="user.id">
            <tr v-if="savingUserId === user.id" class="border-b last:border-b-0">
              <td colspan="4" class="px-3 py-2">
                <div class="flex justify-between items-center">
                  <div class="space-y-2 flex-1">
                    <Skeleton class="h-4 w-1/4" />
                    <Skeleton class="h-3 w-1/3" />
                  </div>
                  <Skeleton class="h-8 w-20" />
                </div>
              </td>
            </tr>

            <!-- Normal row -->
            <UserTableRow
              v-else
              :user="user"
              :get-role-badge-color="getRoleBadgeColor"
            >
              <template #actions="{ user }">
                <Button
                  variant="ghost"
                  size="sm"
                  @click="editUser(user)"
                  title="Edit user"
                  :disabled="!canEdit(user)"
                >
                  <SquarePen class="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  @click="deleteUser(user)"
                  title="Delete user"
                  :disabled="!canEdit(user) || deletingUserId === user.id"
                >
                  <Loader2 v-if="deletingUserId === user.id" class="h-3.5 w-3.5 animate-spin" />
                  <Trash2 v-else class="h-3.5 w-3.5" />
                </Button>
              </template>
            </UserTableRow>
          </template>
        </tbody>
      </table>

      <!-- Empty State -->
      <EmptyState
        v-if="users.length === 0"
        icon="👥"
        title="No Users Found"
        description="No users have been added yet."
      />
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
        <UserEditForm
          :user="editingUser"
          v-model:new-password="newPassword"
          v-model:repeat-password="repeatPassword"
          :password-error="passwordError"
          :can-change-role="canChangeRole"
          can-change-role-message="Cannot change role - you are the only admin"
        />
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

    <!-- Add User Dialog -->
    <Dialog v-model:open="addDialogOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>
            Create a new user account
          </DialogDescription>
        </DialogHeader>
        <div class="space-y-4">
          <div class="space-y-2">
            <label class="text-sm font-medium">Username</label>
            <Input v-model="newUserForm.username" placeholder="Enter username" />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium">Email</label>
            <Input v-model="newUserForm.email" type="email" placeholder="Enter email" />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium">Password</label>
            <Input v-model="newUserForm.password" type="password" placeholder="Enter password" />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium">Confirm Password</label>
            <Input v-model="newUserForm.confirmPassword" type="password" placeholder="Confirm password" />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium">Role</label>
            <Select v-model="newUserForm.role">
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
          <div v-if="addUserError" class="p-3 bg-destructive/10 border border-destructive/20 rounded text-sm">
            <p class="text-destructive font-medium">{{ addUserError }}</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="addDialogOpen = false">Cancel</Button>
          <Button @click="createNewUser" :disabled="loading">
            {{ loading ? 'Creating...' : 'Create User' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { SquarePen, Trash2, Loader2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
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
import UserTableRow from '@/components/features/user/UserTableRow.vue'
import UserEditForm from '@/components/features/user/UserEditForm.vue'
import EmptyState from '@/components/layout/EmptyState.vue'

const authStore = useAuthStore()

const loading = computed(() => authStore.loading)
const error = computed(() => authStore.error)
const users = computed(() => authStore.allUsers)
const currentUser = computed(() => authStore.currentUser)

// Edit dialog state
const editDialogOpen = ref(false)
const editingUser = ref<User | null>(null)
const newPassword = ref('')
const repeatPassword = ref('')
const passwordError = ref('')

// Delete dialog state
const deleteDialogOpen = ref(false)
const deletingUser = ref<User | null>(null)

// Add user dialog state
const addDialogOpen = ref(false)
const newUserForm = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'viewer' as 'admin' | 'operator' | 'viewer'
})
const addUserError = ref('')

// Per-row loading states
const deletingUserId = ref<string | null>(null)
const savingUserId = ref<string | null>(null)

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
  // Only admins can edit users (including themselves)
  return authStore.isAdmin
}

const getUserPermissions = (user: User) => {
  return authStore.getRolePermissions(user.role)
}

const isOnlyAdmin = computed(() => {
  const adminCount = users.value.filter((u) => u.role === 'admin').length
  return adminCount === 1
})

const isEditingSelf = computed(() => {
  return editingUser.value?.id === currentUser.value?.id
})

const canChangeRole = computed(() => {
  // Can't change role if editing self and is the only admin
  return !(isEditingSelf.value && isOnlyAdmin.value && editingUser.value?.role === 'admin')
})

const editUser = (user: User) => {
  editingUser.value = { ...user }
  newPassword.value = ''
  repeatPassword.value = ''
  passwordError.value = ''
  editDialogOpen.value = true
}

const saveUser = async () => {
  if (!editingUser.value) return

  // Validate passwords if provided
  if (newPassword.value || repeatPassword.value) {
    if (newPassword.value !== repeatPassword.value) {
      passwordError.value = 'Passwords do not match'
      return
    }
    if (newPassword.value.length < 6) {
      passwordError.value = 'Password must be at least 6 characters'
      return
    }
  }

  passwordError.value = ''

  try {
    savingUserId.value = editingUser.value.id
    editDialogOpen.value = false

    const updateData: any = {
      username: editingUser.value.username,
      email: editingUser.value.email,
      role: editingUser.value.role,
    }

    // Only include password if it's being changed
    if (newPassword.value) {
      updateData.password = newPassword.value
    }

    await authStore.updateUser(editingUser.value.id, updateData)
    editingUser.value = null
    newPassword.value = ''
    repeatPassword.value = ''
  } catch (err) {
    console.error('Failed to update user:', err)
  } finally {
    savingUserId.value = null
  }
}

const deleteUser = (user: User) => {
  deletingUser.value = user
  deleteDialogOpen.value = true
}

const confirmDelete = async () => {
  if (!deletingUser.value) return

  try {
    deletingUserId.value = deletingUser.value.id
    deleteDialogOpen.value = false

    await authStore.deleteUser(deletingUser.value.id)
    deletingUser.value = null
  } catch (err) {
    console.error('Failed to delete user:', err)
  } finally {
    deletingUserId.value = null
  }
}

const openAddUserDialog = () => {
  newUserForm.value = {
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'viewer'
  }
  addUserError.value = ''
  addDialogOpen.value = true
}

const createNewUser = async () => {
  addUserError.value = ''

  // Validate form
  if (!newUserForm.value.username.trim()) {
    addUserError.value = 'Username is required'
    return
  }

  if (!newUserForm.value.email.trim()) {
    addUserError.value = 'Email is required'
    return
  }

  if (!newUserForm.value.password) {
    addUserError.value = 'Password is required'
    return
  }

  if (newUserForm.value.password.length < 6) {
    addUserError.value = 'Password must be at least 6 characters'
    return
  }

  if (newUserForm.value.password !== newUserForm.value.confirmPassword) {
    addUserError.value = 'Passwords do not match'
    return
  }

  try {
    await authStore.createUser({
      username: newUserForm.value.username,
      email: newUserForm.value.email,
      password: newUserForm.value.password,
      role: newUserForm.value.role
    })

    addDialogOpen.value = false
    newUserForm.value = {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'viewer'
    }
  } catch (err) {
    addUserError.value = err instanceof Error ? err.message : 'Failed to create user'
    console.error('Failed to create user:', err)
  }
}

// Clear password error when user types
watch([newPassword, repeatPassword], () => {
  if (passwordError.value) {
    passwordError.value = ''
  }
})

// Clear add user error when user types
watch(() => newUserForm.value, () => {
  if (addUserError.value) {
    addUserError.value = ''
  }
}, { deep: true })

onMounted(() => {
  refreshUsers()
})
</script>