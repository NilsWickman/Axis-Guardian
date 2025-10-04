import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ref, computed } from 'vue'

// Mock data for different checkbox scenarios
const mockCheckboxData = {
  basic: {
    default: { label: 'Accept terms and conditions', id: 'terms' },
    checked: { label: 'I agree to receive marketing emails', id: 'marketing', checked: true },
    disabled: { label: 'This option is disabled', id: 'disabled', disabled: true },
    disabledChecked: {
      label: 'Disabled and checked',
      id: 'disabled-checked',
      disabled: true,
      checked: true,
    },
  },
  groups: {
    preferences: [
      { id: 'notifications', label: 'Email notifications', checked: true },
      { id: 'newsletter', label: 'Newsletter subscription', checked: false },
      { id: 'updates', label: 'Product updates', checked: true },
      { id: 'promotions', label: 'Promotional offers', checked: false },
    ],
    permissions: [
      { id: 'read', label: 'Read access', checked: true },
      { id: 'write', label: 'Write access', checked: true },
      { id: 'delete', label: 'Delete access', checked: false },
      { id: 'admin', label: 'Admin privileges', checked: false },
    ],
  },
  form: {
    registration: [
      { id: 'terms', label: 'I accept the Terms of Service', required: true },
      { id: 'privacy', label: 'I accept the Privacy Policy', required: true },
      { id: 'marketing', label: 'I want to receive marketing communications', required: false },
      { id: 'newsletter', label: 'Subscribe to newsletter for updates', required: false },
    ],
  },
  todoList: [
    { id: 'task1', label: 'Review quarterly reports', checked: true },
    { id: 'task2', label: 'Update project documentation', checked: false },
    { id: 'task3', label: 'Schedule team meeting', checked: true },
    { id: 'task4', label: 'Prepare presentation slides', checked: false },
    { id: 'task5', label: 'Send client follow-up email', checked: false },
  ],
}

const meta = {
  title: 'UI Components/Checkbox',
  component: Checkbox,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A checkbox component that allows users to select or deselect options. Supports checked, unchecked, indeterminate, and disabled states.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    checked: {
      control: { type: 'select' },
      options: [true, false, 'indeterminate'],
      description: 'The checked state of the checkbox',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Whether the checkbox is disabled',
    },
    required: {
      control: { type: 'boolean' },
      description: 'Whether the checkbox is required',
    },
    name: {
      control: { type: 'text' },
      description: 'The name attribute for form submission',
    },
    value: {
      control: { type: 'text' },
      description: 'The value attribute for form submission',
    },
    id: {
      control: { type: 'text' },
      description: 'The id attribute for the checkbox',
    },
    class: {
      control: { type: 'text' },
      description: 'Additional CSS classes',
    },
  },
  args: {
    checked: false,
    disabled: false,
  },
} satisfies Meta<typeof Checkbox>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => ({
    components: { Checkbox },
    setup() {
      return { args }
    },
    template: '<Checkbox v-bind="args" />',
  }),
}

export const WithLabel: Story = {
  render: (args) => ({
    components: { Checkbox, Label },
    setup() {
      const checkboxData = mockCheckboxData.basic.default
      return { args, checkboxData }
    },
    template: `
      <div class="flex items-center space-x-2">
        <Checkbox :id="checkboxData.id" v-bind="args" />
        <Label :for="checkboxData.id" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {{ checkboxData.label }}
        </Label>
      </div>
    `,
  }),
}

export const CheckboxStates: Story = {
  render: () => ({
    components: { Checkbox, Label },
    setup() {
      const { basic } = mockCheckboxData
      return { basic }
    },
    template: `
      <div class="space-y-4">
        <div class="flex items-center space-x-2">
          <Checkbox :id="basic.default.id" />
          <Label :for="basic.default.id" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {{ basic.default.label }}
          </Label>
        </div>
        
        <div class="flex items-center space-x-2">
          <Checkbox :id="basic.checked.id" :checked="basic.checked.checked" />
          <Label :for="basic.checked.id" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {{ basic.checked.label }}
          </Label>
        </div>
        
        <div class="flex items-center space-x-2">
          <Checkbox :id="basic.disabled.id" :disabled="basic.disabled.disabled" />
          <Label :for="basic.disabled.id" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {{ basic.disabled.label }}
          </Label>
        </div>
        
        <div class="flex items-center space-x-2">
          <Checkbox :id="basic.disabledChecked.id" :checked="basic.disabledChecked.checked" :disabled="basic.disabledChecked.disabled" />
          <Label :for="basic.disabledChecked.id" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {{ basic.disabledChecked.label }}
          </Label>
        </div>
      </div>
    `,
  }),
}

