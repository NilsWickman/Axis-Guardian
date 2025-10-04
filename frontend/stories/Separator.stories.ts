import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { Separator } from '@/components/ui/separator'
import { FileText, Calendar, Mail, Settings, Bell, User, MapPin, Clock, Tag } from 'lucide-vue-next'

const meta = {
  title: 'UI Components/Separator',
  component: Separator,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Visually or semantically separates content. A separator can be used to create visual divisions between sections, menu items, or content blocks. It supports both horizontal and vertical orientations.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    orientation: {
      control: { type: 'select' },
      options: ['horizontal', 'vertical'],
      description: 'The orientation of the separator',
    },
    decorative: {
      control: { type: 'boolean' },
      description: 'Whether the separator is purely decorative (removes from accessibility tree)',
    },
    class: {
      control: { type: 'text' },
      description: 'Additional CSS classes to apply to the separator',
    },
  },
  args: {
    orientation: 'horizontal',
    decorative: true,
  },
} satisfies Meta<typeof Separator>

export default meta
type Story = StoryObj<typeof meta>

export const Horizontal: Story = {
  render: () => ({
    components: { Separator },
    template: `
      <div class="w-full max-w-md space-y-4">
        <h3 class="text-lg font-semibold">Horizontal Separator</h3>
        <p class="text-sm text-muted-foreground">This content is above the separator.</p>
        <Separator orientation="horizontal" />
        <p class="text-sm text-muted-foreground">This content is below the separator.</p>
      </div>
    `,
  }),
}

export const Vertical: Story = {
  render: () => ({
    components: { Separator },
    template: `
      <div class="flex items-center space-x-4 h-8">
        <span class="text-sm">Left content</span>
        <Separator orientation="vertical" />
        <span class="text-sm">Right content</span>
        <Separator orientation="vertical" />
        <span class="text-sm">More content</span>
      </div>
    `,
  }),
}

export const DropdownMenuSections: Story = {
  render: () => ({
    components: {
      Separator,
      FileText,
      Calendar,
      Mail,
      Settings,
      Bell,
      User,
    },
    setup() {
      const menuSections = {
        primary: [
          { icon: FileText, label: 'Documents' },
          { icon: Calendar, label: 'Calendar' },
          { icon: Mail, label: 'Messages' },
        ],
        secondary: [
          { icon: Settings, label: 'Preferences' },
          { icon: Bell, label: 'Notifications' },
          { icon: User, label: 'Profile' },
        ],
      }
      return { menuSections }
    },
    template: `
      <div class="w-56 bg-background border rounded-md shadow-md p-1">
        <div class="space-y-1">
          <template v-for="item in menuSections.primary" :key="item.label">
            <div class="flex items-center space-x-2 px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground rounded-sm cursor-pointer">
              <component :is="item.icon" class="h-4 w-4" />
              <span>{{ item.label }}</span>
            </div>
          </template>
        </div>
        
        <Separator class="my-1" />
        
        <div class="space-y-1">
          <template v-for="item in menuSections.secondary" :key="item.label">
            <div class="flex items-center space-x-2 px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground rounded-sm cursor-pointer">
              <component :is="item.icon" class="h-4 w-4" />
              <span>{{ item.label }}</span>
            </div>
          </template>
        </div>
      </div>
    `,
  }),
}

export const CardFooter: Story = {
  render: () => ({
    components: {
      Separator,
      MapPin,
      Clock,
      Tag,
      User,
    },
    setup() {
      const metadata = [
        { icon: MapPin, label: 'Location', value: 'San Francisco, CA' },
        { icon: Clock, label: 'Created', value: '2 hours ago' },
        { icon: Tag, label: 'Tags', value: 'design, ui, components' },
        { icon: User, label: 'Author', value: 'John Doe' },
      ]
      return { metadata }
    },
    template: `
      <div class="max-w-md bg-background border rounded-lg overflow-hidden">
        <div class="p-4">
          <h3 class="text-lg font-semibold mb-2">Project Overview</h3>
          <p class="text-sm text-muted-foreground">
            This is a sample project card showing how separators can be used to organize metadata and information in a clean, structured way.
          </p>
        </div>
        
        <Separator />
        
        <div class="p-4 space-y-3">
          <template v-for="(item, index) in metadata" :key="item.label">
            <div class="flex items-center space-x-3">
              <component :is="item.icon" class="h-4 w-4 text-muted-foreground" />
              <span class="text-sm font-medium">{{ item.label }}:</span>
              <span class="text-sm text-muted-foreground">{{ item.value }}</span>
            </div>
            <Separator v-if="index < metadata.length - 1" class="ml-7" />
          </template>
        </div>
      </div>
    `,
  }),
}
