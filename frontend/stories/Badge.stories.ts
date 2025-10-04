import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { Badge } from '@/components/ui/badge'
import { Check, X, Star, Shield, Zap } from 'lucide-vue-next'

// Mock data for different badge scenarios
const mockBadges = {
  status: {
    active: { variant: 'default' as const, text: 'Active', icon: Check },
    inactive: { variant: 'secondary' as const, text: 'Inactive', icon: null },
    error: { variant: 'destructive' as const, text: 'Error', icon: X },
    pending: { variant: 'outline' as const, text: 'Pending', icon: null },
  },
  categories: {
    premium: { variant: 'default' as const, text: 'Premium', icon: Star },
    verified: { variant: 'secondary' as const, text: 'Verified', icon: Shield },
    new: { variant: 'destructive' as const, text: 'New', icon: Zap },
    sale: { variant: 'outline' as const, text: 'On Sale', icon: null },
  },
  counts: {
    notifications: { variant: 'destructive' as const, text: '3', icon: null },
    messages: { variant: 'default' as const, text: '12', icon: null },
    updates: { variant: 'secondary' as const, text: '2', icon: null },
  },
}

const meta = {
  title: 'UI Components/Badge',
  component: Badge,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Displays a badge or a component that looks like a badge with customizable variants.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'secondary', 'destructive', 'outline'],
      description: 'The visual style variant of the badge',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'default' },
      },
    },
    class: {
      control: { type: 'text' },
      description: 'Additional CSS classes',
    },
  },
  args: {
    variant: 'default',
  },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => ({
    components: { Badge },
    setup() {
      return { args }
    },
    template: '<Badge v-bind="args">Default Badge</Badge>',
  }),
}

export const StatusBadges: Story = {
  render: () => ({
    components: { Badge, Check, X },
    setup() {
      const { status } = mockBadges
      return { status }
    },
    template: `
      <div class="flex gap-2 flex-wrap">
        <Badge :variant="status.active.variant">
          <Check class="w-3 h-3 mr-1" />
          {{ status.active.text }}
        </Badge>
        <Badge :variant="status.inactive.variant">{{ status.inactive.text }}</Badge>
        <Badge :variant="status.error.variant">
          <X class="w-3 h-3 mr-1" />
          {{ status.error.text }}
        </Badge>
        <Badge :variant="status.pending.variant">{{ status.pending.text }}</Badge>
      </div>
    `,
  }),
}

export const CategoryBadges: Story = {
  render: () => ({
    components: { Badge, Star, Shield, Zap },
    setup() {
      const { categories } = mockBadges
      return { categories }
    },
    template: `
      <div class="flex gap-2 flex-wrap">
        <Badge :variant="categories.premium.variant">
          <Star class="w-3 h-3 mr-1" />
          {{ categories.premium.text }}
        </Badge>
        <Badge :variant="categories.verified.variant">
          <Shield class="w-3 h-3 mr-1" />
          {{ categories.verified.text }}
        </Badge>
        <Badge :variant="categories.new.variant">
          <Zap class="w-3 h-3 mr-1" />
          {{ categories.new.text }}
        </Badge>
        <Badge :variant="categories.sale.variant">{{ categories.sale.text }}</Badge>
      </div>
    `,
  }),
}

export const CountBadges: Story = {
  render: () => ({
    components: { Badge },
    setup() {
      const { counts } = mockBadges
      return { counts }
    },
    template: `
      <div class="flex gap-4 items-center">
        <div class="relative">
          <span class="text-sm">Notifications</span>
          <Badge :variant="counts.notifications.variant" class="ml-2">
            {{ counts.notifications.text }}
          </Badge>
        </div>
        <div class="relative">
          <span class="text-sm">Messages</span>
          <Badge :variant="counts.messages.variant" class="ml-2">
            {{ counts.messages.text }}
          </Badge>
        </div>
        <div class="relative">
          <span class="text-sm">Updates</span>
          <Badge :variant="counts.updates.variant" class="ml-2">
            {{ counts.updates.text }}
          </Badge>
        </div>
      </div>
    `,
  }),
}

export const AllVariants: Story = {
  render: () => ({
    components: { Badge },
    template: `
      <div class="flex gap-2 flex-wrap">
        <Badge variant="default">Default</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="destructive">Destructive</Badge>
        <Badge variant="outline">Outline</Badge>
      </div>
    `,
  }),
}

export const WithIcons: Story = {
  render: () => ({
    components: { Badge, Check, X, Star },
    template: `
      <div class="flex gap-2 flex-wrap">
        <Badge variant="default">
          <Check class="w-3 h-3 mr-1" />
          Verified
        </Badge>
        <Badge variant="destructive">
          <X class="w-3 h-3 mr-1" />
          Failed
        </Badge>
        <Badge variant="secondary">
          <Star class="w-3 h-3 mr-1" />
          Featured
        </Badge>
      </div>
    `,
  }),
}

export const AsLink: Story = {
  render: () => ({
    components: { Badge },
    template: `
      <div class="flex gap-2">
        <Badge variant="outline" class="cursor-pointer hover:bg-accent">
          Clickable Badge
        </Badge>
        <a href="#" class="no-underline">
          <Badge variant="default">Link Badge</Badge>
        </a>
      </div>
    `,
  }),
}
