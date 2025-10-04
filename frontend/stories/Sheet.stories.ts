import type { Meta, StoryObj } from '@storybook/vue3-vite'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Edit } from 'lucide-vue-next'

const meta = {
  title: 'UI Components/Sheet',
  component: Sheet,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A sheet is a sliding panel that appears from the edge of the screen. Built on top of Reka UI Dialog primitives.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Sheet>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => ({
    components: {
      Sheet,
      SheetTrigger,
      SheetContent,
      SheetHeader,
      SheetTitle,
      SheetDescription,
      SheetFooter,
      Button,
    },
    template: `
      <Sheet>
        <SheetTrigger as-child>
          <Button variant="outline">Open Sheet</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Sheet Title</SheetTitle>
            <SheetDescription>
              This is a basic sheet example with a title, description, and footer buttons.
            </SheetDescription>
          </SheetHeader>
          <div class="py-4">
            <p class="text-sm text-muted-foreground">
              Sheet content goes here. You can add any content like forms, lists, or other components.
            </p>
          </div>
          <SheetFooter>
            <Button variant="outline">Cancel</Button>
            <Button>Save Changes</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    `,
  }),
}

export const Sides: Story = {
  render: () => ({
    components: {
      Sheet,
      SheetTrigger,
      SheetContent,
      SheetHeader,
      SheetTitle,
      SheetDescription,
      Button,
    },
    template: `
      <div class="flex flex-wrap gap-4">
        <Sheet v-for="side in ['left', 'right', 'top', 'bottom']" :key="side">
          <SheetTrigger as-child>
            <Button variant="outline">{{ side }} Sheet</Button>
          </SheetTrigger>
          <SheetContent :side="side" :class="{
            'w-[300px]': side === 'left' || side === 'right',
            'h-[300px]': side === 'top' || side === 'bottom'
          }">
            <SheetHeader>
              <SheetTitle>{{ side.charAt(0).toUpperCase() + side.slice(1) }} Sheet</SheetTitle>
              <SheetDescription>
                This sheet appears from the {{ side }} side of the screen.
              </SheetDescription>
            </SheetHeader>
            <div class="py-4">
              <p class="text-sm text-muted-foreground">
                Sheet content for {{ side }} positioning.
              </p>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    `,
  }),
}

export const Form: Story = {
  render: () => ({
    components: {
      Sheet,
      SheetTrigger,
      SheetContent,
      SheetHeader,
      SheetTitle,
      SheetDescription,
      SheetFooter,
      Button,
      Input,
      Label,
      Edit,
    },
    template: `
      <Sheet>
        <SheetTrigger as-child>
          <Button variant="outline">
            <Edit class="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Edit Profile</SheetTitle>
            <SheetDescription>
              Make changes to your profile here. Click save when you're done.
            </SheetDescription>
          </SheetHeader>
          <div class="grid gap-4 py-4">
            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="name" class="text-right">
                Name
              </Label>
              <Input
                id="name"
                value="Pedro Duarte"
                class="col-span-3"
              />
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="username" class="text-right">
                Username
              </Label>
              <Input
                id="username"
                value="@peduarte"
                class="col-span-3"
              />
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="email" class="text-right">
                Email
              </Label>
              <Input
                id="email"
                value="pedro@example.com"
                type="email"
                class="col-span-3"
              />
            </div>
          </div>
          <SheetFooter>
            <Button variant="outline">Cancel</Button>
            <Button type="submit">Save changes</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    `,
  }),
}
