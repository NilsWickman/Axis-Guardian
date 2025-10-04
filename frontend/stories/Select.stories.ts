import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { ref } from 'vue'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Globe,
  User,
  Flag,
  Shield,
  Code,
  Palette,
  Music,
  Camera,
  Gamepad,
  Building,
  Settings,
} from 'lucide-vue-next'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

// Mock data for different select scenarios
const mockSelectData = {
  basic: {
    fruits: [
      { value: 'apple', label: 'Apple' },
      { value: 'banana', label: 'Banana' },
      { value: 'cherry', label: 'Cherry' },
      { value: 'date', label: 'Date' },
      { value: 'elderberry', label: 'Elderberry' },
      { value: 'fig', label: 'Fig' },
      { value: 'grape', label: 'Grape' },
      { value: 'honeydew', label: 'Honeydew' },
    ],
  },
  countries: [
    { value: 'us', label: 'United States', flag: '🇺🇸', code: 'US' },
    { value: 'uk', label: 'United Kingdom', flag: '🇬🇧', code: 'GB' },
    { value: 'ca', label: 'Canada', flag: '🇨🇦', code: 'CA' },
    { value: 'de', label: 'Germany', flag: '🇩🇪', code: 'DE' },
    { value: 'fr', label: 'France', flag: '🇫🇷', code: 'FR' },
    { value: 'jp', label: 'Japan', flag: '🇯🇵', code: 'JP' },
    { value: 'au', label: 'Australia', flag: '🇦🇺', code: 'AU' },
    { value: 'br', label: 'Brazil', flag: '🇧🇷', code: 'BR' },
  ],
  userRoles: [
    {
      value: 'admin',
      label: 'Administrator',
      description: 'Full system access',
      permissions: 'All',
    },
    {
      value: 'editor',
      label: 'Editor',
      description: 'Content management access',
      permissions: 'Edit, Create',
    },
    {
      value: 'author',
      label: 'Author',
      description: 'Create and edit own content',
      permissions: 'Create, Edit Own',
    },
    {
      value: 'contributor',
      label: 'Contributor',
      description: 'Create content for review',
      permissions: 'Create',
    },
  ],
  priorities: [
    { value: 'critical', label: 'Critical', color: 'text-red-600', bgColor: 'bg-red-50' },
    { value: 'high', label: 'High', color: 'text-orange-600', bgColor: 'bg-orange-50' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
    { value: 'low', label: 'Low', color: 'text-green-600', bgColor: 'bg-green-50' },
  ],
  categories: {
    technology: [
      { value: 'frontend', label: 'Frontend Development', icon: Code },
      { value: 'backend', label: 'Backend Development', icon: Settings },
      { value: 'mobile', label: 'Mobile Development', icon: Gamepad },
      { value: 'devops', label: 'DevOps & Infrastructure', icon: Building },
    ],
    creative: [
      { value: 'design', label: 'UI/UX Design', icon: Palette },
      { value: 'photography', label: 'Photography', icon: Camera },
      { value: 'music', label: 'Music Production', icon: Music },
    ],
  },
}

const meta = {
  title: 'UI Components/Select',
  component: Select,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A select component that allows users to choose one option from a list. Built with accessibility in mind and supports keyboard navigation, search, and grouping.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    defaultValue: {
      control: { type: 'text' },
      description: 'The default selected value',
    },
    value: {
      control: { type: 'text' },
      description: 'The controlled selected value',
    },
    placeholder: {
      control: { type: 'text' },
      description: 'Placeholder text when no value is selected',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Whether the select is disabled',
    },
    required: {
      control: { type: 'boolean' },
      description: 'Whether the select is required',
    },
    name: {
      control: { type: 'text' },
      description: 'The name attribute for the select input',
    },
  },
  args: {
    disabled: false,
    required: false,
  },
} satisfies Meta<typeof Select>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => ({
    components: {
      Select,
      SelectContent,
      SelectItem,
      SelectTrigger,
      SelectValue,
    },
    setup() {
      const fruits = mockSelectData.basic.fruits
      return { args, fruits }
    },
    template: `
      <Select v-bind="args">
        <SelectTrigger class="w-[180px]">
          <SelectValue placeholder="Select a fruit" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="fruit in fruits" :key="fruit.value" :value="fruit.value">
            {{ fruit.label }}
          </SelectItem>
        </SelectContent>
      </Select>
    `,
  }),
}

export const PreSelected: Story = {
  render: () => ({
    components: {
      Select,
      SelectContent,
      SelectItem,
      SelectTrigger,
      SelectValue,
      Label,
    },
    setup() {
      const fruits = mockSelectData.basic.fruits.slice(0, 5)
      return { fruits }
    },
    template: `
      <div class="grid w-full max-w-sm items-center gap-1.5">
        <Label for="preselected-select">Favorite Fruit</Label>
        <Select default-value="cherry">
          <SelectTrigger id="preselected-select" class="w-[180px]">
            <SelectValue placeholder="Select fruit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="fruit in fruits" :key="fruit.value" :value="fruit.value">
              {{ fruit.label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    `,
  }),
}

