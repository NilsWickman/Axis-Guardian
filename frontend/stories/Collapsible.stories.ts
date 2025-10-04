import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Minus,
  Info,
  Settings,
  User,
  Mail,
  Bell,
  Shield,
  HelpCircle,
  FileText,
  Code,
  Database,
  Cloud,
  Users,
  BarChart3,
  Package,
  CreditCard,
  Globe,
  Smartphone,
  Monitor,
  Calendar,
  Star,
  Heart,
  Bookmark,
  Eye,
  EyeOff,
} from 'lucide-vue-next'

// Mock data for different collapsible scenarios
const mockCollapsibleData = {
  faq: [
    {
      id: 'faq-1',
      question: 'What is your return policy?',
      answer:
        "We offer a 30-day return policy for all unused items in their original packaging. Items must be returned with proof of purchase and may be subject to a restocking fee. Digital products are generally non-refundable unless there's a technical issue.",
    },
    {
      id: 'faq-2',
      question: 'How long does shipping take?',
      answer:
        'Standard shipping takes 3-5 business days, while express shipping takes 1-2 business days. International orders may take 7-14 business days depending on the destination. We provide tracking information for all shipments.',
    },
    {
      id: 'faq-3',
      question: 'Do you offer technical support?',
      answer:
        'Yes, we provide 24/7 technical support through email, phone, and live chat. Our technical team is available to help with installation, troubleshooting, and product questions. Premium customers get priority support.',
    },
  ],
  settings: [
    {
      id: 'profile',
      title: 'Profile Settings',
      icon: User,
      description: 'Manage your personal information, avatar, and display preferences.',
      items: [
        'Update profile picture',
        'Change display name',
        'Set timezone',
        'Language preferences',
      ],
    },
    {
      id: 'notifications',
      title: 'Notification Settings',
      icon: Bell,
      description: 'Control how and when you receive notifications.',
      items: ['Email notifications', 'Push notifications', 'SMS alerts', 'In-app notifications'],
    },
    {
      id: 'security',
      title: 'Security & Privacy',
      icon: Shield,
      description: 'Configure security settings and privacy controls.',
      items: [
        'Two-factor authentication',
        'Password settings',
        'Privacy controls',
        'Login sessions',
      ],
    },
  ],
  features: [
    {
      id: 'analytics',
      title: 'Advanced Analytics',
      icon: BarChart3,
      description: 'Get detailed insights into your data with customizable dashboards and reports.',
      details: {
        features: [
          'Real-time dashboards',
          'Custom reports',
          'Data visualization',
          'Export capabilities',
        ],
        benefits: [
          'Better decision making',
          'Performance tracking',
          'Trend identification',
          'ROI measurement',
        ],
      },
    },
    {
      id: 'collaboration',
      title: 'Team Collaboration',
      icon: Users,
      description: 'Work together seamlessly with shared workspaces and real-time editing.',
      details: {
        features: [
          'Shared workspaces',
          'Real-time editing',
          'Comment system',
          'Role-based permissions',
        ],
        benefits: [
          'Improved teamwork',
          'Faster project completion',
          'Better communication',
          'Clear responsibilities',
        ],
      },
    },
    {
      id: 'integrations',
      title: 'API Integrations',
      icon: Code,
      description: 'Connect with over 100+ third-party services and build custom integrations.',
      details: {
        features: ['100+ integrations', 'REST API', 'Webhooks', 'Custom endpoints'],
        benefits: [
          'Streamlined workflow',
          'Automated processes',
          'Data synchronization',
          'Extended functionality',
        ],
      },
    },
  ],
  documentation: [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: Star,
      sections: [
        {
          name: 'Quick Start Guide',
          content: 'Get up and running in just 5 minutes with our comprehensive quick start guide.',
        },
        {
          name: 'Installation',
          content:
            'Step-by-step installation instructions for all supported platforms and environments.',
        },
        {
          name: 'First Steps',
          content: 'Learn the basics and create your first project with our guided tutorial.',
        },
      ],
    },
    {
      id: 'api-reference',
      title: 'API Reference',
      icon: Code,
      sections: [
        {
          name: 'Authentication',
          content: 'Learn how to authenticate your API requests using API keys or OAuth tokens.',
        },
        {
          name: 'Endpoints',
          content: 'Complete reference of all available API endpoints with examples and responses.',
        },
        {
          name: 'Rate Limits',
          content: 'Understanding rate limits and best practices for API usage optimization.',
        },
      ],
    },
    {
      id: 'tutorials',
      title: 'Tutorials & Guides',
      icon: FileText,
      sections: [
        {
          name: 'Basic Tutorials',
          content: 'Step-by-step tutorials covering common use cases and workflows.',
        },
        {
          name: 'Advanced Guides',
          content: 'In-depth guides for complex implementations and enterprise features.',
        },
        {
          name: 'Best Practices',
          content: 'Learn industry best practices and optimization techniques.',
        },
      ],
    },
  ],
  code: [
    {
      id: 'react-example',
      title: 'React Component Example',
      language: 'jsx',
      code: `import React, { useState } from 'react';
import { Button } from './components/ui/button';

export function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div className="flex items-center gap-4">
      <Button onClick={() => setCount(count - 1)}>-</Button>
      <span className="font-mono text-lg">{count}</span>
      <Button onClick={() => setCount(count + 1)}>+</Button>
    </div>
  );
}`,
    },
    {
      id: 'vue-example',
      title: 'Vue Component Example',
      language: 'vue',
      code: `<script setup>
import { ref } from 'vue'

const count = ref(0)
</script>

<template>
  <div class="flex items-center gap-4">
    <button @click="count--" class="btn">-</button>
    <span class="font-mono text-lg">{{ count }}</span>
    <button @click="count++" class="btn">+</button>
  </div>
</template>`,
    },
  ],
}

