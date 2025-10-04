import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ref } from 'vue'
import { AlertCircle, Info, Asterisk } from 'lucide-vue-next'

// Mock data for different label scenarios
const mockLabels = {
  basic: {
    simple: { text: 'Email Address', for: 'email' },
    withDescription: {
      text: 'Full Name',
      for: 'name',
      description: 'Enter your first and last name',
    },
    required: { text: 'Password', for: 'password', required: true },
  },
  states: {
    default: { text: 'Default Label', for: 'default' },
    disabled: { text: 'Disabled Field', for: 'disabled', disabled: true },
    error: { text: 'Invalid Field', for: 'error', error: 'This field is required' },
    success: { text: 'Valid Field', for: 'success', success: 'Field is valid' },
  },
  variations: {
    withIcon: { text: 'Important Field', for: 'important', icon: true },
    withTooltip: {
      text: 'Complex Field',
      for: 'complex',
      tooltip: 'This field requires special formatting',
    },
    longText: {
      text: 'This is a very long label that might wrap to multiple lines in certain contexts',
      for: 'long',
    },
    uppercase: { text: 'UPPERCASE LABEL', for: 'upper' },
  },
  formTypes: {
    checkbox: { text: 'Accept Terms and Conditions', for: 'terms' },
    radio: { text: 'Preferred Contact Method', for: 'contact' },
    textarea: { text: 'Additional Comments', for: 'comments' },
    select: { text: 'Country/Region', for: 'country' },
  },
}

const meta = {
  title: 'UI Components/Label',
  component: Label,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A label component for form fields with support for required indicators, descriptions, and various states.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    for: {
      control: { type: 'text' },
      description: 'The id of the element the label is associated with',
    },
    class: {
      control: { type: 'text' },
      description: 'Additional CSS classes',
    },
    as: {
      control: { type: 'text' },
      description: 'The element to render as (default: label)',
      defaultValue: 'label',
    },
  },
  args: {
    for: 'input-field',
  },
} satisfies Meta<typeof Label>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => ({
    components: { Label },
    setup() {
      return { args }
    },
    template: '<Label v-bind="args">Default Label</Label>',
  }),
}

export const WithFormStates: Story = {
  render: () => ({
    components: { Label, Input },
    setup() {
      const { states } = mockLabels
      const values = ref({
        default: '',
        disabled: 'Read-only value',
        error: 'invalid-email',
        success: 'valid@example.com',
      })
      return { states, values }
    },
    template: `
      <div class="space-y-6 max-w-md">
        <div class="space-y-2">
          <Label :for="states.default.for">{{ states.default.text }}</Label>
          <Input 
            :id="states.default.for"
            v-model="values.default"
            placeholder="Enter text"
          />
        </div>
        
        <div class="space-y-2" data-disabled="true">
          <Label :for="states.disabled.for">{{ states.disabled.text }}</Label>
          <Input 
            :id="states.disabled.for"
            :model-value="values.disabled"
            disabled
          />
        </div>
        
        <div class="space-y-2">
          <Label :for="states.error.for" class="text-red-600">{{ states.error.text }}</Label>
          <Input 
            :id="states.error.for"
            :model-value="values.error"
            class="border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20"
          />
          <p class="text-sm text-red-600 flex items-center gap-1">
            <AlertCircle class="h-4 w-4" />
            {{ states.error.error }}
          </p>
        </div>
        
        <div class="space-y-2">
          <Label :for="states.success.for" class="text-green-600">{{ states.success.text }}</Label>
          <Input 
            :id="states.success.for"
            :model-value="values.success"
            class="border-green-500 focus-visible:border-green-500 focus-visible:ring-green-500/20"
          />
          <p class="text-sm text-green-600">{{ states.success.success }}</p>
        </div>
      </div>
    `,
  }),
}

