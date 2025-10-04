import type { Meta, StoryObj } from '@storybook/vue3-vite'
import {
  NumberField,
  NumberFieldContent,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
} from '@/components/ui/number-field'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Package } from 'lucide-vue-next'
import { ref, computed } from 'vue'

// Mock data for number field examples
const mockNumberFieldData = {
  basic: {
    quantity: { label: 'Quantity', defaultValue: 1, min: 1, max: 99, step: 1 },
    price: { label: 'Price ($)', defaultValue: 29.99, min: 0, max: 9999.99, step: 0.01 },
    rating: { label: 'Rating (1-5)', defaultValue: 3, min: 1, max: 5, step: 1 },
  },
  states: {
    default: { defaultValue: 5, min: 0, max: 10, step: 1 },
    disabled: { defaultValue: 3, min: 0, max: 10, step: 1, disabled: true },
    readonly: { defaultValue: 7, min: 0, max: 10, step: 1, readOnly: true },
  },
}

const meta = {
  title: 'UI Components/NumberField',
  component: NumberField,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A number field component with increment/decrement buttons, supporting various number formats, ranges, and step values. Perfect for quantities, prices, ratings, and other numeric inputs.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    defaultValue: {
      control: { type: 'number' },
      description: 'Default value for the number field',
    },
    modelValue: {
      control: { type: 'number' },
      description: 'Current value of the number field (v-model)',
    },
    min: {
      control: { type: 'number' },
      description: 'Minimum allowed value',
    },
    max: {
      control: { type: 'number' },
      description: 'Maximum allowed value',
    },
    step: {
      control: { type: 'number' },
      description: 'Step increment/decrement amount',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Whether the field is disabled',
    },
    readOnly: {
      control: { type: 'boolean' },
      description: 'Whether the field is read-only',
    },
    required: {
      control: { type: 'boolean' },
      description: 'Whether the field is required',
    },
    name: {
      control: { type: 'text' },
      description: 'Name attribute for form submission',
    },
    id: {
      control: { type: 'text' },
      description: 'ID attribute for the field',
    },
    class: {
      control: { type: 'text' },
      description: 'Additional CSS classes',
    },
  },
  args: {
    defaultValue: 0,
    min: 0,
    max: 100,
    step: 1,
    disabled: false,
  },
} satisfies Meta<typeof NumberField>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => ({
    components: {
      NumberField,
      NumberFieldContent,
      NumberFieldDecrement,
      NumberFieldIncrement,
      NumberFieldInput,
    },
    setup() {
      return { args }
    },
    template: `
      <NumberField v-bind="args">
        <NumberFieldContent>
          <NumberFieldDecrement />
          <NumberFieldInput />
          <NumberFieldIncrement />
        </NumberFieldContent>
      </NumberField>
    `,
  }),
}

export const WithLabel: Story = {
  render: (args) => ({
    components: {
      NumberField,
      NumberFieldContent,
      NumberFieldDecrement,
      NumberFieldIncrement,
      NumberFieldInput,
      Label,
    },
    setup() {
      const fieldData = mockNumberFieldData.basic.quantity
      return { args, fieldData }
    },
    template: `
      <NumberField v-bind="args" :default-value="fieldData.defaultValue" :min="fieldData.min" :max="fieldData.max" :step="fieldData.step">
        <Label for="quantity">{{ fieldData.label }}</Label>
        <NumberFieldContent>
          <NumberFieldDecrement />
          <NumberFieldInput id="quantity" />
          <NumberFieldIncrement />
        </NumberFieldContent>
      </NumberField>
    `,
  }),
}

export const CommonUseCases: Story = {
  render: () => ({
    components: {
      NumberField,
      NumberFieldContent,
      NumberFieldDecrement,
      NumberFieldIncrement,
      NumberFieldInput,
      Label,
    },
    setup() {
      const { basic } = mockNumberFieldData
      const values = ref({
        quantity: basic.quantity.defaultValue,
        price: basic.price.defaultValue,
        rating: basic.rating.defaultValue,
      })
      return { basic, values }
    },
    template: `
      <div class="space-y-4 max-w-sm">
        <NumberField v-model="values.quantity" :min="basic.quantity.min" :max="basic.quantity.max" :step="basic.quantity.step">
          <Label for="quantity">{{ basic.quantity.label }}</Label>
          <NumberFieldContent>
            <NumberFieldDecrement />
            <NumberFieldInput id="quantity" />
            <NumberFieldIncrement />
          </NumberFieldContent>
        </NumberField>
        
        <NumberField v-model="values.price" :min="basic.price.min" :max="basic.price.max" :step="basic.price.step">
          <Label for="price">{{ basic.price.label }}</Label>
          <NumberFieldContent>
            <NumberFieldDecrement />
            <NumberFieldInput id="price" />
            <NumberFieldIncrement />
          </NumberFieldContent>
        </NumberField>
        
        <NumberField v-model="values.rating" :min="basic.rating.min" :max="basic.rating.max" :step="basic.rating.step">
          <Label for="rating">{{ basic.rating.label }}</Label>
          <NumberFieldContent>
            <NumberFieldDecrement />
            <NumberFieldInput id="rating" />
            <NumberFieldIncrement />
          </NumberFieldContent>
        </NumberField>
      </div>
    `,
  }),
}