const meta = {
  title: 'UI Components/Collapsible',
  component: Collapsible,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'An interactive component which expands/collapses a panel. Built using Reka UI primitives with customizable triggers and content areas.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    defaultOpen: {
      control: { type: 'boolean' },
      description: 'Whether the collapsible is open by default',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    open: {
      control: { type: 'boolean' },
      description: 'The controlled open state of the collapsible',
      table: {
        type: { summary: 'boolean' },
      },
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'When true, prevents the user from interacting with the collapsible',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    unmountOnHide: {
      control: { type: 'boolean' },
      description: 'Whether to unmount the content when collapsed',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
      },
    },
  },
} satisfies Meta<typeof Collapsible>

export default meta
type Story = StoryObj<typeof meta>

// Basic collapsible with default styling
export const Default: Story = {
  render: (args) => ({
    components: { Collapsible, CollapsibleContent, CollapsibleTrigger, ChevronDown },
    setup() {
      return { args }
    },
    template: `
      <Collapsible v-bind="args" class="w-full max-w-lg border rounded-lg">
        <CollapsibleTrigger class="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors">
          <span class="font-medium">What is a collapsible component?</span>
          <ChevronDown class="h-4 w-4 transition-transform ui-open:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent class="px-4 pb-3">
          <p class="text-sm text-muted-foreground leading-relaxed">
            A collapsible component is an interactive element that allows users to expand and collapse content sections. 
            It's commonly used for FAQs, settings panels, and navigation menus to save space and improve user experience.
          </p>
        </CollapsibleContent>
      </Collapsible>
    `,
  }),
  args: {
    defaultOpen: false,
  },
}

