import type { Meta, StoryObj } from '@storybook/vue3-vite'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Menu,
  Settings,
  User,
  Filter,
  ShoppingCart,
  Bell,
  Search,
  Home,
  Calendar,
  FileText,
  Star,
  Heart,
  Share,
  Download,
  Edit,
  Trash2,
  Plus,
  X,
  CheckCircle,
  AlertTriangle,
  Info,
  MapPin,
  Phone,
  Mail,
  Clock,
  Package,
  CreditCard,
  Palette,
  Volume2,
  Wifi,
  Battery,
  Smartphone,
  Monitor,
  Globe,
  Shield,
  Key,
  HelpCircle,
  MessageSquare,
  Image,
  Video,
  Music,
  Camera,
  Bookmark,
  Tag,
  Layers,
  Grid,
  List,
  BarChart,
  Upload,
} from 'lucide-vue-next'

// Mock data for different drawer scenarios
const mockDrawerData = {
  navigation: {
    trigger: 'Navigation',
    title: 'Menu',
    description: 'Navigate through the application',
    menuItems: [
      { icon: Home, label: 'Home', href: '/' },
      { icon: User, label: 'Profile', href: '/profile' },
      { icon: Settings, label: 'Settings', href: '/settings' },
      { icon: Calendar, label: 'Calendar', href: '/calendar' },
      { icon: FileText, label: 'Documents', href: '/documents' },
      { icon: Bell, label: 'Notifications', href: '/notifications' },
      { icon: HelpCircle, label: 'Help & Support', href: '/help' },
    ],
  },
  settings: {
    trigger: 'Settings',
    title: 'Application Settings',
    description: 'Configure your app preferences',
    sections: [
      {
        title: 'General',
        settings: [
          { label: 'Enable notifications', type: 'toggle', value: true },
          { label: 'Dark mode', type: 'toggle', value: false },
          { label: 'Auto-save', type: 'toggle', value: true },
          {
            label: 'Language',
            type: 'select',
            value: 'English (US)',
            options: ['English (US)', 'English (UK)', 'Spanish', 'French'],
          },
        ],
      },
      {
        title: 'Privacy',
        settings: [
          { label: 'Public profile', type: 'toggle', value: false },
          { label: 'Activity tracking', type: 'toggle', value: true },
          { label: 'Data sharing', type: 'toggle', value: false },
        ],
      },
    ],
  },
  filters: {
    trigger: 'Filters',
    title: 'Filter Options',
    description: 'Refine your search results',
    categories: [
      {
        title: 'Category',
        options: ['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports', 'Toys'],
      },
      {
        title: 'Price Range',
        options: ['Under $25', '$25 - $50', '$50 - $100', '$100 - $200', 'Over $200'],
      },
      {
        title: 'Brand',
        options: ['Apple', 'Samsung', 'Nike', 'Adidas', 'Sony', 'LG'],
      },
      {
        title: 'Rating',
        options: ['5 Stars', '4 Stars & Up', '3 Stars & Up', '2 Stars & Up', '1 Star & Up'],
      },
    ],
  },
  shoppingCart: {
    trigger: 'Cart (3)',
    title: 'Shopping Cart',
    description: 'Review your items before checkout',
    items: [
      {
        id: 1,
        name: 'Wireless Bluetooth Headphones',
        price: 89.99,
        quantity: 1,
        image: '/placeholder-product.jpg',
      },
      {
        id: 2,
        name: 'Smartphone Case',
        price: 24.99,
        quantity: 2,
        image: '/placeholder-product.jpg',
      },
      {
        id: 3,
        name: 'USB-C Cable',
        price: 12.99,
        quantity: 1,
        image: '/placeholder-product.jpg',
      },
    ],
    subtotal: 152.96,
    shipping: 9.99,
    tax: 14.67,
    total: 177.62,
  },
  notifications: {
    trigger: 'Notifications',
    title: 'Recent Activity',
    description: 'Stay updated with the latest notifications',
    notifications: [
      {
        id: 1,
        type: 'success',
        icon: CheckCircle,
        title: 'Order Confirmed',
        message: 'Your order #12345 has been confirmed and is being processed.',
        time: '2 minutes ago',
        unread: true,
      },
      {
        id: 2,
        type: 'info',
        icon: Info,
        title: 'System Update',
        message: 'A new version of the app is available. Update now for the latest features.',
        time: '1 hour ago',
        unread: true,
      },
      {
        id: 3,
        type: 'warning',
        icon: AlertTriangle,
        title: 'Payment Due',
        message: 'Your monthly subscription payment is due in 3 days.',
        time: '3 hours ago',
        unread: false,
      },
      {
        id: 4,
        type: 'info',
        icon: MessageSquare,
        title: 'New Message',
        message: 'You have received a new message from customer support.',
        time: '1 day ago',
        unread: false,
      },
    ],
  },
  search: {
    trigger: 'Search',
    title: 'Search',
    description: "Find what you're looking for",
    recentSearches: [
      'Vue.js components',
      'Storybook examples',
      'UI design patterns',
      'JavaScript tutorials',
    ],
    suggestions: ['React vs Vue', 'CSS Grid Layout', 'TypeScript basics', 'Mobile-first design'],
  },
  userProfile: {
    trigger: 'Profile',
    title: 'User Profile',
    description: 'Manage your account information',
    user: {
      name: 'John Doe',
      email: 'john.doe@example.com',
      avatar: '/placeholder-avatar.jpg',
      bio: 'Frontend developer passionate about creating beautiful user experiences.',
      location: 'San Francisco, CA',
      website: 'https://johndoe.dev',
      joinDate: 'Member since January 2023',
    },
    stats: [
      { label: 'Projects', value: '24' },
      { label: 'Followers', value: '1.2K' },
      { label: 'Following', value: '485' },
    ],
  },
  mediaLibrary: {
    trigger: 'Media Library',
    title: 'Media Files',
    description: 'Browse and manage your media',
    categories: [
      { name: 'Images', count: 128, icon: Image },
      { name: 'Videos', count: 24, icon: Video },
      { name: 'Audio', count: 45, icon: Music },
      { name: 'Documents', count: 67, icon: FileText },
    ],
    recentFiles: [
      { name: 'presentation.pdf', size: '2.4 MB', date: '2 hours ago', type: 'document' },
      { name: 'logo-design.png', size: '845 KB', date: '5 hours ago', type: 'image' },
      { name: 'intro-video.mp4', size: '15.2 MB', date: '1 day ago', type: 'video' },
      { name: 'background-music.mp3', size: '4.1 MB', date: '2 days ago', type: 'audio' },
    ],
  },
  quickActions: {
    trigger: 'Quick Actions',
    title: 'Quick Actions',
    description: 'Frequently used actions and shortcuts',
    actions: [
      { label: 'New Project', icon: Plus, color: 'bg-blue-500' },
      { label: 'Upload File', icon: Upload, color: 'bg-green-500' },
      { label: 'Share Link', icon: Share, color: 'bg-purple-500' },
      { label: 'Download Report', icon: Download, color: 'bg-orange-500' },
      { label: 'Send Message', icon: MessageSquare, color: 'bg-pink-500' },
      { label: 'Create Backup', icon: Shield, color: 'bg-red-500' },
    ],
  },
}

