import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { Popover, PopoverContent, PopoverTrigger, PopoverAnchor } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Settings,
  HelpCircle,
  ChevronDown,
  Edit,
  Copy,
  Download,
  Trash2,
  Share2,
  Plus,
  Info,
} from 'lucide-vue-next'

const meta = {
  title: 'UI Components/Popover',
  component: Popover,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A popover component that displays floating content anchored to an element. Useful for menus, forms, and detailed information displays.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Popover>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => ({
    components: { Popover, PopoverTrigger, PopoverContent, Button },
    template: `
      <Popover>
        <PopoverTrigger as-child>
          <Button variant="outline">Open popover</Button>
        </PopoverTrigger>
        <PopoverContent class="w-80">
          <div class="space-y-2">
            <h4 class="font-medium leading-none">Dimensions</h4>
            <p class="text-sm text-muted-foreground">
              Set the dimensions for the layer.
            </p>
          </div>
        </PopoverContent>
      </Popover>
    `,
  }),
}

export const ActionMenu: Story = {
  render: () => ({
    components: {
      Popover,
      PopoverTrigger,
      PopoverContent,
      Button,
      Edit,
      Copy,
      Download,
      Trash2,
      Share2,
      ChevronDown,
    },
    template: `
      <Popover>
        <PopoverTrigger as-child>
          <Button variant="outline">
            Actions
            <ChevronDown class="ml-2 h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent class="w-48 p-1">
          <div class="space-y-1">
            <Button variant="ghost" class="w-full justify-start" size="sm">
              <Edit class="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button variant="ghost" class="w-full justify-start" size="sm">
              <Copy class="mr-2 h-4 w-4" />
              Copy
            </Button>
            <Button variant="ghost" class="w-full justify-start" size="sm">
              <Download class="mr-2 h-4 w-4" />
              Download
            </Button>
            <Button variant="ghost" class="w-full justify-start" size="sm">
              <Share2 class="mr-2 h-4 w-4" />
              Share
            </Button>
            <div class="border-t my-1"></div>
            <Button variant="ghost" class="w-full justify-start text-destructive hover:text-destructive" size="sm">
              <Trash2 class="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    `,
  }),
}

export const FormPopover: Story = {
  render: () => ({
    components: {
      Popover,
      PopoverTrigger,
      PopoverContent,
      Button,
      Label,
      Input,
      Plus,
    },
    template: `
      <Popover>
        <PopoverTrigger as-child>
          <Button>
            <Plus class="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </PopoverTrigger>
        <PopoverContent class="w-80">
          <form class="space-y-4">
            <div class="space-y-2">
              <h4 class="font-medium leading-none">Add New Item</h4>
              <p class="text-sm text-muted-foreground">
                Enter the details for the new item.
              </p>
            </div>
            
            <div class="space-y-3">
              <div class="space-y-2">
                <Label for="name" class="text-sm font-medium">Name</Label>
                <Input id="name" placeholder="Item name" />
              </div>
              
              <div class="space-y-2">
                <Label for="description" class="text-sm font-medium">Description</Label>
                <Input id="description" placeholder="Brief description" />
              </div>
              
              <div class="space-y-2">
                <Label for="category" class="text-sm font-medium">Category</Label>
                <select id="category" class="w-full text-sm border rounded px-3 py-2">
                  <option value="">Select category</option>
                  <option value="work">Work</option>
                  <option value="personal">Personal</option>
                  <option value="project">Project</option>
                </select>
              </div>
            </div>
            
            <div class="flex space-x-2 pt-2">
              <Button type="submit" size="sm" class="flex-1">Add Item</Button>
              <Button type="button" size="sm" variant="outline" class="flex-1">Cancel</Button>
            </div>
          </form>
        </PopoverContent>
      </Popover>
    `,
  }),
}

