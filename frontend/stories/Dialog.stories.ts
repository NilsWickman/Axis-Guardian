import type { Meta, StoryObj } from '@storybook/vue3-vite'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Settings,
  User,
  Mail,
  Upload,
  AlertTriangle,
  FileText,
  Bell,
  CreditCard,
  Search,
  MessageSquare,
} from 'lucide-vue-next'

// Mock data for different dialog scenarios
const mockDialogData = {
  userProfile: {
    trigger: 'Edit Profile',
    title: 'Edit User Profile',
    description: 'Update your personal information and account settings.',
    fields: {
      name: 'John Doe',
      email: 'john.doe@example.com',
      bio: 'Software developer passionate about Vue.js and modern web technologies.',
    },
  },
  contactForm: {
    trigger: 'Contact Us',
    title: 'Get in Touch',
    description: "Send us a message and we'll get back to you as soon as possible.",
    fields: {
      name: '',
      email: '',
      subject: '',
      message: '',
    },
  },
  confirmation: {
    trigger: 'Delete Item',
    title: 'Confirm Deletion',
    description: 'This action cannot be undone. This will permanently delete the selected item.',
  },
}

const meta = {
  title: 'UI Components/Dialog',
  component: Dialog,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A dialog is a window overlaid on either the primary window or another dialog window.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    open: {
      control: { type: 'boolean' },
      description: 'Whether the dialog is open',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    onOpenChange: {
      action: 'openChange',
      description: 'Callback fired when the open state changes',
    },
  },
} satisfies Meta<typeof Dialog>

export default meta
type Story = StoryObj<typeof meta>

// Default dialog - simple content
export const Default: Story = {
  render: (args) => ({
    components: {
      Dialog,
      DialogContent,
      DialogDescription,
      DialogFooter,
      DialogHeader,
      DialogTitle,
      DialogTrigger,
      Button,
      Settings,
    },
    setup() {
      return { args }
    },
    template: `
      <Dialog v-bind="args">
        <DialogTrigger as-child>
          <Button>
            <Settings class="h-4 w-4" />
            Open Dialog
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Welcome to Dialog</DialogTitle>
            <DialogDescription>
              This is a basic dialog example. You can include any content here.
            </DialogDescription>
          </DialogHeader>
          <div class="py-4">
            <p class="text-sm text-muted-foreground">
              This is the main content area of the dialog. You can put any components or content here.
            </p>
          </div>
          <DialogFooter>
            <DialogTrigger as-child>
              <Button variant="outline">Cancel</Button>
            </DialogTrigger>
            <Button>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    `,
  }),
}

// Confirmation dialog (simple)
export const ConfirmationDialog: Story = {
  render: (args) => ({
    components: {
      Dialog,
      DialogContent,
      DialogDescription,
      DialogFooter,
      DialogHeader,
      DialogTitle,
      DialogTrigger,
      Button,
      AlertTriangle,
    },
    setup() {
      const confirmData = mockDialogData.confirmation
      return { args, confirmData }
    },
    template: `
      <Dialog v-bind="args">
        <DialogTrigger as-child>
          <Button variant="destructive">
            <AlertTriangle class="h-4 w-4" />
            {{ confirmData.trigger }}
          </Button>
        </DialogTrigger>
        <DialogContent class="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle class="flex items-center gap-2">
              <AlertTriangle class="h-5 w-5 text-destructive" />
              {{ confirmData.title }}
            </DialogTitle>
            <DialogDescription>{{ confirmData.description }}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogTrigger as-child>
              <Button variant="outline">Cancel</Button>
            </DialogTrigger>
            <Button variant="destructive">Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    `,
  }),
}

