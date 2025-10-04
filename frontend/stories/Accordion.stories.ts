import type { Meta, StoryObj } from '@storybook/vue3-vite'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { User, Bell, Shield, CreditCard, Palette } from 'lucide-vue-next'

// Mock data for different accordion scenarios
const mockAccordionData = {
  faq: [
    {
      value: 'faq-1',
      title: 'What is your return policy?',
      content:
        "We offer a 30-day return policy for all unused items in their original packaging. Items must be returned with proof of purchase and may be subject to a restocking fee. Digital products are generally non-refundable unless there's a technical issue.",
    },
    {
      value: 'faq-2',
      title: 'How long does shipping take?',
      content:
        'Standard shipping takes 3-5 business days, while express shipping takes 1-2 business days. International orders may take 7-14 business days depending on the destination. We provide tracking information for all shipments.',
    },
    {
      value: 'faq-3',
      title: 'Do you offer technical support?',
      content:
        'Yes, we provide 24/7 technical support through email, phone, and live chat. Our technical team is available to help with installation, troubleshooting, and product questions. Premium customers get priority support.',
    },
    {
      value: 'faq-4',
      title: 'Can I upgrade my plan at any time?',
      content:
        'Absolutely! You can upgrade your plan at any time from your account dashboard. The upgraded features will be available immediately, and billing will be prorated accordingly.',
    },
    {
      value: 'faq-5',
      title: 'Is my data secure?',
      content:
        'We take security seriously. All data is encrypted in transit and at rest using industry-standard AES-256 encryption. We also comply with GDPR, SOC 2, and other security frameworks.',
    },
  ],
  settings: [
    {
      value: 'account',
      title: 'Account Settings',
      icon: User,
      content:
        'Manage your account information, password, and security settings. You can also update your email preferences and notification settings here. Two-factor authentication is recommended for enhanced security.',
    },
    {
      value: 'privacy',
      title: 'Privacy & Security',
      icon: Shield,
      content:
        'Control your privacy settings, data sharing preferences, and security options. Enable two-factor authentication for enhanced account security. Review and manage your data export requests.',
    },
    {
      value: 'notifications',
      title: 'Notifications',
      icon: Bell,
      content:
        'Customize which notifications you receive via email, SMS, and push notifications. Set your communication preferences for updates and promotions. Configure notification frequency and timing.',
    },
    {
      value: 'billing',
      title: 'Billing & Payments',
      icon: CreditCard,
      content:
        'View your billing history, manage payment methods, and update subscription settings. Download invoices and receipts for your records. Set up automatic payments and billing alerts.',
    },
    {
      value: 'appearance',
      title: 'Appearance',
      icon: Palette,
      content:
        'Customize your interface with theme options, color schemes, and layout preferences. Choose between light, dark, or system theme. Adjust font sizes and content density.',
    },
  ],
}

const meta = {
  title: 'UI Components/Accordion',
  component: Accordion,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A collapsible component for organizing content into sections that can be expanded or collapsed.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: { type: 'select' },
      options: ['single', 'multiple'],
      description: 'Whether one or multiple accordion items can be open at the same time',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'single' },
      },
    },
    collapsible: {
      control: { type: 'boolean' },
      description: 'When type is "single", allows the user to close an open item',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    defaultValue: {
      control: { type: 'text' },
      description: 'The value of the item to expand when initially rendered',
      table: {
        type: { summary: 'string | string[]' },
      },
    },
    modelValue: {
      control: { type: 'text' },
      description: 'The controlled value of the item to expand',
      table: {
        type: { summary: 'string | string[]' },
      },
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'When true, prevents the user from interacting with the accordion',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    orientation: {
      control: { type: 'select' },
      options: ['vertical', 'horizontal'],
      description: 'The orientation of the accordion',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'vertical' },
      },
    },
    dir: {
      control: { type: 'select' },
      options: ['ltr', 'rtl'],
      description: 'The reading direction of the accordion',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'ltr' },
      },
    },
  },
} satisfies Meta<typeof Accordion>

export default meta
type Story = StoryObj<typeof meta>

// Default single accordion - Basic FAQ implementation
export const Default: Story = {
  name: 'Default',
  render: (args) => ({
    components: { Accordion, AccordionContent, AccordionItem, AccordionTrigger },
    setup() {
      const faqData = mockAccordionData.faq.slice(0, 3) // Limit for cleaner default view
      return { args, faqData }
    },
    template: `
      <Accordion v-bind="args" type="single" collapsible class="w-full max-w-2xl">
        <AccordionItem v-for="item in faqData" :key="item.value" :value="item.value">
          <AccordionTrigger>{{ item.title }}</AccordionTrigger>
          <AccordionContent>{{ item.content }}</AccordionContent>
        </AccordionItem>
      </Accordion>
    `,
  }),
  args: {
    type: 'single',
    collapsible: true,
  },
}

