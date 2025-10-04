import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { reactive } from 'vue'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Trash2,
  AlertTriangle,
  Save,
  LogOut,
  Settings,
  RefreshCw,
  Shield,
  Database,
} from 'lucide-vue-next'

// Mock data for different alert dialog scenarios
const mockAlertDialogs = {
  deleteConfirmation: {
    trigger: 'Delete Account',
    title: 'Are you absolutely sure?',
    description:
      'This action cannot be undone. This will permanently delete your account and remove your data from our servers.',
    actionText: 'Yes, delete account',
    cancelText: 'Cancel',
    icon: Trash2,
    variant: 'destructive' as const,
  },
  saveChanges: {
    trigger: 'Save Changes',
    title: 'Save your changes?',
    description: 'You have unsaved changes. Would you like to save them before continuing?',
    actionText: 'Save changes',
    cancelText: 'Discard',
    icon: Save,
    variant: 'default' as const,
  },
  signOut: {
    trigger: 'Sign Out',
    title: 'Sign out of your account?',
    description: 'You will need to sign in again to access your account and data.',
    actionText: 'Sign out',
    cancelText: 'Stay signed in',
    icon: LogOut,
    variant: 'default' as const,
  },
  resetSettings: {
    trigger: 'Reset Settings',
    title: 'Reset to default settings?',
    description:
      'This will restore all settings to their default values. Your custom configurations will be lost.',
    actionText: 'Reset settings',
    cancelText: 'Keep current settings',
    icon: Settings,
    variant: 'default' as const,
  },
  refreshData: {
    trigger: 'Refresh Data',
    title: 'Refresh all data?',
    description:
      'This will fetch the latest data from the server. Any unsaved local changes may be overwritten.',
    actionText: 'Refresh now',
    cancelText: 'Cancel',
    icon: RefreshCw,
    variant: 'default' as const,
  },
  securityAction: {
    trigger: 'Security Action Required',
    title: 'Confirm security action',
    description:
      'This action requires additional verification for your security. Please confirm that you want to proceed.',
    actionText: 'Confirm action',
    cancelText: 'Cancel',
    icon: Shield,
    variant: 'default' as const,
  },
  dataLoss: {
    trigger: 'Clear Database',
    title: 'Warning: Data Loss',
    description:
      'This operation will permanently remove all data from the database. This action is irreversible and cannot be undone.',
    actionText: 'Clear database',
    cancelText: 'Keep data',
    icon: Database,
    variant: 'destructive' as const,
  },
}

const meta = {
  title: 'UI Components/AlertDialog',
  component: AlertDialog,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A modal dialog that interrupts the user with important content and expects a response.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    open: {
      control: { type: 'boolean' },
      description: 'Whether the dialog is open',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    onOpenChange: {
      action: 'openChange',
      description: 'Callback fired when the open state changes',
    },
  },
} satisfies Meta<typeof AlertDialog>

export default meta
type Story = StoryObj<typeof meta>

// Default story - delete confirmation
export const Default: Story = {
  render: (args) => ({
    components: {
      AlertDialog,
      AlertDialogAction,
      AlertDialogCancel,
      AlertDialogContent,
      AlertDialogDescription,
      AlertDialogFooter,
      AlertDialogHeader,
      AlertDialogTitle,
      AlertDialogTrigger,
      Button,
      Trash2,
    },
    setup() {
      const dialogData = reactive(mockAlertDialogs.deleteConfirmation)
      return { args, dialogData }
    },
    template: `
      <AlertDialog v-bind="args">
        <AlertDialogTrigger as-child>
          <Button variant="destructive">
            <Trash2 class="h-4 w-4" />
            {{ dialogData.trigger }}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{{ dialogData.title }}</AlertDialogTitle>
            <AlertDialogDescription>{{ dialogData.description }}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{{ dialogData.cancelText }}</AlertDialogCancel>
            <AlertDialogAction class="bg-red-600 text-white hover:bg-red-700">
              {{ dialogData.actionText }}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    `,
  }),
}

// Save changes confirmation
export const SaveChanges: Story = {
  render: (args) => ({
    components: {
      AlertDialog,
      AlertDialogAction,
      AlertDialogCancel,
      AlertDialogContent,
      AlertDialogDescription,
      AlertDialogFooter,
      AlertDialogHeader,
      AlertDialogTitle,
      AlertDialogTrigger,
      Button,
      Save,
    },
    setup() {
      const dialogData = reactive(mockAlertDialogs.saveChanges)
      return { args, dialogData }
    },
    template: `
      <AlertDialog v-bind="args">
        <AlertDialogTrigger as-child>
          <Button variant="outline">
            <Save class="h-4 w-4" />
            {{ dialogData.trigger }}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{{ dialogData.title }}</AlertDialogTitle>
            <AlertDialogDescription>{{ dialogData.description }}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{{ dialogData.cancelText }}</AlertDialogCancel>
            <AlertDialogAction>{{ dialogData.actionText }}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    `,
  }),
}

