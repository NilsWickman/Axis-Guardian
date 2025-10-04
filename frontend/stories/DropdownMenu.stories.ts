import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { ref } from 'vue'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import {
  User,
  Settings,
  LogOut,
  CreditCard,
  Users,
  Plus,
  Mail,
  MessageSquare,
  PlusCircle,
  UserPlus,
  Github,
  LifeBuoy,
  Cloud,
  Keyboard,
  MoreHorizontal,
  Edit,
  Copy,
  Archive,
  Trash2,
  Star,
  Download,
  Share,
  Eye,
  EyeOff,
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  Palette,
  Sun,
  Moon,
  Monitor,
  Check,
  Circle,
  ChevronRight,
  FileText,
  Folder,
  Image,
  Video,
  Music,
} from 'lucide-vue-next'

// Mock data for different dropdown menu scenarios
const mockUserData = {
  user: {
    name: 'John Doe',
    email: 'john.doe@example.com',
    avatar: 'https://github.com/johndoe.png',
  },
  notifications: {
    enabled: ref(true),
    email: ref(false),
    push: ref(true),
    sound: ref(false),
  },
  theme: ref('light'),
  language: ref('english'),
  statusIndicator: ref('online'),
}

const mockProjectData = {
  projects: [
    { id: '1', name: 'Marketing Site', status: 'active' },
    { id: '2', name: 'Mobile App', status: 'draft' },
    { id: '3', name: 'Dashboard', status: 'archived' },
  ],
  fileTypes: ref(['document']),
}

const mockActionItems = [
  { icon: Edit, label: 'Edit', shortcut: '⌘E' },
  { icon: Copy, label: 'Duplicate', shortcut: '⌘D' },
  { icon: Archive, label: 'Archive', shortcut: '⌘A' },
  { icon: Trash2, label: 'Delete', shortcut: '⌘⌫', variant: 'destructive' },
]

const meta = {
  title: 'UI Components/DropdownMenu',
  component: DropdownMenu,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A dropdown menu component that displays a menu of options when triggered. Built with Reka UI and supports keyboard navigation, checkboxes, radio groups, and nested menus.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DropdownMenu>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => ({
    components: {
      DropdownMenu,
      DropdownMenuTrigger,
      DropdownMenuContent,
      DropdownMenuItem,
      DropdownMenuSeparator,
      Button,
      Settings,
      User,
      LogOut,
    },
    template: `
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="outline">Open Menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent class="w-56">
          <DropdownMenuItem>
            <User class="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings class="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <LogOut class="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    `,
  }),
}

export const UserAccountMenu: Story = {
  render: () => ({
    components: {
      DropdownMenu,
      DropdownMenuTrigger,
      DropdownMenuContent,
      DropdownMenuItem,
      DropdownMenuGroup,
      DropdownMenuLabel,
      DropdownMenuSeparator,
      DropdownMenuShortcut,
      Button,
      User,
      CreditCard,
      Settings,
      Users,
      Plus,
      Github,
      LifeBuoy,
      Cloud,
      LogOut,
    },
    setup() {
      return { mockUserData }
    },
    template: `
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="outline">{{ mockUserData.user.name }}</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent class="w-56">
          <DropdownMenuLabel>{{ mockUserData.user.email }}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <User class="mr-2 h-4 w-4" />
              <span>Profile</span>
              <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <CreditCard class="mr-2 h-4 w-4" />
              <span>Billing</span>
              <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings class="mr-2 h-4 w-4" />
              <span>Settings</span>
              <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <Users class="mr-2 h-4 w-4" />
              <span>Team</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Plus class="mr-2 h-4 w-4" />
              <span>New Team</span>
              <DropdownMenuShortcut>⌘+T</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Github class="mr-2 h-4 w-4" />
            <span>GitHub</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <LifeBuoy class="mr-2 h-4 w-4" />
            <span>Support</span>
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
            <Cloud class="mr-2 h-4 w-4" />
            <span>API</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <LogOut class="mr-2 h-4 w-4" />
            <span>Log out</span>
            <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    `,
  }),
}

export const ActionsMenu: Story = {
  render: () => ({
    components: {
      DropdownMenu,
      DropdownMenuTrigger,
      DropdownMenuContent,
      DropdownMenuItem,
      DropdownMenuSeparator,
      DropdownMenuShortcut,
      Button,
      MoreHorizontal,
      Edit,
      Copy,
      Archive,
      Trash2,
      Star,
      Download,
      Share,
    },
    setup() {
      return { mockActionItems }
    },
    template: `
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="ghost" size="sm">
            <MoreHorizontal class="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent class="w-48">
          <DropdownMenuItem>
            <Star class="mr-2 h-4 w-4" />
            <span>Add to favorites</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Download class="mr-2 h-4 w-4" />
            <span>Download</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Share class="mr-2 h-4 w-4" />
            <span>Share</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Edit class="mr-2 h-4 w-4" />
            <span>Edit</span>
            <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Copy class="mr-2 h-4 w-4" />
            <span>Duplicate</span>
            <DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Archive class="mr-2 h-4 w-4" />
            <span>Archive</span>
            <DropdownMenuShortcut>⌘A</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">
            <Trash2 class="mr-2 h-4 w-4" />
            <span>Delete</span>
            <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    `,
  }),
}