export const IndeterminateState: Story = {
  render: () => ({
    components: { Checkbox, Label },
    setup() {
      const parentChecked = ref('indeterminate')
      const childItems = ref([
        { id: 'child1', label: 'Option 1', checked: true },
        { id: 'child2', label: 'Option 2', checked: false },
        { id: 'child3', label: 'Option 3', checked: true },
      ])

      const updateParentState = () => {
        const checkedCount = childItems.value.filter((item) => item.checked).length
        if (checkedCount === 0) {
          parentChecked.value = false
        } else if (checkedCount === childItems.value.length) {
          parentChecked.value = true
        } else {
          parentChecked.value = 'indeterminate'
        }
      }

      const toggleParent = () => {
        const newState = parentChecked.value !== true
        childItems.value.forEach((item) => {
          item.checked = newState
        })
        parentChecked.value = newState
      }

      const toggleChild = (index: number) => {
        childItems.value[index].checked = !childItems.value[index].checked
        updateParentState()
      }

      return { parentChecked, childItems, toggleParent, toggleChild }
    },
    template: `
      <div class="space-y-3">
        <div class="flex items-center space-x-2">
          <Checkbox 
            id="parent" 
            :checked="parentChecked" 
            @update:checked="toggleParent"
          />
          <Label for="parent" class="text-sm font-medium leading-none">
            Select all options
          </Label>
        </div>
        
        <div class="ml-6 space-y-2">
          <div v-for="(item, index) in childItems" :key="item.id" class="flex items-center space-x-2">
            <Checkbox 
              :id="item.id" 
              :checked="item.checked" 
              @update:checked="() => toggleChild(index)"
            />
            <Label :for="item.id" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              {{ item.label }}
            </Label>
          </div>
        </div>
      </div>
    `,
  }),
}

export const CheckboxGroup: Story = {
  render: () => ({
    components: { Checkbox, Label },
    setup() {
      const { preferences } = mockCheckboxData.groups
      const items = ref(preferences.map((item) => ({ ...item })))

      return { items }
    },
    template: `
      <div class="space-y-3">
        <h4 class="text-sm font-medium">Notification Preferences</h4>
        <div class="space-y-2">
          <div v-for="item in items" :key="item.id" class="flex items-center space-x-2">
            <Checkbox :id="item.id" v-model:checked="item.checked" />
            <Label :for="item.id" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              {{ item.label }}
            </Label>
          </div>
        </div>
      </div>
    `,
  }),
}

export const PermissionsMatrix: Story = {
  render: () => ({
    components: { Checkbox, Label },
    setup() {
      const { permissions } = mockCheckboxData.groups
      const items = ref(permissions.map((item) => ({ ...item })))

      return { items }
    },
    template: `
      <div class="space-y-3">
        <h4 class="text-sm font-medium">User Permissions</h4>
        <div class="space-y-2">
          <div v-for="item in items" :key="item.id" class="flex items-center space-x-2">
            <Checkbox :id="item.id" v-model:checked="item.checked" />
            <Label :for="item.id" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              {{ item.label }}
            </Label>
          </div>
        </div>
      </div>
    `,
  }),
}

export const RegistrationForm: Story = {
  render: () => ({
    components: { Checkbox, Label, Button },
    setup() {
      const { registration } = mockCheckboxData.form
      const formData = ref(registration.map((item) => ({ ...item, checked: false })))

      const canSubmit = computed(() => {
        return formData.value.filter((item) => item.required).every((item) => item.checked)
      })

      const handleSubmit = () => {
        if (canSubmit.value) {
          console.log('Form submitted:', formData.value)
          alert('Registration form submitted successfully!')
        }
      }

      return { formData, canSubmit, handleSubmit }
    },
    template: `
      <div class="max-w-md space-y-4 p-6 border rounded-lg">
        <div class="space-y-2">
          <h3 class="text-lg font-semibold">Create Account</h3>
          <p class="text-sm text-muted-foreground">Please review and accept the following:</p>
        </div>
        
        <div class="space-y-3">
          <div v-for="item in formData" :key="item.id" class="flex items-start space-x-2">
            <Checkbox :id="item.id" v-model:checked="item.checked" />
            <div class="flex-1">
              <Label :for="item.id" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {{ item.label }}
                <span v-if="item.required" class="text-red-500 ml-1">*</span>
              </Label>
            </div>
          </div>
        </div>
        
        <Button 
          @click="handleSubmit" 
          :disabled="!canSubmit"
          class="w-full"
        >
          Create Account
        </Button>
        
        <p v-if="!canSubmit" class="text-sm text-muted-foreground">
          Please accept the required terms to continue.
        </p>
      </div>
    `,
  }),
}

