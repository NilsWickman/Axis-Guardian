import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { reactive } from 'vue'
import { Button } from '@/components/ui/button'
import {
  ChevronRight,
  Mail,
  Loader2,
  Download,
  Heart,
  Plus,
  Settings,
  Trash2,
  Edit,
} from 'lucide-vue-next'

// Mock data for different button scenarios
const mockButtons = {
  primary: {
    variant: 'default' as const,
    text: 'Get Started',
    size: 'default' as const,
  },
  secondary: {
    variant: 'secondary' as const,
    text: 'Learn More',
    size: 'default' as const,
  },
  outline: {
    variant: 'outline' as const,
    text: 'Learn More',
    size: 'default' as const,
  },
  ghost: {
    variant: 'ghost' as const,
    text: 'Ghost Button',
    size: 'default' as const,
  },
  link: {
    variant: 'link' as const,
    text: 'Link Button',
    size: 'default' as const,
  },
  destructive: {
    variant: 'destructive' as const,
    text: 'Delete',
    size: 'default' as const,
  },
  small: {
    variant: 'default' as const,
    text: 'Small Button',
    size: 'sm' as const,
  },
  large: {
    variant: 'default' as const,
    text: 'Large Button',
    size: 'lg' as const,
  },
}

const meta = {
  title: 'UI Components/Button',
  component: Button,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Displays a button or a component that looks like a button with various styles and states.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
      description: 'The visual style variant of the button',
    },
    size: {
      control: { type: 'select' },
      options: ['default', 'sm', 'lg', 'icon'],
      description: 'The size of the button',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Whether the button is disabled',
    },
    asChild: {
      control: { type: 'boolean' },
      description:
        'Change the default rendered element for the one passed as a child, merging their props and behavior',
    },
  },
  args: {
    variant: 'default',
    size: 'default',
    disabled: false,
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => ({
    components: { Button },
    setup() {
      return { args }
    },
    template: '<Button v-bind="args">Button</Button>',
  }),
}

export const Primary: Story = {
  render: () => ({
    components: { Button },
    setup() {
      return { mockButtons: reactive(mockButtons) }
    },
    template:
      '<Button :variant="mockButtons.primary.variant" :size="mockButtons.primary.size">{{ mockButtons.primary.text }}</Button>',
  }),
}

export const Secondary: Story = {
  render: () => ({
    components: { Button },
    setup() {
      return { mockButtons: reactive(mockButtons) }
    },
    template:
      '<Button :variant="mockButtons.secondary.variant" :size="mockButtons.secondary.size">{{ mockButtons.secondary.text }}</Button>',
  }),
}

export const AllSizes: Story = {
  render: () => ({
    components: { Button },
    setup() {
      return { mockButtons: reactive(mockButtons) }
    },
    template: `
      <div class="flex items-center gap-4">
        <Button :variant="mockButtons.small.variant" :size="mockButtons.small.size">{{ mockButtons.small.text }}</Button>
        <Button :variant="mockButtons.primary.variant" :size="mockButtons.primary.size">{{ mockButtons.primary.text }}</Button>
        <Button :variant="mockButtons.large.variant" :size="mockButtons.large.size">{{ mockButtons.large.text }}</Button>
      </div>
    `,
  }),
}

export const AllVariants: Story = {
  render: () => ({
    components: { Button },
    setup() {
      return { mockButtons: reactive(mockButtons) }
    },
    template: `
      <div class="flex flex-wrap items-center gap-4">
        <Button :variant="mockButtons.primary.variant" :size="mockButtons.primary.size">{{ mockButtons.primary.text }}</Button>
        <Button :variant="mockButtons.secondary.variant" :size="mockButtons.secondary.size">{{ mockButtons.secondary.text }}</Button>
        <Button :variant="mockButtons.outline.variant" :size="mockButtons.outline.size">{{ mockButtons.outline.text }}</Button>
        <Button :variant="mockButtons.ghost.variant" :size="mockButtons.ghost.size">{{ mockButtons.ghost.text }}</Button>
        <Button :variant="mockButtons.link.variant" :size="mockButtons.link.size">{{ mockButtons.link.text }}</Button>
        <Button :variant="mockButtons.destructive.variant" :size="mockButtons.destructive.size">{{ mockButtons.destructive.text }}</Button>
      </div>
    `,
  }),
}

export const WithIcons: Story = {
  render: () => ({
    components: { Button, Mail, Download, Heart, Plus, Settings, Trash2, Edit, ChevronRight },
    template: `
      <div class="flex flex-wrap items-center gap-4">
        <Button>
          <Mail class="mr-2 h-4 w-4" />
          Email
        </Button>
        <Button variant="outline">
          <Download class="mr-2 h-4 w-4" />
          Download
        </Button>
        <Button variant="secondary">
          <Heart class="mr-2 h-4 w-4" />
          Like
        </Button>
        <Button variant="ghost">
          <Plus class="mr-2 h-4 w-4" />
          Add Item
        </Button>
        <Button variant="destructive">
          <Trash2 class="mr-2 h-4 w-4" />
          Delete
        </Button>
      </div>
    `,
  }),
}

export const IconOnly: Story = {
  render: () => ({
    components: { Button, Settings, Edit, Trash2, Plus, Heart },
    template: `
      <div class="flex items-center gap-4">
        <Button variant="outline" size="icon">
          <Settings class="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon">
          <Edit class="h-4 w-4" />
        </Button>
        <Button variant="destructive" size="icon">
          <Trash2 class="h-4 w-4" />
        </Button>
        <Button size="icon">
          <Plus class="h-4 w-4" />
        </Button>
        <Button variant="secondary" size="icon">
          <Heart class="h-4 w-4" />
        </Button>
      </div>
    `,
  }),
}

export const Loading: Story = {
  render: () => ({
    components: { Button, Loader2 },
    template: `
      <div class="flex items-center gap-4">
        <Button disabled>
          <Loader2 class="mr-2 h-4 w-4 animate-spin" />
          Please wait
        </Button>
        <Button variant="outline" disabled>
          <Loader2 class="mr-2 h-4 w-4 animate-spin" />
          Loading...
        </Button>
      </div>
    `,
  }),
}

export const AsChild: Story = {
  render: () => ({
    components: { Button, ChevronRight },
    template: `
      <div class="flex items-center gap-4">
        <Button as-child>
          <a href="#" class="no-underline">
            Link Button
            <ChevronRight class="ml-2 h-4 w-4" />
          </a>
        </Button>
        <Button variant="outline" as-child>
          <a href="#" class="no-underline">
            Outline Link
          </a>
        </Button>
      </div>
    `,
  }),
}
