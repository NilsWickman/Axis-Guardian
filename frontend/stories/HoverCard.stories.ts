import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Calendar,
  MapPin,
  Mail,
  Phone,
  ExternalLink,
  User,
  Star,
  GitFork,
  Eye,
  Package,
  Heart,
  MessageCircle,
  Share2,
  Building,
  Award,
  Clock,
  Users,
  TrendingUp,
  Shield,
  Zap,
} from 'lucide-vue-next'

// Mock data for different hover card scenarios
const mockProfiles = {
  developer: {
    name: 'Sarah Johnson',
    handle: '@sarahjdev',
    avatar: 'SJ',
    bio: 'Senior Frontend Developer passionate about Vue.js and modern web technologies. Building accessible and performant user interfaces.',
    location: 'San Francisco, CA',
    email: 'sarah@example.com',
    website: 'sarahj.dev',
    stats: {
      followers: '2.4K',
      following: '180',
      repositories: '42',
    },
    joinDate: 'March 2020',
    company: 'Tech Innovations Inc.',
    verified: true,
  },
  designer: {
    name: 'Alex Chen',
    handle: '@alexdesigns',
    avatar: 'AC',
    bio: 'UI/UX Designer crafting beautiful digital experiences. Love minimalism and user-centered design.',
    location: 'New York, NY',
    portfolio: 'alexchen.design',
    stats: {
      projects: '89',
      likes: '12.3K',
      views: '45.2K',
    },
    skills: ['UI Design', 'Prototyping', 'User Research'],
    company: 'Design Studio Co.',
  },
  author: {
    name: 'Maria Rodriguez',
    handle: '@maria_writes',
    avatar: 'MR',
    bio: 'Technical writer and documentation specialist. Making complex topics accessible to everyone.',
    location: 'Austin, TX',
    stats: {
      articles: '156',
      readers: '8.7K',
      claps: '23.1K',
    },
    topics: ['JavaScript', 'Vue.js', 'Web Development'],
    joinDate: 'January 2021',
  },
}

const mockProducts = {
  headphones: {
    name: 'Premium Wireless Headphones',
    brand: 'AudioTech Pro',
    price: '$299.99',
    originalPrice: '$399.99',
    rating: 4.8,
    reviews: 1247,
    image: '/api/placeholder/120/120',
    features: ['Active Noise Cancelling', '30h Battery Life', 'Quick Charge'],
    availability: 'In Stock',
    shipping: 'Free 2-day shipping',
    colors: ['Black', 'White', 'Silver'],
  },
  laptop: {
    name: 'MacBook Pro 14-inch',
    brand: 'Apple',
    price: '$1,999.00',
    specs: ['M3 Pro chip', '18GB RAM', '512GB SSD'],
    rating: 4.9,
    reviews: 892,
    availability: 'Limited Stock',
    shipping: 'Ships in 1-2 weeks',
  },
}

const mockProjects = {
  vue_dashboard: {
    name: 'Vue.js Dashboard',
    description: 'A modern admin dashboard built with Vue 3, TypeScript, and Tailwind CSS',
    language: 'Vue',
    stars: 1205,
    forks: 234,
    lastUpdate: '2 hours ago',
    topics: ['vue', 'typescript', 'tailwindcss', 'dashboard'],
    license: 'MIT',
    author: 'Sarah Johnson',
  },
  ui_components: {
    name: 'Accessible UI Components',
    description: 'A collection of accessible React components following WAI-ARIA guidelines',
    language: 'TypeScript',
    stars: 2843,
    forks: 456,
    lastUpdate: '1 day ago',
    topics: ['react', 'accessibility', 'components', 'typescript'],
    license: 'Apache-2.0',
    author: 'Alex Chen',
  },
}

const mockArticles = {
  vue_performance: {
    title: 'Optimizing Vue.js Performance: Advanced Techniques',
    excerpt:
      'Learn advanced optimization techniques to make your Vue.js applications faster and more efficient.',
    author: 'Maria Rodriguez',
    publishDate: 'March 15, 2024',
    readTime: '8 min read',
    tags: ['Vue.js', 'Performance', 'Optimization'],
    claps: 234,
    comments: 18,
    category: 'Frontend Development',
  },
  design_systems: {
    title: 'Building Scalable Design Systems',
    excerpt: 'A comprehensive guide to creating design systems that scale with your organization.',
    author: 'Alex Chen',
    publishDate: 'March 12, 2024',
    readTime: '12 min read',
    tags: ['Design Systems', 'UI/UX', 'Scaling'],
    claps: 456,
    comments: 29,
    category: 'Design',
  },
}

