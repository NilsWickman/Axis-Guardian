import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Search, Mail, Lock, User, Eye, EyeOff } from 'lucide-vue-next'
import { ref } from 'vue'

// Mock data for different input scenarios
const mockInputs = {
  basic: {
    email: { type: 'email', placeholder: 'Enter your email', label: 'Email Address' },
    password: { type: 'password', placeholder: 'Enter password', label: 'Password' },
    text: { type: 'text', placeholder: 'Enter your name', label: 'Full Name' },
    search: { type: 'search', placeholder: 'Search...', label: 'Search' },
  },
  states: {
    default: { placeholder: 'Default state', disabled: false },
    disabled: { placeholder: 'Disabled input', disabled: true, modelValue: 'Read only' },
    withValue: { placeholder: 'With value', modelValue: 'Pre-filled value' },
  },
  validation: {
    valid: {
      placeholder: 'Valid input',
      modelValue: 'valid@example.com',
      class: 'border-green-500',
    },
    invalid: { placeholder: 'Invalid input', modelValue: 'invalid-email', class: 'border-red-500' },
  },
}

const meta = {
  title: 'UI Components/Input',
  component: Input,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A form input component with various states and styling options.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    modelValue: {
      control: { type: 'text' },
      description: 'The input value (v-model)',
    },
    defaultValue: {
      control: { type: 'text' },
      description: 'Default value for the input',
    },
    placeholder: {
      control: { type: 'text' },
      description: 'Placeholder text',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Whether the input is disabled',
    },
    type: {
      control: { type: 'select' },
      options: ['text', 'email', 'password', 'search', 'number', 'tel', 'url'],
      description: 'Input type',
    },
    class: {
      control: { type: 'text' },
      description: 'Additional CSS classes',
    },
  },
  args: {
    placeholder: 'Enter text...',
    type: 'text',
  },
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => ({
    components: { Input },
    setup() {
      return { args }
    },
    template: '<Input v-bind="args" />',
  }),
}

export const WithLabel: Story = {
  render: (args) => ({
    components: { Input, Label },
    setup() {
      const inputData = mockInputs.basic.email
      return { args, inputData }
    },
    template: `
      <div class="space-y-2">
        <Label for="email">{{ inputData.label }}</Label>
        <Input 
          id="email"
          :type="inputData.type"
          :placeholder="inputData.placeholder"
          v-bind="args" 
        />
      </div>
    `,
  }),
}

export const InputTypes: Story = {
  render: () => ({
    components: { Input, Label },
    setup() {
      const { basic } = mockInputs
      const values = ref({
        email: '',
        password: '',
        text: '',
        search: '',
      })
      return { basic, values }
    },
    template: `
      <div class="space-y-4 max-w-sm">
        <div class="space-y-2">
          <Label for="text">{{ basic.text.label }}</Label>
          <Input 
            id="text"
            v-model="values.text"
            :type="basic.text.type"
            :placeholder="basic.text.placeholder"
          />
        </div>
        
        <div class="space-y-2">
          <Label for="email">{{ basic.email.label }}</Label>
          <Input 
            id="email"
            v-model="values.email"
            :type="basic.email.type"
            :placeholder="basic.email.placeholder"
          />
        </div>
        
        <div class="space-y-2">
          <Label for="password">{{ basic.password.label }}</Label>
          <Input 
            id="password"
            v-model="values.password"
            :type="basic.password.type"
            :placeholder="basic.password.placeholder"
          />
        </div>
        
        <div class="space-y-2">
          <Label for="search">{{ basic.search.label }}</Label>
          <Input 
            id="search"
            v-model="values.search"
            :type="basic.search.type"
            :placeholder="basic.search.placeholder"
          />
        </div>
      </div>
    `,
  }),
}

