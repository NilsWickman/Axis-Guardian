import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { ref } from 'vue'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'
import { Button } from '@/components/ui/button'
import {
  Home,
  ShoppingBag,
  Users,
  Settings,
  HelpCircle,
  ChevronRight,
  Star,
  Heart,
  BookOpen,
  Code,
  Palette,
  Smartphone,
  Monitor,
  Tablet,
  Headphones,
  Camera,
  Watch,
  Globe,
  Briefcase,
  GraduationCap,
  Building,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Clock,
  TrendingUp,
  BarChart3,
  PieChart,
  Award,
  Target,
  Zap,
} from 'lucide-vue-next'

// Mock data for different navigation scenarios
const mockData = {
  // Website header navigation
  websiteNavigation: {
    title: 'Company Name',
    items: [
      {
        label: 'Home',
        href: '/',
        icon: Home,
      },
      {
        label: 'Products',
        trigger: true,
        content: [
          {
            title: 'Electronics',
            description: 'Latest gadgets and tech products',
            items: [
              { label: 'Smartphones', href: '/products/smartphones', icon: Smartphone },
              { label: 'Laptops', href: '/products/laptops', icon: Monitor },
              { label: 'Tablets', href: '/products/tablets', icon: Tablet },
              { label: 'Headphones', href: '/products/headphones', icon: Headphones },
            ],
          },
          {
            title: 'Accessories',
            description: 'Enhance your tech experience',
            items: [
              { label: 'Cases & Covers', href: '/products/cases' },
              { label: 'Cables & Chargers', href: '/products/cables' },
              { label: 'Screen Protectors', href: '/products/protection' },
              { label: 'Stands & Mounts', href: '/products/stands' },
            ],
          },
        ],
      },
      {
        label: 'Services',
        trigger: true,
        content: [
          {
            title: 'Support Services',
            description: 'Get help when you need it',
            items: [
              { label: 'Technical Support', href: '/services/tech-support', icon: Settings },
              { label: 'Repair Services', href: '/services/repair' },
              { label: 'Extended Warranty', href: '/services/warranty', icon: Star },
              { label: 'Training', href: '/services/training', icon: BookOpen },
            ],
          },
        ],
      },
      {
        label: 'About',
        href: '/about',
        icon: Users,
      },
      {
        label: 'Contact',
        href: '/contact',
        icon: Phone,
      },
    ],
  },

  // E-commerce navigation
  ecommerceNavigation: {
    categories: [
      {
        label: 'Electronics',
        trigger: true,
        content: [
          {
            title: 'Computers',
            description: 'Desktops, laptops, and accessories',
            featured: true,
            items: [
              { label: 'Gaming PCs', href: '/electronics/gaming-pcs', price: 'From $999' },
              {
                label: 'Business Laptops',
                href: '/electronics/business-laptops',
                price: 'From $599',
              },
              { label: 'Monitors', href: '/electronics/monitors', price: 'From $199' },
              { label: 'Keyboards & Mice', href: '/electronics/peripherals', price: 'From $29' },
            ],
          },
          {
            title: 'Mobile Devices',
            description: 'Smartphones and tablets',
            items: [
              { label: 'iPhone', href: '/electronics/iphone', icon: Smartphone },
              { label: 'Samsung Galaxy', href: '/electronics/samsung', icon: Smartphone },
              { label: 'iPad', href: '/electronics/ipad', icon: Tablet },
              { label: 'Android Tablets', href: '/electronics/android-tablets', icon: Tablet },
            ],
          },
          {
            title: 'Audio & Video',
            description: 'Sound and entertainment systems',
            items: [
              { label: 'Headphones', href: '/electronics/headphones', icon: Headphones },
              { label: 'Speakers', href: '/electronics/speakers' },
              { label: 'Cameras', href: '/electronics/cameras', icon: Camera },
              { label: 'Smart Watches', href: '/electronics/watches', icon: Watch },
            ],
          },
        ],
      },
      {
        label: 'Fashion',
        trigger: true,
        content: [
          {
            title: "Men's Fashion",
            description: 'Clothing and accessories for men',
            items: [
              { label: 'Shirts', href: '/fashion/mens-shirts' },
              { label: 'Pants', href: '/fashion/mens-pants' },
              { label: 'Shoes', href: '/fashion/mens-shoes' },
              { label: 'Accessories', href: '/fashion/mens-accessories' },
            ],
          },
          {
            title: "Women's Fashion",
            description: 'Clothing and accessories for women',
            items: [
              { label: 'Dresses', href: '/fashion/womens-dresses' },
              { label: 'Tops', href: '/fashion/womens-tops' },
              { label: 'Shoes', href: '/fashion/womens-shoes' },
              { label: 'Handbags', href: '/fashion/handbags' },
            ],
          },
        ],
      },
      {
        label: 'Home & Garden',
        href: '/home-garden',
      },
      {
        label: 'Sale',
        href: '/sale',
        badge: 'Hot',
        className: 'text-red-600 font-semibold',
      },
    ],
  },

  // Service-based navigation
  servicesNavigation: {
    services: [
      {
        label: 'Web Design',
        trigger: true,
        content: [
          {
            title: 'Design Services',
            description: 'Creating beautiful, functional websites',
            items: [
              { label: 'Custom Web Design', href: '/services/web-design/custom', icon: Palette },
              {
                label: 'Responsive Design',
                href: '/services/web-design/responsive',
                icon: Monitor,
              },
              {
                label: 'E-commerce Design',
                href: '/services/web-design/ecommerce',
                icon: ShoppingBag,
              },
              { label: 'Landing Pages', href: '/services/web-design/landing-pages' },
            ],
          },
          {
            title: 'Development',
            description: 'Bringing designs to life with code',
            items: [
              { label: 'Frontend Development', href: '/services/development/frontend', icon: Code },
              { label: 'Backend Development', href: '/services/development/backend', icon: Code },
              {
                label: 'Full Stack Development',
                href: '/services/development/fullstack',
                icon: Code,
              },
              { label: 'CMS Integration', href: '/services/development/cms' },
            ],
          },
        ],
      },
      {
        label: 'Digital Marketing',
        trigger: true,
        content: [
          {
            title: 'Marketing Services',
            description: 'Grow your online presence',
            items: [
              { label: 'SEO Optimization', href: '/services/marketing/seo', icon: TrendingUp },
              { label: 'Social Media Marketing', href: '/services/marketing/social', icon: Users },
              { label: 'Content Marketing', href: '/services/marketing/content', icon: BookOpen },
              { label: 'Email Marketing', href: '/services/marketing/email', icon: Mail },
            ],
          },
          {
            title: 'Analytics & Reporting',
            description: 'Track your success',
            items: [
              {
                label: 'Google Analytics Setup',
                href: '/services/analytics/setup',
                icon: BarChart3,
              },
              { label: 'Performance Reports', href: '/services/analytics/reports', icon: PieChart },
              {
                label: 'Conversion Tracking',
                href: '/services/analytics/conversion',
                icon: Target,
              },
              { label: 'ROI Analysis', href: '/services/analytics/roi', icon: TrendingUp },
            ],
          },
        ],
      },
      {
        label: 'Consulting',
        href: '/services/consulting',
        icon: Briefcase,
      },
      {
        label: 'Support',
        href: '/services/support',
        icon: HelpCircle,
      },
    ],
  },

  // Educational platform navigation
  educationNavigation: {
    courses: [
      {
        label: 'Programming',
        trigger: true,
        content: [
          {
            title: 'Web Development',
            description: 'Build modern web applications',
            featured: true,
            items: [
              {
                label: 'JavaScript Fundamentals',
                href: '/courses/javascript',
                duration: '8 weeks',
                level: 'Beginner',
              },
              {
                label: 'React Development',
                href: '/courses/react',
                duration: '10 weeks',
                level: 'Intermediate',
              },
              {
                label: 'Node.js Backend',
                href: '/courses/nodejs',
                duration: '12 weeks',
                level: 'Intermediate',
              },
              {
                label: 'Full Stack Bootcamp',
                href: '/courses/fullstack',
                duration: '24 weeks',
                level: 'Beginner to Advanced',
              },
            ],
          },
          {
            title: 'Mobile Development',
            description: 'Create mobile applications',
            items: [
              { label: 'iOS Development', href: '/courses/ios', icon: Smartphone },
              { label: 'Android Development', href: '/courses/android', icon: Smartphone },
              { label: 'React Native', href: '/courses/react-native', icon: Smartphone },
              { label: 'Flutter', href: '/courses/flutter', icon: Smartphone },
            ],
          },
        ],
      },
      {
        label: 'Design',
        trigger: true,
        content: [
          {
            title: 'UI/UX Design',
            description: 'Design user-centered experiences',
            items: [
              { label: 'Design Fundamentals', href: '/courses/design-fundamentals', icon: Palette },
              { label: 'Figma Mastery', href: '/courses/figma', icon: Palette },
              { label: 'User Research', href: '/courses/user-research', icon: Users },
              { label: 'Design Systems', href: '/courses/design-systems', icon: Palette },
            ],
          },
        ],
      },
      {
        label: 'Business',
        trigger: true,
        content: [
          {
            title: 'Entrepreneurship',
            description: 'Start and grow your business',
            items: [
              { label: 'Business Planning', href: '/courses/business-planning', icon: Briefcase },
              {
                label: 'Marketing Strategy',
                href: '/courses/marketing-strategy',
                icon: TrendingUp,
              },
              { label: 'Financial Management', href: '/courses/finance', icon: BarChart3 },
              { label: 'Leadership Skills', href: '/courses/leadership', icon: Award },
            ],
          },
        ],
      },
    ],
    quickLinks: [
      { label: 'All Courses', href: '/courses', icon: BookOpen },
      { label: 'Free Courses', href: '/courses/free', icon: Heart },
      { label: 'Certificates', href: '/certificates', icon: Award },
      { label: 'Career Path', href: '/career-path', icon: Target },
    ],
  },

  // Corporate navigation
  corporateNavigation: {
    company: [
      {
        label: 'Solutions',
        trigger: true,
        content: [
          {
            title: 'Enterprise Solutions',
            description: 'Scalable solutions for large organizations',
            items: [
              { label: 'Cloud Infrastructure', href: '/solutions/cloud', icon: Globe },
              { label: 'Data Analytics', href: '/solutions/analytics', icon: BarChart3 },
              { label: 'Security Services', href: '/solutions/security', icon: Zap },
              { label: 'Custom Development', href: '/solutions/development', icon: Code },
            ],
          },
          {
            title: 'Industry Solutions',
            description: 'Tailored for your industry',
            items: [
              { label: 'Healthcare', href: '/solutions/healthcare', icon: Heart },
              { label: 'Financial Services', href: '/solutions/finance', icon: BarChart3 },
              { label: 'Education', href: '/solutions/education', icon: GraduationCap },
              { label: 'Manufacturing', href: '/solutions/manufacturing', icon: Building },
            ],
          },
        ],
      },
      {
        label: 'Resources',
        trigger: true,
        content: [
          {
            title: 'Learning Resources',
            description: 'Expand your knowledge',
            items: [
              { label: 'Documentation', href: '/resources/docs', icon: BookOpen },
              { label: 'Case Studies', href: '/resources/case-studies', icon: Target },
              { label: 'White Papers', href: '/resources/whitepapers', icon: BookOpen },
              { label: 'Webinars', href: '/resources/webinars', icon: Calendar },
            ],
          },
          {
            title: 'Support',
            description: 'Get the help you need',
            items: [
              { label: 'Help Center', href: '/support/help', icon: HelpCircle },
              { label: 'Contact Support', href: '/support/contact', icon: Mail },
              { label: 'Training', href: '/support/training', icon: GraduationCap },
              { label: 'Community', href: '/support/community', icon: Users },
            ],
          },
        ],
      },
      {
        label: 'Company',
        trigger: true,
        content: [
          {
            title: 'About Us',
            description: 'Learn more about our company',
            items: [
              { label: 'Our Story', href: '/company/story', icon: BookOpen },
              { label: 'Leadership Team', href: '/company/leadership', icon: Users },
              { label: 'Careers', href: '/company/careers', icon: Briefcase },
              { label: 'Locations', href: '/company/locations', icon: MapPin },
            ],
          },
          {
            title: 'News & Events',
            description: 'Stay up to date',
            items: [
              { label: 'Press Releases', href: '/company/press', icon: BookOpen },
              { label: 'Events', href: '/company/events', icon: Calendar },
              { label: 'Blog', href: '/company/blog', icon: BookOpen },
              { label: 'Awards', href: '/company/awards', icon: Award },
            ],
          },
        ],
      },
    ],
  },
}

