import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { ref, computed } from 'vue'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'
import { Button } from '@/components/ui/button'
import {
  Search,
  Settings,
  User,
  Mail,
  Calendar,
  FileText,
  Folder,
  Home,
  Star,
  Clock,
  Archive,
  Trash,
  Download,
  Upload,
  Edit,
  Copy,
  Share,
  Bell,
  Shield,
  Palette,
  Monitor,
  Moon,
  Sun,
  Zap,
  Code,
  Terminal,
  Database,
  Cloud,
  Globe,
  Smartphone,
  Wifi,
  Battery,
  Volume2,
  Camera,
  Image,
  Video,
  Music,
  Headphones,
  Mic,
  Phone,
  MessageSquare,
  Heart,
  ThumbsUp,
  Bookmark,
  Tag,
  Flag,
  AlertCircle,
  CheckCircle,
  Info,
  HelpCircle,
  Plus,
  Minus,
  X,
  ChevronRight,
} from 'lucide-vue-next'

// Mock data for different command scenarios
const mockCommandData = {
  basic: {
    actions: [
      { value: 'new-file', label: 'New File', icon: FileText, shortcut: 'Ctrl+N' },
      { value: 'open-file', label: 'Open File', icon: Folder, shortcut: 'Ctrl+O' },
      { value: 'save-file', label: 'Save File', icon: Download, shortcut: 'Ctrl+S' },
      { value: 'save-as', label: 'Save As...', icon: Copy, shortcut: 'Ctrl+Shift+S' },
      { value: 'close-file', label: 'Close File', icon: X, shortcut: 'Ctrl+W' },
      { value: 'quit', label: 'Quit Application', icon: X, shortcut: 'Ctrl+Q' },
    ],
  },
  palette: {
    navigation: [
      { value: 'go-home', label: 'Go to Home', icon: Home, shortcut: 'Ctrl+H' },
      { value: 'go-profile', label: 'Go to Profile', icon: User, shortcut: 'Ctrl+P' },
      { value: 'go-settings', label: 'Go to Settings', icon: Settings, shortcut: 'Ctrl+,' },
      { value: 'go-inbox', label: 'Go to Inbox', icon: Mail, shortcut: 'Ctrl+I' },
      { value: 'go-calendar', label: 'Go to Calendar', icon: Calendar, shortcut: 'Ctrl+K' },
      { value: 'go-starred', label: 'Go to Starred', icon: Star, shortcut: 'Ctrl+*' },
      { value: 'go-archive', label: 'Go to Archive', icon: Archive, shortcut: 'Ctrl+A' },
    ],
    actions: [
      { value: 'new-message', label: 'Compose New Message', icon: Edit, shortcut: 'C' },
      { value: 'search', label: 'Search Messages', icon: Search, shortcut: '/' },
      { value: 'mark-read', label: 'Mark All as Read', icon: CheckCircle, shortcut: 'Shift+I' },
      { value: 'mark-starred', label: 'Add to Starred', icon: Star, shortcut: 'S' },
      { value: 'delete', label: 'Move to Trash', icon: Trash, shortcut: 'Del' },
      { value: 'share', label: 'Share', icon: Share, shortcut: 'Ctrl+Shift+S' },
    ],
    preferences: [
      { value: 'theme-light', label: 'Light Theme', icon: Sun },
      { value: 'theme-dark', label: 'Dark Theme', icon: Moon },
      { value: 'theme-auto', label: 'System Theme', icon: Monitor },
      { value: 'notifications', label: 'Notifications', icon: Bell },
      { value: 'privacy', label: 'Privacy Settings', icon: Shield },
      { value: 'appearance', label: 'Appearance', icon: Palette },
    ],
  },
  search: {
    files: [
      {
        value: 'readme',
        label: 'README.md',
        icon: FileText,
        path: '/project/README.md',
        type: 'markdown',
      },
      {
        value: 'package',
        label: 'package.json',
        icon: Settings,
        path: '/project/package.json',
        type: 'json',
      },
      { value: 'app-vue', label: 'App.vue', icon: Code, path: '/src/App.vue', type: 'vue' },
      { value: 'main-ts', label: 'main.ts', icon: Code, path: '/src/main.ts', type: 'typescript' },
      {
        value: 'style-css',
        label: 'style.css',
        icon: Palette,
        path: '/src/style.css',
        type: 'css',
      },
      {
        value: 'config',
        label: 'vite.config.ts',
        icon: Settings,
        path: '/vite.config.ts',
        type: 'typescript',
      },
    ],
    people: [
      {
        value: 'john',
        label: 'John Doe',
        email: 'john@company.com',
        role: 'Frontend Developer',
        avatar: 'JD',
      },
      {
        value: 'jane',
        label: 'Jane Smith',
        email: 'jane@company.com',
        role: 'Designer',
        avatar: 'JS',
      },
      {
        value: 'mike',
        label: 'Mike Johnson',
        email: 'mike@company.com',
        role: 'Backend Developer',
        avatar: 'MJ',
      },
      {
        value: 'sarah',
        label: 'Sarah Wilson',
        email: 'sarah@company.com',
        role: 'Product Manager',
        avatar: 'SW',
      },
      {
        value: 'alex',
        label: 'Alex Brown',
        email: 'alex@company.com',
        role: 'DevOps Engineer',
        avatar: 'AB',
      },
    ],
    recent: [
      { value: 'dashboard', label: 'Dashboard View', icon: Home, lastAccessed: '2 hours ago' },
      { value: 'project-alpha', label: 'Project Alpha', icon: Folder, lastAccessed: '1 day ago' },
      {
        value: 'team-meeting',
        label: 'Team Meeting Notes',
        icon: FileText,
        lastAccessed: '3 days ago',
      },
      { value: 'design-system', label: 'Design System', icon: Palette, lastAccessed: '1 week ago' },
    ],
  },
  developer: {
    git: [
      { value: 'git-status', label: 'Git Status', icon: Terminal, command: 'git status' },
      { value: 'git-add', label: 'Stage All Changes', icon: Plus, command: 'git add .' },
      { value: 'git-commit', label: 'Commit Changes', icon: CheckCircle, command: 'git commit' },
      { value: 'git-push', label: 'Push to Remote', icon: Upload, command: 'git push' },
      { value: 'git-pull', label: 'Pull from Remote', icon: Download, command: 'git pull' },
      { value: 'git-branch', label: 'List Branches', icon: Code, command: 'git branch' },
    ],
    build: [
      {
        value: 'npm-install',
        label: 'Install Dependencies',
        icon: Download,
        command: 'npm install',
      },
      { value: 'npm-dev', label: 'Start Dev Server', icon: Zap, command: 'npm run dev' },
      {
        value: 'npm-build',
        label: 'Build for Production',
        icon: Settings,
        command: 'npm run build',
      },
      { value: 'npm-test', label: 'Run Tests', icon: CheckCircle, command: 'npm test' },
      { value: 'npm-lint', label: 'Lint Code', icon: Search, command: 'npm run lint' },
    ],
    tools: [
      { value: 'open-terminal', label: 'Open Terminal', icon: Terminal, shortcut: 'Ctrl+`' },
      { value: 'toggle-devtools', label: 'Toggle DevTools', icon: Code, shortcut: 'F12' },
      { value: 'reload-page', label: 'Reload Page', icon: ChevronRight, shortcut: 'Ctrl+R' },
      { value: 'clear-cache', label: 'Clear Cache', icon: Trash, shortcut: 'Ctrl+Shift+R' },
    ],
  },
  media: {
    audio: [
      { value: 'play-pause', label: 'Play/Pause', icon: Music, shortcut: 'Space' },
      { value: 'next-track', label: 'Next Track', icon: ChevronRight, shortcut: 'Ctrl+Right' },
      { value: 'volume-up', label: 'Volume Up', icon: Volume2, shortcut: 'Ctrl+Up' },
      { value: 'volume-down', label: 'Volume Down', icon: Volume2, shortcut: 'Ctrl+Down' },
      { value: 'mute', label: 'Mute/Unmute', icon: Volume2, shortcut: 'M' },
    ],
    camera: [
      { value: 'take-photo', label: 'Take Photo', icon: Camera, shortcut: 'Ctrl+Shift+P' },
      { value: 'record-video', label: 'Record Video', icon: Video, shortcut: 'Ctrl+Shift+V' },
      { value: 'open-gallery', label: 'Open Gallery', icon: Image, shortcut: 'Ctrl+G' },
      { value: 'settings', label: 'Camera Settings', icon: Settings },
    ],
  },
}

