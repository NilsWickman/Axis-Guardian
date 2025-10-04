import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { File, Folder, FileText, Code } from 'lucide-vue-next'

const meta = {
  title: 'UI Components/ScrollArea',
  component: ScrollArea,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Provides a scrollable area with custom scrollbars for better control over content overflow.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ScrollArea>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => ({
    components: { ScrollArea, ScrollBar },
    setup() {
      const longText = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.

Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.

Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit.`

      return { longText }
    },
    template: `
      <ScrollArea class="h-72 w-full rounded border p-4">
        <div class="pr-4">
          <h3 class="mb-4 text-lg font-semibold">Scrollable Text Content</h3>
          <p class="text-sm text-muted-foreground leading-relaxed">
            {{ longText }}
          </p>
        </div>
        <ScrollBar orientation="vertical" />
      </ScrollArea>
    `,
  }),
}

export const FileList: Story = {
  render: () => ({
    components: { ScrollArea, File, Folder, FileText, Code },
    setup() {
      const files = [
        { name: 'package.json', type: 'config', size: '2.1 KB' },
        { name: 'README.md', type: 'doc', size: '4.3 KB' },
        { name: 'src', type: 'folder', size: '-' },
        { name: 'components', type: 'folder', size: '-' },
        { name: 'App.vue', type: 'vue', size: '1.8 KB' },
        { name: 'main.ts', type: 'typescript', size: '456 B' },
        { name: 'style.css', type: 'css', size: '3.2 KB' },
        { name: 'vite.config.ts', type: 'config', size: '892 B' },
        { name: 'tsconfig.json', type: 'config', size: '654 B' },
        { name: 'public', type: 'folder', size: '-' },
        { name: 'dist', type: 'folder', size: '-' },
        { name: 'node_modules', type: 'folder', size: '-' },
      ]

      return { files }
    },
    template: `
      <ScrollArea class="h-80 w-full rounded border">
        <div class="p-4">
          <h3 class="mb-4 text-lg font-semibold">Project Files</h3>
          <div class="space-y-2">
            <div
              v-for="file in files"
              :key="file.name"
              class="flex items-center space-x-3 rounded-md p-2 hover:bg-muted transition-colors"
            >
              <component
                :is="file.type === 'folder' ? Folder : file.type === 'doc' ? FileText : file.type === 'vue' || file.type === 'typescript' ? Code : File"
                class="h-4 w-4 text-muted-foreground"
              />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium truncate">{{ file.name }}</p>
                <p class="text-xs text-muted-foreground">{{ file.size }}</p>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    `,
  }),
}

export const ChatMessages: Story = {
  render: () => ({
    components: { ScrollArea, Avatar, AvatarFallback },
    setup() {
      const messages = [
        {
          id: 1,
          user: 'Alice',
          message: 'Hey everyone! How is the project going?',
          time: '9:30 AM',
          avatar: 'AJ',
        },
        {
          id: 2,
          user: 'Bob',
          message: 'Great progress on the UI components. The design system is looking fantastic!',
          time: '9:32 AM',
          avatar: 'BS',
        },
        {
          id: 3,
          user: 'Carol',
          message: 'I just finished the authentication flow. Ready for review.',
          time: '9:35 AM',
          avatar: 'CD',
        },
        {
          id: 4,
          user: 'David',
          message: 'The API integration is almost complete. Should have it done by end of day.',
          time: '9:40 AM',
          avatar: 'DW',
        },
        {
          id: 5,
          user: 'Emma',
          message: 'Can someone help me with the deployment configuration?',
          time: '9:45 AM',
          avatar: 'EB',
        },
        {
          id: 6,
          user: 'Frank',
          message: "Sure Emma, I can help with that. Let me know what errors you're seeing.",
          time: '9:47 AM',
          avatar: 'FM',
        },
      ]

      return { messages }
    },
    template: `
      <ScrollArea class="h-96 w-full rounded border">
        <div class="p-4">
          <h3 class="mb-4 text-lg font-semibold">Team Chat</h3>
          <div class="space-y-4">
            <div
              v-for="message in messages"
              :key="message.id"
              class="flex space-x-3"
            >
              <Avatar class="h-8 w-8">
                <AvatarFallback class="text-xs">{{ message.avatar }}</AvatarFallback>
              </Avatar>
              <div class="flex-1 min-w-0">
                <div class="flex items-center space-x-2">
                  <p class="text-sm font-medium">{{ message.user }}</p>
                  <p class="text-xs text-muted-foreground">{{ message.time }}</p>
                </div>
                <p class="text-sm text-muted-foreground mt-1">{{ message.message }}</p>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    `,
  }),
}

export const HorizontalScroll: Story = {
  render: () => ({
    components: { ScrollArea, ScrollBar },
    setup() {
      const artworks = [
        {
          id: '1',
          artist: 'Ornella Binni',
          art: 'https://images.unsplash.com/photo-1465869185982-5a1a7522cbcb?auto=format&fit=crop&w=300&q=80',
        },
        {
          id: '2',
          artist: 'Tom Byrom',
          art: 'https://images.unsplash.com/photo-1548516173-3cabfa4607e9?auto=format&fit=crop&w=300&q=80',
        },
        {
          id: '3',
          artist: 'Vladimir Malyavko',
          art: 'https://images.unsplash.com/photo-1494337480532-3725c85fd2ab?auto=format&fit=crop&w=300&q=80',
        },
        {
          id: '4',
          artist: 'John Doe',
          art: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=300&q=80',
        },
        {
          id: '5',
          artist: 'Jane Smith',
          art: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?auto=format&fit=crop&w=300&q=80',
        },
      ]

      return { artworks }
    },
    template: `
      <ScrollArea class="border rounded-md w-96 whitespace-nowrap">
        <div class="flex p-4 space-x-4 w-max">
          <div v-for="artwork in artworks" :key="artwork.id">
            <figure class="shrink-0">
              <div class="overflow-hidden rounded-md">
                <img
                  :src="artwork.art"
                  :alt="\`Photo by \${artwork.artist}\`"
                  class="aspect-[3/4] w-36 h-56 object-cover"
                />
              </div>
              <figcaption class="pt-2 text-xs text-muted-foreground">
                Photo by
                <span class="font-semibold text-foreground">
                  {{ artwork.artist }}
                </span>
              </figcaption>
            </figure>
          </div>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    `,
  }),
}
