import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { User } from 'lucide-vue-next'

// Mock data for different avatar scenarios
const mockAvatars = {
  users: [
    {
      name: 'Sarah Johnson',
      initials: 'SJ',
      image:
        'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      status: 'online',
    },
    {
      name: 'Alex Chen',
      initials: 'AC',
      image:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      status: 'away',
    },
    {
      name: 'Maria Rodriguez',
      initials: 'MR',
      image:
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      status: 'offline',
    },
    {
      name: 'David Kim',
      initials: 'DK',
      image: '', // Broken image to test fallback
      status: 'online',
    },
    {
      name: 'Emma Thompson',
      initials: 'ET',
      image:
        'https://images.unsplash.com/photo-1554151228-14d9def656e4?w=150&h=150&fit=crop&crop=face',
      status: 'busy',
    },
  ],
  sizes: {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-16 h-16',
    xlarge: 'w-24 h-24',
  },
  statusColors: {
    online: 'bg-green-500',
    away: 'bg-yellow-500',
    busy: 'bg-red-500',
    offline: 'bg-gray-400',
  },
}

const meta = {
  title: 'UI Components/Avatar',
  component: Avatar,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'An avatar component that displays a user profile image with a fallback to initials or icon.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    class: {
      control: { type: 'text' },
      description: 'Additional CSS classes',
    },
  },
} satisfies Meta<typeof Avatar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => ({
    components: { Avatar, AvatarImage, AvatarFallback },
    setup() {
      const user = mockAvatars.users[0]
      return { args, user }
    },
    template: `
      <Avatar v-bind="args">
        <AvatarImage :src="user.image" :alt="user.name" />
        <AvatarFallback>{{ user.initials }}</AvatarFallback>
      </Avatar>
    `,
  }),
}

export const WithImage: Story = {
  render: () => ({
    components: { Avatar, AvatarImage, AvatarFallback },
    setup() {
      const user = mockAvatars.users[0]
      return { user }
    },
    template: `
      <Avatar>
        <AvatarImage :src="user.image" :alt="user.name" />
        <AvatarFallback>{{ user.initials }}</AvatarFallback>
      </Avatar>
    `,
  }),
}

export const WithFallback: Story = {
  render: () => ({
    components: { Avatar, AvatarImage, AvatarFallback },
    setup() {
      const user = mockAvatars.users[3] // User with broken image
      return { user }
    },
    template: `
      <Avatar>
        <AvatarImage :src="user.image" :alt="user.name" />
        <AvatarFallback>{{ user.initials }}</AvatarFallback>
      </Avatar>
    `,
  }),
}

export const WithIcon: Story = {
  render: () => ({
    components: { Avatar, AvatarFallback, User },
    template: `
      <Avatar>
        <AvatarFallback>
          <User class="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
    `,
  }),
}

export const DifferentSizes: Story = {
  render: () => ({
    components: { Avatar, AvatarImage, AvatarFallback },
    setup() {
      const user = mockAvatars.users[0]
      const { sizes } = mockAvatars
      return { user, sizes }
    },
    template: `
      <div class="flex items-center gap-4">
        <div class="text-center space-y-2">
          <Avatar :class="sizes.small">
            <AvatarImage :src="user.image" :alt="user.name" />
            <AvatarFallback class="text-xs">{{ user.initials }}</AvatarFallback>
          </Avatar>
          <p class="text-xs text-muted-foreground">Small</p>
        </div>
        
        <div class="text-center space-y-2">
          <Avatar :class="sizes.medium">
            <AvatarImage :src="user.image" :alt="user.name" />
            <AvatarFallback class="text-sm">{{ user.initials }}</AvatarFallback>
          </Avatar>
          <p class="text-xs text-muted-foreground">Medium</p>
        </div>
        
        <div class="text-center space-y-2">
          <Avatar :class="sizes.large">
            <AvatarImage :src="user.image" :alt="user.name" />
            <AvatarFallback class="text-lg">{{ user.initials }}</AvatarFallback>
          </Avatar>
          <p class="text-xs text-muted-foreground">Large</p>
        </div>
        
        <div class="text-center space-y-2">
          <Avatar :class="sizes.xlarge">
            <AvatarImage :src="user.image" :alt="user.name" />
            <AvatarFallback class="text-xl">{{ user.initials }}</AvatarFallback>
          </Avatar>
          <p class="text-xs text-muted-foreground">Extra Large</p>
        </div>
      </div>
    `,
  }),
}

export const WithStatus: Story = {
  render: () => ({
    components: { Avatar, AvatarImage, AvatarFallback },
    setup() {
      const user = mockAvatars.users[0]
      const { statusColors } = mockAvatars
      return { user, statusColors }
    },
    template: `
      <div class="flex gap-4">
        <div class="relative">
          <Avatar>
            <AvatarImage :src="user.image" :alt="user.name" />
            <AvatarFallback>{{ user.initials }}</AvatarFallback>
          </Avatar>
          <div class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white bg-green-500"></div>
        </div>
        
        <div class="relative">
          <Avatar>
            <AvatarImage :src="user.image" :alt="user.name" />
            <AvatarFallback>{{ user.initials }}</AvatarFallback>
          </Avatar>
          <div class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white bg-yellow-500"></div>
        </div>
        
        <div class="relative">
          <Avatar>
            <AvatarImage :src="user.image" :alt="user.name" />
            <AvatarFallback>{{ user.initials }}</AvatarFallback>
          </Avatar>
          <div class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white bg-red-500"></div>
        </div>
        
        <div class="relative">
          <Avatar>
            <AvatarImage :src="user.image" :alt="user.name" />
            <AvatarFallback>{{ user.initials }}</AvatarFallback>
          </Avatar>
          <div class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white bg-gray-400"></div>
        </div>
      </div>
    `,
  }),
}

export const UserList: Story = {
  render: () => ({
    components: { Avatar, AvatarImage, AvatarFallback, Badge },
    setup() {
      const { users, statusColors } = mockAvatars
      return { users, statusColors }
    },
    template: `
      <div class="space-y-4">
        <div 
          v-for="user in users" 
          :key="user.name"
          class="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
        >
          <div class="relative">
            <Avatar>
              <AvatarImage :src="user.image" :alt="user.name" />
              <AvatarFallback>{{ user.initials }}</AvatarFallback>
            </Avatar>
            <div 
              :class="[\`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white\`, statusColors[user.status]]"
            ></div>
          </div>
          
          <div class="flex-1">
            <p class="font-medium">{{ user.name }}</p>
            <div class="flex items-center gap-2">
              <Badge 
                :variant="user.status === 'online' ? 'default' : user.status === 'offline' ? 'secondary' : 'outline'"
                class="text-xs"
              >
                {{ user.status }}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    `,
  }),
}

export const AvatarGroup: Story = {
  render: () => ({
    components: { Avatar, AvatarImage, AvatarFallback },
    setup() {
      const users = mockAvatars.users.slice(0, 4)
      return { users }
    },
    template: `
      <div class="flex -space-x-2">
        <Avatar 
          v-for="(user, index) in users" 
          :key="user.name"
          class="border-2 border-background hover:z-10 transition-transform hover:scale-110"
          :style="{ zIndex: users.length - index }"
        >
          <AvatarImage :src="user.image" :alt="user.name" />
          <AvatarFallback>{{ user.initials }}</AvatarFallback>
        </Avatar>
        <Avatar class="border-2 border-background">
          <AvatarFallback class="bg-muted">+3</AvatarFallback>
        </Avatar>
      </div>
    `,
  }),
}
