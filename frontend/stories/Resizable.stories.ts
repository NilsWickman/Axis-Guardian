import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { ResizablePanel, ResizableHandle, ResizablePanelGroup } from '@/components/ui/resizable'

const meta = {
  title: 'UI Components/Resizable',
  component: ResizablePanelGroup,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Resizable panel components for creating flexible layouts with draggable dividers. Built on top of reka-ui splitter primitives.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    direction: {
      control: { type: 'select' },
      options: ['horizontal', 'vertical'],
      description: 'The direction of the resizable panels',
    },
    class: {
      control: { type: 'text' },
      description: 'Additional CSS classes',
    },
  },
  args: {
    direction: 'horizontal',
  },
} satisfies Meta<typeof ResizablePanelGroup>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => ({
    components: { ResizablePanelGroup, ResizablePanel, ResizableHandle },
    setup() {
      return { args }
    },
    template: `
      <div class="h-[200px] w-full">
        <ResizablePanelGroup v-bind="args">
          <ResizablePanel>
            <div class="flex h-full items-center justify-center p-6">
              <span class="font-semibold">One</span>
            </div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel>
            <div class="flex h-full items-center justify-center p-6">
              <span class="font-semibold">Two</span>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    `,
  }),
}

export const WithHandle: Story = {
  render: (args) => ({
    components: { ResizablePanelGroup, ResizablePanel, ResizableHandle },
    setup() {
      return { args }
    },
    template: `
      <div class="h-[200px] w-full">
        <ResizablePanelGroup
          v-bind="args"
          class="min-h-[200px] max-w-md rounded-lg border"
        >
          <ResizablePanel :defaultSize="25">
            <div class="flex h-full items-center justify-center p-6">
              <span class="font-semibold">Sidebar</span>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel :defaultSize="75">
            <div class="flex h-full items-center justify-center p-6">
              <span class="font-semibold">Content</span>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    `,
  }),
}

export const Vertical: Story = {
  args: {
    direction: 'vertical',
  },
  render: (args) => ({
    components: { ResizablePanelGroup, ResizablePanel, ResizableHandle },
    setup() {
      return { args }
    },
    template: `
      <div class="h-[400px] w-full">
        <ResizablePanelGroup v-bind="args" class="min-h-[400px] rounded-lg border">
          <ResizablePanel :defaultSize="50">
            <div class="flex h-full items-center justify-center p-6">
              <span class="font-semibold">Top</span>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel :defaultSize="50">
            <div class="flex h-full items-center justify-center p-6">
              <span class="font-semibold">Bottom</span>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    `,
  }),
}

export const ThreePanels: Story = {
  render: (args) => ({
    components: { ResizablePanelGroup, ResizablePanel, ResizableHandle },
    setup() {
      return { args }
    },
    template: `
      <div class="h-[200px] w-full">
        <ResizablePanelGroup v-bind="args" class="rounded-lg border">
          <ResizablePanel :defaultSize="25" :minSize="20" :maxSize="40">
            <div class="flex h-full items-center justify-center p-6">
              <span class="font-semibold">Left</span>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel :defaultSize="50">
            <div class="flex h-full items-center justify-center p-6">
              <span class="font-semibold">Center</span>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel :defaultSize="25" :minSize="20" :maxSize="40">
            <div class="flex h-full items-center justify-center p-6">
              <span class="font-semibold">Right</span>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    `,
  }),
}