const meta = {
  title: 'UI Components/NavigationMenu',
  component: NavigationMenu,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A collection of links for navigating websites. Built on top of Reka UI NavigationMenu with accessibility features and keyboard navigation support.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    viewport: {
      control: { type: 'boolean' },
      description: 'Whether to show the viewport container for dropdown content',
      defaultValue: true,
    },
    class: {
      control: { type: 'text' },
      description: 'Additional CSS classes',
    },
  },
} satisfies Meta<typeof NavigationMenu>

export default meta
type Story = StoryObj<typeof meta>

// Basic navigation with simple links
export const Default: Story = {
  render: (args) => ({
    components: {
      NavigationMenu,
      NavigationMenuList,
      NavigationMenuItem,
      NavigationMenuLink,
      Home,
      Users,
      Settings,
      HelpCircle,
    },
    setup() {
      return { args }
    },
    template: `
      <NavigationMenu v-bind="args">
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink href="/">
              <Home class="w-4 h-4 mr-2" />
              Home
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink href="/about">
              <Users class="w-4 h-4 mr-2" />
              About
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink href="/services">
              Services
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink href="/contact">
              Contact
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    `,
  }),
  args: {
    viewport: true,
  },
}

// Website header navigation with dropdown content
export const WebsiteHeader: Story = {
  render: (args) => ({
    components: {
      NavigationMenu,
      NavigationMenuList,
      NavigationMenuItem,
      NavigationMenuLink,
      NavigationMenuTrigger,
      NavigationMenuContent,
      Home,
      Smartphone,
      Monitor,
      Tablet,
      Headphones,
      Settings,
      Star,
      BookOpen,
      Users,
      Phone,
    },
    setup() {
      const navigation = mockData.websiteNavigation
      return { args, navigation }
    },
    template: `
      <NavigationMenu v-bind="args">
        <NavigationMenuList>
          <NavigationMenuItem v-for="item in navigation.items" :key="item.label">
            <NavigationMenuTrigger v-if="item.trigger">
              {{ item.label }}
            </NavigationMenuTrigger>
            <NavigationMenuLink v-else :href="item.href">
              <component v-if="item.icon" :is="item.icon" class="w-4 h-4 mr-2" />
              {{ item.label }}
            </NavigationMenuLink>
            
            <NavigationMenuContent v-if="item.trigger && item.content">
              <div class="grid gap-3 p-4 md:w-[500px] lg:w-[600px] lg:grid-cols-2">
                <div v-for="section in item.content" :key="section.title" class="row-span-3">
                  <NavigationMenuLink as-child>
                    <a class="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md" href="#">
                      <div class="mb-2 mt-4 text-lg font-medium">
                        {{ section.title }}
                      </div>
                      <p class="text-sm leading-tight text-muted-foreground">
                        {{ section.description }}
                      </p>
                    </a>
                  </NavigationMenuLink>
                </div>
                <div class="space-y-1">
                  <template v-for="section in item.content" :key="section.title">
                    <NavigationMenuLink
                      v-for="subItem in section.items"
                      :key="subItem.label"
                      :href="subItem.href"
                      class="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                    >
                      <div class="flex items-center">
                        <component v-if="subItem.icon" :is="subItem.icon" class="w-4 h-4 mr-2" />
                        <div class="text-sm font-medium leading-none">{{ subItem.label }}</div>
                      </div>
                    </NavigationMenuLink>
                  </template>
                </div>
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    `,
  }),
  args: {
    viewport: true,
  },
}

