import type { Meta, StoryObj } from '@storybook/vue3-vite'
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  Home,
  FolderOpen,
  File,
  Settings,
  Users,
  ShoppingBag,
  MoreHorizontal,
  ChevronRight,
  Slash,
} from 'lucide-vue-next'

// Mock data for different breadcrumb scenarios
const mockBreadcrumbs = {
  simple: {
    items: [
      { text: 'Home', href: '/' },
      { text: 'Library', href: '/library' },
      { text: 'Data', isCurrentPage: true },
    ],
  },
  ecommerce: {
    items: [
      { text: 'Home', href: '/', icon: Home },
      { text: 'Electronics', href: '/electronics' },
      { text: 'Computers', href: '/electronics/computers' },
      { text: 'Laptops', href: '/electronics/computers/laptops' },
      { text: 'Gaming Laptop Pro', isCurrentPage: true },
    ],
  },
  fileSystem: {
    items: [
      { text: 'Root', href: '/', icon: Home },
      { text: 'Documents', href: '/documents', icon: FolderOpen },
      { text: 'Projects', href: '/documents/projects', icon: FolderOpen },
      { text: 'Vue App', href: '/documents/projects/vue-app', icon: FolderOpen },
      { text: 'package.json', isCurrentPage: true, icon: File },
    ],
  },
  dashboard: {
    items: [
      { text: 'Dashboard', href: '/dashboard' },
      { text: 'Settings', href: '/dashboard/settings', icon: Settings },
      { text: 'User Management', href: '/dashboard/settings/users', icon: Users },
      { text: 'Add User', isCurrentPage: true },
    ],
  },
  deepNavigation: {
    items: [
      { text: 'Home', href: '/' },
      { text: 'Category 1', href: '/category1' },
      { text: 'Subcategory A', href: '/category1/subcategory-a' },
      { text: 'Sub-subcategory', href: '/category1/subcategory-a/sub-subcategory' },
      { text: 'Item Collection', href: '/category1/subcategory-a/sub-subcategory/items' },
      { text: 'Specific Item', href: '/category1/subcategory-a/sub-subcategory/items/specific' },
      { text: 'Item Details', isCurrentPage: true },
    ],
  },
  withCollapse: {
    items: [
      { text: 'Home', href: '/' },
      { text: 'Level 1', href: '/level1' },
      { text: 'Level 2', href: '/level1/level2' },
      { text: 'Level 3', href: '/level1/level2/level3' },
      { text: 'Current Page', isCurrentPage: true },
    ],
  },
}

const meta = {
  title: 'UI Components/Breadcrumb',
  component: Breadcrumb,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Displays the path to the current resource using a hierarchy of links. Breadcrumbs help users understand their location within a site or application and navigate back to parent pages.',
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
} satisfies Meta<typeof Breadcrumb>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => ({
    components: {
      Breadcrumb,
      BreadcrumbList,
      BreadcrumbItem,
      BreadcrumbLink,
      BreadcrumbSeparator,
      BreadcrumbPage,
    },
    setup() {
      const breadcrumbData = mockBreadcrumbs.simple
      return { args, breadcrumbData }
    },
    template: `
      <Breadcrumb v-bind="args">
        <BreadcrumbList>
          <template v-for="(item, index) in breadcrumbData.items" :key="index">
            <BreadcrumbItem v-if="!item.isCurrentPage">
              <BreadcrumbLink :href="item.href">
                {{ item.text }}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem v-else>
              <BreadcrumbPage>{{ item.text }}</BreadcrumbPage>
            </BreadcrumbItem>
            <BreadcrumbSeparator v-if="index < breadcrumbData.items.length - 1" />
          </template>
        </BreadcrumbList>
      </Breadcrumb>
    `,
  }),
}

export const WithIcons: Story = {
  render: (args) => ({
    components: {
      Breadcrumb,
      BreadcrumbList,
      BreadcrumbItem,
      BreadcrumbLink,
      BreadcrumbSeparator,
      BreadcrumbPage,
      Home,
      FolderOpen,
      File,
    },
    setup() {
      const breadcrumbData = mockBreadcrumbs.fileSystem
      return { args, breadcrumbData }
    },
    template: `
      <Breadcrumb v-bind="args">
        <BreadcrumbList>
          <template v-for="(item, index) in breadcrumbData.items" :key="index">
            <BreadcrumbItem v-if="!item.isCurrentPage">
              <BreadcrumbLink :href="item.href" class="flex items-center gap-2">
                <component v-if="item.icon" :is="item.icon" class="h-4 w-4" />
                {{ item.text }}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem v-else>
              <BreadcrumbPage class="flex items-center gap-2">
                <component v-if="item.icon" :is="item.icon" class="h-4 w-4" />
                {{ item.text }}
              </BreadcrumbPage>
            </BreadcrumbItem>
            <BreadcrumbSeparator v-if="index < breadcrumbData.items.length - 1" />
          </template>
        </BreadcrumbList>
      </Breadcrumb>
    `,
  }),
}

