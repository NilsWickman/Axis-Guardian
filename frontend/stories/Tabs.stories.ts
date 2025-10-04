import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import {
  Settings,
  User,
  Bell,
  Shield,
  CreditCard,
  Palette,
  Globe,
  Home,
  Eye,
  Edit,
  Code,
  FileText,
  Star,
  Heart,
  Zap,
} from 'lucide-vue-next'

const meta = {
  title: 'UI Components/Tabs',
  component: Tabs,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A set of layered sections of content—known as tab panels—that are displayed one at a time. Users can switch between tabs to view different content sections.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    defaultValue: {
      control: { type: 'text' },
      description: 'The value of the tab that should be active by default',
    },
    orientation: {
      control: { type: 'select' },
      options: ['horizontal', 'vertical'],
      description: 'The orientation of the tabs',
    },
    class: {
      control: { type: 'text' },
      description: 'Additional CSS classes',
    },
  },
  args: {
    defaultValue: 'tab1',
    orientation: 'horizontal',
  },
} satisfies Meta<typeof Tabs>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => ({
    components: { Tabs, TabsList, TabsTrigger, TabsContent },
    setup() {
      return { args }
    },
    template: `
      <Tabs v-bind="args" class="w-full max-w-md">
        <TabsList class="grid w-full grid-cols-2">
          <TabsTrigger value="tab1">Account</TabsTrigger>
          <TabsTrigger value="tab2">Password</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1" class="mt-4 space-y-4">
          <div class="space-y-2">
            <h3 class="text-lg font-semibold">Account Settings</h3>
            <p class="text-sm text-muted-foreground">
              Manage your account settings and preferences here.
            </p>
          </div>
          <div class="space-y-4">
            <div class="space-y-2">
              <label class="text-sm font-medium">Name</label>
              <input class="w-full px-3 py-2 border rounded-md" value="John Doe" />
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium">Email</label>
              <input class="w-full px-3 py-2 border rounded-md" value="john@example.com" />
            </div>
          </div>
        </TabsContent>
        <TabsContent value="tab2" class="mt-4 space-y-4">
          <div class="space-y-2">
            <h3 class="text-lg font-semibold">Password Settings</h3>
            <p class="text-sm text-muted-foreground">
              Change your password here. After saving, you'll be logged out.
            </p>
          </div>
          <div class="space-y-4">
            <div class="space-y-2">
              <label class="text-sm font-medium">Current password</label>
              <input type="password" class="w-full px-3 py-2 border rounded-md" />
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium">New password</label>
              <input type="password" class="w-full px-3 py-2 border rounded-md" />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    `,
  }),
}

export const WithIcons: Story = {
  render: () => ({
    components: { Tabs, TabsList, TabsTrigger, TabsContent, User, Settings, Bell },
    template: `
      <Tabs default-value="profile" class="w-full max-w-lg">
        <TabsList class="grid w-full grid-cols-3">
          <TabsTrigger value="profile">
            <User class="mr-2 h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings class="mr-2 h-4 w-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell class="mr-2 h-4 w-4" />
            Notifications
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" class="mt-6 space-y-4">
          <div class="flex items-center space-x-4">
            <div class="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <User class="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 class="text-lg font-semibold">John Doe</h3>
              <p class="text-sm text-muted-foreground">Senior Developer</p>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4 pt-4">
            <div class="space-y-2">
              <label class="text-sm font-medium">First Name</label>
              <input class="w-full px-3 py-2 border rounded-md" value="John" />
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium">Last Name</label>
              <input class="w-full px-3 py-2 border rounded-md" value="Doe" />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="settings" class="mt-6 space-y-6">
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <h4 class="font-medium">Dark Mode</h4>
                <p class="text-sm text-muted-foreground">Toggle dark mode theme</p>
              </div>
              <button class="bg-primary text-primary-foreground px-3 py-1 rounded-md text-sm">On</button>
            </div>
            <div class="flex items-center justify-between">
              <div>
                <h4 class="font-medium">Language</h4>
                <p class="text-sm text-muted-foreground">Select your preferred language</p>
              </div>
              <select class="px-3 py-1 border rounded-md text-sm">
                <option>English</option>
                <option>Spanish</option>
                <option>French</option>
              </select>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="notifications" class="mt-6 space-y-4">
          <div class="space-y-6">
            <div class="flex items-center justify-between">
              <div>
                <h4 class="font-medium">Email Notifications</h4>
                <p class="text-sm text-muted-foreground">Receive email updates</p>
              </div>
              <button class="bg-primary text-primary-foreground px-3 py-1 rounded-md text-sm">Enabled</button>
            </div>
            <div class="flex items-center justify-between">
              <div>
                <h4 class="font-medium">Push Notifications</h4>
                <p class="text-sm text-muted-foreground">Browser notifications</p>
              </div>
              <button class="bg-muted text-muted-foreground px-3 py-1 rounded-md text-sm">Disabled</button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    `,
  }),
}