// Navigation without viewport (inline dropdowns)
export const WithoutViewport: Story = {
  render: (args) => ({
    components: {
      NavigationMenu,
      NavigationMenuList,
      NavigationMenuItem,
      NavigationMenuLink,
      NavigationMenuTrigger,
      NavigationMenuContent,
      Home,
      ShoppingBag,
      Users,
      Settings,
      Smartphone,
      Monitor,
      Tablet,
    },
    setup() {
      return { args }
    },
    template: `
      <NavigationMenu v-bind="args">
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink href="/">
              <Home class="w-4 h-4 mr-2" />
              Home
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Products</NavigationMenuTrigger>
            <NavigationMenuContent>
              <div class="grid gap-3 p-4 w-[300px]">
                <NavigationMenuLink
                  href="/products/smartphones"
                  class="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                >
                  <div class="flex items-center">
                    <Smartphone class="w-4 h-4 mr-2" />
                    <div class="text-sm font-medium leading-none">Smartphones</div>
                  </div>
                  <p class="line-clamp-2 text-sm leading-snug text-muted-foreground">Latest mobile devices</p>
                </NavigationMenuLink>
                <NavigationMenuLink
                  href="/products/laptops"
                  class="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                >
                  <div class="flex items-center">
                    <Monitor class="w-4 h-4 mr-2" />
                    <div class="text-sm font-medium leading-none">Laptops</div>
                  </div>
                  <p class="line-clamp-2 text-sm leading-snug text-muted-foreground">High-performance computers</p>
                </NavigationMenuLink>
                <NavigationMenuLink
                  href="/products/tablets"
                  class="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                >
                  <div class="flex items-center">
                    <Tablet class="w-4 h-4 mr-2" />
                    <div class="text-sm font-medium leading-none">Tablets</div>
                  </div>
                  <p class="line-clamp-2 text-sm leading-snug text-muted-foreground">Portable touch devices</p>
                </NavigationMenuLink>
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink href="/about">
              <Users class="w-4 h-4 mr-2" />
              About
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink href="/contact">Contact</NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    `,
  }),
  args: {
    viewport: false,
  },
}

