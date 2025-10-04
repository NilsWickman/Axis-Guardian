import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { Progress } from '@/components/ui/progress'
import { Download, Upload, HardDrive, Wifi, Package, Loader } from 'lucide-vue-next'
import { ref, onMounted, onUnmounted } from 'vue'

// Mock data for different progress scenarios
const mockProgressData = {
  installation: {
    value: 45,
    max: 100,
    label: 'Installing packages...',
    icon: Package,
    description: 'Installing dependencies (45%)',
    color: 'text-purple-600',
  },
  storageUsage: {
    value: 78,
    max: 100,
    label: 'Storage usage',
    icon: HardDrive,
    description: '78 GB of 100 GB used',
    color: 'text-orange-600',
  },
  networkSpeed: {
    value: 92,
    max: 100,
    label: 'Network speed test',
    icon: Wifi,
    description: '92 Mbps download speed',
    color: 'text-cyan-600',
  },
  fileDownload: {
    value: 85,
    max: 100,
    label: 'Downloading update...',
    icon: Download,
    description: '850 MB of 1 GB downloaded',
    color: 'text-green-600',
  },
}

const meta = {
  title: 'UI Components/Progress',
  component: Progress,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Displays an indicator showing the completion progress of a task, typically displayed as a progress bar.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    modelValue: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      description: 'The progress value',
      table: {
        type: { summary: 'number | null' },
        defaultValue: { summary: '0' },
      },
    },
    max: {
      control: { type: 'number', min: 1, max: 1000, step: 1 },
      description: 'The maximum progress value',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '100' },
      },
    },
    getValueLabel: {
      control: false,
      description: 'A function to get the accessible label text in a human-readable format',
      table: {
        type: { summary: '(value: number | null | undefined, max: number) => string | undefined' },
      },
    },
    class: {
      control: { type: 'text' },
      description: 'Additional CSS classes',
    },
  },
} satisfies Meta<typeof Progress>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    modelValue: 50,
    max: 100,
  },
}

export const MultipleProgressBars: Story = {
  render: () => ({
    components: { Progress, Upload, Download, HardDrive, Wifi },
    setup() {
      return {
        mockProgressData: {
          download: mockProgressData.fileDownload,
          storage: mockProgressData.storageUsage,
          network: mockProgressData.networkSpeed,
        },
      }
    },
    template: `
      <div class="w-full max-w-lg space-y-6">
        <!-- File Download -->
        <div class="space-y-2">
          <div class="flex items-center gap-2 text-sm font-medium">
            <Download class="h-4 w-4 text-green-600" />
            {{ mockProgressData.download.label }}
          </div>
          <Progress :model-value="mockProgressData.download.value" />
          <div class="flex justify-between text-sm text-muted-foreground">
            <span>{{ mockProgressData.download.description }}</span>
            <span>{{ mockProgressData.download.value }}%</span>
          </div>
        </div>

        <!-- Storage Usage -->
        <div class="space-y-2">
          <div class="flex items-center gap-2 text-sm font-medium">
            <HardDrive class="h-4 w-4 text-orange-600" />
            {{ mockProgressData.storage.label }}
          </div>
          <Progress :model-value="mockProgressData.storage.value" class="h-3" />
          <div class="flex justify-between text-sm text-muted-foreground">
            <span>{{ mockProgressData.storage.description }}</span>
            <span>{{ mockProgressData.storage.value }}%</span>
          </div>
        </div>

        <!-- Network Speed -->
        <div class="space-y-2">
          <div class="flex items-center gap-2 text-sm font-medium">
            <Wifi class="h-4 w-4 text-cyan-600" />
            {{ mockProgressData.network.label }}
          </div>
          <Progress :model-value="mockProgressData.network.value" class="h-4" />
          <div class="flex justify-between text-sm text-muted-foreground">
            <span>{{ mockProgressData.network.description }}</span>
            <span>{{ mockProgressData.network.value }}%</span>
          </div>
        </div>
      </div>
    `,
  }),
}

export const InstallationWithAnimation: Story = {
  render: (args) => ({
    components: { Progress, Package, Loader },
    setup() {
      const progressData = mockProgressData.installation
      const currentProgress = ref(0)
      const isInstalling = ref(true)
      let interval: NodeJS.Timeout

      onMounted(() => {
        interval = setInterval(() => {
          if (currentProgress.value < 100) {
            currentProgress.value += Math.random() * 3
          } else {
            isInstalling.value = false
            clearInterval(interval)
          }
        }, 200)
      })

      onUnmounted(() => {
        if (interval) clearInterval(interval)
      })

      return { args, progressData, currentProgress, isInstalling }
    },
    template: `
      <div class="w-full max-w-md space-y-2">
        <div class="flex items-center gap-2 text-sm font-medium">
          <Loader v-if="isInstalling" class="h-4 w-4 animate-spin" :class="progressData.color" />
          <Package v-else class="h-4 w-4" :class="progressData.color" />
          {{ isInstalling ? 'Installing packages...' : 'Installation complete!' }}
        </div>
        <Progress v-bind="args" :model-value="Math.min(currentProgress, 100)" />
        <div class="flex justify-between text-sm text-muted-foreground">
          <span v-if="isInstalling">Installing dependencies</span>
          <span v-else>All packages installed successfully</span>
          <span>{{ Math.round(Math.min(currentProgress, 100)) }}%</span>
        </div>
      </div>
    `,
  }),
  args: {
    max: 100,
  },
}