// Single accordion with default open item
export const SingleWithDefault: Story = {
  name: 'Single with Default Open',
  render: () => ({
    components: { Accordion, AccordionContent, AccordionItem, AccordionTrigger },
    setup() {
      const faqData = mockAccordionData.faq.slice(0, 3)
      return { faqData }
    },
    template: `
      <Accordion type="single" collapsible default-value="faq-2" class="w-full max-w-2xl">
        <AccordionItem v-for="item in faqData" :key="item.value" :value="item.value">
          <AccordionTrigger>{{ item.title }}</AccordionTrigger>
          <AccordionContent>{{ item.content }}</AccordionContent>
        </AccordionItem>
      </Accordion>
    `,
  }),
}

// Multiple accordion allowing multiple open items
export const Multiple: Story = {
  name: 'Multiple Open Items',
  render: () => ({
    components: { Accordion, AccordionContent, AccordionItem, AccordionTrigger },
    setup() {
      const settingsData = mockAccordionData.settings.slice(0, 4)
      return { settingsData }
    },
    template: `
      <Accordion type="multiple" class="w-full max-w-2xl">
        <AccordionItem v-for="item in settingsData" :key="item.value" :value="item.value">
          <AccordionTrigger>{{ item.title }}</AccordionTrigger>
          <AccordionContent>{{ item.content }}</AccordionContent>
        </AccordionItem>
      </Accordion>
    `,
  }),
}

// Multiple accordion with default open items
export const MultipleWithDefaults: Story = {
  name: 'Multiple with Defaults',
  render: () => ({
    components: { Accordion, AccordionContent, AccordionItem, AccordionTrigger },
    setup() {
      const settingsData = mockAccordionData.settings.slice(0, 4)
      return { settingsData }
    },
    template: `
      <Accordion type="multiple" :default-value="['account', 'notifications']" class="w-full max-w-2xl">
        <AccordionItem v-for="item in settingsData" :key="item.value" :value="item.value">
          <AccordionTrigger>{{ item.title }}</AccordionTrigger>
          <AccordionContent>{{ item.content }}</AccordionContent>
        </AccordionItem>
      </Accordion>
    `,
  }),
}

// Accordion with icons for each item
export const WithIcons: Story = {
  name: 'With Icons',
  render: () => ({
    components: {
      Accordion,
      AccordionContent,
      AccordionItem,
      AccordionTrigger,
    },
    setup() {
      const settingsData = mockAccordionData.settings
      return { settingsData }
    },
    template: `
      <Accordion type="single" collapsible class="w-full max-w-2xl">
        <AccordionItem v-for="item in settingsData" :key="item.value" :value="item.value">
          <AccordionTrigger>
            <div class="flex items-center gap-3">
              <component :is="item.icon" class="h-4 w-4 text-muted-foreground" />
              {{ item.title }}
            </div>
          </AccordionTrigger>
          <AccordionContent>{{ item.content }}</AccordionContent>
        </AccordionItem>
      </Accordion>
    `,
  }),
}

// Disabled accordion
export const Disabled: Story = {
  name: 'Disabled',
  render: () => ({
    components: { Accordion, AccordionContent, AccordionItem, AccordionTrigger },
    setup() {
      const faqData = mockAccordionData.faq.slice(0, 3)
      return { faqData }
    },
    template: `
      <Accordion type="single" collapsible disabled class="w-full max-w-2xl">
        <AccordionItem v-for="item in faqData" :key="item.value" :value="item.value">
          <AccordionTrigger>{{ item.title }}</AccordionTrigger>
          <AccordionContent>{{ item.content }}</AccordionContent>
        </AccordionItem>
      </Accordion>
    `,
  }),
}

// All variations comparison
export const AllVariations: Story = {
  name: 'All Variations',
  render: () => ({
    components: { Accordion, AccordionContent, AccordionItem, AccordionTrigger },
    setup() {
      const faqData = mockAccordionData.faq.slice(0, 2)
      const settingsData = mockAccordionData.settings.slice(0, 2)
      return { faqData, settingsData }
    },
    template: `
      <div class="space-y-8 w-full max-w-4xl">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 class="text-lg font-semibold mb-3">Single Collapsible</h3>
            <Accordion type="single" collapsible class="w-full">
              <AccordionItem v-for="item in faqData" :key="item.value" :value="item.value">
                <AccordionTrigger>{{ item.title }}</AccordionTrigger>
                <AccordionContent>{{ item.content }}</AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
          
          <div>
            <h3 class="text-lg font-semibold mb-3">Multiple Open</h3>
            <Accordion type="multiple" :default-value="['account']" class="w-full">
              <AccordionItem v-for="item in settingsData" :key="item.value" :value="item.value">
                <AccordionTrigger>
                  <div class="flex items-center gap-2">
                    <component :is="item.icon" class="h-4 w-4" />
                    {{ item.title }}
                  </div>
                </AccordionTrigger>
                <AccordionContent>{{ item.content }}</AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </div>
    `,
  }),
}
