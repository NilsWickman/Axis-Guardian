import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Star, Settings, Info } from 'lucide-vue-next'
import { ref } from 'vue'

const meta = {
  title: 'UI Components/RadioGroup',
  component: RadioGroup,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A radio group component that allows users to select a single option from multiple choices. Built with Vue 3 Composition API and reka-ui.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    modelValue: {
      control: { type: 'text' },
      description: 'The selected value of the radio group',
    },
    orientation: {
      control: { type: 'select' },
      options: ['horizontal', 'vertical'],
      description: 'The orientation of the radio group',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Whether the radio group is disabled',
    },
    required: {
      control: { type: 'boolean' },
      description: 'Whether the radio group is required',
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
    orientation: 'vertical',
    disabled: false,
    required: false,
  },
} satisfies Meta<typeof RadioGroup>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => ({
    components: {
      RadioGroup,
      RadioGroupItem,
      Label,
    },
    setup() {
      const selectedValue = ref('option-2')

      return { selectedValue, args }
    },
    template: `
      <RadioGroup v-model="selectedValue" v-bind="args" class="space-y-3">
        <div class="flex items-center space-x-2">
          <RadioGroupItem value="option-1" id="r1" />
          <Label for="r1">Option 1</Label>
        </div>
        <div class="flex items-center space-x-2">
          <RadioGroupItem value="option-2" id="r2" />
          <Label for="r2">Option 2</Label>
        </div>
        <div class="flex items-center space-x-2">
          <RadioGroupItem value="option-3" id="r3" />
          <Label for="r3">Option 3</Label>
        </div>
      </RadioGroup>
    `,
  }),
}

export const Horizontal: Story = {
  render: () => ({
    components: {
      RadioGroup,
      RadioGroupItem,
      Label,
    },
    setup() {
      const selectedValue = ref('medium')

      return { selectedValue }
    },
    template: `
      <div class="space-y-4">
        <Label class="text-sm font-medium">Size Selection</Label>
        <RadioGroup v-model="selectedValue" orientation="horizontal" class="flex space-x-6">
          <div class="flex items-center space-x-2">
            <RadioGroupItem value="small" id="h1" />
            <Label for="h1" class="text-sm cursor-pointer">Small</Label>
          </div>
          <div class="flex items-center space-x-2">
            <RadioGroupItem value="medium" id="h2" />
            <Label for="h2" class="text-sm cursor-pointer">Medium</Label>
          </div>
          <div class="flex items-center space-x-2">
            <RadioGroupItem value="large" id="h3" />
            <Label for="h3" class="text-sm cursor-pointer">Large</Label>
          </div>
        </RadioGroup>
        <p class="text-sm text-muted-foreground">Selected: {{ selectedValue }}</p>
      </div>
    `,
  }),
}

export const WithDescriptions: Story = {
  render: () => ({
    components: {
      RadioGroup,
      RadioGroupItem,
      Label,
      Card,
      CardContent,
    },
    setup() {
      const selectedValue = ref('standard')

      const options = [
        {
          value: 'basic',
          label: 'Basic Option',
          description: 'Simple configuration with default settings',
        },
        {
          value: 'standard',
          label: 'Standard Option',
          description: 'Recommended configuration for most users',
        },
        {
          value: 'advanced',
          label: 'Advanced Option',
          description: 'Full customization with advanced features',
        },
      ]

      return { selectedValue, options }
    },
    template: `
      <Card class="w-full max-w-md">
        <CardContent class="pt-6">
          <RadioGroup v-model="selectedValue" class="space-y-3">
            <div 
              v-for="option in options" 
              :key="option.value"
              class="flex items-start space-x-3 p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
              :class="{ 'border-primary bg-primary/5': selectedValue === option.value }"
            >
              <RadioGroupItem :value="option.value" :id="option.value" class="mt-0.5" />
              <div class="flex-1">
                <Label :for="option.value" class="text-sm font-medium cursor-pointer block">
                  {{ option.label }}
                </Label>
                <p class="text-xs text-muted-foreground mt-1">{{ option.description }}</p>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>
    `,
  }),
}