const mockEvents = {
  conference: {
    title: 'Vue.js Conference 2024',
    date: 'June 15-16, 2024',
    time: '9:00 AM - 6:00 PM PST',
    location: 'San Francisco, CA',
    venue: 'Moscone Center',
    attendees: 1250,
    price: '$299',
    speakers: 24,
    talks: 36,
    type: 'In-person + Virtual',
    organizer: 'Vue.js Team',
  },
  workshop: {
    title: 'Advanced Vue.js Workshop',
    date: 'April 22, 2024',
    time: '10:00 AM - 4:00 PM EST',
    location: 'Online',
    instructor: 'Sarah Johnson',
    duration: '6 hours',
    price: '$149',
    level: 'Advanced',
    spots: 12,
    maxSpots: 25,
  },
}

const meta = {
  title: 'UI Components/HoverCard',
  component: HoverCard,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'For sighted users to preview content available behind a link or reveal additional information on hover.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    openDelay: {
      control: { type: 'number' },
      description: 'The delay in milliseconds before the hover card opens',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '700' },
      },
    },
    closeDelay: {
      control: { type: 'number' },
      description: 'The delay in milliseconds before the hover card closes',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '300' },
      },
    },
  },
} satisfies Meta<typeof HoverCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => ({
    components: { HoverCard, HoverCardTrigger, HoverCardContent },
    setup() {
      return { args }
    },
    template: `
      <div class="flex justify-center">
        <HoverCard v-bind="args">
          <HoverCardTrigger as-child>
            <button class="text-blue-600 hover:underline cursor-pointer">
              @sarahjdev
            </button>
          </HoverCardTrigger>
          <HoverCardContent class="w-80">
            <div class="space-y-2">
              <h4 class="text-sm font-semibold">Sarah Johnson</h4>
              <p class="text-sm text-muted-foreground">
                Senior Frontend Developer passionate about Vue.js and modern web technologies.
              </p>
              <div class="flex items-center pt-2">
                <Calendar class="mr-2 h-4 w-4 opacity-70" />
                <span class="text-xs text-muted-foreground">Joined March 2020</span>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
      </div>
    `,
  }),
}

export const UserProfile: Story = {
  render: (args) => ({
    components: {
      HoverCard,
      HoverCardTrigger,
      HoverCardContent,
      Avatar,
      Badge,
      Button,
      Calendar,
      MapPin,
      Mail,
      ExternalLink,
      Building,
      Shield,
    },
    setup() {
      const profile = mockProfiles.developer
      return { args, profile }
    },
    template: `
      <div class="flex justify-center">
        <HoverCard v-bind="args">
          <HoverCardTrigger as-child>
            <button class="flex items-center gap-2 text-blue-600 hover:underline cursor-pointer">
              <Avatar class="h-6 w-6">
                <div class="bg-blue-600 text-white text-xs font-medium h-full w-full flex items-center justify-center">
                  {{ profile.avatar }}
                </div>
              </Avatar>
              {{ profile.handle }}
            </button>
          </HoverCardTrigger>
          <HoverCardContent class="w-80">
            <div class="flex justify-between space-x-4">
              <Avatar class="h-12 w-12">
                <div class="bg-blue-600 text-white font-medium h-full w-full flex items-center justify-center">
                  {{ profile.avatar }}
                </div>
              </Avatar>
              <div class="space-y-1 flex-1">
                <div class="flex items-center gap-2">
                  <h4 class="text-sm font-semibold">{{ profile.name }}</h4>
                  <Shield v-if="profile.verified" class="h-4 w-4 text-blue-600" />
                </div>
                <p class="text-sm">{{ profile.handle }}</p>
                <p class="text-sm text-muted-foreground">{{ profile.bio }}</p>
                <div class="flex items-center pt-2 space-y-1 flex-col">
                  <div class="flex items-center w-full">
                    <Building class="mr-2 h-4 w-4 opacity-70" />
                    <span class="text-xs text-muted-foreground">{{ profile.company }}</span>
                  </div>
                  <div class="flex items-center w-full">
                    <MapPin class="mr-2 h-4 w-4 opacity-70" />
                    <span class="text-xs text-muted-foreground">{{ profile.location }}</span>
                  </div>
                  <div class="flex items-center w-full">
                    <Calendar class="mr-2 h-4 w-4 opacity-70" />
                    <span class="text-xs text-muted-foreground">Joined {{ profile.joinDate }}</span>
                  </div>
                </div>
                <div class="flex gap-4 pt-2">
                  <div class="text-center">
                    <div class="text-sm font-semibold">{{ profile.stats.followers }}</div>
                    <div class="text-xs text-muted-foreground">Followers</div>
                  </div>
                  <div class="text-center">
                    <div class="text-sm font-semibold">{{ profile.stats.following }}</div>
                    <div class="text-xs text-muted-foreground">Following</div>
                  </div>
                  <div class="text-center">
                    <div class="text-sm font-semibold">{{ profile.stats.repositories }}</div>
                    <div class="text-xs text-muted-foreground">Repos</div>
                  </div>
                </div>
                <div class="flex gap-2 pt-2">
                  <Button size="sm" class="flex-1">Follow</Button>
                  <Button size="sm" variant="outline" class="flex-1">Message</Button>
                </div>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
      </div>
    `,
  }),
}

