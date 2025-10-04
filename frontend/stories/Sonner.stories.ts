import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { Toaster } from '@/components/ui/sonner'
import { Button } from '@/components/ui/button'
import { toast } from 'vue-sonner'
import 'vue-sonner/style.css'

const meta = {
  title: 'UI Components/Sonner',
  component: Toaster,
  decorators: [
    (story, context) => ({
      template: '<div><Toaster class="pointer-events-auto" v-bind="toasterProps" /><story /></div>',
      components: { Toaster },
      setup() {
        return {
          toasterProps: context.args,
        }
      },
    }),
  ],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `A powerful toast notification system built on vue-sonner. 

**Setup:** Add the Toaster component to your App.vue file:

\`\`\`vue
<script setup lang="ts">
import { Toaster } from '@/components/ui/sonner'
import 'vue-sonner/style.css' // vue-sonner v2 requires this import
</script>

<template>
  <Toaster />
  
  <!-- For Nuxt with vue-sonner v1 -->
  <ClientOnly>
    <Toaster />
  </ClientOnly>
  
  <!-- For Nuxt with vue-sonner v2 -->
  <Toaster />
</template>
\`\`\`

**With Dialog:** Add \`pointer-events-auto\` class for dialog compatibility.`,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    position: {
      control: { type: 'select' },
      options: [
        'top-left',
        'top-center',
        'top-right',
        'bottom-left',
        'bottom-center',
        'bottom-right',
      ],
      description: 'Position of the toast notifications',
    },
    theme: {
      control: { type: 'select' },
      options: ['light', 'dark', 'system'],
      description: 'Theme variant for the toasts',
    },
    richColors: {
      control: { type: 'boolean' },
      description: 'Enable rich colors for different toast types',
    },
  },
} satisfies Meta<typeof Toaster>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => ({
    components: { Button },
    setup() {
      const showToast = () => {
        toast('Event has been created', {
          description: 'Sunday, December 03, 2023 at 9:00 AM',
          action: {
            label: 'Undo',
            onClick: () => console.log('Undo'),
          },
        })
      }
      return { showToast }
    },
    template: `
      <div class="p-8">
        <Button variant="outline" @click="showToast">
          Add to calendar
        </Button>
      </div>
    `,
  }),
}

export const ToastTypes: Story = {
  render: (args) => ({
    components: { Button },
    setup() {
      const showSuccess = () =>
        toast.success('Success!', { description: 'Your changes have been saved.' })
      const showError = () => toast.error('Error!', { description: 'Something went wrong.' })
      const showWarning = () =>
        toast.warning('Warning!', { description: 'Please check your input.' })
      const showInfo = () => toast.info('Info!', { description: 'Here is some information.' })

      return { showSuccess, showError, showWarning, showInfo }
    },
    template: `
      <div class="p-8 space-x-2">
        <Button @click="showSuccess" variant="default">Success</Button>
        <Button @click="showError" variant="destructive">Error</Button>
        <Button @click="showWarning" variant="outline">Warning</Button>
        <Button @click="showInfo" variant="secondary">Info</Button>
      </div>
    `,
  }),
}

export const WithAction: Story = {
  render: (args) => ({
    components: { Button },
    setup() {
      const showActionToast = () => {
        toast('Event created', {
          description: 'Your event has been scheduled.',
          action: {
            label: 'Undo',
            onClick: () => console.log('Undo clicked'),
          },
        })
      }
      return { showActionToast }
    },
    template: `
      <div class="p-8">
        <Button variant="outline" @click="showActionToast">
          Show Toast with Action
        </Button>
      </div>
    `,
  }),
}

export const PromiseToast: Story = {
  render: (args) => ({
    components: { Button },
    setup() {
      const showPromiseToast = () => {
        const uploadPromise = new Promise((resolve, reject) => {
          setTimeout(() => {
            Math.random() > 0.5 ? resolve('Upload complete') : reject(new Error('Upload failed'))
          }, 2000)
        })

        toast.promise(uploadPromise, {
          loading: 'Uploading...',
          success: 'File uploaded successfully!',
          error: 'Failed to upload file',
        })
      }
      return { showPromiseToast }
    },
    template: `
      <div class="p-8">
        <Button variant="outline" @click="showPromiseToast">
          Upload File
        </Button>
      </div>
    `,
  }),
}

export const LoadingToast: Story = {
  render: (args) => ({
    components: { Button },
    setup() {
      const showLoadingToast = () => {
        toast.loading('Processing...', {
          description: 'Please wait while we process your request',
        })
      }
      return { showLoadingToast }
    },
    template: `
      <div class="p-8">
        <Button variant="outline" @click="showLoadingToast">
          Show Loading Toast
        </Button>
      </div>
    `,
  }),
}

export const Positions: Story = {
  args: {
    position: 'top-right',
  },
  render: (args) => ({
    components: { Button },
    setup() {
      const positions = [
        'top-left',
        'top-center',
        'top-right',
        'bottom-left',
        'bottom-center',
        'bottom-right',
      ]

      const showToast = (position) => {
        toast(`Toast from ${position}`, {
          description: `This toast appears at ${position}`,
        })
      }

      return { positions, showToast, args }
    },
    template: `
      <div class="p-8 space-y-4">
        <h3 class="text-lg font-semibold">Toast Positions</h3>
        <p class="text-sm text-muted-foreground">Current position: {{ args.position }}</p>
        <div class="grid grid-cols-3 gap-4 max-w-md">
          <Button
            v-for="position in positions"
            :key="position"
            variant="outline"
            size="sm"
            @click="showToast(position)"
            :class="{ 'ring-2 ring-primary': args.position === position }"
          >
            {{ position }}
          </Button>
        </div>
      </div>
    `,
  }),
}

export const AutoShow: Story = {
  render: (args) => ({
    components: { Button },
    setup() {
      // Auto-show different types of toasts for preview
      setTimeout(() => {
        toast('Welcome to Sonner!', {
          description: 'This toast shows automatically for demo purposes',
        })
      }, 500)

      setTimeout(() => {
        toast.success('Auto success toast', {
          description: 'Demonstrates automatic toast display',
        })
      }, 1500)

      const showToast = () => {
        toast('Manual toast', {
          description: 'This one was triggered by clicking the button',
          action: {
            label: 'Got it',
            onClick: () => console.log('Manual toast action clicked'),
          },
        })
      }

      return { showToast }
    },
    template: `
      <div class="p-8">
        <div class="space-y-4">
          <h3 class="text-lg font-semibold">Auto-Display Demo</h3>
          <p class="text-sm text-muted-foreground">
            This story automatically shows toasts when loaded, plus you can trigger more manually.
          </p>
          <Button variant="outline" @click="showToast">
            Show Manual Toast
          </Button>
        </div>
      </div>
    `,
  }),
}

export const WithDialog: Story = {
  render: (args) => ({
    components: { Button },
    setup() {
      const showToast = () => {
        toast('Toast with Dialog support', {
          description: 'This toast works properly with dialogs using pointer-events-auto class.',
        })
      }
      return { showToast }
    },
    template: `
      <div class="p-8">
        <Button variant="outline" @click="showToast">
          Show Toast (Dialog Compatible)
        </Button>
        <p class="text-sm text-muted-foreground mt-4">
          This example uses the pointer-events-auto class for dialog compatibility.
        </p>
      </div>
    `,
  }),
}