// Collapsible that starts open
export const DefaultOpen: Story = {
  render: () => ({
    components: { Collapsible, CollapsibleContent, CollapsibleTrigger, ChevronDown },
    template: `
      <Collapsible default-open class="w-full max-w-lg border rounded-lg">
        <CollapsibleTrigger class="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors">
          <span class="font-medium">This collapsible starts open</span>
          <ChevronDown class="h-4 w-4 transition-transform ui-open:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent class="px-4 pb-3">
          <p class="text-sm text-muted-foreground leading-relaxed">
            This content is visible by default because the collapsible has the default-open prop set to true.
            Users can still collapse it by clicking the trigger button.
          </p>
        </CollapsibleContent>
      </Collapsible>
    `,
  }),
}

// Disabled collapsible
export const Disabled: Story = {
  render: () => ({
    components: { Collapsible, CollapsibleContent, CollapsibleTrigger, ChevronDown },
    template: `
      <Collapsible disabled class="w-full max-w-lg border rounded-lg opacity-60">
        <CollapsibleTrigger class="flex items-center justify-between w-full px-4 py-3 text-left cursor-not-allowed">
          <span class="font-medium">This collapsible is disabled</span>
          <ChevronDown class="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent class="px-4 pb-3">
          <p class="text-sm text-muted-foreground leading-relaxed">
            This content cannot be toggled because the collapsible is disabled.
          </p>
        </CollapsibleContent>
      </Collapsible>
    `,
  }),
}

// FAQ-style collapsibles with different trigger styles
export const FAQStyle: Story = {
  render: () => ({
    components: { Collapsible, CollapsibleContent, CollapsibleTrigger, Plus, Minus },
    setup() {
      const faqData = mockCollapsibleData.faq
      return { faqData }
    },
    template: `
      <div class="space-y-3 w-full max-w-2xl">
        <div class="mb-6">
          <h2 class="text-2xl font-bold mb-2">Frequently Asked Questions</h2>
          <p class="text-muted-foreground">Find answers to common questions about our service.</p>
        </div>
        <Collapsible v-for="item in faqData" :key="item.id" class="border rounded-lg">
          <CollapsibleTrigger class="flex items-center justify-between w-full px-4 py-4 text-left hover:bg-muted/50 transition-colors group">
            <span class="font-medium pr-4">{{ item.question }}</span>
            <div class="relative">
              <Plus class="h-4 w-4 transition-all ui-open:scale-0 ui-open:rotate-180" />
              <Minus class="h-4 w-4 absolute inset-0 transition-all scale-0 ui-open:scale-100" />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent class="px-4 pb-4">
            <div class="pt-2 border-t">
              <p class="text-sm text-muted-foreground leading-relaxed">{{ item.answer }}</p>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    `,
  }),
}

// Settings panel style with icons
export const SettingsPanel: Story = {
  render: () => ({
    components: { Collapsible, CollapsibleContent, CollapsibleTrigger, ChevronRight },
    setup() {
      const settingsData = mockCollapsibleData.settings
      return { settingsData }
    },
    template: `
      <div class="space-y-2 w-full max-w-lg">
        <div class="mb-6">
          <h2 class="text-xl font-semibold mb-1">Settings</h2>
          <p class="text-sm text-muted-foreground">Manage your account preferences and configuration.</p>
        </div>
        <Collapsible v-for="item in settingsData" :key="item.id" class="border rounded-lg bg-card">
          <CollapsibleTrigger class="flex items-center w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors">
            <component :is="item.icon" class="h-4 w-4 mr-3 text-muted-foreground" />
            <div class="flex-1 min-w-0">
              <div class="font-medium">{{ item.title }}</div>
              <div class="text-sm text-muted-foreground truncate">{{ item.description }}</div>
            </div>
            <ChevronRight class="h-4 w-4 ml-2 text-muted-foreground transition-transform ui-open:rotate-90" />
          </CollapsibleTrigger>
          <CollapsibleContent class="px-4 pb-4">
            <div class="pl-7 space-y-2">
              <div v-for="setting in item.items" :key="setting" 
                   class="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <span class="text-sm">{{ setting }}</span>
                <button class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded transition-colors">
                  Configure
                </button>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    `,
  }),
}

