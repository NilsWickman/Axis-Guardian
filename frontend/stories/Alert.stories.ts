import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Terminal, AlertCircle, Info, CheckCircle, AlertTriangle } from 'lucide-vue-next'

// Mock data for different alert scenarios
const mockAlerts = {
  info: {
    icon: Info,
    title: 'Information',
    description: 'This is an informational alert with helpful details.',
    variant: 'default' as const,
  },
  success: {
    icon: CheckCircle,
    title: 'Success!',
    description: 'Your action has been completed successfully.',
    variant: 'default' as const,
  },
  warning: {
    icon: AlertTriangle,
    title: 'Warning',
    description: 'Please review this information before proceeding.',
    variant: 'default' as const,
  },
  error: {
    icon: AlertCircle,
    title: 'Error',
    description: 'Something went wrong. Please try again.',
    variant: 'destructive' as const,
  },
  terminal: {
    icon: Terminal,
    title: 'Heads up!',
    description: 'You can add components to your app using the cli.',
    variant: 'default' as const,
  },
}

const meta = {
  title: 'UI Components/Alert',
  component: Alert,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Displays a callout for user attention with customizable variants and content.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'destructive'],
      description: 'The visual style variant of the alert',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'default' },
      },
    },
    class: {
      control: { type: 'text' },
      description: 'Additional CSS classes',
    },
  },
} satisfies Meta<typeof Alert>

export default meta
type Story = StoryObj<typeof meta>

// Default story using mock data
export const Default: Story = {
  render: (args) => ({
    components: { Alert, AlertDescription, AlertTitle, Terminal },
    setup() {
      const alertData = mockAlerts.terminal
      return { args, alertData }
    },
    template: `
      <Alert v-bind="args" :variant="alertData.variant">
        <Terminal class="h-4 w-4" />
        <AlertTitle>{{ alertData.title }}</AlertTitle>
        <AlertDescription>{{ alertData.description }}</AlertDescription>
      </Alert>
    `,
  }),
}

// Variations using mock data
export const Information: Story = {
  render: (args) => ({
    components: { Alert, AlertDescription, AlertTitle, Info },
    setup() {
      const alertData = mockAlerts.info
      return { args, alertData }
    },
    template: `
      <Alert v-bind="args" :variant="alertData.variant">
        <Info class="h-4 w-4" />
        <AlertTitle>{{ alertData.title }}</AlertTitle>
        <AlertDescription>{{ alertData.description }}</AlertDescription>
      </Alert>
    `,
  }),
}

export const Success: Story = {
  render: (args) => ({
    components: { Alert, AlertDescription, AlertTitle, CheckCircle },
    setup() {
      const alertData = mockAlerts.success
      return { args, alertData }
    },
    template: `
      <Alert v-bind="args" :variant="alertData.variant">
        <CheckCircle class="h-4 w-4 text-green-600" />
        <AlertTitle>{{ alertData.title }}</AlertTitle>
        <AlertDescription>{{ alertData.description }}</AlertDescription>
      </Alert>
    `,
  }),
}

export const Warning: Story = {
  render: (args) => ({
    components: { Alert, AlertDescription, AlertTitle, AlertTriangle },
    setup() {
      const alertData = mockAlerts.warning
      return { args, alertData }
    },
    template: `
      <Alert v-bind="args" :variant="alertData.variant">
        <AlertTriangle class="h-4 w-4 text-yellow-600" />
        <AlertTitle>{{ alertData.title }}</AlertTitle>
        <AlertDescription>{{ alertData.description }}</AlertDescription>
      </Alert>
    `,
  }),
}

export const Error: Story = {
  render: (args) => ({
    components: { Alert, AlertDescription, AlertTitle, AlertCircle },
    setup() {
      const alertData = mockAlerts.error
      return { args, alertData }
    },
    template: `
      <Alert v-bind="args" :variant="alertData.variant">
        <AlertCircle class="h-4 w-4" />
        <AlertTitle>{{ alertData.title }}</AlertTitle>
        <AlertDescription>{{ alertData.description }}</AlertDescription>
      </Alert>
    `,
  }),
}

export const WithoutIcon: Story = {
  render: (args) => ({
    components: { Alert, AlertDescription, AlertTitle },
    setup() {
      return { args }
    },
    template: `
      <Alert v-bind="args">
        <AlertTitle>Simple Notification</AlertTitle>
        <AlertDescription>This alert doesn't have an icon.</AlertDescription>
      </Alert>
    `,
  }),
}

export const OnlyTitle: Story = {
  render: (args) => ({
    components: { Alert, AlertTitle },
    setup() {
      return { args }
    },
    template: `
      <Alert v-bind="args">
        <AlertTitle>Title Only Alert</AlertTitle>
      </Alert>
    `,
  }),
}

export const AllVariations: Story = {
  render: () => ({
    components: {
      Alert,
      AlertDescription,
      AlertTitle,
      Info,
      CheckCircle,
      AlertTriangle,
      AlertCircle,
    },
    setup() {
      return { mockAlerts }
    },
    template: `
      <div class="space-y-4">
        <Alert :variant="mockAlerts.info.variant">
          <Info class="h-4 w-4" />
          <AlertTitle>{{ mockAlerts.info.title }}</AlertTitle>
          <AlertDescription>{{ mockAlerts.info.description }}</AlertDescription>
        </Alert>
        
        <Alert :variant="mockAlerts.success.variant">
          <CheckCircle class="h-4 w-4 text-green-600" />
          <AlertTitle>{{ mockAlerts.success.title }}</AlertTitle>
          <AlertDescription>{{ mockAlerts.success.description }}</AlertDescription>
        </Alert>
        
        <Alert :variant="mockAlerts.warning.variant">
          <AlertTriangle class="h-4 w-4 text-yellow-600" />
          <AlertTitle>{{ mockAlerts.warning.title }}</AlertTitle>
          <AlertDescription>{{ mockAlerts.warning.description }}</AlertDescription>
        </Alert>
        
        <Alert :variant="mockAlerts.error.variant">
          <AlertCircle class="h-4 w-4" />
          <AlertTitle>{{ mockAlerts.error.title }}</AlertTitle>
          <AlertDescription>{{ mockAlerts.error.description }}</AlertDescription>
        </Alert>
      </div>
    `,
  }),
}