export const VerticalTabs: Story = {
  render: () => ({
    components: {
      Tabs,
      TabsList,
      TabsTrigger,
      TabsContent,
      Home,
      User,
      Settings,
      Bell,
      Shield,
      CreditCard,
      Palette,
      Globe,
    },
    template: `
      <Tabs default-value="dashboard" orientation="vertical" class="flex w-full max-w-4xl">
        <TabsList class="flex flex-col h-fit w-48 space-y-1">
          <TabsTrigger value="dashboard" class="w-full justify-start">
            <Home class="mr-2 h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="profile" class="w-full justify-start">
            <User class="mr-2 h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="settings" class="w-full justify-start">
            <Settings class="mr-2 h-4 w-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="notifications" class="w-full justify-start">
            <Bell class="mr-2 h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" class="w-full justify-start">
            <Shield class="mr-2 h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="billing" class="w-full justify-start">
            <CreditCard class="mr-2 h-4 w-4" />
            Billing
          </TabsTrigger>
          <TabsTrigger value="appearance" class="w-full justify-start">
            <Palette class="mr-2 h-4 w-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="advanced" class="w-full justify-start">
            <Globe class="mr-2 h-4 w-4" />
            Advanced
          </TabsTrigger>
        </TabsList>
        
        <div class="flex-1 ml-6">
          <TabsContent value="dashboard" class="mt-0 space-y-4">
            <div class="space-y-2">
              <h3 class="text-2xl font-bold">Dashboard</h3>
              <p class="text-muted-foreground">Welcome to your dashboard overview</p>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="p-4 border rounded-lg">
                <h4 class="font-semibold">Active Projects</h4>
                <p class="text-2xl font-bold">12</p>
              </div>
              <div class="p-4 border rounded-lg">
                <h4 class="font-semibold">Team Members</h4>
                <p class="text-2xl font-bold">8</p>
              </div>
              <div class="p-4 border rounded-lg">
                <h4 class="font-semibold">Tasks Completed</h4>
                <p class="text-2xl font-bold">146</p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="profile" class="mt-0 space-y-6">
            <div class="space-y-2">
              <h3 class="text-2xl font-bold">Profile Settings</h3>
              <p class="text-muted-foreground">Manage your personal information</p>
            </div>
            <div class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-2">
                  <label class="text-sm font-medium">First Name</label>
                  <input class="w-full px-3 py-2 border rounded-md" value="John" />
                </div>
                <div class="space-y-2">
                  <label class="text-sm font-medium">Last Name</label>
                  <input class="w-full px-3 py-2 border rounded-md" value="Doe" />
                </div>
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium">Email</label>
                <input type="email" class="w-full px-3 py-2 border rounded-md" value="john.doe@example.com" />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="settings" class="mt-0 space-y-6">
            <div class="space-y-2">
              <h3 class="text-2xl font-bold">General Settings</h3>
              <p class="text-muted-foreground">Configure your application preferences</p>
            </div>
            <div class="space-y-6">
              <div class="flex items-center justify-between">
                <div>
                  <h4 class="font-medium">Email Notifications</h4>
                  <p class="text-sm text-muted-foreground">Receive email updates</p>
                </div>
                <button class="bg-primary text-primary-foreground px-3 py-1 rounded-md text-sm">Enabled</button>
              </div>
              <div class="flex items-center justify-between">
                <div>
                  <h4 class="font-medium">Auto-save</h4>
                  <p class="text-sm text-muted-foreground">Automatically save changes</p>
                </div>
                <button class="bg-primary text-primary-foreground px-3 py-1 rounded-md text-sm">On</button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="notifications" class="mt-0 space-y-6">
            <div class="space-y-2">
              <h3 class="text-2xl font-bold">Notification Preferences</h3>
              <p class="text-muted-foreground">Choose how you want to be notified</p>
            </div>
            <div class="space-y-4">
              <div class="p-4 border rounded-lg">
                <h4 class="font-medium mb-2">Push Notifications</h4>
                <div class="space-y-3">
                  <label class="flex items-center space-x-2">
                    <input type="checkbox" checked class="rounded" />
                    <span class="text-sm">New messages</span>
                  </label>
                  <label class="flex items-center space-x-2">
                    <input type="checkbox" checked class="rounded" />
                    <span class="text-sm">Task updates</span>
                  </label>
                  <label class="flex items-center space-x-2">
                    <input type="checkbox" class="rounded" />
                    <span class="text-sm">Marketing emails</span>
                  </label>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="security" class="mt-0 space-y-6">
            <div class="space-y-2">
              <h3 class="text-2xl font-bold">Security Settings</h3>
              <p class="text-muted-foreground">Protect your account</p>
            </div>
            <div class="space-y-4">
              <Button class="w-full">Change Password</Button>
              <Button variant="outline" class="w-full">Enable Two-Factor Authentication</Button>
              <Button variant="outline" class="w-full">View Login History</Button>
            </div>
          </TabsContent>
          
          <TabsContent value="billing" class="mt-0 space-y-6">
            <div class="space-y-2">
              <h3 class="text-2xl font-bold">Billing Information</h3>
              <p class="text-muted-foreground">Manage your subscription and payment</p>
            </div>
            <div class="p-4 border rounded-lg">
              <h4 class="font-medium mb-2">Current Plan: Professional</h4>
              <p class="text-sm text-muted-foreground">$29/month • Next billing: April 15, 2024</p>
            </div>
          </TabsContent>
          
          <TabsContent value="appearance" class="mt-0 space-y-6">
            <div class="space-y-2">
              <h3 class="text-2xl font-bold">Appearance</h3>
              <p class="text-muted-foreground">Customize your interface</p>
            </div>
            <div class="space-y-4">
              <div>
                <h4 class="font-medium mb-2">Theme</h4>
                <div class="flex space-x-2">
                  <button class="px-4 py-2 bg-primary text-primary-foreground rounded-md">Light</button>
                  <button class="px-4 py-2 border rounded-md">Dark</button>
                  <button class="px-4 py-2 border rounded-md">System</button>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="advanced" class="mt-0 space-y-6">
            <div class="space-y-2">
              <h3 class="text-2xl font-bold">Advanced Settings</h3>
              <p class="text-muted-foreground">Advanced configuration options</p>
            </div>
            <div class="space-y-4">
              <div class="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                <h4 class="font-medium text-yellow-800">⚠️ Warning</h4>
                <p class="text-sm text-yellow-700">These settings can affect your application performance.</p>
              </div>
              <Button variant="destructive">Reset All Settings</Button>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    `,
  }),
}