export const WithIcons: Story = {
  render: () => ({
    components: {
      RadioGroup,
      RadioGroupItem,
      Label,
      Card,
      CardContent,
      Star,
      Settings,
      Info,
    },
    setup() {
      const selectedValue = ref('settings')

      const options = [
        {
          value: 'favorites',
          label: 'Favorites',
          icon: Star,
          description: 'Your starred items',
        },
        {
          value: 'settings',
          label: 'Settings',
          icon: Settings,
          description: 'Configuration options',
        },
        {
          value: 'info',
          label: 'Information',
          icon: Info,
          description: 'Help and documentation',
        },
      ]

      return { selectedValue, options }
    },
    template: `
      <Card class="w-full max-w-sm">
        <CardContent class="pt-6">
          <RadioGroup v-model="selectedValue" class="space-y-2">
            <div 
              v-for="option in options" 
              :key="option.value"
              class="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
              :class="{ 'border-primary bg-primary/5': selectedValue === option.value }"
            >
              <RadioGroupItem :value="option.value" :id="option.value" />
              <div class="flex items-center space-x-3 flex-1">
                <component :is="option.icon" class="h-4 w-4 text-gray-500" />
                <div>
                  <Label :for="option.value" class="text-sm font-medium cursor-pointer block">
                    {{ option.label }}
                  </Label>
                  <p class="text-xs text-muted-foreground">{{ option.description }}</p>
                </div>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>
    `,
  }),
}

export const WithDisabledOptions: Story = {
  render: () => ({
    components: {
      RadioGroup,
      RadioGroupItem,
      Label,
      Card,
      CardContent,
    },
    setup() {
      const selectedValue = ref('medium')

      const options = [
        { value: 'low', label: 'Low Priority', disabled: false },
        { value: 'medium', label: 'Medium Priority', disabled: false },
        { value: 'high', label: 'High Priority', disabled: false },
        { value: 'urgent', label: 'Urgent Priority', disabled: true, note: '(Premium feature)' },
      ]

      return { selectedValue, options }
    },
    template: `
      <Card class="w-full max-w-sm">
        <CardContent class="pt-6">
          <h3 class="text-lg font-semibold mb-4">Priority Level</h3>
          <RadioGroup v-model="selectedValue" class="space-y-3">
            <div 
              v-for="option in options" 
              :key="option.value" 
              class="flex items-center space-x-3"
              :class="{ 'opacity-50': option.disabled }"
            >
              <RadioGroupItem 
                :value="option.value" 
                :id="option.value"
                :disabled="option.disabled"
              />
              <Label 
                :for="option.value" 
                class="text-sm font-medium"
                :class="{ 'cursor-not-allowed': option.disabled, 'cursor-pointer': !option.disabled }"
              >
                {{ option.label }}
                <span v-if="option.note" class="text-xs text-muted-foreground ml-1">{{ option.note }}</span>
              </Label>
            </div>
          </RadioGroup>
          <p class="text-sm text-muted-foreground mt-4">Selected: {{ selectedValue }}</p>
        </CardContent>
      </Card>
    `,
  }),
}

