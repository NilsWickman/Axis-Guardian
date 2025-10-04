import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { AspectRatio } from '@/components/ui/aspect-ratio'

// Mock data for different aspect ratio scenarios
const mockContent = {
  image: {
    src: 'https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80',
    alt: 'Photo of gray concrete building with windows',
  },
  video: {
    title: 'Sample Video Content',
    description: 'Video content that maintains aspect ratio',
  },
  placeholder: {
    text: 'Content Area',
    description: 'This content will maintain the specified aspect ratio',
  },
  card: {
    title: 'Card Content',
    subtitle: 'Maintains aspect ratio',
    content: 'This card content is constrained to the specified aspect ratio.',
  },
}

// Common aspect ratios for reference
const commonRatios = {
  square: 1, // 1:1
  landscape: 16 / 9, // 16:9 (widescreen)
  portrait: 9 / 16, // 9:16 (mobile/portrait)
  golden: 1.618, // Golden ratio
  photo: 4 / 3, // 4:3 (traditional photo)
  cinema: 21 / 9, // 21:9 (ultrawide)
  instagram: 1.91, // Instagram landscape
  story: 9 / 16, // Instagram/TikTok story
}

const meta = {
  title: 'UI Components/AspectRatio',
  component: AspectRatio,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Displays content within a desired aspect ratio. Useful for images, videos, and any content that needs to maintain specific proportions.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    ratio: {
      control: { type: 'number', min: 0.1, max: 5, step: 0.1 },
      description: 'The desired aspect ratio (width/height). E.g. 16/9 = 1.78',
    },
    as: {
      control: { type: 'text' },
      description: 'The element or component this should render as',
    },
    asChild: {
      control: { type: 'boolean' },
      description: 'Change the default rendered element for the one passed as a child',
    },
  },
  args: {
    ratio: 16 / 9,
  },
} satisfies Meta<typeof AspectRatio>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => ({
    components: { AspectRatio },
    setup() {
      const content = mockContent.placeholder
      return { args, content }
    },
    template: `
      <div style="max-width: 400px;">
        <AspectRatio v-bind="args" class="bg-muted rounded-lg flex items-center justify-center">
          <div class="text-center">
            <div class="text-lg font-semibold">{{ content.text }}</div>
            <div class="text-sm text-muted-foreground mt-2">{{ content.description }}</div>
            <div class="text-xs text-muted-foreground mt-1">Ratio: {{ args.ratio.toFixed(2) }}</div>
          </div>
        </AspectRatio>
      </div>
    `,
  }),
}

export const WithImage: Story = {
  render: (args) => ({
    components: { AspectRatio },
    setup() {
      const imageData = mockContent.image
      return { args, imageData }
    },
    template: `
      <div style="max-width: 500px;">
        <AspectRatio v-bind="args" class="bg-muted rounded-lg overflow-hidden">
          <img 
            :src="imageData.src" 
            :alt="imageData.alt"
            class="object-cover w-full h-full"
          />
        </AspectRatio>
      </div>
    `,
  }),
  args: {
    ratio: 16 / 9,
  },
}

export const VideoContainer: Story = {
  render: (args) => ({
    components: { AspectRatio },
    setup() {
      const videoData = mockContent.video
      return { args, videoData }
    },
    template: `
      <div style="max-width: 600px;">
        <AspectRatio v-bind="args" class="bg-black rounded-lg flex items-center justify-center">
          <div class="text-center text-white">
            <div class="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
            <div class="text-lg font-semibold">{{ videoData.title }}</div>
            <div class="text-sm text-white/70 mt-1">{{ videoData.description }}</div>
          </div>
        </AspectRatio>
      </div>
    `,
  }),
  args: {
    ratio: 16 / 9,
  },
}

export const Square: Story = {
  render: (args) => ({
    components: { AspectRatio },
    setup() {
      return { args }
    },
    template: `
      <div style="max-width: 300px;">
        <AspectRatio v-bind="args" class="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
          <div class="text-white text-center">
            <div class="text-2xl font-bold">1:1</div>
            <div class="text-sm opacity-90">Square Ratio</div>
          </div>
        </AspectRatio>
      </div>
    `,
  }),
  args: {
    ratio: 1,
  },
}

export const Portrait: Story = {
  render: (args) => ({
    components: { AspectRatio },
    setup() {
      return { args }
    },
    template: `
      <div style="max-width: 250px;">
        <AspectRatio v-bind="args" class="bg-gradient-to-b from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
          <div class="text-white text-center">
            <div class="text-xl font-bold">9:16</div>
            <div class="text-sm opacity-90 mt-1">Portrait</div>
            <div class="text-xs opacity-75 mt-2">Mobile/Story Format</div>
          </div>
        </AspectRatio>
      </div>
    `,
  }),
  args: {
    ratio: 9 / 16,
  },
}