// Product features showcase
export const ProductFeatures: Story = {
  render: () => ({
    components: { Collapsible, CollapsibleContent, CollapsibleTrigger, ChevronDown },
    setup() {
      const featuresData = mockCollapsibleData.features
      return { featuresData }
    },
    template: `
      <div class="space-y-4 w-full max-w-2xl">
        <div class="mb-6">
          <h2 class="text-2xl font-bold mb-2">Product Features</h2>
          <p class="text-muted-foreground">Explore our powerful features designed to enhance your workflow.</p>
        </div>
        <Collapsible v-for="feature in featuresData" :key="feature.id" class="border rounded-lg bg-card">
          <CollapsibleTrigger class="flex items-center justify-between w-full px-6 py-4 text-left hover:bg-muted/30 transition-colors">
            <div class="flex items-center gap-3">
              <div class="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                <component :is="feature.icon" class="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 class="font-semibold">{{ feature.title }}</h3>
                <p class="text-sm text-muted-foreground">{{ feature.description }}</p>
              </div>
            </div>
            <ChevronDown class="h-4 w-4 text-muted-foreground transition-transform ui-open:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent class="px-6 pb-6">
            <div class="pt-4 space-y-4">
              <div class="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 class="font-medium text-sm mb-2">Key Features</h4>
                  <ul class="space-y-1">
                    <li v-for="f in feature.details.features" :key="f" class="flex items-center gap-2 text-sm">
                      <div class="w-1.5 h-1.5 bg-primary rounded-full"></div>
                      {{ f }}
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 class="font-medium text-sm mb-2">Benefits</h4>
                  <ul class="space-y-1">
                    <li v-for="b in feature.details.benefits" :key="b" class="flex items-center gap-2 text-sm">
                      <div class="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      {{ b }}
                    </li>
                  </ul>
                </div>
              </div>
              <div class="flex gap-2 pt-2">
                <button class="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                  Learn More
                </button>
                <button class="px-4 py-2 text-sm border border-border rounded-md hover:bg-muted/50 transition-colors">
                  Try Demo
                </button>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    `,
  }),
}

// Documentation sections
export const DocumentationSections: Story = {
  render: () => ({
    components: { Collapsible, CollapsibleContent, CollapsibleTrigger, ChevronRight },
    setup() {
      const docsData = mockCollapsibleData.documentation
      return { docsData }
    },
    template: `
      <div class="space-y-3 w-full max-w-2xl">
        <div class="mb-6">
          <h2 class="text-2xl font-bold mb-2">Documentation</h2>
          <p class="text-muted-foreground">Browse through our comprehensive documentation and guides.</p>
        </div>
        <Collapsible v-for="section in docsData" :key="section.id" class="border rounded-lg">
          <CollapsibleTrigger class="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors">
            <div class="flex items-center gap-3">
              <component :is="section.icon" class="h-4 w-4 text-primary" />
              <span class="font-medium">{{ section.title }}</span>
            </div>
            <ChevronRight class="h-4 w-4 text-muted-foreground transition-transform ui-open:rotate-90" />
          </CollapsibleTrigger>
          <CollapsibleContent class="px-4 pb-4">
            <div class="pl-7 space-y-3">
              <div v-for="subsection in section.sections" :key="subsection.name" 
                   class="border rounded-md p-3 hover:bg-muted/30 transition-colors">
                <h4 class="font-medium text-sm mb-1">{{ subsection.name }}</h4>
                <p class="text-xs text-muted-foreground">{{ subsection.content }}</p>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    `,
  }),
}