export const ProductPreview: Story = {
  render: (args) => ({
    components: {
      HoverCard,
      HoverCardTrigger,
      HoverCardContent,
      Button,
      Badge,
      Star,
      Package,
      Heart,
    },
    setup() {
      const product = mockProducts.headphones
      return { args, product }
    },
    template: `
      <div class="flex justify-center">
        <HoverCard v-bind="args">
          <HoverCardTrigger as-child>
            <button class="text-blue-600 hover:underline cursor-pointer">
              {{ product.name }}
            </button>
          </HoverCardTrigger>
          <HoverCardContent class="w-80">
            <div class="space-y-3">
              <div class="flex gap-3">
                <div class="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Package class="h-8 w-8 text-gray-400" />
                </div>
                <div class="flex-1">
                  <h4 class="text-sm font-semibold">{{ product.name }}</h4>
                  <p class="text-sm text-muted-foreground">{{ product.brand }}</p>
                  <div class="flex items-center gap-2 mt-1">
                    <div class="flex items-center">
                      <Star class="h-3 w-3 fill-current text-yellow-400" />
                      <span class="text-xs ml-1">{{ product.rating }}</span>
                    </div>
                    <span class="text-xs text-muted-foreground">({{ product.reviews }} reviews)</span>
                  </div>
                </div>
              </div>
              
              <div class="flex items-center gap-2">
                <span class="text-lg font-bold">{{ product.price }}</span>
                <span class="text-sm text-muted-foreground line-through">{{ product.originalPrice }}</span>
                <Badge variant="destructive" class="text-xs">25% OFF</Badge>
              </div>

              <div class="space-y-2">
                <div class="text-xs text-green-600 font-medium">{{ product.availability }}</div>
                <div class="text-xs text-muted-foreground">{{ product.shipping }}</div>
              </div>

              <div class="space-y-1">
                <div class="text-xs font-medium">Key Features:</div>
                <ul class="text-xs text-muted-foreground space-y-1">
                  <li v-for="feature in product.features" :key="feature">• {{ feature }}</li>
                </ul>
              </div>

              <div class="flex gap-2 pt-2">
                <Button size="sm" class="flex-1">Add to Cart</Button>
                <Button size="sm" variant="outline">
                  <Heart class="h-4 w-4" />
                </Button>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
      </div>
    `,
  }),
}

export const GitHubRepository: Story = {
  render: (args) => ({
    components: {
      HoverCard,
      HoverCardTrigger,
      HoverCardContent,
      Button,
      Badge,
      Star,
      GitFork,
      Eye,
      ExternalLink,
      Clock,
    },
    setup() {
      const repo = mockProjects.vue_dashboard
      return { args, repo }
    },
    template: `
      <div class="flex justify-center">
        <HoverCard v-bind="args">
          <HoverCardTrigger as-child>
            <button class="text-blue-600 hover:underline cursor-pointer font-mono">
              {{ repo.author }}/{{ repo.name }}
            </button>
          </HoverCardTrigger>
          <HoverCardContent class="w-80">
            <div class="space-y-3">
              <div>
                <h4 class="text-sm font-semibold">{{ repo.name }}</h4>
                <p class="text-sm text-muted-foreground">{{ repo.description }}</p>
              </div>
              
              <div class="flex items-center gap-4 text-sm">
                <div class="flex items-center gap-1">
                  <div class="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>{{ repo.language }}</span>
                </div>
                <div class="flex items-center gap-1">
                  <Star class="h-4 w-4" />
                  <span>{{ repo.stars }}</span>
                </div>
                <div class="flex items-center gap-1">
                  <GitFork class="h-4 w-4" />
                  <span>{{ repo.forks }}</span>
                </div>
              </div>

              <div class="flex flex-wrap gap-1">
                <Badge v-for="topic in repo.topics" :key="topic" variant="secondary" class="text-xs">
                  {{ topic }}
                </Badge>
              </div>

              <div class="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock class="h-3 w-3" />
                <span>Updated {{ repo.lastUpdate }}</span>
                <span>•</span>
                <span>{{ repo.license }} license</span>
              </div>

              <div class="flex gap-2 pt-2">
                <Button size="sm" variant="outline" class="flex-1">
                  <Star class="mr-2 h-4 w-4" />
                  Star
                </Button>
                <Button size="sm" variant="outline" class="flex-1">
                  <GitFork class="mr-2 h-4 w-4" />
                  Fork
                </Button>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
      </div>
    `,
  }),
}