export const EcommercePath: Story = {
  render: (args) => ({
    components: {
      Breadcrumb,
      BreadcrumbList,
      BreadcrumbItem,
      BreadcrumbLink,
      BreadcrumbSeparator,
      BreadcrumbPage,
      Home,
    },
    setup() {
      const breadcrumbData = mockBreadcrumbs.ecommerce
      return { args, breadcrumbData }
    },
    template: `
      <Breadcrumb v-bind="args">
        <BreadcrumbList>
          <template v-for="(item, index) in breadcrumbData.items" :key="index">
            <BreadcrumbItem v-if="!item.isCurrentPage">
              <BreadcrumbLink :href="item.href" class="flex items-center gap-2">
                <component v-if="item.icon" :is="item.icon" class="h-4 w-4" />
                {{ item.text }}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem v-else>
              <BreadcrumbPage class="flex items-center gap-2">
                <component v-if="item.icon" :is="item.icon" class="h-4 w-4" />
                {{ item.text }}
              </BreadcrumbPage>
            </BreadcrumbItem>
            <BreadcrumbSeparator v-if="index < breadcrumbData.items.length - 1" />
          </template>
        </BreadcrumbList>
      </Breadcrumb>
    `,
  }),
}

export const DashboardNavigation: Story = {
  render: (args) => ({
    components: {
      Breadcrumb,
      BreadcrumbList,
      BreadcrumbItem,
      BreadcrumbLink,
      BreadcrumbSeparator,
      BreadcrumbPage,
      Settings,
      Users,
    },
    setup() {
      const breadcrumbData = mockBreadcrumbs.dashboard
      return { args, breadcrumbData }
    },
    template: `
      <Breadcrumb v-bind="args">
        <BreadcrumbList>
          <template v-for="(item, index) in breadcrumbData.items" :key="index">
            <BreadcrumbItem v-if="!item.isCurrentPage">
              <BreadcrumbLink :href="item.href" class="flex items-center gap-2">
                <component v-if="item.icon" :is="item.icon" class="h-4 w-4" />
                {{ item.text }}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem v-else>
              <BreadcrumbPage class="flex items-center gap-2">
                <component v-if="item.icon" :is="item.icon" class="h-4 w-4" />
                {{ item.text }}
              </BreadcrumbPage>
            </BreadcrumbItem>
            <BreadcrumbSeparator v-if="index < breadcrumbData.items.length - 1" />
          </template>
        </BreadcrumbList>
      </Breadcrumb>
    `,
  }),
}

export const WithEllipsis: Story = {
  render: (args) => ({
    components: {
      Breadcrumb,
      BreadcrumbList,
      BreadcrumbItem,
      BreadcrumbLink,
      BreadcrumbSeparator,
      BreadcrumbPage,
      BreadcrumbEllipsis,
    },
    setup() {
      const breadcrumbData = mockBreadcrumbs.deepNavigation
      return { args, breadcrumbData }
    },
    template: `
      <Breadcrumb v-bind="args">
        <BreadcrumbList>
          <!-- First item -->
          <BreadcrumbItem>
            <BreadcrumbLink :href="breadcrumbData.items[0].href">
              {{ breadcrumbData.items[0].text }}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          
          <!-- Ellipsis for collapsed middle items -->
          <BreadcrumbItem>
            <BreadcrumbEllipsis />
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          
          <!-- Second to last item -->
          <BreadcrumbItem>
            <BreadcrumbLink :href="breadcrumbData.items[breadcrumbData.items.length - 2].href">
              {{ breadcrumbData.items[breadcrumbData.items.length - 2].text }}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          
          <!-- Current page -->
          <BreadcrumbItem>
            <BreadcrumbPage>
              {{ breadcrumbData.items[breadcrumbData.items.length - 1].text }}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    `,
  }),
}

export const CustomSeparator: Story = {
  render: (args) => ({
    components: {
      Breadcrumb,
      BreadcrumbList,
      BreadcrumbItem,
      BreadcrumbLink,
      BreadcrumbSeparator,
      BreadcrumbPage,
      Slash,
    },
    setup() {
      const breadcrumbData = mockBreadcrumbs.simple
      return { args, breadcrumbData }
    },
    template: `
      <Breadcrumb v-bind="args">
        <BreadcrumbList>
          <template v-for="(item, index) in breadcrumbData.items" :key="index">
            <BreadcrumbItem v-if="!item.isCurrentPage">
              <BreadcrumbLink :href="item.href">
                {{ item.text }}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem v-else>
              <BreadcrumbPage>{{ item.text }}</BreadcrumbPage>
            </BreadcrumbItem>
            <BreadcrumbSeparator v-if="index < breadcrumbData.items.length - 1">
              <Slash class="h-4 w-4" />
            </BreadcrumbSeparator>
          </template>
        </BreadcrumbList>
      </Breadcrumb>
    `,
  }),
}