// Large content dialog with scroll
export const LargeContentDialog: Story = {
  render: (args) => ({
    components: {
      Dialog,
      DialogContent,
      DialogDescription,
      DialogFooter,
      DialogHeader,
      DialogTitle,
      DialogTrigger,
      Button,
      FileText,
    },
    setup() {
      return { args }
    },
    template: `
      <Dialog v-bind="args">
        <DialogTrigger as-child>
          <Button variant="outline">
            <FileText class="h-4 w-4" />
            Terms & Conditions
          </Button>
        </DialogTrigger>
        <DialogContent class="sm:max-w-[600px] max-h-[80vh] flex flex-col">
          <DialogHeader class="flex-shrink-0">
            <DialogTitle>Terms and Conditions</DialogTitle>
            <DialogDescription>
              Please read through our terms and conditions carefully before agreeing.
            </DialogDescription>
          </DialogHeader>
          <div class="flex-1 overflow-y-auto py-4 min-h-0">
            <div class="prose prose-sm max-w-none space-y-4">
              <h3 class="text-lg font-semibold">1. Introduction</h3>
              <p class="text-sm text-muted-foreground">
                Welcome to our service. These terms and conditions outline the rules and regulations 
                for the use of our website and services. By accessing this website, we assume you 
                accept these terms and conditions.
              </p>
              
              <h3 class="text-lg font-semibold">2. Use License</h3>
              <p class="text-sm text-muted-foreground">
                Permission is granted to temporarily download one copy of the materials on our 
                website for personal, non-commercial transitory viewing only. This is the grant 
                of a license, not a transfer of title.
              </p>
              
              <h3 class="text-lg font-semibold">3. Disclaimer</h3>
              <p class="text-sm text-muted-foreground">
                The materials on our website are provided on an 'as is' basis. To the fullest 
                extent permitted by law, this company excludes all representations, warranties, 
                conditions and terms.
              </p>
              
              <h3 class="text-lg font-semibold">4. Limitations</h3>
              <p class="text-sm text-muted-foreground">
                In no event shall our company or its suppliers be liable for any damages 
                (including, without limitation, damages for loss of data or profit, or due to 
                business interruption) arising out of the use or inability to use the materials 
                on our website.
              </p>
              
              <h3 class="text-lg font-semibold">5. Privacy Policy</h3>
              <p class="text-sm text-muted-foreground">
                Your privacy is important to us. Our privacy policy explains how we collect, 
                use, and protect your information when you use our service. By using our service, 
                you agree to the collection and use of information in accordance with our privacy policy.
              </p>
              
              <h3 class="text-lg font-semibold">6. Changes to Terms</h3>
              <p class="text-sm text-muted-foreground">
                We reserve the right to modify these terms at any time. We will notify users 
                of any material changes by posting the new terms on our website.
              </p>
            </div>
          </div>
          <DialogFooter class="flex-shrink-0">
            <DialogTrigger as-child>
              <Button variant="outline">Disagree</Button>
            </DialogTrigger>
            <Button>I Agree</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    `,
  }),
}

// User profile edit dialog with form
export const UserProfileForm: Story = {
  render: (args) => ({
    components: {
      Dialog,
      DialogContent,
      DialogDescription,
      DialogFooter,
      DialogHeader,
      DialogTitle,
      DialogTrigger,
      Button,
      Input,
      User,
    },
    setup() {
      const profileData = mockDialogData.userProfile
      return { args, profileData }
    },
    template: `
      <Dialog v-bind="args">
        <DialogTrigger as-child>
          <Button variant="outline">
            <User class="h-4 w-4" />
            {{ profileData.trigger }}
          </Button>
        </DialogTrigger>
        <DialogContent class="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{{ profileData.title }}</DialogTitle>
            <DialogDescription>{{ profileData.description }}</DialogDescription>
          </DialogHeader>
          <div class="grid gap-4 py-4">
            <div class="grid grid-cols-4 items-center gap-4">
              <label for="name" class="text-right text-sm font-medium">Name</label>
              <Input
                id="name"
                :model-value="profileData.fields.name"
                class="col-span-3"
                placeholder="Enter your name"
              />
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
              <label for="email" class="text-right text-sm font-medium">Email</label>
              <Input
                id="email"
                type="email"
                :model-value="profileData.fields.email"
                class="col-span-3"
                placeholder="Enter your email"
              />
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
              <label for="bio" class="text-right text-sm font-medium">Bio</label>
              <textarea
                id="bio"
                :value="profileData.fields.bio"
                class="col-span-3 min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Tell us about yourself"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogTrigger as-child>
              <Button variant="outline">Cancel</Button>
            </DialogTrigger>
            <Button>Save Profile</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    `,
  }),
}