export const ManyTabs: Story = {
  render: () => ({
    components: { Tabs, TabsList, TabsTrigger, TabsContent, FileText },
    setup() {
      const files = [
        { id: 'index', name: 'index.vue', type: 'vue' },
        { id: 'components', name: 'components.ts', type: 'ts' },
        { id: 'styles', name: 'styles.css', type: 'css' },
        { id: 'config', name: 'config.json', type: 'json' },
        { id: 'readme', name: 'README.md', type: 'md' },
        { id: 'package', name: 'package.json', type: 'json' },
        { id: 'tsconfig', name: 'tsconfig.json', type: 'json' },
        { id: 'vite', name: 'vite.config.ts', type: 'ts' },
      ]
      return { files }
    },
    template: `
      <Tabs default-value="index" class="w-full">
        <TabsList class="w-full justify-start overflow-x-auto">
          <TabsTrigger 
            v-for="file in files" 
            :key="file.id" 
            :value="file.id"
            class="flex-shrink-0 text-xs"
          >
            <FileText class="mr-1 h-3 w-3" />
            {{ file.name }}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent 
          v-for="file in files" 
          :key="file.id" 
          :value="file.id" 
          class="mt-4"
        >
          <div class="p-4 border rounded-lg">
            <div class="flex items-center space-x-2 mb-4">
              <FileText class="h-4 w-4 text-muted-foreground" />
              <span class="font-medium">{{ file.name }}</span>
              <span class="px-2 py-1 bg-muted text-muted-foreground text-xs rounded">{{ file.type.toUpperCase() }}</span>
            </div>
            <div class="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm">
              <pre><code>// {{ file.name }}
// File content would go here...

export default {
  // Component or configuration
}</code></pre>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    `,
  }),
}