export const FieldStates: Story = {
  render: () => ({
    components: {
      NumberField,
      NumberFieldContent,
      NumberFieldDecrement,
      NumberFieldIncrement,
      NumberFieldInput,
      Label,
    },
    setup() {
      const { states } = mockNumberFieldData
      return { states }
    },
    template: `
      <div class="space-y-4 max-w-sm">
        <NumberField :default-value="states.default.defaultValue" :min="states.default.min" :max="states.default.max" :step="states.default.step">
          <Label>Default State</Label>
          <NumberFieldContent>
            <NumberFieldDecrement />
            <NumberFieldInput />
            <NumberFieldIncrement />
          </NumberFieldContent>
        </NumberField>
        
        <NumberField :default-value="states.disabled.defaultValue" :min="states.disabled.min" :max="states.disabled.max" :step="states.disabled.step" disabled>
          <Label>Disabled State</Label>
          <NumberFieldContent>
            <NumberFieldDecrement />
            <NumberFieldInput />
            <NumberFieldIncrement />
          </NumberFieldContent>
        </NumberField>
        
        <NumberField :default-value="states.readonly.defaultValue" :min="states.readonly.min" :max="states.readonly.max" :step="states.readonly.step" read-only>
          <Label>Read-only State</Label>
          <NumberFieldContent>
            <NumberFieldDecrement />
            <NumberFieldInput />
            <NumberFieldIncrement />
          </NumberFieldContent>
        </NumberField>
      </div>
    `,
  }),
}

export const WithReactiveValue: Story = {
  render: () => ({
    components: {
      NumberField,
      NumberFieldContent,
      NumberFieldDecrement,
      NumberFieldIncrement,
      NumberFieldInput,
      Label,
      Button,
      ShoppingCart,
      Package,
    },
    setup() {
      const quantity = ref(1)
      const price = 29.99
      const totalPrice = computed(() => (quantity.value * price).toFixed(2))

      const addToCart = () => {
        alert(`Added ${quantity.value} item(s) to cart. Total: $${totalPrice.value}`)
      }

      return { quantity, price, totalPrice, addToCart }
    },
    template: `
      <div class="max-w-sm space-y-4 p-4 border rounded-lg">
        <div class="flex items-center gap-2">
          <Package class="h-5 w-5" />
          <span class="font-semibold">Product Order</span>
        </div>
        <div class="text-2xl font-bold">\${{ price }}</div>
        
        <NumberField v-model="quantity" :min="1" :max="50" :step="1">
          <Label for="product-quantity">Quantity</Label>
          <NumberFieldContent>
            <NumberFieldDecrement />
            <NumberFieldInput id="product-quantity" />
            <NumberFieldIncrement />
          </NumberFieldContent>
        </NumberField>
        
        <div class="flex items-center justify-between text-sm">
          <span>Subtotal:</span>
          <span class="font-semibold">\${{ totalPrice }}</span>
        </div>
        
        <Button @click="addToCart" class="w-full">
          <ShoppingCart class="mr-2 h-4 w-4" />
          Add to Cart
        </Button>
      </div>
    `,
  }),
}

export const CustomSizing: Story = {
  render: () => ({
    components: {
      NumberField,
      NumberFieldContent,
      NumberFieldDecrement,
      NumberFieldIncrement,
      NumberFieldInput,
      Label,
    },
    setup() {
      const values = ref({ small: 1, default: 5, large: 10 })
      return { values }
    },
    template: `
      <div class="space-y-6">
        <div class="space-y-2">
          <Label>Small Size</Label>
          <NumberField v-model="values.small" :min="0" :max="10" class="max-w-24">
            <NumberFieldContent class="text-xs">
              <NumberFieldDecrement class="p-1">
                <div class="h-3 w-3">-</div>
              </NumberFieldDecrement>
              <NumberFieldInput class="h-6 text-xs" />
              <NumberFieldIncrement class="p-1">
                <div class="h-3 w-3">+</div>
              </NumberFieldIncrement>
            </NumberFieldContent>
          </NumberField>
        </div>
        
        <div class="space-y-2">
          <Label>Default Size</Label>
          <NumberField v-model="values.default" :min="0" :max="10" class="max-w-32">
            <NumberFieldContent>
              <NumberFieldDecrement />
              <NumberFieldInput />
              <NumberFieldIncrement />
            </NumberFieldContent>
          </NumberField>
        </div>
        
        <div class="space-y-2">
          <Label>Large Size</Label>
          <NumberField v-model="values.large" :min="0" :max="10" class="max-w-40">
            <NumberFieldContent class="text-lg">
              <NumberFieldDecrement class="p-4">
                <div class="h-5 w-5">-</div>
              </NumberFieldDecrement>
              <NumberFieldInput class="h-12 text-lg" />
              <NumberFieldIncrement class="p-4">
                <div class="h-5 w-5">+</div>
              </NumberFieldIncrement>
            </NumberFieldContent>
          </NumberField>
        </div>
      </div>
    `,
  }),
}