const meta = {
  title: 'UI Components/Drawer',
  component: Drawer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A drawer component that can slide in from any direction (top, bottom, left, right) to display content over the main interface.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    direction: {
      control: { type: 'select' },
      options: ['top', 'bottom', 'left', 'right'],
      description: 'Direction from which the drawer slides in',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'bottom' },
      },
    },
    open: {
      control: { type: 'boolean' },
      description: 'Whether the drawer is open',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    shouldScaleBackground: {
      control: { type: 'boolean' },
      description: 'Whether the background should scale when drawer is open',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
      },
    },
  },
} satisfies Meta<typeof Drawer>

export default meta
type Story = StoryObj<typeof meta>

// Default drawer - simple content from bottom
export const Default: Story = {
  render: (args) => ({
    components: {
      Drawer,
      DrawerContent,
      DrawerDescription,
      DrawerFooter,
      DrawerHeader,
      DrawerTitle,
      DrawerTrigger,
      DrawerClose,
      Button,
      Menu,
    },
    setup() {
      return { args }
    },
    template: `
      <Drawer v-bind="args">
        <DrawerTrigger as-child>
          <Button>
            <Menu class="h-4 w-4" />
            Open Drawer
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Welcome to Drawer</DrawerTitle>
            <DrawerDescription>
              This is a basic drawer example that slides up from the bottom.
            </DrawerDescription>
          </DrawerHeader>
          <div class="p-4 pb-0">
            <p class="text-sm text-muted-foreground">
              Drawers are perfect for displaying additional content, navigation menus, 
              settings panels, or any overlay content that doesn't require the full attention of a dialog.
            </p>
          </div>
          <DrawerFooter>
            <Button>Continue</Button>
            <DrawerClose as-child>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    `,
  }),
}