export const WithCheckboxItems: Story = {
  render: () => ({
    components: {
      DropdownMenu,
      DropdownMenuTrigger,
      DropdownMenuContent,
      DropdownMenuCheckboxItem,
      DropdownMenuLabel,
      DropdownMenuSeparator,
      Button,
    },
    setup() {
      const showStatusBar = ref(true)
      const showActivityBar = ref(false)
      const showPanel = ref(false)

      return { showStatusBar, showActivityBar, showPanel }
    },
    template: `
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="outline">
            Open
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent class="w-56">
          <DropdownMenuLabel>Appearance</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem
            v-model:model-value="showStatusBar"
          >
            Status Bar
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            v-model:model-value="showActivityBar"
            disabled
          >
            Activity Bar
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            v-model:model-value="showPanel"
          >
            Panel
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    `,
  }),
}

export const WithRadioGroup: Story = {
  render: () => ({
    components: {
      DropdownMenu,
      DropdownMenuTrigger,
      DropdownMenuContent,
      DropdownMenuRadioGroup,
      DropdownMenuRadioItem,
      DropdownMenuLabel,
      DropdownMenuSeparator,
      Button,
      Palette,
    },
    setup() {
      const theme = ref('light')

      return { theme }
    },
    template: `
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="outline">
            <Palette class="mr-2 h-4 w-4" />
            Theme: {{ theme }}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent class="w-56">
          <DropdownMenuLabel>Choose Theme</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup v-model="theme">
            <DropdownMenuRadioItem value="light">
              <Sun class="mr-2 h-4 w-4" />
              Light
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dark">
              <Moon class="mr-2 h-4 w-4" />
              Dark
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="system">
              <Monitor class="mr-2 h-4 w-4" />
              System
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    `,
  }),
}

export const WithSubmenus: Story = {
  render: () => ({
    components: {
      DropdownMenu,
      DropdownMenuTrigger,
      DropdownMenuContent,
      DropdownMenuItem,
      DropdownMenuGroup,
      DropdownMenuLabel,
      DropdownMenuSeparator,
      DropdownMenuSub,
      DropdownMenuSubTrigger,
      DropdownMenuSubContent,
      Button,
      Plus,
      Mail,
      MessageSquare,
      PlusCircle,
      UserPlus,
      FileText,
      Folder,
      Image,
      Video,
      Music,
      ChevronRight,
    },
    template: `
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="outline">
            <Plus class="mr-2 h-4 w-4" />
            Create New
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent class="w-56">
          <DropdownMenuLabel>Create</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <Mail class="mr-2 h-4 w-4" />
              <span>Email</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <MessageSquare class="mr-2 h-4 w-4" />
              <span>Message</span>
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <PlusCircle class="mr-2 h-4 w-4" />
                <span>More Options</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent class="w-48">
                <DropdownMenuItem>
                  <FileText class="mr-2 h-4 w-4" />
                  <span>Document</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Folder class="mr-2 h-4 w-4" />
                  <span>Folder</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Image class="mr-2 h-4 w-4" />
                    <span>Media</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent class="w-48">
                    <DropdownMenuItem>
                      <Image class="mr-2 h-4 w-4" />
                      <span>Image</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Video class="mr-2 h-4 w-4" />
                      <span>Video</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Music class="mr-2 h-4 w-4" />
                      <span>Audio</span>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <UserPlus class="mr-2 h-4 w-4" />
            <span>Invite User</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    `,
  }),
}

export const StatusIndicatorMenu: Story = {
  render: () => ({
    components: {
      DropdownMenu,
      DropdownMenuTrigger,
      DropdownMenuContent,
      DropdownMenuRadioGroup,
      DropdownMenuRadioItem,
      DropdownMenuLabel,
      DropdownMenuSeparator,
      Button,
      Circle,
    },
    setup() {
      const status = ref('online')

      const getStatusColor = (statusValue: string) => {
        switch (statusValue) {
          case 'online':
            return 'text-green-500'
          case 'away':
            return 'text-yellow-500'
          case 'busy':
            return 'text-red-500'
          case 'offline':
            return 'text-gray-500'
          default:
            return 'text-gray-500'
        }
      }

      const getStatusLabel = (statusValue: string) => {
        return statusValue.charAt(0).toUpperCase() + statusValue.slice(1)
      }

      return { status, getStatusColor, getStatusLabel }
    },
    template: `
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="outline">
            <Circle :class="['mr-2 h-3 w-3 fill-current', getStatusColor(status)]" />
            {{ getStatusLabel(status) }}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent class="w-56">
          <DropdownMenuLabel>Set Status</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup v-model="status">
            <DropdownMenuRadioItem value="online">
              <Circle class="mr-2 h-3 w-3 fill-current text-green-500" />
              Online
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="away">
              <Circle class="mr-2 h-3 w-3 fill-current text-yellow-500" />
              Away
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="busy">
              <Circle class="mr-2 h-3 w-3 fill-current text-red-500" />
              Busy
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="offline">
              <Circle class="mr-2 h-3 w-3 fill-current text-gray-500" />
              Offline
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    `,
  }),
}