// Compact navigation for mobile-friendly design
export const CompactNavigation: Story = {
  render: (args) => ({
    components: {
      NavigationMenu,
      NavigationMenuList,
      NavigationMenuItem,
      NavigationMenuLink,
      NavigationMenuTrigger,
      NavigationMenuContent,
      Home,
      ShoppingBag,
      Users,
      Settings,
      HelpCircle,
    },
    setup() {
      return { args }
    },
    template: `
      <NavigationMenu v-bind="args" class="w-full max-w-none">
        <NavigationMenuList class="flex-wrap justify-start gap-2">
          <NavigationMenuItem>
            <NavigationMenuLink href="/" class="px-3 py-2 text-sm">
              <Home class="w-4 h-4" />
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuTrigger class="px-3 py-2 text-sm">Shop</NavigationMenuTrigger>
            <NavigationMenuContent>
              <div class="grid gap-2 p-3 w-[200px]">
                <NavigationMenuLink href="/shop/electronics" class="block p-2 text-sm rounded hover:bg-accent">Electronics</NavigationMenuLink>
                <NavigationMenuLink href="/shop/clothing" class="block p-2 text-sm rounded hover:bg-accent">Clothing</NavigationMenuLink>
                <NavigationMenuLink href="/shop/books" class="block p-2 text-sm rounded hover:bg-accent">Books</NavigationMenuLink>
                <NavigationMenuLink href="/shop/home" class="block p-2 text-sm rounded hover:bg-accent">Home & Garden</NavigationMenuLink>
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink href="/about" class="px-3 py-2 text-sm">
              <Users class="w-4 h-4" />
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink href="/support" class="px-3 py-2 text-sm">
              <HelpCircle class="w-4 h-4" />
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    `,
  }),
  args: {
    viewport: true,
  },
}