// Code examples with syntax highlighting mockup
export const CodeExamples: Story = {
  render: () => ({
    components: { Collapsible, CollapsibleContent, CollapsibleTrigger, ChevronDown, Code },
    setup() {
      const codeData = mockCollapsibleData.code
      return { codeData }
    },
    template: `
      <div class="space-y-4 w-full max-w-3xl">
        <div class="mb-6">
          <h2 class="text-2xl font-bold mb-2">Code Examples</h2>
          <p class="text-muted-foreground">View implementation examples in different frameworks.</p>
        </div>
        <Collapsible v-for="example in codeData" :key="example.id" class="border rounded-lg bg-card">
          <CollapsibleTrigger class="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors">
            <div class="flex items-center gap-3">
              <Code class="h-4 w-4 text-primary" />
              <span class="font-medium">{{ example.title }}</span>
              <span class="px-2 py-1 text-xs bg-muted rounded-md font-mono">{{ example.language }}</span>
            </div>
            <ChevronDown class="h-4 w-4 text-muted-foreground transition-transform ui-open:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent class="px-4 pb-4">
            <div class="mt-3">
              <pre class="bg-muted/50 rounded-md p-4 text-sm overflow-x-auto"><code>{{ example.code }}</code></pre>
              <div class="flex items-center justify-between mt-3 pt-3 border-t">
                <div class="flex gap-2">
                  <button class="text-xs px-3 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors">
                    Copy Code
                  </button>
                  <button class="text-xs px-3 py-1 border rounded hover:bg-muted/50 transition-colors">
                    Run Example
                  </button>
                </div>
                <span class="text-xs text-muted-foreground">{{ example.language.toUpperCase() }}</span>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    `,
  }),
}

// Custom styling with different triggers
export const CustomStyling: Story = {
  render: () => ({
    components: {
      Collapsible,
      CollapsibleContent,
      CollapsibleTrigger,
      Eye,
      EyeOff,
      Heart,
      Bookmark,
      Star,
    },
    template: `
      <div class="space-y-6 w-full max-w-2xl">
        <h2 class="text-2xl font-bold mb-4">Custom Styling Examples</h2>
        
        <!-- Minimal style -->
        <Collapsible class="space-y-2">
          <CollapsibleTrigger class="group flex items-center text-sm font-medium underline underline-offset-4 hover:no-underline">
            Show Details
            <Eye class="h-3 w-3 ml-2 group-ui-open:hidden" />
            <EyeOff class="h-3 w-3 ml-2 hidden group-ui-open:block" />
          </CollapsibleTrigger>
          <CollapsibleContent class="text-sm text-muted-foreground pl-4 border-l-2 border-border">
            This is a minimally styled collapsible with a simple underlined trigger and left border content area.
          </CollapsibleContent>
        </Collapsible>

        <!-- Card style with shadow -->
        <Collapsible class="bg-card rounded-lg shadow-sm border">
          <CollapsibleTrigger class="flex items-center justify-between w-full px-4 py-4 text-left">
            <div class="flex items-center gap-2">
              <Heart class="h-4 w-4 text-red-500" />
              <span class="font-medium">Favorite Items</span>
            </div>
            <span class="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">3 items</span>
          </CollapsibleTrigger>
          <CollapsibleContent class="px-4 pb-4 border-t bg-muted/20">
            <div class="pt-3 space-y-2">
              <div class="flex items-center gap-2 text-sm">
                <Star class="h-3 w-3 text-yellow-500" />
                Premium Analytics Dashboard
              </div>
              <div class="flex items-center gap-2 text-sm">
                <Bookmark class="h-3 w-3 text-blue-500" />
                Team Collaboration Tools
              </div>
              <div class="flex items-center gap-2 text-sm">
                <Heart class="h-3 w-3 text-red-500" />
                Advanced Security Features
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <!-- Gradient style -->
        <Collapsible class="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
          <CollapsibleTrigger class="flex items-center justify-between w-full px-4 py-4 text-left">
            <span class="font-medium text-purple-900">Premium Features</span>
            <div class="w-6 h-6 rounded-full bg-purple-200 flex items-center justify-center">
              <Plus class="h-3 w-3 text-purple-700 transition-transform ui-open:rotate-45" />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent class="px-4 pb-4">
            <div class="bg-white/60 rounded-md p-3 text-sm text-purple-800">
              Access to premium features including advanced analytics, priority support, and exclusive integrations.
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    `,
  }),
}

