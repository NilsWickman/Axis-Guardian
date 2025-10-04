import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardHeader, CardContent } from '@/components/ui/card'

const meta = {
  title: 'UI Components/Skeleton',
  component: Skeleton,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A skeleton component that provides loading placeholders with a pulsing animation effect for better user experience during data fetching.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    class: {
      control: { type: 'text' },
      description: 'Additional CSS classes to customize the skeleton appearance',
    },
  },
} satisfies Meta<typeof Skeleton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => ({
    components: { Skeleton },
    setup() {
      return { args }
    },
    template: `
      <Skeleton v-bind="args" class="w-full h-4" />
    `,
  }),
}

export const TextLines: Story = {
  render: () => ({
    components: { Skeleton },
    template: `
      <div class="space-y-3 w-full max-w-md">
        <Skeleton class="h-6 w-3/4" />
        <Skeleton class="h-4 w-full" />
        <Skeleton class="h-4 w-1/2" />
        <Skeleton class="h-4 w-5/6" />
        <Skeleton class="h-4 w-2/3" />
      </div>
    `,
  }),
}

export const DifferentShapes: Story = {
  render: () => ({
    components: { Skeleton },
    template: `
      <div class="flex items-center gap-6">
        <div class="text-center space-y-2">
          <Skeleton class="w-12 h-12 rounded-full" />
          <p class="text-xs text-muted-foreground">Circle</p>
        </div>
        
        <div class="text-center space-y-2">
          <Skeleton class="w-16 h-16 rounded-md" />
          <p class="text-xs text-muted-foreground">Square</p>
        </div>
        
        <div class="text-center space-y-2">
          <Skeleton class="h-9 w-20 rounded-md" />
          <p class="text-xs text-muted-foreground">Button</p>
        </div>
        
        <div class="text-center space-y-2">
          <Skeleton class="w-24 h-6 rounded-full" />
          <p class="text-xs text-muted-foreground">Badge</p>
        </div>
      </div>
    `,
  }),
}

export const LoadingCard: Story = {
  render: () => ({
    components: { Skeleton, Card, CardHeader, CardContent },
    template: `
      <Card class="w-[350px]">
        <CardHeader>
          <Skeleton class="h-6 w-1/2" />
          <Skeleton class="h-4 w-3/4" />
        </CardHeader>
        <CardContent class="space-y-3">
          <Skeleton class="h-4 w-full" />
          <Skeleton class="h-4 w-5/6" />
          <Skeleton class="h-4 w-2/3" />
          <div class="flex gap-2 pt-2">
            <Skeleton class="h-9 w-20" />
            <Skeleton class="h-9 w-16" />
          </div>
        </CardContent>
      </Card>
    `,
  }),
}

export const LoadingList: Story = {
  render: () => ({
    components: { Skeleton },
    template: `
      <div class="space-y-4 w-full max-w-md">
        <div v-for="i in 4" :key="i" class="flex items-center gap-4">
          <Skeleton class="w-12 h-12 rounded-full" />
          <div class="flex-1 space-y-2">
            <Skeleton class="h-4 w-3/4" />
            <Skeleton class="h-3 w-1/2" />
          </div>
          <Skeleton class="h-8 w-16" />
        </div>
      </div>
    `,
  }),
}

export const LoadingTable: Story = {
  render: () => ({
    components: { Skeleton },
    template: `
      <div class="w-full">
        <!-- Table Header -->
        <div class="grid grid-cols-4 gap-4 p-4 border-b">
          <Skeleton class="h-4 w-16" />
          <Skeleton class="h-4 w-20" />
          <Skeleton class="h-4 w-12" />
          <Skeleton class="h-4 w-14" />
        </div>
        
        <!-- Table Rows -->
        <div v-for="i in 5" :key="i" class="grid grid-cols-4 gap-4 p-4 border-b">
          <Skeleton class="h-4 w-24" />
          <Skeleton class="h-4 w-32" />
          <Skeleton class="h-4 w-16" />
          <Skeleton class="h-4 w-8" />
        </div>
      </div>
    `,
  }),
}
