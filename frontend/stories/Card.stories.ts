import type { Meta, StoryObj } from '@storybook/vue3-vite'
import {
  Card,
  CardHeader,
  CardContent,
  CardDescription,
  CardTitle,
  CardFooter,
  CardAction,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  BellRing,
  Heart,
  MessageCircle,
  Share,
  Check,
  Star,
  ShoppingCart,
  User,
  Calendar,
  MapPin,
} from 'lucide-vue-next'

// Mock data for different card scenarios
const mockCards = {
  project: {
    title: 'Create project',
    description: 'Deploy your new project in one-click.',
    content: 'Get started by creating a new project or importing an existing one.',
    actions: [
      { variant: 'outline' as const, text: 'Cancel' },
      { variant: 'default' as const, text: 'Deploy' },
    ],
  },
  blogPost: {
    title: 'Understanding Vue 3 Composition API',
    description: 'Published on March 15, 2024 by Jane Doe',
    content:
      'The Composition API is a new way to organize and reuse logic in Vue 3 components. It provides a more flexible and powerful approach compared to the Options API.',
    stats: { likes: 24, comments: 8 },
  },
  product: {
    title: 'Wireless Headphones',
    description: 'Premium noise-cancelling headphones',
    price: '$299.99',
    content: 'High-quality audio with 30-hour battery life and active noise cancellation.',
    rating: 4.5,
    reviews: 128,
  },
  profile: {
    name: 'Sarah Johnson',
    role: 'Senior Frontend Developer',
    location: 'San Francisco, CA',
    joined: 'Joined March 2023',
    stats: {
      followers: '2.4K',
      following: '180',
      posts: '42',
    },
  },
  event: {
    title: 'Vue.js Conference 2024',
    date: 'June 15-16, 2024',
    location: 'San Francisco, CA',
    description: 'Join us for two days of Vue.js talks, workshops, and networking.',
    price: '$299',
    spots: 45,
  },
}

const meta = {
  title: 'UI Components/Card',
  component: Card,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Displays a card with header, content and footer for organizing related information.',
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
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => ({
    components: { Card, CardHeader, CardTitle, CardDescription, CardContent },
    setup() {
      const cardData = mockCards.project
      return { args, cardData }
    },
    template: `
      <Card v-bind="args" class="w-[350px]">
        <CardHeader>
          <CardTitle>{{ cardData.title }}</CardTitle>
          <CardDescription>{{ cardData.description }}</CardDescription>
        </CardHeader>
        <CardContent>
          <p>{{ cardData.content }}</p>
        </CardContent>
      </Card>
    `,
  }),
}

export const WithFooter: Story = {
  render: (args) => ({
    components: { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Button },
    setup() {
      const cardData = mockCards.project
      return { args, cardData }
    },
    template: `
      <Card v-bind="args" class="w-[350px]">
        <CardHeader>
          <CardTitle>{{ cardData.title }}</CardTitle>
          <CardDescription>{{ cardData.description }}</CardDescription>
        </CardHeader>
        <CardContent>
          <p>{{ cardData.content }}</p>
        </CardContent>
        <CardFooter class="flex justify-between">
          <Button 
            v-for="action in cardData.actions" 
            :key="action.text"
            :variant="action.variant"
          >
            {{ action.text }}
          </Button>
        </CardFooter>
      </Card>
    `,
  }),
}

export const BlogPost: Story = {
  render: (args) => ({
    components: {
      Card,
      CardHeader,
      CardTitle,
      CardDescription,
      CardContent,
      CardFooter,
      Button,
      Heart,
      MessageCircle,
      Share,
    },
    setup() {
      const cardData = mockCards.blogPost
      return { args, cardData }
    },
    template: `
      <Card v-bind="args" class="w-[400px]">
        <CardHeader>
          <CardTitle>{{ cardData.title }}</CardTitle>
          <CardDescription>{{ cardData.description }}</CardDescription>
        </CardHeader>
        <CardContent>
          <p class="text-sm text-muted-foreground">{{ cardData.content }}</p>
        </CardContent>
        <CardFooter class="flex justify-between items-center pt-6 border-t">
          <div class="flex space-x-4">
            <Button variant="ghost" size="sm">
              <Heart class="mr-2 h-4 w-4" />
              {{ cardData.stats.likes }}
            </Button>
            <Button variant="ghost" size="sm">
              <MessageCircle class="mr-2 h-4 w-4" />
              {{ cardData.stats.comments }}
            </Button>
            <Button variant="ghost" size="sm">
              <Share class="mr-2 h-4 w-4" />
              Share
            </Button>
          </div>
          <Button variant="outline" size="sm">Read More</Button>
        </CardFooter>
      </Card>
    `,
  }),
}

export const ProductCard: Story = {
  render: (args) => ({
    components: {
      Card,
      CardHeader,
      CardTitle,
      CardDescription,
      CardContent,
      CardFooter,
      Button,
      Star,
      ShoppingCart,
    },
    setup() {
      const cardData = mockCards.product
      return { args, cardData }
    },
    template: `
      <Card v-bind="args" class="w-[300px] py-0">
        <div class="aspect-square bg-gradient-to-br from-blue-100 to-blue-200 rounded-t-xl flex items-center justify-center">
          <div class="w-24 h-24 bg-white rounded-full shadow-lg"></div>
        </div>
        <CardHeader class="px-6 pt-6">
          <div class="flex items-center justify-between">
            <CardTitle class="text-lg">{{ cardData.title }}</CardTitle>
            <div class="flex items-center">
              <Star class="h-4 w-4 fill-current text-yellow-400" />
              <span class="text-sm ml-1">{{ cardData.rating }}</span>
            </div>
          </div>
          <CardDescription>{{ cardData.description }}</CardDescription>
        </CardHeader>
        <CardContent class="px-6">
          <div class="text-2xl font-bold mb-2">{{ cardData.price }}</div>
          <p class="text-sm text-muted-foreground">{{ cardData.content }}</p>
          <p class="text-xs text-muted-foreground mt-2">{{ cardData.reviews }} reviews</p>
        </CardContent>
        <CardFooter class="px-6 pb-6">
          <Button class="w-full">
            <ShoppingCart class="mr-2 h-4 w-4" />
            Add to Cart
          </Button>
        </CardFooter>
      </Card>
    `,
  }),
}