export const FormValidation: Story = {
  render: () => ({
    components: {
      RadioGroup,
      RadioGroupItem,
      Label,
      Card,
      CardContent,
      Button,
    },
    setup() {
      const selectedValue = ref('')
      const error = ref('')
      const isSubmitted = ref(false)

      const options = [
        { value: 'option-a', label: 'Option A' },
        { value: 'option-b', label: 'Option B' },
        { value: 'option-c', label: 'Option C' },
      ]

      const handleSubmit = () => {
        isSubmitted.value = true
        if (!selectedValue.value) {
          error.value = 'Please select an option'
          return
        }
        error.value = ''
        alert(`Form submitted with: ${selectedValue.value}`)
      }

      const clearError = () => {
        if (isSubmitted.value && selectedValue.value) {
          error.value = ''
        }
      }

      return { selectedValue, error, isSubmitted, options, handleSubmit, clearError }
    },
    template: `
      <Card class="w-full max-w-md">
        <CardContent class="pt-6">
          <form @submit.prevent="handleSubmit" class="space-y-4">
            <div>
              <h3 class="text-lg font-semibold mb-4">
                Select an Option <span class="text-red-500">*</span>
              </h3>
              <RadioGroup 
                v-model="selectedValue" 
                @update:model-value="clearError"
                required
                class="space-y-3"
                :class="{ 'border border-red-200 rounded-lg p-2': error }"
              >
                <div v-for="option in options" :key="option.value" class="flex items-center space-x-3">
                  <RadioGroupItem :value="option.value" :id="option.value" />
                  <Label :for="option.value" class="text-sm font-medium cursor-pointer">
                    {{ option.label }}
                  </Label>
                </div>
              </RadioGroup>
              <p v-if="error" class="text-red-500 text-sm mt-2">{{ error }}</p>
            </div>
            <Button type="submit" class="w-full">Submit</Button>
          </form>
        </CardContent>
      </Card>
    `,
  }),
}

export const ControlledExample: Story = {
  render: () => ({
    components: {
      RadioGroup,
      RadioGroupItem,
      Label,
      Button,
      Card,
      CardContent,
    },
    setup() {
      const controlledValue = ref('option-2')
      const uncontrolledValue = ref('')

      const resetControlled = () => {
        controlledValue.value = 'option-1'
      }

      const handleUncontrolledChange = (value) => {
        uncontrolledValue.value = value
      }

      return {
        controlledValue,
        uncontrolledValue,
        resetControlled,
        handleUncontrolledChange,
      }
    },
    template: `
      <div class="grid gap-6 md:grid-cols-2">
        <Card>
          <CardContent class="pt-6">
            <h3 class="text-lg font-semibold mb-4">Controlled</h3>
            <RadioGroup v-model="controlledValue" class="space-y-2 mb-4">
              <div class="flex items-center space-x-2">
                <RadioGroupItem value="option-1" id="c1" />
                <Label for="c1" class="cursor-pointer">Option 1</Label>
              </div>
              <div class="flex items-center space-x-2">
                <RadioGroupItem value="option-2" id="c2" />
                <Label for="c2" class="cursor-pointer">Option 2</Label>
              </div>
              <div class="flex items-center space-x-2">
                <RadioGroupItem value="option-3" id="c3" />
                <Label for="c3" class="cursor-pointer">Option 3</Label>
              </div>
            </RadioGroup>
            <p class="text-sm text-muted-foreground mb-3">Selected: {{ controlledValue }}</p>
            <Button @click="resetControlled" size="sm">Reset to Option 1</Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent class="pt-6">
            <h3 class="text-lg font-semibold mb-4">Uncontrolled</h3>
            <RadioGroup @update:model-value="handleUncontrolledChange" class="space-y-2 mb-4">
              <div class="flex items-center space-x-2">
                <RadioGroupItem value="option-a" id="u1" />
                <Label for="u1" class="cursor-pointer">Option A</Label>
              </div>
              <div class="flex items-center space-x-2">
                <RadioGroupItem value="option-b" id="u2" />
                <Label for="u2" class="cursor-pointer">Option B</Label>
              </div>
              <div class="flex items-center space-x-2">
                <RadioGroupItem value="option-c" id="u3" />
                <Label for="u3" class="cursor-pointer">Option C</Label>
              </div>
            </RadioGroup>
            <p class="text-sm text-muted-foreground">Last selected: {{ uncontrolledValue || 'None' }}</p>
          </CardContent>
        </Card>
      </div>
    `,
  }),
}