export const HelpTooltip: Story = {
  render: () => ({
    components: { Popover, PopoverTrigger, PopoverContent, Button, HelpCircle },
    template: `
      <div class="flex items-center space-x-2">
        <span class="text-sm font-medium">Complex Setting</span>
        <Popover>
          <PopoverTrigger as-child>
            <Button variant="ghost" size="icon" class="h-4 w-4 p-0">
              <HelpCircle class="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent class="w-80" side="top">
            <div class="space-y-2">
              <h4 class="font-medium">What is this setting?</h4>
              <p class="text-sm text-muted-foreground">
                This setting controls how your application handles complex data transformations. 
                When enabled, it will automatically optimize performance but may use more memory.
              </p>
              <div class="pt-2">
                <Button size="sm" variant="outline">
                  Learn more
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    `,
  }),
}

export const WithCustomAnchor: Story = {
  render: () => ({
    components: {
      Popover,
      PopoverTrigger,
      PopoverContent,
      PopoverAnchor,
      Button,
    },
    template: `
      <div class="flex items-center space-x-4">
        <Popover>
          <PopoverAnchor>
            <div class="w-20 h-10 bg-primary rounded flex items-center justify-center text-primary-foreground">
              Anchor
            </div>
          </PopoverAnchor>
          <PopoverTrigger as-child>
            <Button>Click me</Button>
          </PopoverTrigger>
          <PopoverContent class="w-64">
            <div class="space-y-2">
              <h4 class="font-medium">Custom Anchor</h4>
              <p class="text-sm text-muted-foreground">
                This popover is anchored to a different element than the trigger.
              </p>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    `,
  }),
}

export const PositionVariants: Story = {
  render: () => ({
    components: { Popover, PopoverTrigger, PopoverContent, Button },
    template: `
      <div class="grid grid-cols-3 gap-4 p-8">
        <div class="flex justify-center">
          <Popover>
            <PopoverTrigger as-child>
              <Button variant="outline">Top</Button>
            </PopoverTrigger>
            <PopoverContent side="top" class="w-48">
              <p class="text-sm">Positioned at the top</p>
            </PopoverContent>
          </Popover>
        </div>
        
        <div></div>
        
        <div class="flex justify-center">
          <Popover>
            <PopoverTrigger as-child>
              <Button variant="outline">Top Start</Button>
            </PopoverTrigger>
            <PopoverContent side="top" align="start" class="w-48">
              <p class="text-sm">Top aligned to start</p>
            </PopoverContent>
          </Popover>
        </div>
        
        <div class="flex justify-center">
          <Popover>
            <PopoverTrigger as-child>
              <Button variant="outline">Left</Button>
            </PopoverTrigger>
            <PopoverContent side="left" class="w-48">
              <p class="text-sm">Positioned to the left</p>
            </PopoverContent>
          </Popover>
        </div>
        
        <div class="flex justify-center">
          <Popover>
            <PopoverTrigger as-child>
              <Button variant="outline">Center</Button>
            </PopoverTrigger>
            <PopoverContent class="w-48">
              <p class="text-sm">Default position</p>
            </PopoverContent>
          </Popover>
        </div>
        
        <div class="flex justify-center">
          <Popover>
            <PopoverTrigger as-child>
              <Button variant="outline">Right</Button>
            </PopoverTrigger>
            <PopoverContent side="right" class="w-48">
              <p class="text-sm">Positioned to the right</p>
            </PopoverContent>
          </Popover>
        </div>
        
        <div class="flex justify-center">
          <Popover>
            <PopoverTrigger as-child>
              <Button variant="outline">Bottom Start</Button>
            </PopoverTrigger>
            <PopoverContent side="bottom" align="start" class="w-48">
              <p class="text-sm">Bottom aligned to start</p>
            </PopoverContent>
          </Popover>
        </div>
        
        <div class="flex justify-center">
          <Popover>
            <PopoverTrigger as-child>
              <Button variant="outline">Bottom</Button>
            </PopoverTrigger>
            <PopoverContent side="bottom" class="w-48">
              <p class="text-sm">Positioned at the bottom</p>
            </PopoverContent>
          </Popover>
        </div>
        
        <div></div>
      </div>
    `,
  }),
}