// Nested collapsibles
export const NestedCollapsibles: Story = {
  render: () => ({
    components: {
      Collapsible,
      CollapsibleContent,
      CollapsibleTrigger,
      ChevronRight,
      Folder,
      File,
      Settings,
      Database,
      Globe,
    },
    template: `
      <div class="w-full max-w-lg">
        <div class="mb-6">
          <h2 class="text-xl font-semibold mb-2">File Explorer</h2>
          <p class="text-sm text-muted-foreground">Navigate through nested folder structure.</p>
        </div>
        
        <!-- Root level -->
        <div class="border rounded-lg bg-card">
          <Collapsible default-open>
            <CollapsibleTrigger class="flex items-center w-full px-3 py-2 text-left hover:bg-muted/50 transition-colors">
              <ChevronRight class="h-3 w-3 mr-2 text-muted-foreground transition-transform ui-open:rotate-90" />
              <Folder class="h-4 w-4 mr-2 text-blue-500" />
              <span class="text-sm font-medium">src</span>
            </CollapsibleTrigger>
            <CollapsibleContent class="pl-5 border-l border-border/50 ml-4">
              
              <!-- Components folder -->
              <Collapsible>
                <CollapsibleTrigger class="flex items-center w-full px-3 py-2 text-left hover:bg-muted/30 transition-colors">
                  <ChevronRight class="h-3 w-3 mr-2 text-muted-foreground transition-transform ui-open:rotate-90" />
                  <Folder class="h-4 w-4 mr-2 text-blue-500" />
                  <span class="text-sm">components</span>
                </CollapsibleTrigger>
                <CollapsibleContent class="pl-5 border-l border-border/50 ml-4">
                  
                  <!-- UI folder -->
                  <Collapsible>
                    <CollapsibleTrigger class="flex items-center w-full px-3 py-2 text-left hover:bg-muted/30 transition-colors">
                      <ChevronRight class="h-3 w-3 mr-2 text-muted-foreground transition-transform ui-open:rotate-90" />
                      <Folder class="h-4 w-4 mr-2 text-blue-500" />
                      <span class="text-sm">ui</span>
                    </CollapsibleTrigger>
                    <CollapsibleContent class="pl-5 border-l border-border/50 ml-4 space-y-1">
                      <div class="flex items-center px-3 py-1">
                        <File class="h-3 w-3 mr-3 text-gray-500" />
                        <span class="text-xs text-muted-foreground">button.vue</span>
                      </div>
                      <div class="flex items-center px-3 py-1">
                        <File class="h-3 w-3 mr-3 text-gray-500" />
                        <span class="text-xs text-muted-foreground">input.vue</span>
                      </div>
                      <div class="flex items-center px-3 py-1">
                        <File class="h-3 w-3 mr-3 text-gray-500" />
                        <span class="text-xs text-muted-foreground">collapsible.vue</span>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                  
                  <!-- Layout folder -->
                  <Collapsible>
                    <CollapsibleTrigger class="flex items-center w-full px-3 py-2 text-left hover:bg-muted/30 transition-colors">
                      <ChevronRight class="h-3 w-3 mr-2 text-muted-foreground transition-transform ui-open:rotate-90" />
                      <Folder class="h-4 w-4 mr-2 text-blue-500" />
                      <span class="text-sm">layout</span>
                    </CollapsibleTrigger>
                    <CollapsibleContent class="pl-5 border-l border-border/50 ml-4 space-y-1">
                      <div class="flex items-center px-3 py-1">
                        <File class="h-3 w-3 mr-3 text-gray-500" />
                        <span class="text-xs text-muted-foreground">header.vue</span>
                      </div>
                      <div class="flex items-center px-3 py-1">
                        <File class="h-3 w-3 mr-3 text-gray-500" />
                        <span class="text-xs text-muted-foreground">sidebar.vue</span>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                  
                </CollapsibleContent>
              </Collapsible>
              
              <!-- Pages folder -->
              <Collapsible>
                <CollapsibleTrigger class="flex items-center w-full px-3 py-2 text-left hover:bg-muted/30 transition-colors">
                  <ChevronRight class="h-3 w-3 mr-2 text-muted-foreground transition-transform ui-open:rotate-90" />
                  <Folder class="h-4 w-4 mr-2 text-blue-500" />
                  <span class="text-sm">pages</span>
                </CollapsibleTrigger>
                <CollapsibleContent class="pl-5 border-l border-border/50 ml-4 space-y-1">
                  <div class="flex items-center px-3 py-1">
                    <File class="h-3 w-3 mr-3 text-gray-500" />
                    <span class="text-xs text-muted-foreground">index.vue</span>
                  </div>
                  <div class="flex items-center px-3 py-1">
                    <File class="h-3 w-3 mr-3 text-gray-500" />
                    <span class="text-xs text-muted-foreground">about.vue</span>
                  </div>
                </CollapsibleContent>
              </Collapsible>
              
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    `,
  }),
}