export const ArticlePreview: Story = {
  render: (args) => ({
    components: {
      HoverCard,
      HoverCardTrigger,
      HoverCardContent,
      Badge,
      Clock,
      Heart,
      MessageCircle,
      User,
    },
    setup() {
      const article = mockArticles.vue_performance
      return { args, article }
    },
    template: `
      <div class="flex justify-center">
        <HoverCard v-bind="args">
          <HoverCardTrigger as-child>
            <button class="text-blue-600 hover:underline cursor-pointer text-left">
              {{ article.title }}
            </button>
          </HoverCardTrigger>
          <HoverCardContent class="w-80">
            <div class="space-y-3">
              <div>
                <h4 class="text-sm font-semibold">{{ article.title }}</h4>
                <p class="text-sm text-muted-foreground mt-1">{{ article.excerpt }}</p>
              </div>
              
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                  <User class="h-3 w-3" />
                </div>
                <span class="text-sm">{{ article.author }}</span>
              </div>

              <div class="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{{ article.publishDate }}</span>
                <div class="flex items-center gap-1">
                  <Clock class="h-3 w-3" />
                  <span>{{ article.readTime }}</span>
                </div>
                <Badge variant="outline" class="text-xs">{{ article.category }}</Badge>
              </div>

              <div class="flex flex-wrap gap-1">
                <Badge v-for="tag in article.tags" :key="tag" variant="secondary" class="text-xs">
                  {{ tag }}
                </Badge>
              </div>

              <div class="flex items-center justify-between pt-2">
                <div class="flex items-center gap-4 text-sm text-muted-foreground">
                  <div class="flex items-center gap-1">
                    <Heart class="h-4 w-4" />
                    <span>{{ article.claps }}</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <MessageCircle class="h-4 w-4" />
                    <span>{{ article.comments }}</span>
                  </div>
                </div>
                <Button size="sm" variant="outline">Read More</Button>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
      </div>
    `,
  }),
}

export const EventDetails: Story = {
  render: (args) => ({
    components: {
      HoverCard,
      HoverCardTrigger,
      HoverCardContent,
      Button,
      Badge,
      Calendar,
      Clock,
      MapPin,
      Users,
      Award,
    },
    setup() {
      const event = mockEvents.conference
      return { args, event }
    },
    template: `
      <div class="flex justify-center">
        <HoverCard v-bind="args">
          <HoverCardTrigger as-child>
            <button class="text-blue-600 hover:underline cursor-pointer">
              {{ event.title }}
            </button>
          </HoverCardTrigger>
          <HoverCardContent class="w-80">
            <div class="space-y-3">
              <div>
                <h4 class="text-sm font-semibold">{{ event.title }}</h4>
                <p class="text-sm text-muted-foreground">by {{ event.organizer }}</p>
              </div>
              
              <div class="space-y-2 text-sm">
                <div class="flex items-center gap-2">
                  <Calendar class="h-4 w-4 opacity-70" />
                  <span>{{ event.date }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <Clock class="h-4 w-4 opacity-70" />
                  <span>{{ event.time }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <MapPin class="h-4 w-4 opacity-70" />
                  <span>{{ event.location }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <Users class="h-4 w-4 opacity-70" />
                  <span>{{ event.attendees }} attendees</span>
                </div>
              </div>

              <div class="flex items-center gap-4 text-sm">
                <div class="flex items-center gap-1">
                  <Award class="h-4 w-4" />
                  <span>{{ event.speakers }} speakers</span>
                </div>
                <span>{{ event.talks }} talks</span>
                <Badge variant="secondary" class="text-xs">{{ event.type }}</Badge>
              </div>

              <div class="flex items-center justify-between pt-2">
                <div class="text-lg font-bold">{{ event.price }}</div>
                <Button size="sm">Register Now</Button>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
      </div>
    `,
  }),
}

