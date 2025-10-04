import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { Slider } from '@/components/ui/slider'
import { Volume2, DollarSign } from 'lucide-vue-next'
import { ref } from 'vue'

const meta = {
  title: 'UI Components/Slider',
  component: Slider,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A customizable slider component built with Reka UI. Supports single and dual thumb sliders with various orientations and step values.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    modelValue: {
      control: { type: 'object' },
      description: 'The controlled value of the slider',
    },
    defaultValue: {
      control: { type: 'object' },
      description: 'The initial value when uncontrolled',
    },
    min: {
      control: { type: 'number' },
      description: 'The minimum permitted value',
    },
    max: {
      control: { type: 'number' },
      description: 'The maximum permitted value',
    },
    step: {
      control: { type: 'number' },
      description: 'The step interval',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Whether the slider is disabled',
    },
    orientation: {
      control: { type: 'select' },
      options: ['horizontal', 'vertical'],
      description: 'The orientation of the slider',
    },
  },
} satisfies Meta<typeof Slider>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => ({
    components: { Slider },
    setup() {
      const sliderValue = ref(args.defaultValue || [50])
      return { sliderValue, args }
    },
    template: `
      <div class="w-full max-w-md space-y-4">
        <div class="space-y-2">
          <label class="text-sm font-medium">Basic Slider</label>
          <Slider
            v-model="sliderValue"
            :min="args.min || 0"
            :max="args.max || 100"
            :step="args.step || 1"
            :disabled="args.disabled"
            :orientation="args.orientation"
            class="w-full"
          />
          <div class="flex justify-between text-sm text-muted-foreground">
            <span>{{ args.min || 0 }}</span>
            <span class="font-medium">{{ sliderValue[0] }}</span>
            <span>{{ args.max || 100 }}</span>
          </div>
        </div>
      </div>
    `,
  }),
  args: {
    defaultValue: [50],
    min: 0,
    max: 100,
    step: 1,
    disabled: false,
    orientation: 'horizontal',
  },
}

export const Range: Story = {
  render: () => ({
    components: { Slider, DollarSign },
    setup() {
      const priceRange = ref([25, 75])
      return { priceRange }
    },
    template: `
      <div class="w-full max-w-md space-y-4">
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <DollarSign class="h-4 w-4" />
            <label class="text-sm font-medium">Price Range</label>
          </div>
          <Slider
            v-model="priceRange"
            :min="0"
            :max="100"
            :step="5"
            class="w-full"
          />
          <div class="flex justify-between items-center">
            <span class="text-sm font-medium">\${{ priceRange[0] }}</span>
            <span class="text-xs text-muted-foreground">to</span>
            <span class="text-sm font-medium">\${{ priceRange[1] }}</span>
          </div>
        </div>
      </div>
    `,
  }),
}

export const WithSteps: Story = {
  render: () => ({
    components: { Slider },
    setup() {
      const value = ref([2.5])
      return { value }
    },
    template: `
      <div class="w-full max-w-md space-y-4">
        <div class="space-y-2">
          <label class="text-sm font-medium">Decimal Steps (0.5)</label>
          <Slider
            v-model="value"
            :min="0"
            :max="5"
            :step="0.5"
            class="w-full"
          />
          <div class="flex justify-between text-sm text-muted-foreground">
            <span>0</span>
            <span class="font-medium">{{ value[0] }}</span>
            <span>5</span>
          </div>
        </div>
      </div>
    `,
  }),
}

export const Vertical: Story = {
  render: () => ({
    components: { Slider, Volume2 },
    setup() {
      const volume = ref([65])
      return { volume }
    },
    template: `
      <div class="flex items-center justify-center h-80 p-8">
        <div class="flex flex-col items-center space-y-4">
          <Volume2 class="h-5 w-5" />
          <Slider
            v-model="volume"
            :min="0"
            :max="100"
            :step="1"
            orientation="vertical"
            class="h-48"
          />
          <span class="text-sm font-medium">{{ volume[0] }}%</span>
        </div>
      </div>
    `,
  }),
}

export const Disabled: Story = {
  render: () => ({
    components: { Slider },
    setup() {
      const value = ref([30])
      return { value }
    },
    template: `
      <div class="w-full max-w-md space-y-4">
        <div class="space-y-2">
          <label class="text-sm font-medium text-muted-foreground">Disabled Slider</label>
          <Slider
            v-model="value"
            :min="0"
            :max="100"
            :step="1"
            :disabled="true"
            class="w-full"
          />
          <div class="flex justify-between text-sm text-muted-foreground">
            <span>0</span>
            <span class="font-medium">{{ value[0] }}</span>
            <span>100</span>
          </div>
        </div>
      </div>
    `,
  }),
}