// Contact form dialog
export const ContactFormDialog: Story = {
  render: (args) => ({
    components: {
      Dialog,
      DialogContent,
      DialogDescription,
      DialogFooter,
      DialogHeader,
      DialogTitle,
      DialogTrigger,
      Button,
      Input,
      Mail,
    },
    setup() {
      const contactData = mockDialogData.contactForm
      return { args, contactData }
    },
    template: `
      <Dialog v-bind="args">
        <DialogTrigger as-child>
          <Button>
            <Mail class="h-4 w-4" />
            {{ contactData.trigger }}
          </Button>
        </DialogTrigger>
        <DialogContent class="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{{ contactData.title }}</DialogTitle>
            <DialogDescription>{{ contactData.description }}</DialogDescription>
          </DialogHeader>
          <div class="grid gap-4 py-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="grid gap-2">
                <label for="contact-name" class="text-sm font-medium">Name</label>
                <Input id="contact-name" placeholder="Your name" />
              </div>
              <div class="grid gap-2">
                <label for="contact-email" class="text-sm font-medium">Email</label>
                <Input id="contact-email" type="email" placeholder="your.email@example.com" />
              </div>
            </div>
            <div class="grid gap-2">
              <label for="contact-subject" class="text-sm font-medium">Subject</label>
              <Input id="contact-subject" placeholder="What is this about?" />
            </div>
            <div class="grid gap-2">
              <label for="contact-message" class="text-sm font-medium">Message</label>
              <textarea
                id="contact-message"
                class="min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Your message..."
              />
            </div>
          </div>
          <DialogFooter>
            <DialogTrigger as-child>
              <Button variant="outline">Cancel</Button>
            </DialogTrigger>
            <Button>Send Message</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    `,
  }),
}