export const RichTooltip: Story = {
  render: (args) => ({
    components: {
      HoverCard,
      HoverCardTrigger,
      HoverCardContent,
      Badge,
      TrendingUp,
      Zap,
      Shield,
    },
    setup() {
      return { args }
    },
    template: `
      <div class="flex justify-center">
        <HoverCard v-bind="args">
          <HoverCardTrigger as-child>
            <button class="px-3 py-1 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors">
              Premium Feature
            </button>
          </HoverCardTrigger>
          <HoverCardContent class="w-64">
            <div class="space-y-3">
              <div class="flex items-center gap-2">
                <Zap class="h-5 w-5 text-yellow-500" />
                <h4 class="text-sm font-semibold">Premium Feature</h4>
              </div>
              
              <p class="text-sm text-muted-foreground">
                Unlock advanced analytics, priority support, and exclusive features with our Premium plan.
              </p>

              <div class="space-y-2">
                <div class="flex items-center gap-2 text-sm">
                  <TrendingUp class="h-4 w-4 text-green-500" />
                  <span>Advanced Analytics</span>
                </div>
                <div class="flex items-center gap-2 text-sm">
                  <Shield class="h-4 w-4 text-blue-500" />
                  <span>Priority Support</span>
                </div>
                <div class="flex items-center gap-2 text-sm">
                  <Zap class="h-4 w-4 text-purple-500" />
                  <span>Early Access Features</span>
                </div>
              </div>

              <div class="flex items-center justify-between pt-2 border-t">
                <Badge variant="outline" class="text-xs">30-day free trial</Badge>
                <span class="text-lg font-bold">$19/mo</span>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
      </div>
    `,
  }),
}

export const CustomDelays: Story = {
  args: {
    openDelay: 300,
    closeDelay: 100,
  },
  render: (args) => ({
    components: { HoverCard, HoverCardTrigger, HoverCardContent },
    setup() {
      return { args }
    },
    template: `
      <div class="flex justify-center">
        <HoverCard v-bind="args">
          <HoverCardTrigger as-child>
            <button class="text-blue-600 hover:underline cursor-pointer">
              Fast hover (300ms open, 100ms close)
            </button>
          </HoverCardTrigger>
          <HoverCardContent class="w-64">
            <div class="space-y-2">
              <h4 class="text-sm font-semibold">Quick Response</h4>
              <p class="text-sm text-muted-foreground">
                This hover card opens quickly (300ms) and closes fast (100ms) for a more responsive feel.
              </p>
            </div>
          </HoverCardContent>
        </HoverCard>
      </div>
    `,
  }),
}

export const MultipleHoverCards: Story = {
  render: (args) => ({
    components: {
      HoverCard,
      HoverCardTrigger,
      HoverCardContent,
      Badge,
      User,
      Package,
      Calendar,
    },
    setup() {
      const users = [
        { name: 'Sarah Johnson', handle: '@sarahjdev', role: 'Frontend Developer' },
        { name: 'Alex Chen', handle: '@alexdesigns', role: 'UI/UX Designer' },
        { name: 'Maria Rodriguez', handle: '@maria_writes', role: 'Technical Writer' },
      ]
      return { args, users }
    },
    template: `
      <div class="flex flex-col items-center gap-4">
        <p class="text-sm text-muted-foreground">Hover over the team members below:</p>
        <div class="flex gap-4">
          <HoverCard v-for="user in users" :key="user.handle" v-bind="args">
            <HoverCardTrigger as-child>
              <button class="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 transition-colors">
                <div class="w-8 h-8 bg-blue-600 text-white text-xs font-medium rounded-full flex items-center justify-center">
                  {{ user.name.split(' ').map(n => n[0]).join('') }}
                </div>
                <span class="text-sm">{{ user.name }}</span>
              </button>
            </HoverCardTrigger>
            <HoverCardContent class="w-64">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 bg-blue-600 text-white font-medium rounded-full flex items-center justify-center">
                  {{ user.name.split(' ').map(n => n[0]).join('') }}
                </div>
                <div>
                  <h4 class="text-sm font-semibold">{{ user.name }}</h4>
                  <p class="text-sm text-muted-foreground">{{ user.handle }}</p>
                  <Badge variant="secondary" class="text-xs mt-1">{{ user.role }}</Badge>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>
      </div>
    `,
  }),
}