// Navigation drawer from left
export const NavigationDrawer: Story = {
  render: (args) => ({
    components: {
      Drawer,
      DrawerContent,
      DrawerDescription,
      DrawerHeader,
      DrawerTitle,
      DrawerTrigger,
      DrawerClose,
      Button,
      Menu,
      Home,
      User,
      Settings,
      Calendar,
      FileText,
      Bell,
      HelpCircle,
    },
    setup() {
      const navData = mockDrawerData.navigation
      return { args, navData }
    },
    template: `
      <Drawer v-bind="args" direction="left">
        <DrawerTrigger as-child>
          <Button variant="outline">
            <Menu class="h-4 w-4" />
            {{ navData.trigger }}
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{{ navData.title }}</DrawerTitle>
            <DrawerDescription>{{ navData.description }}</DrawerDescription>
          </DrawerHeader>
          <div class="p-4 space-y-2">
            <div
              v-for="item in navData.menuItems"
              :key="item.label"
              class="flex items-center gap-3 rounded-lg p-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
            >
              <component :is="item.icon" class="h-4 w-4" />
              {{ item.label }}
            </div>
          </div>
          <div class="mt-auto p-4 border-t">
            <div class="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <div class="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User class="h-4 w-4" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium truncate">John Doe</p>
                <p class="text-xs text-muted-foreground truncate">john@example.com</p>
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    `,
  }),
  args: {
    direction: 'left',
  },
}

// Settings drawer from right
export const SettingsDrawer: Story = {
  render: (args) => ({
    components: {
      Drawer,
      DrawerContent,
      DrawerDescription,
      DrawerFooter,
      DrawerHeader,
      DrawerTitle,
      DrawerTrigger,
      DrawerClose,
      Button,
      Settings,
    },
    setup() {
      const settingsData = mockDrawerData.settings
      return { args, settingsData }
    },
    template: `
      <Drawer v-bind="args" direction="right">
        <DrawerTrigger as-child>
          <Button variant="outline">
            <Settings class="h-4 w-4" />
            {{ settingsData.trigger }}
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{{ settingsData.title }}</DrawerTitle>
            <DrawerDescription>{{ settingsData.description }}</DrawerDescription>
          </DrawerHeader>
          <div class="flex-1 overflow-y-auto p-4 space-y-6">
            <div v-for="section in settingsData.sections" :key="section.title" class="space-y-4">
              <h3 class="text-sm font-medium">{{ section.title }}</h3>
              <div class="space-y-3">
                <div
                  v-for="setting in section.settings"
                  :key="setting.label"
                  class="flex items-center justify-between"
                >
                  <label class="text-sm">{{ setting.label }}</label>
                  <div v-if="setting.type === 'toggle'">
                    <input
                      type="checkbox"
                      :checked="setting.value"
                      class="rounded"
                    />
                  </div>
                  <div v-else-if="setting.type === 'select'">
                    <select class="text-sm rounded-md border border-input bg-background px-3 py-1">
                      <option
                        v-for="option in setting.options"
                        :key="option"
                        :selected="option === setting.value"
                      >
                        {{ option }}
                      </option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DrawerFooter>
            <Button>Save Changes</Button>
            <DrawerClose as-child>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    `,
  }),
  args: {
    direction: 'right',
  },
}