export const CustomStyling: Story = {
  render: () => ({
    components: { Tabs, TabsList, TabsTrigger, TabsContent, Star, Heart, Zap },
    template: `
      <div class="space-y-8">
        <!-- Rounded Pills Style -->
        <Tabs default-value="option1" class="w-full max-w-lg">
          <TabsList class="bg-slate-100 p-1 rounded-full">
            <TabsTrigger value="option1" class="rounded-full px-6">
              <Star class="mr-2 h-4 w-4" />
              Premium
            </TabsTrigger>
            <TabsTrigger value="option2" class="rounded-full px-6">
              <Heart class="mr-2 h-4 w-4" />
              Favorites
            </TabsTrigger>
            <TabsTrigger value="option3" class="rounded-full px-6">
              <Zap class="mr-2 h-4 w-4" />
              Popular
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="option1" class="mt-6">
            <div class="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl">
              <h3 class="text-lg font-semibold text-yellow-800 mb-2">Premium Features</h3>
              <p class="text-yellow-700">Access to all premium features and priority support.</p>
            </div>
          </TabsContent>
          
          <TabsContent value="option2" class="mt-6">
            <div class="p-6 bg-gradient-to-r from-pink-50 to-red-50 border border-pink-200 rounded-xl">
              <h3 class="text-lg font-semibold text-pink-800 mb-2">Your Favorites</h3>
              <p class="text-pink-700">Items you've marked as favorites appear here.</p>
            </div>
          </TabsContent>
          
          <TabsContent value="option3" class="mt-6">
            <div class="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl">
              <h3 class="text-lg font-semibold text-blue-800 mb-2">Popular Content</h3>
              <p class="text-blue-700">The most popular and trending content.</p>
            </div>
          </TabsContent>
        </Tabs>

        <!-- Minimal Style -->
        <Tabs default-value="tab1" class="w-full max-w-lg">
          <TabsList class="bg-transparent border-b w-full h-auto p-0 rounded-none">
            <TabsTrigger 
              value="tab1" 
              class="border-b-2 border-transparent data-[state=active]:border-primary bg-transparent rounded-none px-4 py-2 h-auto"
            >
              Design
            </TabsTrigger>
            <TabsTrigger 
              value="tab2" 
              class="border-b-2 border-transparent data-[state=active]:border-primary bg-transparent rounded-none px-4 py-2 h-auto"
            >
              Development
            </TabsTrigger>
            <TabsTrigger 
              value="tab3" 
              class="border-b-2 border-transparent data-[state=active]:border-primary bg-transparent rounded-none px-4 py-2 h-auto"
            >
              Marketing
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="tab1" class="mt-4">
            <p class="text-muted-foreground">Design-focused content and tools.</p>
          </TabsContent>
          
          <TabsContent value="tab2" class="mt-4">
            <p class="text-muted-foreground">Development resources and documentation.</p>
          </TabsContent>
          
          <TabsContent value="tab3" class="mt-4">
            <p class="text-muted-foreground">Marketing strategies and analytics.</p>
          </TabsContent>
        </Tabs>
      </div>
    `,
  }),
}