// Sign out confirmation
export const SignOut: Story = {
  render: (args) => ({
    components: {
      AlertDialog,
      AlertDialogAction,
      AlertDialogCancel,
      AlertDialogContent,
      AlertDialogDescription,
      AlertDialogFooter,
      AlertDialogHeader,
      AlertDialogTitle,
      AlertDialogTrigger,
      Button,
      LogOut,
    },
    setup() {
      const dialogData = reactive(mockAlertDialogs.signOut)
      return { args, dialogData }
    },
    template: `
      <AlertDialog v-bind="args">
        <AlertDialogTrigger as-child>
          <Button variant="ghost">
            <LogOut class="h-4 w-4" />
            {{ dialogData.trigger }}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{{ dialogData.title }}</AlertDialogTitle>
            <AlertDialogDescription>{{ dialogData.description }}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{{ dialogData.cancelText }}</AlertDialogCancel>
            <AlertDialogAction>{{ dialogData.actionText }}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    `,
  }),
}

// Security action confirmation
export const SecurityAction: Story = {
  render: (args) => ({
    components: {
      AlertDialog,
      AlertDialogAction,
      AlertDialogCancel,
      AlertDialogContent,
      AlertDialogDescription,
      AlertDialogFooter,
      AlertDialogHeader,
      AlertDialogTitle,
      AlertDialogTrigger,
      Button,
      Shield,
    },
    setup() {
      const dialogData = reactive(mockAlertDialogs.securityAction)
      return { args, dialogData }
    },
    template: `
      <AlertDialog v-bind="args">
        <AlertDialogTrigger as-child>
          <Button variant="secondary">
            <Shield class="h-4 w-4" />
            {{ dialogData.trigger }}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{{ dialogData.title }}</AlertDialogTitle>
            <AlertDialogDescription>{{ dialogData.description }}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{{ dialogData.cancelText }}</AlertDialogCancel>
            <AlertDialogAction>{{ dialogData.actionText }}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    `,
  }),
}

// Simple alert without description
export const SimpleAlert: Story = {
  render: (args) => ({
    components: {
      AlertDialog,
      AlertDialogAction,
      AlertDialogCancel,
      AlertDialogContent,
      AlertDialogFooter,
      AlertDialogHeader,
      AlertDialogTitle,
      AlertDialogTrigger,
      Button,
      AlertTriangle,
    },
    setup() {
      return { args }
    },
    template: `
      <AlertDialog v-bind="args">
        <AlertDialogTrigger as-child>
          <Button variant="outline">
            <AlertTriangle class="h-4 w-4" />
            Simple Alert
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Action</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    `,
  }),
}

// Long content example
export const LongContent: Story = {
  render: (args) => ({
    components: {
      AlertDialog,
      AlertDialogAction,
      AlertDialogCancel,
      AlertDialogContent,
      AlertDialogDescription,
      AlertDialogFooter,
      AlertDialogHeader,
      AlertDialogTitle,
      AlertDialogTrigger,
      Button,
      Database,
    },
    setup() {
      return { args }
    },
    template: `
      <AlertDialog v-bind="args">
        <AlertDialogTrigger as-child>
          <Button variant="destructive">
            <Database class="h-4 w-4" />
            Delete Database
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Database - Final Warning</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to permanently delete the entire database. This action will:
              <br><br>
              • Remove all user accounts and profiles
              <br>
              • Delete all stored content and media files  
              <br>
              • Erase all transaction history and logs
              <br>
              • Remove all system configurations and settings
              <br>
              • Delete all backup and recovery points
              <br><br>
              This operation is <strong>irreversible</strong> and cannot be undone. All data will be permanently lost.
              <br><br>
              Please type "DELETE DATABASE" in the confirmation field to proceed, or click Cancel to abort this operation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel Operation</AlertDialogCancel>
            <AlertDialogAction class="bg-red-600 text-white hover:bg-red-700">
              Delete Everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    `,
  }),
}

// Custom styled action buttons
export const CustomButtons: Story = {
  render: (args) => ({
    components: {
      AlertDialog,
      AlertDialogAction,
      AlertDialogCancel,
      AlertDialogContent,
      AlertDialogDescription,
      AlertDialogFooter,
      AlertDialogHeader,
      AlertDialogTitle,
      AlertDialogTrigger,
      Button,
      RefreshCw,
    },
    setup() {
      const dialogData = reactive(mockAlertDialogs.refreshData)
      return { args, dialogData }
    },
    template: `
      <AlertDialog v-bind="args">
        <AlertDialogTrigger as-child>
          <Button>
            <RefreshCw class="h-4 w-4" />
            {{ dialogData.trigger }}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{{ dialogData.title }}</AlertDialogTitle>
            <AlertDialogDescription>{{ dialogData.description }}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel class="hover:bg-gray-100">
              {{ dialogData.cancelText }}
            </AlertDialogCancel>
            <AlertDialogAction class="bg-blue-600 text-white hover:bg-blue-700">
              {{ dialogData.actionText }}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    `,
  }),
}