// Filters drawer from top
export const FiltersDrawer: Story = {
  render: (args) => ({
    components: {
      Drawer,
      DrawerContent,
      DrawerDescription,
      DrawerFooter,
      DrawerHeader,
      DrawerTitle,
      DrawerTrigger,
      DrawerClose,
      Button,
      Filter,
    },
    setup() {
      const filtersData = mockDrawerData.filters
      return { args, filtersData }
    },
    template: `
      <Drawer v-bind="args" direction="top">
        <DrawerTrigger as-child>
          <Button variant="outline">
            <Filter class="h-4 w-4" />
            {{ filtersData.trigger }}
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{{ filtersData.title }}</DrawerTitle>
            <DrawerDescription>{{ filtersData.description }}</DrawerDescription>
          </DrawerHeader>
          <div class="p-4 max-h-[300px] overflow-y-auto">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div v-for="category in filtersData.categories" :key="category.title" class="space-y-3">
                <h3 class="text-sm font-medium">{{ category.title }}</h3>
                <div class="space-y-2">
                  <label
                    v-for="option in category.options"
                    :key="option"
                    class="flex items-center gap-2 text-sm cursor-pointer hover:text-foreground"
                  >
                    <input type="checkbox" class="rounded text-sm" />
                    {{ option }}
                  </label>
                </div>
              </div>
            </div>
          </div>
          <DrawerFooter class="flex-row">
            <Button class="flex-1">Apply Filters</Button>
            <Button variant="outline" class="flex-1">Clear All</Button>
            <DrawerClose as-child>
              <Button variant="ghost" size="sm">
                <X class="h-4 w-4" />
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    `,
  }),
  args: {
    direction: 'top',
  },
}

// Shopping cart drawer
export const ShoppingCartDrawer: Story = {
  render: (args) => ({
    components: {
      Drawer,
      DrawerContent,
      DrawerDescription,
      DrawerFooter,
      DrawerHeader,
      DrawerTitle,
      DrawerTrigger,
      DrawerClose,
      Button,
      ShoppingCart,
      Plus,
      Trash2,
    },
    setup() {
      const cartData = mockDrawerData.shoppingCart
      return { args, cartData }
    },
    template: `
      <Drawer v-bind="args">
        <DrawerTrigger as-child>
          <Button>
            <ShoppingCart class="h-4 w-4" />
            {{ cartData.trigger }}
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{{ cartData.title }}</DrawerTitle>
            <DrawerDescription>{{ cartData.description }}</DrawerDescription>
          </DrawerHeader>
          <div class="flex-1 overflow-y-auto p-4">
            <div class="space-y-4">
              <div
                v-for="item in cartData.items"
                :key="item.id"
                class="flex items-center gap-4 p-3 border rounded-lg"
              >
                <div class="h-12 w-12 bg-muted rounded-md flex items-center justify-center">
                  <Package class="h-6 w-6 text-muted-foreground" />
                </div>
                <div class="flex-1 min-w-0">
                  <h4 class="text-sm font-medium truncate">{{ item.name }}</h4>
                  <p class="text-sm text-muted-foreground">\${{ item.price.toFixed(2) }}</p>
                </div>
                <div class="flex items-center gap-2">
                  <Button size="sm" variant="outline">-</Button>
                  <span class="text-sm w-8 text-center">{{ item.quantity }}</span>
                  <Button size="sm" variant="outline">+</Button>
                  <Button size="sm" variant="ghost">
                    <Trash2 class="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            <div class="mt-6 space-y-2 border-t pt-4">
              <div class="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>\${{ cartData.subtotal.toFixed(2) }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span>Shipping</span>
                <span>\${{ cartData.shipping.toFixed(2) }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span>Tax</span>
                <span>\${{ cartData.tax.toFixed(2) }}</span>
              </div>
              <div class="flex justify-between font-medium border-t pt-2">
                <span>Total</span>
                <span>\${{ cartData.total.toFixed(2) }}</span>
              </div>
            </div>
          </div>
          <DrawerFooter>
            <Button class="w-full">Proceed to Checkout</Button>
            <DrawerClose as-child>
              <Button variant="outline" class="w-full">Continue Shopping</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    `,
  }),
}