export const LabelVariations: Story = {
  render: () => ({
    components: { Label, Input, Info },
    setup() {
      const { variations } = mockLabels
      const values = ref({
        important: '',
        complex: '',
        long: '',
        upper: '',
      })
      return { variations, values }
    },
    template: `
      <div class="space-y-6 max-w-md">
        <div class="space-y-2">
          <Label :for="variations.withIcon.for" class="flex items-center gap-2">
            <AlertCircle class="h-4 w-4 text-orange-500" />
            {{ variations.withIcon.text }}
          </Label>
          <Input 
            :id="variations.withIcon.for"
            v-model="values.important"
            placeholder="Handle with care"
          />
        </div>
        
        <div class="space-y-2">
          <Label :for="variations.withTooltip.for" class="flex items-center gap-2">
            {{ variations.withTooltip.text }}
            <Info class="h-4 w-4 text-muted-foreground cursor-help" />
          </Label>
          <Input 
            :id="variations.withTooltip.for"
            v-model="values.complex"
            placeholder="Follow the format"
          />
          <p class="text-xs text-muted-foreground">{{ variations.withTooltip.tooltip }}</p>
        </div>
        
        <div class="space-y-2">
          <Label :for="variations.longText.for" class="leading-relaxed">{{ variations.longText.text }}</Label>
          <Input 
            :id="variations.longText.for"
            v-model="values.long"
            placeholder="Enter value"
          />
        </div>
        
        <div class="space-y-2">
          <Label :for="variations.uppercase.for" class="uppercase text-xs font-bold tracking-wide">{{ variations.uppercase.text }}</Label>
          <Input 
            :id="variations.uppercase.for"
            v-model="values.upper"
            placeholder="Enter value"
          />
        </div>
      </div>
    `,
  }),
}

export const RequiredFieldsForm: Story = {
  render: () => ({
    components: { Label, Input, Button, Asterisk },
    setup() {
      const form = ref({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        company: '',
      })

      const handleSubmit = () => {
        console.log('Form submitted:', form.value)
      }

      return { form, handleSubmit }
    },
    template: `
      <div class="max-w-md space-y-6 p-6 border rounded-lg">
        <div class="space-y-2">
          <h3 class="text-lg font-semibold">Contact Information</h3>
          <p class="text-sm text-muted-foreground">
            Fields marked with <span class="text-red-500">*</span> are required
          </p>
        </div>
        
        <div class="space-y-4">
          <div class="space-y-2">
            <Label for="firstName" class="flex items-center gap-1">
              First Name
              <Asterisk class="h-3 w-3 text-red-500" />
            </Label>
            <Input 
              id="firstName"
              v-model="form.firstName"
              placeholder="John"
              required
            />
          </div>
          
          <div class="space-y-2">
            <Label for="lastName" class="flex items-center gap-1">
              Last Name
              <Asterisk class="h-3 w-3 text-red-500" />
            </Label>
            <Input 
              id="lastName"
              v-model="form.lastName"
              placeholder="Doe"
              required
            />
          </div>
          
          <div class="space-y-2">
            <Label for="email" class="flex items-center gap-1">
              Email Address
              <Asterisk class="h-3 w-3 text-red-500" />
            </Label>
            <Input 
              id="email"
              v-model="form.email"
              type="email"
              placeholder="john@example.com"
              required
            />
          </div>
          
          <div class="space-y-2">
            <Label for="phone">Phone Number</Label>
            <Input 
              id="phone"
              v-model="form.phone"
              type="tel"
              placeholder="+1 (555) 123-4567"
            />
            <p class="text-xs text-muted-foreground">Optional</p>
          </div>
          
          <div class="space-y-2">
            <Label for="company">Company</Label>
            <Input 
              id="company"
              v-model="form.company"
              placeholder="Acme Inc."
            />
            <p class="text-xs text-muted-foreground">Optional</p>
          </div>
          
          <Button @click="handleSubmit" class="w-full">
            Submit Form
          </Button>
        </div>
      </div>
    `,
  }),
}