// Multiple dialogs showcase
export const MultipleDialogs: Story = {
  render: () => ({
    components: {
      Dialog,
      DialogContent,
      DialogDescription,
      DialogFooter,
      DialogHeader,
      DialogTitle,
      DialogTrigger,
      Button,
      Settings,
      User,
      Mail,
      Upload,
      Bell,
      CreditCard,
      Search,
      MessageSquare,
    },
    setup() {
      return { mockDialogData }
    },
    template: `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <!-- Settings Dialog -->
        <Dialog>
          <DialogTrigger as-child>
            <Button variant="outline" size="sm">
              <Settings class="h-4 w-4" />
              Settings
            </Button>
          </DialogTrigger>
          <DialogContent class="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Application Settings</DialogTitle>
              <DialogDescription>Manage your preferences and account settings.</DialogDescription>
            </DialogHeader>
            <div class="py-4 space-y-4">
              <div class="flex items-center justify-between">
                <label class="text-sm font-medium">Notifications</label>
                <input type="checkbox" checked class="rounded" />
              </div>
              <div class="flex items-center justify-between">
                <label class="text-sm font-medium">Dark Mode</label>
                <input type="checkbox" class="rounded" />
              </div>
            </div>
            <DialogFooter>
              <Button>Save Settings</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <!-- Profile Dialog -->
        <Dialog>
          <DialogTrigger as-child>
            <Button variant="outline" size="sm">
              <User class="h-4 w-4" />
              Profile
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>User Profile</DialogTitle>
              <DialogDescription>Update your profile information.</DialogDescription>
            </DialogHeader>
            <div class="py-4 space-y-4">
              <input placeholder="Full Name" class="w-full px-3 py-2 border rounded-md" />
              <input placeholder="Email" class="w-full px-3 py-2 border rounded-md" />
            </div>
            <DialogFooter>
              <Button>Update Profile</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <!-- Contact Dialog -->
        <Dialog>
          <DialogTrigger as-child>
            <Button variant="outline" size="sm">
              <Mail class="h-4 w-4" />
              Contact
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Contact Us</DialogTitle>
              <DialogDescription>Get in touch with our team.</DialogDescription>
            </DialogHeader>
            <div class="py-4 space-y-4">
              <input placeholder="Subject" class="w-full px-3 py-2 border rounded-md" />
              <textarea placeholder="Message" class="w-full px-3 py-2 border rounded-md min-h-[100px]" />
            </div>
            <DialogFooter>
              <Button>Send Message</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <!-- Upload Dialog -->
        <Dialog>
          <DialogTrigger as-child>
            <Button variant="outline" size="sm">
              <Upload class="h-4 w-4" />
              Upload
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Files</DialogTitle>
              <DialogDescription>Select files to upload to your library.</DialogDescription>
            </DialogHeader>
            <div class="py-4">
              <div class="border-2 border-dashed rounded-lg p-6 text-center">
                <Upload class="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p class="text-sm text-muted-foreground">Drag & drop files here</p>
              </div>
            </div>
            <DialogFooter>
              <Button>Upload Files</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <!-- Newsletter Dialog -->
        <Dialog>
          <DialogTrigger as-child>
            <Button variant="outline" size="sm">
              <Bell class="h-4 w-4" />
              Newsletter
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Subscribe</DialogTitle>
              <DialogDescription>Stay updated with our latest news.</DialogDescription>
            </DialogHeader>
            <div class="py-4">
              <input placeholder="Email Address" class="w-full px-3 py-2 border rounded-md" />
            </div>
            <DialogFooter>
              <Button>Subscribe</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <!-- Billing Dialog -->
        <Dialog>
          <DialogTrigger as-child>
            <Button variant="outline" size="sm">
              <CreditCard class="h-4 w-4" />
              Billing
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Payment</DialogTitle>
              <DialogDescription>Update your payment method.</DialogDescription>
            </DialogHeader>
            <div class="py-4 space-y-4">
              <input placeholder="Card Number" class="w-full px-3 py-2 border rounded-md" />
              <div class="grid grid-cols-2 gap-4">
                <input placeholder="MM/YY" class="px-3 py-2 border rounded-md" />
                <input placeholder="CVC" class="px-3 py-2 border rounded-md" />
              </div>
            </div>
            <DialogFooter>
              <Button>Update Payment</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <!-- Search Dialog -->
        <Dialog>
          <DialogTrigger as-child>
            <Button variant="outline" size="sm">
              <Search class="h-4 w-4" />
              Search
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Search</DialogTitle>
              <DialogDescription>Search through your content and files.</DialogDescription>
            </DialogHeader>
            <div class="py-4">
              <input placeholder="Search..." class="w-full px-3 py-2 border rounded-md" />
              <div class="mt-4 space-y-2">
                <div class="p-2 hover:bg-accent rounded-md cursor-pointer">
                  <p class="text-sm font-medium">Document 1</p>
                  <p class="text-xs text-muted-foreground">Last modified 2 days ago</p>
                </div>
                <div class="p-2 hover:bg-accent rounded-md cursor-pointer">
                  <p class="text-sm font-medium">Project Files</p>
                  <p class="text-xs text-muted-foreground">Last modified 1 week ago</p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <!-- Feedback Dialog -->
        <Dialog>
          <DialogTrigger as-child>
            <Button variant="outline" size="sm">
              <MessageSquare class="h-4 w-4" />
              Feedback
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Feedback</DialogTitle>
              <DialogDescription>Help us improve by sharing your thoughts.</DialogDescription>
            </DialogHeader>
            <div class="py-4 space-y-4">
              <div>
                <label class="text-sm font-medium">Rating</label>
                <div class="flex gap-1 mt-1">
                  <span class="cursor-pointer">⭐</span>
                  <span class="cursor-pointer">⭐</span>
                  <span class="cursor-pointer">⭐</span>
                  <span class="cursor-pointer">⭐</span>
                  <span class="cursor-pointer">⭐</span>
                </div>
              </div>
              <textarea placeholder="Your feedback..." class="w-full px-3 py-2 border rounded-md min-h-[100px]" />
            </div>
            <DialogFooter>
              <Button>Send Feedback</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    `,
  }),
}