export const GoldenRatio: Story = {
  render: (args) => ({
    components: { AspectRatio },
    setup() {
      return { args }
    },
    template: `
      <div style="max-width: 400px;">
        <AspectRatio v-bind="args" class="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
          <div class="text-white text-center">
            <div class="text-xl font-bold">φ (Phi)</div>
            <div class="text-sm opacity-90 mt-1">Golden Ratio</div>
            <div class="text-xs opacity-75 mt-2">≈ 1.618:1</div>
          </div>
        </AspectRatio>
      </div>
    `,
  }),
  args: {
    ratio: 1.618,
  },
}

export const CommonRatios: Story = {
  render: (args) => ({
    components: { AspectRatio },
    setup() {
      const ratios = [
        { name: 'Square', ratio: commonRatios.square, label: '1:1' },
        { name: 'Photo', ratio: commonRatios.photo, label: '4:3' },
        { name: 'Widescreen', ratio: commonRatios.landscape, label: '16:9' },
        { name: 'Ultrawide', ratio: commonRatios.cinema, label: '21:9' },
      ]
      return { args, ratios }
    },
    template: `
      <div class="space-y-6">
        <div v-for="ratioData in ratios" :key="ratioData.name" class="space-y-2">
          <h3 class="text-sm font-medium text-muted-foreground">
            {{ ratioData.name }} ({{ ratioData.label }})
          </h3>
          <div style="max-width: 400px;">
            <AspectRatio 
              :ratio="ratioData.ratio" 
              class="bg-slate-100 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center"
            >
              <div class="text-center text-slate-600">
                <div class="font-semibold">{{ ratioData.name }}</div>
                <div class="text-sm">{{ ratioData.ratio.toFixed(3) }}</div>
              </div>
            </AspectRatio>
          </div>
        </div>
      </div>
    `,
  }),
}

export const WithCard: Story = {
  render: (args) => ({
    components: { AspectRatio },
    setup() {
      const cardData = mockContent.card
      return { args, cardData }
    },
    template: `
      <div style="max-width: 350px;">
        <div class="border rounded-lg overflow-hidden shadow-sm">
          <AspectRatio v-bind="args" class="bg-gradient-to-br from-purple-500 to-pink-500">
            <div class="p-6 text-white h-full flex flex-col justify-center">
              <h2 class="text-xl font-bold mb-2">{{ cardData.title }}</h2>
              <p class="text-purple-100 text-sm mb-3">{{ cardData.subtitle }}</p>
              <p class="text-purple-200 text-xs">{{ cardData.content }}</p>
            </div>
          </AspectRatio>
          <div class="p-4 border-t">
            <div class="text-xs text-muted-foreground">
              Aspect Ratio: {{ args.ratio.toFixed(2) }}:1
            </div>
          </div>
        </div>
      </div>
    `,
  }),
  args: {
    ratio: 16 / 9,
  },
}

export const ResponsiveGrid: Story = {
  render: (args) => ({
    components: { AspectRatio },
    setup() {
      const items = Array.from({ length: 6 }, (_, i) => ({
        id: i + 1,
        color: `hsl(${(i * 60) % 360}, 70%, 60%)`,
        title: `Item ${i + 1}`,
      }))
      return { args, items }
    },
    template: `
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="item in items" :key="item.id">
          <AspectRatio v-bind="args" class="rounded-lg flex items-center justify-center text-white font-semibold" :style="{ backgroundColor: item.color }">
            {{ item.title }}
          </AspectRatio>
        </div>
      </div>
    `,
  }),
  args: {
    ratio: 1,
  },
}

export const InstagramPost: Story = {
  render: (args) => ({
    components: { AspectRatio },
    setup() {
      return { args }
    },
    template: `
      <div style="max-width: 400px;">
        <div class="border rounded-lg overflow-hidden bg-white shadow-sm">
          <!-- Header -->
          <div class="p-3 flex items-center gap-3 border-b">
            <div class="w-8 h-8 bg-gradient-to-r from-pink-500 to-yellow-500 rounded-full"></div>
            <div class="flex-1">
              <div class="text-sm font-semibold">username</div>
              <div class="text-xs text-muted-foreground">2h</div>
            </div>
            <button class="text-muted-foreground hover:text-foreground">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
              </svg>
            </button>
          </div>
          <!-- Image with AspectRatio -->
          <AspectRatio v-bind="args" class="bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500">
            <div class="w-full h-full flex items-center justify-center text-white">
              <div class="text-center">
                <div class="w-16 h-16 mx-auto mb-3 bg-white/20 rounded-full flex items-center justify-center">
                  <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                  </svg>
                </div>
                <div class="text-sm opacity-90">Instagram Post</div>
                <div class="text-xs opacity-75">1:1 Square</div>
              </div>
            </div>
          </AspectRatio>
          <!-- Footer -->
          <div class="p-3 space-y-2">
            <div class="flex items-center gap-3">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
              </svg>
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
              </svg>
              <div class="flex-1"></div>
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
              </svg>
            </div>
            <div class="text-sm">
              <span class="font-semibold">1,234 likes</span>
            </div>
            <div class="text-sm">
              <span class="font-semibold">username</span> Check out this perfect square aspect ratio! #aspectratio #design
            </div>
          </div>
        </div>
      </div>
    `,
  }),
  args: {
    ratio: 1,
  },
}