const meta = {
  title: 'UI Components/Command',
  component: Command,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A command palette component that provides fast, searchable access to actions and navigation. Built for keyboard-first interaction with filtering and grouping capabilities.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    modelValue: {
      control: { type: 'text' },
      description: 'The selected value (v-model)',
    },
    class: {
      control: { type: 'text' },
      description: 'Additional CSS classes',
    },
  },
} satisfies Meta<typeof Command>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => ({
    components: {
      Command,
      CommandInput,
      CommandList,
      CommandItem,
      CommandEmpty,
      CommandShortcut,
      FileText,
      Folder,
      Download,
      Copy,
      X,
    },
    setup() {
      const selectedValue = ref('')
      const { actions } = mockCommandData.basic
      return { args, selectedValue, actions }
    },
    template: `
      <div class="w-[400px]">
        <Command v-model="selectedValue" v-bind="args" class="border">
          <CommandInput placeholder="Type a command or search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandItem 
              v-for="action in actions" 
              :key="action.value" 
              :value="action.value"
            >
              <component :is="action.icon" class="mr-2 h-4 w-4" />
              <span>{{ action.label }}</span>
              <CommandShortcut v-if="action.shortcut">{{ action.shortcut }}</CommandShortcut>
            </CommandItem>
          </CommandList>
        </Command>
        <p class="mt-4 text-sm text-muted-foreground">
          Selected: {{ selectedValue || 'None' }}
        </p>
      </div>
    `,
  }),
}