export const TodoList: Story = {
  render: () => ({
    components: { Checkbox, Label, Button },
    setup() {
      const todos = ref(mockCheckboxData.todoList.map((item) => ({ ...item })))

      const completedCount = computed(() => todos.value.filter((todo) => todo.checked).length)
      const totalCount = computed(() => todos.value.length)

      const addNewTodo = () => {
        const newId = `task${todos.value.length + 1}`
        todos.value.push({
          id: newId,
          label: 'New task item',
          checked: false,
        })
      }

      const clearCompleted = () => {
        todos.value = todos.value.filter((todo) => !todo.checked)
      }

      return { todos, completedCount, totalCount, addNewTodo, clearCompleted }
    },
    template: `
      <div class="max-w-md space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">Task List</h3>
          <div class="text-sm text-muted-foreground">
            {{ completedCount }}/{{ totalCount }} completed
          </div>
        </div>
        
        <div class="space-y-2">
          <div v-for="todo in todos" :key="todo.id" class="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50">
            <Checkbox :id="todo.id" v-model:checked="todo.checked" />
            <Label 
              :for="todo.id" 
              class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1"
              :class="{ 'line-through text-muted-foreground': todo.checked }"
            >
              {{ todo.label }}
            </Label>
          </div>
        </div>
        
        <div class="flex gap-2">
          <Button variant="outline" @click="addNewTodo" class="flex-1">
            Add Task
          </Button>
          <Button 
            variant="outline" 
            @click="clearCompleted" 
            :disabled="completedCount === 0"
            class="flex-1"
          >
            Clear Completed
          </Button>
        </div>
      </div>
    `,
  }),
}

export const CustomSizes: Story = {
  render: () => ({
    components: { Checkbox, Label },
    setup() {
      return {}
    },
    template: `
      <div class="space-y-4">
        <div class="flex items-center space-x-2">
          <Checkbox id="small" class="size-3" />
          <Label for="small" class="text-xs">Small checkbox</Label>
        </div>
        
        <div class="flex items-center space-x-2">
          <Checkbox id="default" />
          <Label for="default" class="text-sm">Default checkbox</Label>
        </div>
        
        <div class="flex items-center space-x-2">
          <Checkbox id="large" class="size-5" />
          <Label for="large" class="text-base">Large checkbox</Label>
        </div>
        
        <div class="flex items-center space-x-2">
          <Checkbox id="extra-large" class="size-6" />
          <Label for="extra-large" class="text-lg">Extra large checkbox</Label>
        </div>
      </div>
    `,
  }),
}

export const InteractiveDemo: Story = {
  render: () => ({
    components: { Checkbox, Label, Button },
    setup() {
      const checkboxState = ref(false)
      const interactionCount = ref(0)

      const toggleCheckbox = () => {
        checkboxState.value = !checkboxState.value
        interactionCount.value++
      }

      const resetDemo = () => {
        checkboxState.value = false
        interactionCount.value = 0
      }

      return { checkboxState, interactionCount, toggleCheckbox, resetDemo }
    },
    template: `
      <div class="max-w-sm space-y-4 p-6 border rounded-lg">
        <h4 class="text-lg font-semibold">Interactive Demo</h4>
        
        <div class="flex items-center space-x-2">
          <Checkbox 
            id="interactive" 
            :checked="checkboxState"
            @update:checked="toggleCheckbox"
          />
          <Label for="interactive" class="text-sm font-medium leading-none">
            Click me to toggle state
          </Label>
        </div>
        
        <div class="space-y-2 text-sm text-muted-foreground">
          <p>Current state: <strong>{{ checkboxState ? 'Checked' : 'Unchecked' }}</strong></p>
          <p>Interactions: <strong>{{ interactionCount }}</strong></p>
        </div>
        
        <Button variant="outline" @click="resetDemo" class="w-full">
          Reset Demo
        </Button>
      </div>
    `,
  }),
}
