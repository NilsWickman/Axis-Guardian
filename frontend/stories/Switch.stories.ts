import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ref } from 'vue'
import {
  Moon,
  Sun,
  Bell,
  BellOff,
  Wifi,
  WifiOff,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Shield,
  ShieldOff,
} from 'lucide-vue-next'

// Mock data for different switch scenarios
const mockSwitchData = {
  basic: {
    default: { label: 'Enable notifications', id: 'notifications' },
    checked: { label: 'Dark mode enabled', id: 'dark-mode', checked: true },
    disabled: { label: 'This option is disabled', id: 'disabled', disabled: true },
    disabledChecked: {
      label: 'Disabled and checked',
      id: 'disabled-checked',
      disabled: true,
      checked: true,
    },
  },
  settings: {
    appearance: [
      {
        id: 'dark-mode',
        label: 'Dark Mode',
        description: 'Switch between light and dark themes',
        checked: false,
        icon: { on: Moon, off: Sun },
      },
      {
        id: 'animations',
        label: 'Enable Animations',
        description: 'Show smooth transitions and effects',
        checked: true,
      },
      {
        id: 'compact-mode',
        label: 'Compact Layout',
        description: 'Use a more dense interface layout',
        checked: false,
      },
    ],
    notifications: [
      {
        id: 'push-notifications',
        label: 'Push Notifications',
        description: 'Receive notifications on this device',
        checked: true,
        icon: { on: Bell, off: BellOff },
      },
      {
        id: 'sound-notifications',
        label: 'Sound Alerts',
        description: 'Play sound for notifications',
        checked: true,
        icon: { on: Volume2, off: VolumeX },
      },
      {
        id: 'email-digest',
        label: 'Email Digest',
        description: 'Receive weekly email summaries',
        checked: false,
      },
    ],
  },
}

const meta = {
  title: 'UI Components/Switch',
  component: Switch,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A switch component that allows users to toggle between two states. Supports checked, unchecked, and disabled states with smooth animations.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    modelValue: {
      control: { type: 'boolean' },
      description: 'The controlled state of the switch (v-model)',
    },
    defaultValue: {
      control: { type: 'boolean' },
      description: 'The initial state when uncontrolled',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Whether the switch is disabled',
    },
    id: {
      control: { type: 'text' },
      description: 'The id attribute for the switch',
    },
    value: {
      control: { type: 'text' },
      description: 'The value attribute for form submission',
    },
    name: {
      control: { type: 'text' },
      description: 'The name attribute for form submission',
    },
    class: {
      control: { type: 'text' },
      description: 'Additional CSS classes',
    },
  },
  args: {
    modelValue: false,
    disabled: false,
  },
} satisfies Meta<typeof Switch>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => ({
    components: { Switch },
    setup() {
      const enabled = ref(false)
      return { args, enabled }
    },
    template: '<Switch v-model="enabled" v-bind="args" />',
  }),
}

export const SwitchStates: Story = {
  render: () => ({
    components: { Switch, Label },
    setup() {
      const { basic } = mockSwitchData
      const notificationsEnabled = ref(false)
      const darkModeEnabled = ref(true)

      return { basic, notificationsEnabled, darkModeEnabled }
    },
    template: `
      <div class="space-y-4">
        <div class="flex items-center space-x-2">
          <Switch :id="basic.default.id" v-model="notificationsEnabled" />
          <Label :for="basic.default.id" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {{ basic.default.label }}
          </Label>
        </div>
        
        <div class="flex items-center space-x-2">
          <Switch :id="basic.checked.id" v-model="darkModeEnabled" />
          <Label :for="basic.checked.id" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {{ basic.checked.label }}
          </Label>
        </div>
        
        <div class="flex items-center space-x-2">
          <Switch :id="basic.disabled.id" :disabled="basic.disabled.disabled" />
          <Label :for="basic.disabled.id" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {{ basic.disabled.label }}
          </Label>
        </div>
        
        <div class="flex items-center space-x-2">
          <Switch :id="basic.disabledChecked.id" :model-value="basic.disabledChecked.checked" :disabled="basic.disabledChecked.disabled" />
          <Label :for="basic.disabledChecked.id" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {{ basic.disabledChecked.label }}
          </Label>
        </div>
      </div>
    `,
  }),
}