export const CommandPalette: Story = {
  render: () => ({
    components: {
      Command,
      CommandInput,
      CommandList,
      CommandGroup,
      CommandItem,
      CommandEmpty,
      CommandSeparator,
      CommandShortcut,
      Home,
      User,
      Settings,
      Mail,
      Calendar,
      Star,
      Archive,
      Edit,
      Search,
      CheckCircle,
      Trash,
      Share,
      Sun,
      Moon,
      Monitor,
      Bell,
      Shield,
      Palette,
    },
    setup() {
      const selectedValue = ref('')
      const { navigation, actions, preferences } = mockCommandData.palette
      return { selectedValue, navigation, actions, preferences }
    },
    template: `
      <div class="w-[500px]">
        <Command v-model="selectedValue" class="border shadow-lg">
          <CommandInput placeholder="Type a command or search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            
            <CommandGroup heading="Navigation">
              <CommandItem 
                v-for="item in navigation" 
                :key="item.value" 
                :value="item.value"
              >
                <component :is="item.icon" class="mr-2 h-4 w-4" />
                <span>{{ item.label }}</span>
                <CommandShortcut v-if="item.shortcut">{{ item.shortcut }}</CommandShortcut>
              </CommandItem>
            </CommandGroup>
            
            <CommandSeparator />
            
            <CommandGroup heading="Actions">
              <CommandItem 
                v-for="item in actions" 
                :key="item.value" 
                :value="item.value"
              >
                <component :is="item.icon" class="mr-2 h-4 w-4" />
                <span>{{ item.label }}</span>
                <CommandShortcut v-if="item.shortcut">{{ item.shortcut }}</CommandShortcut>
              </CommandItem>
            </CommandGroup>
            
            <CommandSeparator />
            
            <CommandGroup heading="Preferences">
              <CommandItem 
                v-for="item in preferences" 
                :key="item.value" 
                :value="item.value"
              >
                <component :is="item.icon" class="mr-2 h-4 w-4" />
                <span>{{ item.label }}</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
        <p class="mt-4 text-sm text-muted-foreground">
          Selected: {{ selectedValue || 'None' }}
        </p>
      </div>
    `,
  }),
}