export const DisabledState: Story = {
  render: () => ({
    components: {
      Select,
      SelectContent,
      SelectItem,
      SelectTrigger,
      SelectValue,
      Label,
    },
    setup() {
      const fruits = mockSelectData.basic.fruits.slice(0, 4)
      return { fruits }
    },
    template: `
      <div class="space-y-4">
        <div class="grid w-full max-w-sm items-center gap-1.5">
          <Label for="disabled-select">Disabled Select</Label>
          <Select disabled>
            <SelectTrigger id="disabled-select" class="w-[180px]">
              <SelectValue placeholder="This is disabled" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="fruit in fruits" :key="fruit.value" :value="fruit.value">
                {{ fruit.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="grid w-full max-w-sm items-center gap-1.5">
          <Label for="disabled-items-select">Select with Disabled Items</Label>
          <Select>
            <SelectTrigger id="disabled-items-select" class="w-[180px]">
              <SelectValue placeholder="Some items disabled" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="apple">Apple</SelectItem>
              <SelectItem value="banana" disabled>Banana (Out of stock)</SelectItem>
              <SelectItem value="cherry">Cherry</SelectItem>
              <SelectItem value="date" disabled>Date (Coming soon)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    `,
  }),
}

export const GroupedOptions: Story = {
  render: () => ({
    components: {
      Select,
      SelectContent,
      SelectGroup,
      SelectItem,
      SelectLabel,
      SelectSeparator,
      SelectTrigger,
      SelectValue,
      Label,
      Code,
      Settings,
      Gamepad,
      Building,
      Palette,
      Camera,
      Music,
    },
    setup() {
      const categories = mockSelectData.categories
      return { categories }
    },
    template: `
      <div class="grid w-full max-w-sm items-center gap-1.5">
        <Label for="category-select">Category</Label>
        <Select>
          <SelectTrigger id="category-select" class="w-[240px]">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Technology</SelectLabel>
              <SelectItem v-for="item in categories.technology" :key="item.value" :value="item.value">
                <div class="flex items-center gap-2">
                  <component :is="item.icon" class="h-4 w-4 text-muted-foreground" />
                  <span>{{ item.label }}</span>
                </div>
              </SelectItem>
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>Creative</SelectLabel>
              <SelectItem v-for="item in categories.creative" :key="item.value" :value="item.value">
                <div class="flex items-center gap-2">
                  <component :is="item.icon" class="h-4 w-4 text-muted-foreground" />
                  <span>{{ item.label }}</span>
                </div>
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    `,
  }),
}

export const FormIntegration: Story = {
  render: () => ({
    components: {
      Select,
      SelectContent,
      SelectItem,
      SelectTrigger,
      SelectValue,
      Label,
      Button,
    },
    setup() {
      const countries = mockSelectData.countries.slice(0, 5)
      const roles = mockSelectData.userRoles.slice(0, 4)
      const priorities = mockSelectData.priorities.slice(0, 4)

      const formData = ref({
        country: '',
        role: 'editor',
        priority: 'medium',
      })

      const handleSubmit = () => {
        alert(`Form submitted with data: ${JSON.stringify(formData.value, null, 2)}`)
      }

      return { countries, roles, priorities, formData, handleSubmit }
    },
    template: `
      <form @submit.prevent="handleSubmit" class="space-y-4 max-w-md">
        <div class="grid w-full items-center gap-1.5">
          <Label for="form-country">Country *</Label>
          <Select v-model="formData.country" required name="country">
            <SelectTrigger id="form-country">
              <SelectValue placeholder="Select your country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="country in countries" :key="country.value" :value="country.value">
                <span class="flex items-center gap-2">
                  {{ country.flag }} {{ country.label }}
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="grid w-full items-center gap-1.5">
          <Label for="form-role">Role</Label>
          <Select v-model="formData.role" name="role">
            <SelectTrigger id="form-role">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="role in roles" :key="role.value" :value="role.value">
                {{ role.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="grid w-full items-center gap-1.5">
          <Label for="form-priority">Priority</Label>
          <Select v-model="formData.priority" name="priority">
            <SelectTrigger id="form-priority">
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="priority in priorities" :key="priority.value" :value="priority.value">
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 rounded-full" :class="priority.bgColor"></div>
                  {{ priority.label }}
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button type="submit" class="w-full">Submit Form</Button>

        <div class="text-sm text-muted-foreground">
          <strong>Current values:</strong>
          <pre class="mt-2 p-2 bg-muted rounded text-xs">{{ JSON.stringify(formData, null, 2) }}</pre>
        </div>
      </form>
    `,
  }),
}
