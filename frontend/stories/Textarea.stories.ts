import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ref, computed } from 'vue'

// Mock data for different textarea scenarios
const mockTextareaData = {
  content: {
    comment:
      'This is a great product! I really appreciate the attention to detail and the user-friendly interface. Looking forward to future updates.',
    bio: 'Full-stack developer with 5+ years of experience building web applications using modern technologies. Passionate about clean code, user experience, and continuous learning. When not coding, I enjoy hiking, photography, and exploring new coffee shops.',
  },
  placeholders: {
    comment: 'Share your thoughts about this product...',
    notes: 'Add your notes here...',
  },
  validation: {
    errors: {
      required: 'This field is required',
      minLength: 'Please enter at least 10 characters',
      maxLength: 'Maximum 500 characters allowed',
    },
    success: 'Looks good!',
  },
}

const meta = {
  title: 'UI Components/Textarea',
  component: Textarea,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A textarea component for multi-line text input with various states and styling options.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    modelValue: {
      control: { type: 'text' },
      description: 'The textarea value (v-model)',
    },
    defaultValue: {
      control: { type: 'text' },
      description: 'Default value for the textarea',
    },
    placeholder: {
      control: { type: 'text' },
      description: 'Placeholder text',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Whether the textarea is disabled',
    },
    class: {
      control: { type: 'text' },
      description: 'Additional CSS classes',
    },
  },
  args: {
    placeholder: 'Enter your text here...',
  },
} satisfies Meta<typeof Textarea>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => ({
    components: { Textarea },
    setup() {
      return { args }
    },
    template: '<Textarea v-bind="args" />',
  }),
}

export const WithLabel: Story = {
  render: (args) => ({
    components: { Textarea, Label },
    setup() {
      const placeholder = mockTextareaData.placeholders.comment
      return { args, placeholder }
    },
    template: `
      <div class="space-y-2 max-w-md">
        <Label for="comment">Comments</Label>
        <Textarea 
          id="comment"
          :placeholder="placeholder"
          v-bind="args" 
        />
      </div>
    `,
  }),
}

export const TextareaStates: Story = {
  render: () => ({
    components: { Textarea, Label },
    setup() {
      const states = {
        default: { value: '', placeholder: mockTextareaData.placeholders.notes },
        withValue: { value: mockTextareaData.content.comment, placeholder: '' },
        disabled: {
          value: 'This textarea is disabled and cannot be edited',
          placeholder: '',
          disabled: true,
        },
      }
      return { states }
    },
    template: `
      <div class="space-y-6 max-w-md">
        <div class="space-y-2">
          <Label>Default State</Label>
          <Textarea :placeholder="states.default.placeholder" />
        </div>
        
        <div class="space-y-2">
          <Label>With Pre-filled Content</Label>
          <Textarea 
            :model-value="states.withValue.value"
            :placeholder="states.withValue.placeholder"
          />
        </div>
        
        <div class="space-y-2">
          <Label>Disabled</Label>
          <Textarea 
            :model-value="states.disabled.value"
            :placeholder="states.disabled.placeholder"
            disabled
          />
        </div>
      </div>
    `,
  }),
}

export const DifferentSizes: Story = {
  render: () => ({
    components: { Textarea, Label },
    setup() {
      const placeholder = mockTextareaData.placeholders.notes
      return { placeholder }
    },
    template: `
      <div class="space-y-6 max-w-md">
        <div class="space-y-2">
          <Label>Small (min-h-16)</Label>
          <Textarea 
            :placeholder="placeholder"
            class="min-h-16"
          />
        </div>
        
        <div class="space-y-2">
          <Label>Medium (min-h-24)</Label>
          <Textarea 
            :placeholder="placeholder"
            class="min-h-24"
          />
        </div>
        
        <div class="space-y-2">
          <Label>Large (min-h-32)</Label>
          <Textarea 
            :placeholder="placeholder"
            class="min-h-32"
          />
        </div>
        
        <div class="space-y-2">
          <Label>Extra Large (min-h-48)</Label>
          <Textarea 
            :placeholder="placeholder"
            class="min-h-48"
          />
        </div>
      </div>
    `,
  }),
}

export const ValidationStates: Story = {
  render: () => ({
    components: { Textarea, Label },
    setup() {
      const validContent = mockTextareaData.content.bio
      const invalidContent = 'Too short'
      const { validation } = mockTextareaData

      return { validContent, invalidContent, validation }
    },
    template: `
      <div class="space-y-6 max-w-md">
        <div class="space-y-2">
          <Label>Valid Input</Label>
          <Textarea 
            :model-value="validContent"
            class="border-green-500 focus-visible:border-green-500 focus-visible:ring-green-500/20"
          />
          <p class="text-sm text-green-600">{{ validation.success }}</p>
        </div>
        
        <div class="space-y-2">
          <Label>Required Field (Empty)</Label>
          <Textarea 
            placeholder="This field is required..."
            class="border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20"
          />
          <p class="text-sm text-red-600">{{ validation.errors.required }}</p>
        </div>
        
        <div class="space-y-2">
          <Label>Too Short</Label>
          <Textarea 
            :model-value="invalidContent"
            class="border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20"
          />
          <p class="text-sm text-red-600">{{ validation.errors.minLength }}</p>
        </div>
      </div>
    `,
  }),
}

export const CharacterCounter: Story = {
  render: () => ({
    components: { Textarea, Label },
    setup() {
      const text = ref('')
      const maxLength = 280

      const characterCount = computed(() => text.value.length)
      const isOverLimit = computed(() => characterCount.value > maxLength)
      const remainingChars = computed(() => maxLength - characterCount.value)

      return { text, maxLength, characterCount, isOverLimit, remainingChars }
    },
    template: `
      <div class="max-w-md space-y-2">
        <div class="flex justify-between items-center">
          <Label for="tweet-text">Tweet</Label>
          <span class="text-sm" :class="{ 
            'text-red-500': isOverLimit, 
            'text-yellow-500': remainingChars < 20 && !isOverLimit,
            'text-muted-foreground': remainingChars >= 20 
          }">
            {{ remainingChars }} remaining
          </span>
        </div>
        <Textarea 
          id="tweet-text"
          v-model="text"
          placeholder="What's happening?"
          class="min-h-20"
          :class="{ 'border-red-500 focus-visible:border-red-500': isOverLimit }"
        />
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div 
            class="h-2 rounded-full transition-all duration-300"
            :class="{
              'bg-green-500': characterCount / maxLength < 0.7,
              'bg-yellow-500': characterCount / maxLength >= 0.7 && characterCount / maxLength < 0.9,
              'bg-red-500': characterCount / maxLength >= 0.9
            }"
            :style="{ width: Math.min(characterCount / maxLength * 100, 100) + '%' }"
          ></div>
        </div>
      </div>
    `,
  }),
}