export const ExclusiveSwitches: Story = {
  render: () => ({
    components: { Switch, Label },
    setup() {
      const selectedOption = ref('email')

      const options = [
        { id: 'email', label: 'Email Notifications' },
        { id: 'sms', label: 'SMS Notifications' },
        { id: 'push', label: 'Push Notifications' },
      ]

      const handleSwitchChange = (optionId: string, value: boolean) => {
        if (value) {
          selectedOption.value = optionId
        } else if (selectedOption.value === optionId) {
          selectedOption.value = ''
        }
      }

      return {
        options,
        selectedOption,
        handleSwitchChange,
        isSelected: (optionId: string) => selectedOption.value === optionId,
      }
    },
    template: `
      <div class="space-y-4">
        <div class="space-y-2">
          <h4 class="text-sm font-medium">Notification Method (Select One)</h4>
          <p class="text-xs text-muted-foreground">Only one notification method can be active at a time</p>
        </div>
        
        <div class="space-y-3">
          <div v-for="option in options" :key="option.id" class="flex items-center space-x-2">
            <Switch 
              :id="option.id"
              :model-value="isSelected(option.id)"
              @update:model-value="handleSwitchChange(option.id, $event)"
            />
            <Label :for="option.id" class="text-sm font-medium leading-none cursor-pointer">
              {{ option.label }}
            </Label>
          </div>
        </div>
        
        <div v-if="selectedOption" class="text-xs text-muted-foreground">
          Selected: {{ options.find(opt => opt.id === selectedOption)?.label || 'None' }}
        </div>
      </div>
    `,
  }),
}

export const FormIntegration: Story = {
  render: () => ({
    components: { Switch, Label, Button },
    setup() {
      const formData = ref({
        newsletter: false,
        notifications: true,
        analytics: false,
        terms: false,
      })

      const handleSubmit = () => {
        console.log('Form data:', formData.value)
        alert(`Form submitted with: ${JSON.stringify(formData.value, null, 2)}`)
      }

      const isValid = () => formData.value.terms

      return { formData, handleSubmit, isValid }
    },
    template: `
      <form @submit.prevent="handleSubmit" class="max-w-md space-y-4 p-6 border rounded-lg">
        <div class="space-y-2">
          <h3 class="text-lg font-semibold">Account Preferences</h3>
          <p class="text-sm text-muted-foreground">Configure your account settings</p>
        </div>
        
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <Label for="newsletter" class="text-sm font-medium cursor-pointer">
              Newsletter Subscription
            </Label>
            <Switch 
              id="newsletter"
              name="newsletter"
              value="newsletter"
              v-model:model-value="formData.newsletter" 
            />
          </div>
          
          <div class="flex items-center justify-between">
            <Label for="notifications" class="text-sm font-medium cursor-pointer">
              Push Notifications
            </Label>
            <Switch 
              id="notifications"
              name="notifications"
              value="notifications"
              v-model:model-value="formData.notifications" 
            />
          </div>
          
          <div class="flex items-center justify-between">
            <Label for="analytics" class="text-sm font-medium cursor-pointer">
              Analytics & Usage Data
            </Label>
            <Switch 
              id="analytics"
              name="analytics"
              value="analytics"
              v-model:model-value="formData.analytics" 
            />
          </div>
          
          <div class="flex items-center justify-between">
            <Label for="terms" class="text-sm font-medium cursor-pointer">
              I accept the Terms of Service
              <span class="text-red-500 ml-1">*</span>
            </Label>
            <Switch 
              id="terms"
              name="terms"
              value="terms"
              v-model:model-value="formData.terms" 
            />
          </div>
        </div>
        
        <Button 
          type="submit" 
          :disabled="!isValid()"
          class="w-full"
        >
          Save Preferences
        </Button>
        
        <p v-if="!isValid()" class="text-sm text-muted-foreground text-center">
          Please accept the Terms of Service to continue.
        </p>
      </form>
    `,
  }),
}