export const InputStates: Story = {
  render: () => ({
    components: { Input, Label },
    setup() {
      const { states } = mockInputs
      return { states }
    },
    template: `
      <div class="space-y-4 max-w-sm">
        <div class="space-y-2">
          <Label>Default State</Label>
          <Input :placeholder="states.default.placeholder" />
        </div>
        
        <div class="space-y-2">
          <Label>With Value</Label>
          <Input 
            :placeholder="states.withValue.placeholder"
            :model-value="states.withValue.modelValue"
          />
        </div>
        
        <div class="space-y-2">
          <Label>Disabled</Label>
          <Input 
            :placeholder="states.disabled.placeholder"
            :model-value="states.disabled.modelValue"
            disabled
          />
        </div>
      </div>
    `,
  }),
}

export const WithIcons: Story = {
  render: () => ({
    components: { Input, Label, Search, Mail, Lock, User },
    setup() {
      const values = ref({
        search: '',
        email: '',
        password: '',
        username: '',
      })
      return { values }
    },
    template: `
      <div class="space-y-4 max-w-sm">
        <div class="space-y-2">
          <Label>Search with Icon</Label>
          <div class="relative">
            <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input 
              v-model="values.search"
              class="pl-10"
              placeholder="Search..." 
            />
          </div>
        </div>
        
        <div class="space-y-2">
          <Label>Email with Icon</Label>
          <div class="relative">
            <Mail class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input 
              v-model="values.email"
              class="pl-10"
              type="email"
              placeholder="email@example.com" 
            />
          </div>
        </div>
        
        <div class="space-y-2">
          <Label>Password with Icon</Label>
          <div class="relative">
            <Lock class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input 
              v-model="values.password"
              class="pl-10"
              type="password"
              placeholder="Password" 
            />
          </div>
        </div>
        
        <div class="space-y-2">
          <Label>Username with Icon</Label>
          <div class="relative">
            <User class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input 
              v-model="values.username"
              class="pl-10"
              placeholder="Username" 
            />
          </div>
        </div>
      </div>
    `,
  }),
}

export const LoginForm: Story = {
  render: () => ({
    components: { Input, Label, Button, Mail, Lock },
    setup() {
      const form = ref({
        email: '',
        password: '',
      })

      const handleSubmit = () => {
        console.log('Form submitted:', form.value)
      }

      return { form, handleSubmit }
    },
    template: `
      <div class="max-w-sm space-y-4 p-6 border rounded-lg">
        <div class="space-y-2 text-center">
          <h3 class="text-lg font-semibold">Login</h3>
          <p class="text-sm text-muted-foreground">Enter your credentials</p>
        </div>
        
        <div class="space-y-4">
          <div class="space-y-2">
            <Label for="login-email">Email</Label>
            <div class="relative">
              <Mail class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input 
                id="login-email"
                v-model="form.email"
                class="pl-10"
                type="email"
                placeholder="email@example.com" 
              />
            </div>
          </div>
          
          <div class="space-y-2">
            <Label for="login-password">Password</Label>
            <div class="relative">
              <Lock class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input 
                id="login-password"
                v-model="form.password"
                class="pl-10"
                type="password"
                placeholder="Password" 
              />
            </div>
          </div>
          
          <Button @click="handleSubmit" class="w-full">
            Sign In
          </Button>
        </div>
      </div>
    `,
  }),
}

export const ValidationStates: Story = {
  render: () => ({
    components: { Input, Label },
    setup() {
      const { validation } = mockInputs
      return { validation }
    },
    template: `
      <div class="space-y-4 max-w-sm">
        <div class="space-y-2">
          <Label>Valid Input</Label>
          <Input 
            :model-value="validation.valid.modelValue"
            :placeholder="validation.valid.placeholder"
            class="border-green-500 focus-visible:border-green-500 focus-visible:ring-green-500/20"
          />
          <p class="text-sm text-green-600">Email is valid</p>
        </div>
        
        <div class="space-y-2">
          <Label>Invalid Input</Label>
          <Input 
            :model-value="validation.invalid.modelValue"
            :placeholder="validation.invalid.placeholder"
            class="border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20"
          />
          <p class="text-sm text-red-600">Please enter a valid email</p>
        </div>
      </div>
    `,
  }),
}