export const DialogMode: Story = {
  render: () => ({
    components: {
      CommandDialog,
      CommandInput,
      CommandList,
      CommandGroup,
      CommandItem,
      CommandEmpty,
      CommandSeparator,
      CommandShortcut,
      Button,
      Home,
      User,
      Settings,
      Mail,
      Calendar,
      Star,
      Archive,
      Edit,
      Search,
      CheckCircle,
      Trash,
      Share,
      Sun,
      Moon,
      Monitor,
    },
    setup() {
      const open = ref(false)
      const selectedValue = ref('')
      const { navigation, actions, preferences } = mockCommandData.palette

      return { open, selectedValue, navigation, actions, preferences }
    },
    template: `
      <div class="space-y-4">
        <div class="flex items-center gap-4">
          <Button @click="open = true">Open Command Palette</Button>
          <div class="text-sm text-muted-foreground">
            Press <kbd class="px-2 py-1 bg-muted rounded text-xs">Ctrl+K</kbd> to open
          </div>
        </div>
        
        <CommandDialog 
          v-model:open="open" 
          v-model="selectedValue"
          title="Command Palette"
          description="Search for commands and navigate quickly..."
        >
          <CommandInput placeholder="Type a command or search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            
            <CommandGroup heading="Navigation">
              <CommandItem 
                v-for="item in navigation" 
                :key="item.value" 
                :value="item.value"
                @select="open = false"
              >
                <component :is="item.icon" class="mr-2 h-4 w-4" />
                <span>{{ item.label }}</span>
                <CommandShortcut v-if="item.shortcut">{{ item.shortcut }}</CommandShortcut>
              </CommandItem>
            </CommandGroup>
            
            <CommandSeparator />
            
            <CommandGroup heading="Actions">
              <CommandItem 
                v-for="item in actions" 
                :key="item.value" 
                :value="item.value"
                @select="open = false"
              >
                <component :is="item.icon" class="mr-2 h-4 w-4" />
                <span>{{ item.label }}</span>
                <CommandShortcut v-if="item.shortcut">{{ item.shortcut }}</CommandShortcut>
              </CommandItem>
            </CommandGroup>
            
            <CommandSeparator />
            
            <CommandGroup heading="Preferences">
              <CommandItem 
                v-for="item in preferences" 
                :key="item.value" 
                :value="item.value"
                @select="open = false"
              >
                <component :is="item.icon" class="mr-2 h-4 w-4" />
                <span>{{ item.label }}</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </CommandDialog>
        
        <div v-if="selectedValue" class="p-4 border rounded-lg bg-muted/50">
          <p class="text-sm">
            Last selected command: <code class="bg-background px-2 py-1 rounded">{{ selectedValue }}</code>
          </p>
        </div>
      </div>
    `,
  }),
}

export const CustomStyling: Story = {
  render: () => ({
    components: {
      Command,
      CommandInput,
      CommandList,
      CommandGroup,
      CommandItem,
      CommandEmpty,
      CommandShortcut,
      FileText,
      Settings,
      Star,
      Code,
    },
    setup() {
      const selectedValue = ref('')
      const commands = [
        {
          value: 'new',
          label: 'Create New Document',
          icon: FileText,
          shortcut: 'Ctrl+N',
          featured: true,
        },
        {
          value: 'settings',
          label: 'Open Settings',
          icon: Settings,
          shortcut: 'Ctrl+,',
          featured: false,
        },
        {
          value: 'favorites',
          label: 'View Favorites',
          icon: Star,
          shortcut: 'Ctrl+F',
          featured: true,
        },
        {
          value: 'code',
          label: 'Open Code Editor',
          icon: Code,
          shortcut: 'Ctrl+E',
          featured: false,
        },
      ]
      return { selectedValue, commands }
    },
    template: `
      <div class="w-[450px]">
        <Command v-model="selectedValue" class="border-2 border-primary/20 shadow-xl rounded-lg">
          <CommandInput 
            placeholder="Custom styled command palette..." 
            class="border-b-2 border-primary/10"
          />
          <CommandList class="max-h-[400px]">
            <CommandEmpty>
              <div class="text-center py-8">
                <p class="text-primary font-medium">Nothing found</p>
                <p class="text-sm text-muted-foreground mt-1">Try a different search term</p>
              </div>
            </CommandEmpty>
            
            <CommandGroup heading="Featured Commands" class="[&_[cmdk-group-heading]]:text-primary [&_[cmdk-group-heading]]:font-semibold">
              <CommandItem 
                v-for="cmd in commands.filter(c => c.featured)" 
                :key="cmd.value" 
                :value="cmd.value"
                class="data-[selected]:bg-primary/10 data-[selected]:text-primary border-l-2 border-l-transparent data-[selected]:border-l-primary"
              >
                <component :is="cmd.icon" class="mr-3 h-5 w-5" />
                <div class="flex-1">
                  <span class="font-medium">{{ cmd.label }}</span>
                </div>
                <CommandShortcut class="bg-primary/10 text-primary">{{ cmd.shortcut }}</CommandShortcut>
              </CommandItem>
            </CommandGroup>
            
            <CommandGroup heading="Other Commands">
              <CommandItem 
                v-for="cmd in commands.filter(c => !c.featured)" 
                :key="cmd.value" 
                :value="cmd.value"
                class="data-[selected]:bg-secondary"
              >
                <component :is="cmd.icon" class="mr-3 h-4 w-4" />
                <span>{{ cmd.label }}</span>
                <CommandShortcut>{{ cmd.shortcut }}</CommandShortcut>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
        <p class="mt-4 text-sm text-muted-foreground">
          Selected: {{ selectedValue || 'None' }}
        </p>
      </div>
    `,
  }),
}