// Notifications drawer
export const NotificationsDrawer: Story = {
  render: (args) => ({
    components: {
      Drawer,
      DrawerContent,
      DrawerDescription,
      DrawerFooter,
      DrawerHeader,
      DrawerTitle,
      DrawerTrigger,
      DrawerClose,
      Button,
      Bell,
      CheckCircle,
      Info,
      AlertTriangle,
      MessageSquare,
    },
    setup() {
      const notificationData = mockDrawerData.notifications
      return { args, notificationData }
    },
    template: `
      <Drawer v-bind="args" direction="right">
        <DrawerTrigger as-child>
          <Button variant="outline" class="relative">
            <Bell class="h-4 w-4" />
            {{ notificationData.trigger }}
            <span class="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{{ notificationData.title }}</DrawerTitle>
            <DrawerDescription>{{ notificationData.description }}</DrawerDescription>
          </DrawerHeader>
          <div class="flex-1 overflow-y-auto">
            <div class="divide-y">
              <div
                v-for="notification in notificationData.notifications"
                :key="notification.id"
                class="p-4 hover:bg-accent/50 transition-colors"
                :class="{ 'bg-accent/20': notification.unread }"
              >
                <div class="flex gap-3">
                  <div
                    class="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center"
                    :class="{
                      'bg-green-100 text-green-600': notification.type === 'success',
                      'bg-blue-100 text-blue-600': notification.type === 'info',
                      'bg-yellow-100 text-yellow-600': notification.type === 'warning',
                    }"
                  >
                    <component :is="notification.icon" class="h-4 w-4" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <h4 class="text-sm font-medium truncate">{{ notification.title }}</h4>
                      <div v-if="notification.unread" class="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                    </div>
                    <p class="text-sm text-muted-foreground mt-1">{{ notification.message }}</p>
                    <p class="text-xs text-muted-foreground mt-2">{{ notification.time }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DrawerFooter>
            <Button variant="outline" class="w-full">Mark All as Read</Button>
            <DrawerClose as-child>
              <Button variant="ghost" class="w-full">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    `,
  }),
  args: {
    direction: 'right',
  },
}

// Search drawer
export const SearchDrawer: Story = {
  render: (args) => ({
    components: {
      Drawer,
      DrawerContent,
      DrawerDescription,
      DrawerHeader,
      DrawerTitle,
      DrawerTrigger,
      DrawerClose,
      Button,
      Input,
      Search,
      Clock,
      X,
    },
    setup() {
      const searchData = mockDrawerData.search
      return { args, searchData }
    },
    template: `
      <Drawer v-bind="args" direction="top">
        <DrawerTrigger as-child>
          <Button variant="outline">
            <Search class="h-4 w-4" />
            {{ searchData.trigger }}
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{{ searchData.title }}</DrawerTitle>
            <DrawerDescription>{{ searchData.description }}</DrawerDescription>
          </DrawerHeader>
          <div class="p-4 space-y-6">
            <div class="relative">
              <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for anything..."
                class="pl-10 pr-10"
              />
              <DrawerClose as-child>
                <Button
                  variant="ghost"
                  size="sm"
                  class="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                >
                  <X class="h-4 w-4" />
                </Button>
              </DrawerClose>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-3">
                <h3 class="text-sm font-medium flex items-center gap-2">
                  <Clock class="h-4 w-4" />
                  Recent Searches
                </h3>
                <div class="space-y-2">
                  <div
                    v-for="search in searchData.recentSearches"
                    :key="search"
                    class="flex items-center justify-between p-2 rounded-md hover:bg-accent cursor-pointer group"
                  >
                    <span class="text-sm">{{ search }}</span>
                    <Button variant="ghost" size="sm" class="opacity-0 group-hover:opacity-100 h-6 w-6 p-0">
                      <X class="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <div class="space-y-3">
                <h3 class="text-sm font-medium">Popular Searches</h3>
                <div class="space-y-2">
                  <div
                    v-for="suggestion in searchData.suggestions"
                    :key="suggestion"
                    class="p-2 rounded-md hover:bg-accent cursor-pointer"
                  >
                    <span class="text-sm">{{ suggestion }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    `,
  }),
  args: {
    direction: 'top',
  },
}