// Multi-level navigation with nested content
export const MultiLevelNavigation: Story = {
  render: (args) => ({
    components: {
      NavigationMenu,
      NavigationMenuList,
      NavigationMenuItem,
      NavigationMenuLink,
      NavigationMenuTrigger,
      NavigationMenuContent,
      ChevronRight,
      Code,
      Palette,
      BarChart3,
      Users,
      Globe,
      Smartphone,
      Monitor,
      Briefcase,
    },
    setup() {
      return { args }
    },
    template: `
      <NavigationMenu v-bind="args">
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Technology</NavigationMenuTrigger>
            <NavigationMenuContent>
              <div class="grid gap-3 p-6 md:w-[600px] lg:grid-cols-2">
                <div class="space-y-3">
                  <h3 class="text-lg font-medium">Development</h3>
                  <div class="space-y-1">
                    <NavigationMenuLink href="/tech/web-dev" class="group block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center">
                          <Code class="w-4 h-4 mr-2" />
                          <div class="text-sm font-medium leading-none">Web Development</div>
                        </div>
                        <ChevronRight class="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p class="line-clamp-2 text-sm leading-snug text-muted-foreground">Frontend and backend technologies</p>
                    </NavigationMenuLink>
                    <NavigationMenuLink href="/tech/mobile-dev" class="group block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center">
                          <Smartphone class="w-4 h-4 mr-2" />
                          <div class="text-sm font-medium leading-none">Mobile Development</div>
                        </div>
                        <ChevronRight class="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p class="line-clamp-2 text-sm leading-snug text-muted-foreground">iOS and Android applications</p>
                    </NavigationMenuLink>
                  </div>
                </div>
                <div class="space-y-3">
                  <h3 class="text-lg font-medium">Design & Analytics</h3>
                  <div class="space-y-1">
                    <NavigationMenuLink href="/tech/design" class="group block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center">
                          <Palette class="w-4 h-4 mr-2" />
                          <div class="text-sm font-medium leading-none">UI/UX Design</div>
                        </div>
                        <ChevronRight class="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p class="line-clamp-2 text-sm leading-snug text-muted-foreground">User experience and interface design</p>
                    </NavigationMenuLink>
                    <NavigationMenuLink href="/tech/analytics" class="group block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center">
                          <BarChart3 class="w-4 h-4 mr-2" />
                          <div class="text-sm font-medium leading-none">Data Analytics</div>
                        </div>
                        <ChevronRight class="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p class="line-clamp-2 text-sm leading-snug text-muted-foreground">Business intelligence and insights</p>
                    </NavigationMenuLink>
                  </div>
                </div>
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Business</NavigationMenuTrigger>
            <NavigationMenuContent>
              <div class="grid gap-3 p-6 md:w-[500px] lg:grid-cols-1">
                <div class="space-y-3">
                  <NavigationMenuLink href="/business/consulting" class="group flex items-center justify-between w-full p-4 rounded-md bg-muted/50 hover:bg-muted transition-colors">
                    <div class="flex items-center">
                      <Briefcase class="w-5 h-5 mr-3 text-primary" />
                      <div>
                        <div class="font-medium">Business Consulting</div>
                        <div class="text-sm text-muted-foreground">Strategic guidance for growth</div>
                      </div>
                    </div>
                    <ChevronRight class="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </NavigationMenuLink>
                  <NavigationMenuLink href="/business/team" class="group flex items-center justify-between w-full p-4 rounded-md bg-muted/50 hover:bg-muted transition-colors">
                    <div class="flex items-center">
                      <Users class="w-5 h-5 mr-3 text-primary" />
                      <div>
                        <div class="font-medium">Team Building</div>
                        <div class="text-sm text-muted-foreground">Strengthen your organization</div>
                      </div>
                    </div>
                    <ChevronRight class="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </NavigationMenuLink>
                  <NavigationMenuLink href="/business/global" class="group flex items-center justify-between w-full p-4 rounded-md bg-muted/50 hover:bg-muted transition-colors">
                    <div class="flex items-center">
                      <Globe class="w-5 h-5 mr-3 text-primary" />
                      <div>
                        <div class="font-medium">Global Expansion</div>
                        <div class="text-sm text-muted-foreground">Enter new markets</div>
                      </div>
                    </div>
                    <ChevronRight class="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </NavigationMenuLink>
                </div>
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink href="/resources">Resources</NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink href="/contact">Contact</NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    `,
  }),
  args: {
    viewport: true,
  },
}