// All variations for comparison
export const AllVariations: Story = {
  render: () => ({
    components: {
      Collapsible,
      CollapsibleContent,
      CollapsibleTrigger,
      ChevronDown,
      Plus,
      Minus,
      Info,
    },
    template: `
      <div class="space-y-8 w-full max-w-4xl">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <!-- Default -->
          <div>
            <h3 class="text-lg font-semibold mb-3">Default</h3>
            <Collapsible class="border rounded-lg">
              <CollapsibleTrigger class="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-muted/50">
                <span class="font-medium">Basic Collapsible</span>
                <ChevronDown class="h-4 w-4 transition-transform ui-open:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent class="px-4 pb-3">
                <p class="text-sm text-muted-foreground">Default collapsible content with chevron icon.</p>
              </CollapsibleContent>
            </Collapsible>
          </div>

          <!-- Default Open -->
          <div>
            <h3 class="text-lg font-semibold mb-3">Default Open</h3>
            <Collapsible default-open class="border rounded-lg">
              <CollapsibleTrigger class="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-muted/50">
                <span class="font-medium">Starts Open</span>
                <ChevronDown class="h-4 w-4 transition-transform ui-open:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent class="px-4 pb-3">
                <p class="text-sm text-muted-foreground">This collapsible is open by default.</p>
              </CollapsibleContent>
            </Collapsible>
          </div>

          <!-- Plus/Minus Style -->
          <div>
            <h3 class="text-lg font-semibold mb-3">Plus/Minus Style</h3>
            <Collapsible class="border rounded-lg">
              <CollapsibleTrigger class="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-muted/50">
                <span class="font-medium">Expandable Section</span>
                <div class="relative">
                  <Plus class="h-4 w-4 transition-all ui-open:scale-0" />
                  <Minus class="h-4 w-4 absolute inset-0 transition-all scale-0 ui-open:scale-100" />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent class="px-4 pb-3">
                <p class="text-sm text-muted-foreground">Uses plus/minus icons to indicate state.</p>
              </CollapsibleContent>
            </Collapsible>
          </div>

          <!-- Disabled -->
          <div>
            <h3 class="text-lg font-semibold mb-3">Disabled</h3>
            <Collapsible disabled class="border rounded-lg opacity-60">
              <CollapsibleTrigger class="flex items-center justify-between w-full px-4 py-3 text-left cursor-not-allowed">
                <span class="font-medium">Disabled State</span>
                <Info class="h-4 w-4" />
              </CollapsibleTrigger>
              <CollapsibleContent class="px-4 pb-3">
                <p class="text-sm text-muted-foreground">This content is not accessible.</p>
              </CollapsibleContent>
            </Collapsible>
          </div>

        </div>
      </div>
    `,
  }),
}