// User profile drawer
export const UserProfileDrawer: Story = {
  render: (args) => ({
    components: {
      Drawer,
      DrawerContent,
      DrawerDescription,
      DrawerFooter,
      DrawerHeader,
      DrawerTitle,
      DrawerTrigger,
      DrawerClose,
      Button,
      Input,
      User,
      MapPin,
      Globe,
      Calendar,
      Edit,
    },
    setup() {
      const profileData = mockDrawerData.userProfile
      return { args, profileData }
    },
    template: `
      <Drawer v-bind="args" direction="right">
        <DrawerTrigger as-child>
          <Button variant="outline">
            <User class="h-4 w-4" />
            {{ profileData.trigger }}
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{{ profileData.title }}</DrawerTitle>
            <DrawerDescription>{{ profileData.description }}</DrawerDescription>
          </DrawerHeader>
          <div class="flex-1 overflow-y-auto p-4 space-y-6">
            <!-- Profile Header -->
            <div class="text-center space-y-4">
              <div class="h-20 w-20 bg-muted rounded-full mx-auto flex items-center justify-center">
                <User class="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 class="text-lg font-medium">{{ profileData.user.name }}</h3>
                <p class="text-sm text-muted-foreground">{{ profileData.user.email }}</p>
              </div>
            </div>
            
            <!-- Stats -->
            <div class="grid grid-cols-3 gap-4 text-center">
              <div v-for="stat in profileData.stats" :key="stat.label" class="space-y-1">
                <div class="text-lg font-semibold">{{ stat.value }}</div>
                <div class="text-xs text-muted-foreground">{{ stat.label }}</div>
              </div>
            </div>
            
            <!-- Profile Details -->
            <div class="space-y-4">
              <div class="grid gap-3">
                <div class="grid gap-2">
                  <label class="text-sm font-medium">Full Name</label>
                  <Input :model-value="profileData.user.name" />
                </div>
                <div class="grid gap-2">
                  <label class="text-sm font-medium">Email</label>
                  <Input type="email" :model-value="profileData.user.email" />
                </div>
                <div class="grid gap-2">
                  <label class="text-sm font-medium">Bio</label>
                  <textarea
                    :value="profileData.user.bio"
                    class="min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Tell us about yourself"
                  />
                </div>
                <div class="grid gap-2">
                  <label class="text-sm font-medium">Location</label>
                  <div class="flex items-center gap-2">
                    <MapPin class="h-4 w-4 text-muted-foreground" />
                    <Input :model-value="profileData.user.location" />
                  </div>
                </div>
                <div class="grid gap-2">
                  <label class="text-sm font-medium">Website</label>
                  <div class="flex items-center gap-2">
                    <Globe class="h-4 w-4 text-muted-foreground" />
                    <Input :model-value="profileData.user.website" />
                  </div>
                </div>
              </div>
              
              <div class="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar class="h-4 w-4" />
                {{ profileData.user.joinDate }}
              </div>
            </div>
          </div>
          <DrawerFooter>
            <Button>
              <Edit class="h-4 w-4" />
              Save Changes
            </Button>
            <DrawerClose as-child>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    `,
  }),
  args: {
    direction: 'right',
  },
}