// Multiple action buttons
export const MultipleActions: Story = {
  render: (args) => ({
    components: {
      AlertDialog,
      AlertDialogAction,
      AlertDialogCancel,
      AlertDialogContent,
      AlertDialogDescription,
      AlertDialogFooter,
      AlertDialogHeader,
      AlertDialogTitle,
      AlertDialogTrigger,
      Button,
      Settings,
    },
    setup() {
      return { args }
    },
    template: `
      <AlertDialog v-bind="args">
        <AlertDialogTrigger as-child>
          <Button variant="outline">
            <Settings class="h-4 w-4" />
            Reset Settings
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Choose Reset Option</AlertDialogTitle>
            <AlertDialogDescription>
              How would you like to reset your settings? You can reset everything to defaults or just specific categories.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter class="flex-col gap-2 sm:flex-row">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction class="bg-orange-600 text-white hover:bg-orange-700">
              Reset UI Only
            </AlertDialogAction>
            <AlertDialogAction class="bg-red-600 text-white hover:bg-red-700">
              Reset Everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    `,
  }),
}

// All variations showcase
export const AllVariations: Story = {
  render: () => ({
    components: {
      AlertDialog,
      AlertDialogAction,
      AlertDialogCancel,
      AlertDialogContent,
      AlertDialogDescription,
      AlertDialogFooter,
      AlertDialogHeader,
      AlertDialogTitle,
      AlertDialogTrigger,
      Button,
      Trash2,
      Save,
      LogOut,
      Shield,
      Settings,
      Database,
    },
    setup() {
      return { mockAlertDialogs: reactive(mockAlertDialogs) }
    },
    template: `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <!-- Delete Confirmation -->
        <AlertDialog>
          <AlertDialogTrigger as-child>
            <Button variant="destructive" size="sm">
              <Trash2 class="h-4 w-4" />
              Delete Account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{{ mockAlertDialogs.deleteConfirmation.title }}</AlertDialogTitle>
              <AlertDialogDescription>{{ mockAlertDialogs.deleteConfirmation.description }}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{{ mockAlertDialogs.deleteConfirmation.cancelText }}</AlertDialogCancel>
              <AlertDialogAction class="bg-red-600 text-white hover:bg-red-700">
                {{ mockAlertDialogs.deleteConfirmation.actionText }}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <!-- Save Changes -->
        <AlertDialog>
          <AlertDialogTrigger as-child>
            <Button variant="outline" size="sm">
              <Save class="h-4 w-4" />
              Save Changes
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{{ mockAlertDialogs.saveChanges.title }}</AlertDialogTitle>
              <AlertDialogDescription>{{ mockAlertDialogs.saveChanges.description }}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{{ mockAlertDialogs.saveChanges.cancelText }}</AlertDialogCancel>
              <AlertDialogAction>{{ mockAlertDialogs.saveChanges.actionText }}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <!-- Sign Out -->
        <AlertDialog>
          <AlertDialogTrigger as-child>
            <Button variant="ghost" size="sm">
              <LogOut class="h-4 w-4" />
              Sign Out
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{{ mockAlertDialogs.signOut.title }}</AlertDialogTitle>
              <AlertDialogDescription>{{ mockAlertDialogs.signOut.description }}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{{ mockAlertDialogs.signOut.cancelText }}</AlertDialogCancel>
              <AlertDialogAction>{{ mockAlertDialogs.signOut.actionText }}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <!-- Security Action -->
        <AlertDialog>
          <AlertDialogTrigger as-child>
            <Button variant="secondary" size="sm">
              <Shield class="h-4 w-4" />
              Security Action
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{{ mockAlertDialogs.securityAction.title }}</AlertDialogTitle>
              <AlertDialogDescription>{{ mockAlertDialogs.securityAction.description }}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{{ mockAlertDialogs.securityAction.cancelText }}</AlertDialogCancel>
              <AlertDialogAction>{{ mockAlertDialogs.securityAction.actionText }}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <!-- Reset Settings -->
        <AlertDialog>
          <AlertDialogTrigger as-child>
            <Button variant="outline" size="sm">
              <Settings class="h-4 w-4" />
              Reset Settings
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{{ mockAlertDialogs.resetSettings.title }}</AlertDialogTitle>
              <AlertDialogDescription>{{ mockAlertDialogs.resetSettings.description }}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{{ mockAlertDialogs.resetSettings.cancelText }}</AlertDialogCancel>
              <AlertDialogAction>{{ mockAlertDialogs.resetSettings.actionText }}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <!-- Data Loss Warning -->
        <AlertDialog>
          <AlertDialogTrigger as-child>
            <Button variant="destructive" size="sm">
              <Database class="h-4 w-4" />
              Clear Database
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{{ mockAlertDialogs.dataLoss.title }}</AlertDialogTitle>
              <AlertDialogDescription>{{ mockAlertDialogs.dataLoss.description }}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{{ mockAlertDialogs.dataLoss.cancelText }}</AlertDialogCancel>
              <AlertDialogAction class="bg-red-600 text-white hover:bg-red-700">
                {{ mockAlertDialogs.dataLoss.actionText }}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    `,
  }),
}