export const ProfileCard: Story = {
  render: (args) => ({
    components: {
      Card,
      CardHeader,
      CardTitle,
      CardDescription,
      CardContent,
      CardFooter,
      Button,
      User,
      MapPin,
      Calendar,
    },
    setup() {
      const cardData = mockCards.profile
      return { args, cardData }
    },
    template: `
      <Card v-bind="args" class="w-[320px]">
        <CardHeader class="text-center">
          <div class="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
            <User class="h-10 w-10 text-white" />
          </div>
          <CardTitle>{{ cardData.name }}</CardTitle>
          <CardDescription>{{ cardData.role }}</CardDescription>
        </CardHeader>
        <CardContent class="space-y-2">
          <div class="flex items-center justify-center text-sm text-muted-foreground">
            <MapPin class="mr-2 h-4 w-4" />
            {{ cardData.location }}
          </div>
          <div class="flex items-center justify-center text-sm text-muted-foreground">
            <Calendar class="mr-2 h-4 w-4" />
            {{ cardData.joined }}
          </div>
          <div class="grid grid-cols-3 gap-4 pt-4 border-t">
            <div class="text-center">
              <div class="text-xl font-bold">{{ cardData.stats.followers }}</div>
              <div class="text-sm text-muted-foreground">Followers</div>
            </div>
            <div class="text-center">
              <div class="text-xl font-bold">{{ cardData.stats.following }}</div>
              <div class="text-sm text-muted-foreground">Following</div>
            </div>
            <div class="text-center">
              <div class="text-xl font-bold">{{ cardData.stats.posts }}</div>
              <div class="text-sm text-muted-foreground">Posts</div>
            </div>
          </div>
        </CardContent>
        <CardFooter class="flex gap-2">
          <Button variant="outline" class="flex-1">Message</Button>
          <Button class="flex-1">Follow</Button>
        </CardFooter>
      </Card>
    `,
  }),
}

export const EventCard: Story = {
  render: (args) => ({
    components: {
      Card,
      CardHeader,
      CardTitle,
      CardDescription,
      CardContent,
      CardFooter,
      Button,
      Calendar,
      MapPin,
    },
    setup() {
      const cardData = mockCards.event
      return { args, cardData }
    },
    template: `
      <Card v-bind="args" class="w-[350px] py-0">
        <div class="h-32 bg-gradient-to-r from-green-400 to-blue-500 rounded-t-xl"></div>
        <CardHeader class="px-6 pt-6">
          <CardTitle>{{ cardData.title }}</CardTitle>
          <CardDescription class="flex items-center gap-4">
            <span class="flex items-center">
              <Calendar class="mr-1 h-4 w-4" />
              {{ cardData.date }}
            </span>
            <span class="flex items-center">
              <MapPin class="mr-1 h-4 w-4" />
              {{ cardData.location }}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent class="px-6">
          <p class="text-sm text-muted-foreground mb-4">{{ cardData.description }}</p>
          <div class="flex justify-between items-center">
            <div class="text-2xl font-bold">{{ cardData.price }}</div>
            <div class="text-sm text-muted-foreground">{{ cardData.spots }} spots left</div>
          </div>
        </CardContent>
        <CardFooter class="px-6 pb-6">
          <Button class="w-full">Register Now</Button>
        </CardFooter>
      </Card>
    `,
  }),
}

export const StatsGrid: Story = {
  render: (args) => ({
    components: { Card, CardHeader, CardTitle, CardContent },
    setup() {
      const stats = [
        { title: 'Total Revenue', value: '$45,231.89', change: '+20.1% from last month' },
        { title: 'Subscriptions', value: '+2,350', change: '+180.1% from last month' },
        { title: 'Sales', value: '+12,234', change: '+19% from last month' },
        { title: 'Active Users', value: '8,429', change: '+8.2% from last month' },
      ]
      return { args, stats }
    },
    template: `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        <Card v-for="stat in stats" :key="stat.title" v-bind="args">
          <CardHeader class="pb-3">
            <CardTitle class="text-sm font-medium">{{ stat.title }}</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ stat.value }}</div>
            <p class="text-xs text-muted-foreground">{{ stat.change }}</p>
          </CardContent>
        </Card>
      </div>
    `,
  }),
}

export const NotificationCard: Story = {
  render: (args) => ({
    components: {
      Card,
      CardHeader,
      CardTitle,
      CardDescription,
      CardContent,
      CardAction,
      Button,
      BellRing,
    },
    setup() {
      return { args }
    },
    template: `
      <Card v-bind="args" class="w-[400px]">
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardAction>
            <Button variant="outline" size="sm">Mark all as read</Button>
          </CardAction>
          <CardDescription>You have 3 unread messages.</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            <div class="flex items-center space-x-4 rounded-md border p-4">
              <BellRing />
              <div class="flex-1 space-y-1">
                <p class="text-sm font-medium leading-none">Push Notifications</p>
                <p class="text-sm text-muted-foreground">Send notifications to device.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    `,
  }),
}