// Media library drawer
export const MediaLibraryDrawer: Story = {
  render: (args) => ({
    components: {
      Drawer,
      DrawerContent,
      DrawerDescription,
      DrawerFooter,
      DrawerHeader,
      DrawerTitle,
      DrawerTrigger,
      DrawerClose,
      Button,
      Image,
      Video,
      Music,
      FileText,
      Upload,
      Grid,
      List,
    },
    setup() {
      const mediaData = mockDrawerData.mediaLibrary
      return { args, mediaData }
    },
    template: `
      <Drawer v-bind="args" direction="left">
        <DrawerTrigger as-child>
          <Button variant="outline">
            <Image class="h-4 w-4" />
            {{ mediaData.trigger }}
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{{ mediaData.title }}</DrawerTitle>
            <DrawerDescription>{{ mediaData.description }}</DrawerDescription>
          </DrawerHeader>
          <div class="flex-1 overflow-y-auto p-4 space-y-6">
            <!-- Categories -->
            <div class="grid grid-cols-2 gap-3">
              <div
                v-for="category in mediaData.categories"
                :key="category.name"
                class="p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
              >
                <div class="flex items-center gap-3">
                  <div class="h-8 w-8 bg-primary/10 rounded-md flex items-center justify-center">
                    <component :is="category.icon" class="h-4 w-4" />
                  </div>
                  <div>
                    <h3 class="text-sm font-medium">{{ category.name }}</h3>
                    <p class="text-xs text-muted-foreground">{{ category.count }} files</p>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- View Options -->
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-medium">Recent Files</h3>
              <div class="flex items-center gap-1">
                <Button variant="ghost" size="sm">
                  <Grid class="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <List class="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <!-- Recent Files -->
            <div class="space-y-3">
              <div
                v-for="file in mediaData.recentFiles"
                :key="file.name"
                class="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
              >
                <div class="h-10 w-10 bg-muted rounded-md flex items-center justify-center flex-shrink-0">
                  <component
                    :is="file.type === 'document' ? FileText : file.type === 'image' ? Image : file.type === 'video' ? Video : Music"
                    class="h-4 w-4"
                  />
                </div>
                <div class="flex-1 min-w-0">
                  <h4 class="text-sm font-medium truncate">{{ file.name }}</h4>
                  <div class="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{{ file.size }}</span>
                    <span>•</span>
                    <span>{{ file.date }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DrawerFooter>
            <Button>
              <Upload class="h-4 w-4" />
              Upload Files
            </Button>
            <DrawerClose as-child>
              <Button variant="outline">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    `,
  }),
  args: {
    direction: 'left',
  },
}

// Quick actions drawer
export const QuickActionsDrawer: Story = {
  render: (args) => ({
    components: {
      Drawer,
      DrawerContent,
      DrawerDescription,
      DrawerHeader,
      DrawerTitle,
      DrawerTrigger,
      DrawerClose,
      Button,
      Grid,
      Plus,
      Upload,
      Share,
      Download,
      MessageSquare,
      Shield,
    },
    setup() {
      const actionsData = mockDrawerData.quickActions
      return { args, actionsData }
    },
    template: `
      <Drawer v-bind="args">
        <DrawerTrigger as-child>
          <Button>
            <Grid class="h-4 w-4" />
            {{ actionsData.trigger }}
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{{ actionsData.title }}</DrawerTitle>
            <DrawerDescription>{{ actionsData.description }}</DrawerDescription>
          </DrawerHeader>
          <div class="p-4">
            <div class="grid grid-cols-2 gap-4">
              <div
                v-for="action in actionsData.actions"
                :key="action.label"
                class="flex flex-col items-center gap-3 p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors group"
              >
                <div
                  class="h-12 w-12 rounded-lg flex items-center justify-center text-white transition-transform group-hover:scale-110"
                  :class="action.color"
                >
                  <component :is="action.icon" class="h-5 w-5" />
                </div>
                <span class="text-sm font-medium text-center">{{ action.label }}</span>
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    `,
  }),
}