export const SingleLevel: Story = {
  render: (args) => ({
    components: {
      Breadcrumb,
      BreadcrumbList,
      BreadcrumbItem,
      BreadcrumbPage,
    },
    setup() {
      return { args }
    },
    template: `
      <Breadcrumb v-bind="args">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Dashboard</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    `,
  }),
}

export const TwoLevel: Story = {
  render: (args) => ({
    components: {
      Breadcrumb,
      BreadcrumbList,
      BreadcrumbItem,
      BreadcrumbLink,
      BreadcrumbSeparator,
      BreadcrumbPage,
    },
    setup() {
      return { args }
    },
    template: `
      <Breadcrumb v-bind="args">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Settings</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    `,
  }),
}

export const ComplexWithDropdown: Story = {
  render: (args) => ({
    components: {
      Breadcrumb,
      BreadcrumbList,
      BreadcrumbItem,
      BreadcrumbLink,
      BreadcrumbSeparator,
      BreadcrumbPage,
      BreadcrumbEllipsis,
      Home,
    },
    setup() {
      const breadcrumbData = mockBreadcrumbs.deepNavigation
      const collapsedItems = breadcrumbData.items.slice(1, -2)
      return { args, breadcrumbData, collapsedItems }
    },
    template: `
      <Breadcrumb v-bind="args">
        <BreadcrumbList>
          <!-- Home -->
          <BreadcrumbItem>
            <BreadcrumbLink :href="breadcrumbData.items[0].href" class="flex items-center gap-2">
              <Home class="h-4 w-4" />
              {{ breadcrumbData.items[0].text }}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          
          <!-- Collapsed items with ellipsis (could be expanded to dropdown) -->
          <BreadcrumbItem>
            <BreadcrumbEllipsis class="cursor-pointer hover:bg-muted rounded-sm p-1" />
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          
          <!-- Second to last -->
          <BreadcrumbItem>
            <BreadcrumbLink :href="breadcrumbData.items[breadcrumbData.items.length - 2].href">
              {{ breadcrumbData.items[breadcrumbData.items.length - 2].text }}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          
          <!-- Current page -->
          <BreadcrumbItem>
            <BreadcrumbPage>
              {{ breadcrumbData.items[breadcrumbData.items.length - 1].text }}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    `,
  }),
}

export const AllVariations: Story = {
  render: (args) => ({
    components: {
      Breadcrumb,
      BreadcrumbList,
      BreadcrumbItem,
      BreadcrumbLink,
      BreadcrumbSeparator,
      BreadcrumbPage,
      BreadcrumbEllipsis,
      Home,
      FolderOpen,
      File,
      Settings,
      Users,
      Slash,
      ChevronRight,
    },
    setup() {
      const examples = [
        {
          title: 'Simple Path',
          items: mockBreadcrumbs.simple.items,
        },
        {
          title: 'With Icons',
          items: mockBreadcrumbs.fileSystem.items,
        },
        {
          title: 'Dashboard Navigation',
          items: mockBreadcrumbs.dashboard.items,
        },
        {
          title: 'Single Level',
          items: [{ text: 'Current Page', isCurrentPage: true }],
        },
      ]
      return { args, examples }
    },
    template: `
      <div class="space-y-8">
        <div v-for="(example, exampleIndex) in examples" :key="exampleIndex" class="space-y-2">
          <h3 class="text-sm font-medium text-muted-foreground">{{ example.title }}</h3>
          <Breadcrumb v-bind="args">
            <BreadcrumbList>
              <template v-for="(item, index) in example.items" :key="index">
                <BreadcrumbItem v-if="!item.isCurrentPage">
                  <BreadcrumbLink :href="item.href || '#'" class="flex items-center gap-2">
                    <component v-if="item.icon" :is="item.icon" class="h-4 w-4" />
                    {{ item.text }}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbItem v-else>
                  <BreadcrumbPage class="flex items-center gap-2">
                    <component v-if="item.icon" :is="item.icon" class="h-4 w-4" />
                    {{ item.text }}
                  </BreadcrumbPage>
                </BreadcrumbItem>
                <BreadcrumbSeparator v-if="index < example.items.length - 1" />
              </template>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        
        <!-- Example with collapsed items -->
        <div class="space-y-2">
          <h3 class="text-sm font-medium text-muted-foreground">With Collapsed Items</h3>
          <Breadcrumb v-bind="args">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/" class="flex items-center gap-2">
                  <Home class="h-4 w-4" />
                  Home
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbEllipsis />
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/documents/projects">Projects</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Current Project</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        
        <!-- Example with custom separator -->
        <div class="space-y-2">
          <h3 class="text-sm font-medium text-muted-foreground">Custom Separator</h3>
          <Breadcrumb v-bind="args">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator>
                <Slash class="h-4 w-4" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbLink href="/products">Products</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator>
                <Slash class="h-4 w-4" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbPage>Product Details</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>
    `,
  }),
}