// Multiple drawers showcase
export const MultipleDrawers: Story = {
  render: () => ({
    components: {
      Drawer,
      DrawerContent,
      DrawerDescription,
      DrawerFooter,
      DrawerHeader,
      DrawerTitle,
      DrawerTrigger,
      DrawerClose,
      Button,
      Menu,
      Settings,
      Filter,
      ShoppingCart,
      Search,
      Bell,
      User,
      Image,
      Upload,
    },
    template: `
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <!-- Left Navigation -->
        <Drawer direction="left">
          <DrawerTrigger as-child>
            <Button variant="outline" size="sm">
              <Menu class="h-4 w-4" />
              Navigation
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Menu</DrawerTitle>
              <DrawerDescription>Navigate through the app</DrawerDescription>
            </DrawerHeader>
            <div class="p-4 space-y-2">
              <div class="p-2 hover:bg-accent rounded cursor-pointer">Home</div>
              <div class="p-2 hover:bg-accent rounded cursor-pointer">Profile</div>
              <div class="p-2 hover:bg-accent rounded cursor-pointer">Settings</div>
            </div>
          </DrawerContent>
        </Drawer>

        <!-- Right Settings -->
        <Drawer direction="right">
          <DrawerTrigger as-child>
            <Button variant="outline" size="sm">
              <Settings class="h-4 w-4" />
              Settings
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Settings</DrawerTitle>
              <DrawerDescription>Configure your preferences</DrawerDescription>
            </DrawerHeader>
            <div class="p-4 space-y-4">
              <div class="flex items-center justify-between">
                <span class="text-sm">Notifications</span>
                <input type="checkbox" checked />
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm">Dark Mode</span>
                <input type="checkbox" />
              </div>
            </div>
          </DrawerContent>
        </Drawer>

        <!-- Top Filters -->
        <Drawer direction="top">
          <DrawerTrigger as-child>
            <Button variant="outline" size="sm">
              <Filter class="h-4 w-4" />
              Filters
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Filters</DrawerTitle>
              <DrawerDescription>Refine your search</DrawerDescription>
            </DrawerHeader>
            <div class="p-4 grid grid-cols-3 gap-4">
              <div>Category</div>
              <div>Price</div>
              <div>Rating</div>
            </div>
          </DrawerContent>
        </Drawer>

        <!-- Bottom Cart -->
        <Drawer direction="bottom">
          <DrawerTrigger as-child>
            <Button variant="outline" size="sm">
              <ShoppingCart class="h-4 w-4" />
              Cart (2)
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Shopping Cart</DrawerTitle>
              <DrawerDescription>Review your items</DrawerDescription>
            </DrawerHeader>
            <div class="p-4 space-y-3">
              <div class="flex justify-between">
                <span>Product 1</span>
                <span>$29.99</span>
              </div>
              <div class="flex justify-between">
                <span>Product 2</span>
                <span>$49.99</span>
              </div>
            </div>
            <DrawerFooter>
              <Button>Checkout</Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>

        <!-- Search -->
        <Drawer direction="top">
          <DrawerTrigger as-child>
            <Button variant="outline" size="sm">
              <Search class="h-4 w-4" />
              Search
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Search</DrawerTitle>
            </DrawerHeader>
            <div class="p-4">
              <input
                placeholder="Search..."
                class="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </DrawerContent>
        </Drawer>

        <!-- Notifications -->
        <Drawer direction="right">
          <DrawerTrigger as-child>
            <Button variant="outline" size="sm" class="relative">
              <Bell class="h-4 w-4" />
              Alerts
              <span class="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Notifications</DrawerTitle>
            </DrawerHeader>
            <div class="p-4 space-y-3">
              <div class="p-3 bg-blue-50 rounded">New message</div>
              <div class="p-3 bg-green-50 rounded">Order completed</div>
            </div>
          </DrawerContent>
        </Drawer>

        <!-- Profile -->
        <Drawer direction="right">
          <DrawerTrigger as-child>
            <Button variant="outline" size="sm">
              <User class="h-4 w-4" />
              Profile
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Profile</DrawerTitle>
            </DrawerHeader>
            <div class="p-4 space-y-4">
              <input placeholder="Name" class="w-full px-3 py-2 border rounded" />
              <input placeholder="Email" class="w-full px-3 py-2 border rounded" />
            </div>
            <DrawerFooter>
              <Button>Save</Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>

        <!-- Media -->
        <Drawer direction="left">
          <DrawerTrigger as-child>
            <Button variant="outline" size="sm">
              <Image class="h-4 w-4" />
              Media
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Media Library</DrawerTitle>
            </DrawerHeader>
            <div class="p-4 space-y-4">
              <div class="grid grid-cols-2 gap-3">
                <div class="aspect-square bg-muted rounded"></div>
                <div class="aspect-square bg-muted rounded"></div>
                <div class="aspect-square bg-muted rounded"></div>
                <div class="aspect-square bg-muted rounded"></div>
              </div>
              <Button size="sm" class="w-full">
                <Upload class="h-4 w-4" />
                Upload Files
              </Button>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    `,
  }),
}
