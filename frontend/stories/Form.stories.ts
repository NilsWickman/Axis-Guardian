import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { ref, computed } from 'vue'
import {
  User,
  Mail,
  Lock,
  Phone,
  Calendar,
  MapPin,
  CreditCard,
  Globe,
  Building,
  Briefcase,
  Settings,
  Bell,
  Shield,
  Check,
  X,
  AlertCircle,
  Info,
} from 'lucide-vue-next'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import * as z from 'zod'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

// Mock data for forms
const mockFormData = {
  countries: [
    { value: 'us', label: 'United States' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'ca', label: 'Canada' },
    { value: 'au', label: 'Australia' },
    { value: 'de', label: 'Germany' },
    { value: 'fr', label: 'France' },
    { value: 'jp', label: 'Japan' },
    { value: 'cn', label: 'China' },
  ],
  industries: [
    { value: 'tech', label: 'Technology' },
    { value: 'finance', label: 'Finance' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'education', label: 'Education' },
    { value: 'retail', label: 'Retail' },
    { value: 'manufacturing', label: 'Manufacturing' },
    { value: 'other', label: 'Other' },
  ],
  teamSizes: [
    { value: '1-10', label: '1-10 employees' },
    { value: '11-50', label: '11-50 employees' },
    { value: '51-200', label: '51-200 employees' },
    { value: '201-500', label: '201-500 employees' },
    { value: '500+', label: '500+ employees' },
  ],
  preferences: [
    { id: 'email', label: 'Email notifications', description: 'Receive updates via email' },
    { id: 'sms', label: 'SMS notifications', description: 'Receive updates via SMS' },
    { id: 'push', label: 'Push notifications', description: 'Receive push notifications' },
    { id: 'newsletter', label: 'Newsletter', description: 'Weekly newsletter subscription' },
  ],
}

const meta: Meta<typeof Form> = {
  title: 'UI Components/Form',
  component: Form,
  tags: ['autodocs'],
  argTypes: {},
  decorators: [
    (story) => ({
      components: { story },
      template: '<div class="flex items-center justify-center min-h-[400px] p-8"><story /></div>',
    }),
  ],
}

export default meta
type Story = StoryObj<typeof meta>

// Default login form
export const Default: Story = {
  render: (args) => ({
    components: {
      Form,
      FormField,
      FormItem,
      FormLabel,
      FormControl,
      FormDescription,
      FormMessage,
      Input,
      Button,
      User,
      Lock,
    },
    setup() {
      const formSchema = toTypedSchema(
        z.object({
          email: z.string().min(1, 'Email is required').email('Please enter a valid email'),
          password: z.string().min(8, 'Password must be at least 8 characters'),
        })
      )

      const form = useForm({
        validationSchema: formSchema,
      })

      const onSubmit = form.handleSubmit((values) => {
        console.log('Login successful!', values)
        alert('Login successful!')
      })

      return { form, onSubmit }
    },
    template: `
      <Form @submit="onSubmit" class="w-[400px] space-y-4">
        <FormField v-slot="{ componentField }" name="email">
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <div class="relative">
                <User class="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  v-bind="componentField"
                  type="email" 
                  placeholder="Enter your email"
                  class="pl-9"
                />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>
        
        <FormField v-slot="{ componentField }" name="password">
          <FormItem>
            <FormLabel>Password</FormLabel>
            <FormControl>
              <div class="relative">
                <Lock class="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  v-bind="componentField"
                  type="password" 
                  placeholder="Enter your password"
                  class="pl-9"
                />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>
        
        <Button type="submit" class="w-full">
          Sign In
        </Button>
      </Form>
    `,
  }),
}

// Registration form with multiple fields
export const RegistrationForm: Story = {
  render: () => ({
    components: {
      Form,
      FormField,
      FormItem,
      FormLabel,
      FormControl,
      FormDescription,
      FormMessage,
      Input,
      Button,
      Checkbox,
      Label,
      User,
      Mail,
      Lock,
      Phone,
    },
    setup() {
      const formSchema = toTypedSchema(
        z
          .object({
            firstName: z.string().min(1, 'First name is required'),
            lastName: z.string().min(1, 'Last name is required'),
            email: z.string().min(1, 'Email is required').email('Please enter a valid email'),
            phone: z.string().optional(),
            password: z.string().min(8, 'Password must be at least 8 characters'),
            confirmPassword: z.string(),
            acceptTerms: z.boolean().refine((val) => val === true, 'You must accept the terms'),
            newsletter: z.boolean().optional(),
          })
          .refine((data) => data.password === data.confirmPassword, {
            message: "Passwords don't match",
            path: ['confirmPassword'],
          })
      )

      const form = useForm({
        validationSchema: formSchema,
        initialValues: {
          acceptTerms: false,
          newsletter: false,
        },
      })

      const onSubmit = form.handleSubmit((values) => {
        console.log('Registration data:', values)
        alert('Registration successful!')
      })

      return { form, onSubmit }
    },
    template: `
      <Form @submit="onSubmit" class="w-[500px] space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <FormField v-slot="{ componentField }" name="firstName">
            <FormItem>
              <FormLabel>First Name</FormLabel>
              <FormControl>
                <Input v-bind="componentField" placeholder="John" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>
          
          <FormField v-slot="{ componentField }" name="lastName">
            <FormItem>
              <FormLabel>Last Name</FormLabel>
              <FormControl>
                <Input v-bind="componentField" placeholder="Doe" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>
        </div>
        
        <FormField v-slot="{ componentField }" name="email">
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <div class="relative">
                <Mail class="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  v-bind="componentField"
                  type="email" 
                  placeholder="john.doe@example.com"
                  class="pl-9"
                />
              </div>
            </FormControl>
            <FormDescription>
              We'll never share your email with anyone else.
            </FormDescription>
            <FormMessage />
          </FormItem>
        </FormField>
        
        <FormField v-slot="{ componentField }" name="phone">
          <FormItem>
            <FormLabel>Phone Number</FormLabel>
            <FormControl>
              <div class="relative">
                <Phone class="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  v-bind="componentField"
                  type="tel" 
                  placeholder="+1 (555) 123-4567"
                  class="pl-9"
                />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>
        
        <div class="grid grid-cols-2 gap-4">
          <FormField v-slot="{ componentField }" name="password">
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input v-bind="componentField" type="password" />
              </FormControl>
              <FormDescription>
                Minimum 8 characters
              </FormDescription>
              <FormMessage />
            </FormItem>
          </FormField>
          
          <FormField v-slot="{ componentField }" name="confirmPassword">
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <Input v-bind="componentField" type="password" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>
        </div>
        
        <div class="space-y-2">
          <FormField v-slot="{ value, handleChange }" name="acceptTerms" type="checkbox">
            <FormItem>
              <div class="flex items-center space-x-2">
                <FormControl>
                  <Checkbox 
                    :checked="value"
                    @update:checked="handleChange"
                  />
                </FormControl>
                <Label class="text-sm">
                  I accept the <a href="#" class="underline">terms and conditions</a>
                </Label>
              </div>
              <FormMessage />
            </FormItem>
          </FormField>
          
          <FormField v-slot="{ value, handleChange }" name="newsletter" type="checkbox">
            <FormItem>
              <div class="flex items-center space-x-2">
                <FormControl>
                  <Checkbox 
                    :checked="value"
                    @update:checked="handleChange"
                  />
                </FormControl>
                <Label class="text-sm">
                  Send me promotional emails and updates
                </Label>
              </div>
              <FormMessage />
            </FormItem>
          </FormField>
        </div>
        
        <Button type="submit" class="w-full">
          Create Account
        </Button>
      </Form>
    `,
  }),
}

// Contact form with textarea
export const ContactForm: Story = {
  render: () => ({
    components: {
      Form,
      FormField,
      FormItem,
      FormLabel,
      FormControl,
      FormDescription,
      FormMessage,
      Input,
      Textarea,
      Button,
      Select,
      SelectContent,
      SelectItem,
      SelectTrigger,
      SelectValue,
      User,
      Mail,
      Briefcase,
    },
    setup() {
      const subjects = [
        { value: 'general', label: 'General Inquiry' },
        { value: 'support', label: 'Technical Support' },
        { value: 'sales', label: 'Sales Question' },
        { value: 'partnership', label: 'Partnership Opportunity' },
        { value: 'feedback', label: 'Feedback' },
      ]

      const formSchema = toTypedSchema(
        z.object({
          name: z.string().min(1, 'Name is required'),
          email: z.string().min(1, 'Email is required').email('Please enter a valid email'),
          subject: z.string().min(1, 'Please select a subject'),
          message: z.string().min(10, 'Message must be at least 10 characters'),
        })
      )

      const form = useForm({
        validationSchema: formSchema,
      })

      const onSubmit = form.handleSubmit((values) => {
        console.log('Contact form:', values)
        alert('Message sent successfully!')
      })

      return { form, onSubmit, subjects }
    },
    template: `
      <Form @submit="onSubmit" class="w-[500px] space-y-4">
        <FormField v-slot="{ componentField }" name="name">
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl>
              <div class="relative">
                <User class="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  v-bind="componentField"
                  placeholder="Your name"
                  class="pl-9"
                />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>
        
        <FormField v-slot="{ componentField }" name="email">
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <div class="relative">
                <Mail class="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  v-bind="componentField"
                  type="email"
                  placeholder="your.email@example.com"
                  class="pl-9"
                />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>
        
        <FormField v-slot="{ componentField }" name="subject">
          <FormItem>
            <FormLabel>Subject</FormLabel>
            <Select v-bind="componentField">
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem v-for="subject in subjects" :key="subject.value" :value="subject.value">
                  {{ subject.label }}
                </SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>
              Help us route your message to the right team
            </FormDescription>
            <FormMessage />
          </FormItem>
        </FormField>
        
        <FormField v-slot="{ componentField }" name="message">
          <FormItem>
            <FormLabel>Message</FormLabel>
            <FormControl>
              <Textarea 
                v-bind="componentField"
                placeholder="Tell us how we can help..."
                rows="6"
              />
            </FormControl>
            <FormDescription>
              Please provide as much detail as possible
            </FormDescription>
            <FormMessage />
          </FormItem>
        </FormField>
        
        <Button type="submit" class="w-full">
          Send Message
        </Button>
      </Form>
    `,
  }),
}

// Settings form with switches and radio groups
export const SettingsForm: Story = {
  render: () => ({
    components: {
      Form,
      FormField,
      FormItem,
      FormLabel,
      FormControl,
      FormDescription,
      FormMessage,
      Input,
      Button,
      Switch,
      RadioGroup,
      RadioGroupItem,
      Label,
      Bell,
      Shield,
      Globe,
    },
    setup() {
      const formSchema = toTypedSchema(
        z.object({
          displayName: z.string().min(1, 'Display name is required'),
          username: z
            .string()
            .min(3, 'Username must be at least 3 characters')
            .regex(
              /^[a-zA-Z0-9_]+$/,
              'Username can only contain letters, numbers, and underscores'
            ),
          emailNotifications: z.boolean().optional(),
          pushNotifications: z.boolean().optional(),
          marketingEmails: z.boolean().optional(),
          visibility: z.enum(['public', 'friends', 'private']),
          dataSharing: z.boolean().optional(),
        })
      )

      const form = useForm({
        validationSchema: formSchema,
        initialValues: {
          displayName: 'John Doe',
          username: 'johndoe',
          emailNotifications: true,
          pushNotifications: false,
          marketingEmails: false,
          visibility: 'public',
          dataSharing: false,
        },
      })

      const onSubmit = form.handleSubmit((values) => {
        console.log('Settings:', values)
        alert('Settings saved successfully!')
      })

      return { form, onSubmit }
    },
    template: `
      <Form @submit="onSubmit" class="w-[600px] space-y-6">
        <div>
          <h3 class="text-lg font-medium mb-4">Profile Settings</h3>
          <div class="space-y-4">
            <FormField v-slot="{ componentField }" name="displayName">
              <FormItem>
                <FormLabel>Display Name</FormLabel>
                <FormControl>
                  <Input v-bind="componentField" />
                </FormControl>
                <FormDescription>
                  This is your public display name.
                </FormDescription>
                <FormMessage />
              </FormItem>
            </FormField>
            
            <FormField v-slot="{ componentField }" name="username">
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input v-bind="componentField" />
                </FormControl>
                <FormDescription>
                  Your unique username for the platform.
                </FormDescription>
                <FormMessage />
              </FormItem>
            </FormField>
          </div>
        </div>
        
        <div>
          <h3 class="text-lg font-medium mb-4 flex items-center gap-2">
            <Bell class="h-5 w-5" />
            Notification Preferences
          </h3>
          <div class="space-y-4">
            <FormField v-slot="{ value, handleChange }" name="emailNotifications" type="checkbox">
              <FormItem class="flex items-center justify-between">
                <div>
                  <FormLabel>Email Notifications</FormLabel>
                  <FormDescription>
                    Receive notifications via email
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch 
                    :checked="value"
                    @update:checked="handleChange"
                  />
                </FormControl>
              </FormItem>
            </FormField>
            
            <FormField v-slot="{ value, handleChange }" name="pushNotifications" type="checkbox">
              <FormItem class="flex items-center justify-between">
                <div>
                  <FormLabel>Push Notifications</FormLabel>
                  <FormDescription>
                    Receive push notifications on your devices
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch 
                    :checked="value"
                    @update:checked="handleChange"
                  />
                </FormControl>
              </FormItem>
            </FormField>
            
            <FormField v-slot="{ value, handleChange }" name="marketingEmails" type="checkbox">
              <FormItem class="flex items-center justify-between">
                <div>
                  <FormLabel>Marketing Emails</FormLabel>
                  <FormDescription>
                    Receive promotional content and updates
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch 
                    :checked="value"
                    @update:checked="handleChange"
                  />
                </FormControl>
              </FormItem>
            </FormField>
          </div>
        </div>
        
        <div>
          <h3 class="text-lg font-medium mb-4 flex items-center gap-2">
            <Shield class="h-5 w-5" />
            Privacy Settings
          </h3>
          <div class="space-y-4">
            <FormField v-slot="{ componentField }" name="visibility">
              <FormItem>
                <FormLabel>Profile Visibility</FormLabel>
                <FormControl>
                  <RadioGroup v-bind="componentField">
                    <div class="flex items-center space-x-2">
                      <RadioGroupItem value="public" id="public" />
                      <Label for="public">Public - Anyone can view your profile</Label>
                    </div>
                    <div class="flex items-center space-x-2">
                      <RadioGroupItem value="friends" id="friends" />
                      <Label for="friends">Friends - Only friends can view your profile</Label>
                    </div>
                    <div class="flex items-center space-x-2">
                      <RadioGroupItem value="private" id="private" />
                      <Label for="private">Private - Only you can view your profile</Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>
            
            <FormField v-slot="{ value, handleChange }" name="dataSharing" type="checkbox">
              <FormItem class="flex items-center justify-between">
                <div>
                  <FormLabel>Data Sharing</FormLabel>
                  <FormDescription>
                    Allow sharing anonymized data for improvements
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch 
                    :checked="value"
                    @update:checked="handleChange"
                  />
                </FormControl>
              </FormItem>
            </FormField>
          </div>
        </div>
        
        <div class="flex gap-4">
          <Button type="submit">
            Save Changes
          </Button>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </div>
      </Form>
    `,
  }),
}

// Payment form with validation states
export const PaymentForm: Story = {
  render: () => ({
    components: {
      Form,
      FormField,
      FormItem,
      FormLabel,
      FormControl,
      FormDescription,
      FormMessage,
      Input,
      Button,
      Select,
      SelectContent,
      SelectItem,
      SelectTrigger,
      SelectValue,
      CreditCard,
      Calendar,
      Lock,
      Check,
      AlertCircle,
    },
    setup() {
      const formSchema = toTypedSchema(
        z.object({
          cardNumber: z
            .string()
            .min(1, 'Card number is required')
            .regex(/^\d{16}$/, 'Card number must be 16 digits'),
          cardHolder: z.string().min(1, 'Cardholder name is required'),
          expiryMonth: z.string().min(1, 'Expiry month is required'),
          expiryYear: z.string().min(1, 'Expiry year is required'),
          cvv: z.string().min(3, 'CVV must be 3 digits').max(3, 'CVV must be 3 digits'),
          billingAddress: z.string().min(1, 'Billing address is required'),
          city: z.string().min(1, 'City is required'),
          country: z.string().min(1, 'Country is required'),
          zipCode: z.string().min(1, 'ZIP code is required'),
        })
      )

      const form = useForm({
        validationSchema: formSchema,
      })

      const onSubmit = form.handleSubmit((values) => {
        console.log('Payment data:', values)
        alert('Payment processed successfully!')
      })

      return {
        form,
        onSubmit,
        countries: mockFormData.countries,
      }
    },
    template: `
      <Form @submit="onSubmit" class="w-[500px] space-y-4">
        <FormField v-slot="{ componentField }" name="cardNumber">
          <FormItem>
            <FormLabel>Card Number</FormLabel>
            <FormControl>
              <div class="relative">
                <CreditCard class="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  v-bind="componentField"
                  placeholder="1234567890123456"
                  maxlength="16"
                  class="pl-9"
                />
              </div>
            </FormControl>
            <FormDescription>
              Enter your 16-digit card number
            </FormDescription>
            <FormMessage />
          </FormItem>
        </FormField>
        
        <FormField v-slot="{ componentField }" name="cardHolder">
          <FormItem>
            <FormLabel>Cardholder Name</FormLabel>
            <FormControl>
              <Input 
                v-bind="componentField"
                placeholder="John Doe"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>
        
        <div class="grid grid-cols-3 gap-4">
          <FormField v-slot="{ componentField }" name="expiryMonth">
            <FormItem>
              <FormLabel>Expiry Month</FormLabel>
              <Select v-bind="componentField">
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="MM" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem v-for="i in 12" :key="i" :value="String(i).padStart(2, '0')">
                    {{ String(i).padStart(2, '0') }}
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          </FormField>
          
          <FormField v-slot="{ componentField }" name="expiryYear">
            <FormItem>
              <FormLabel>Expiry Year</FormLabel>
              <Select v-bind="componentField">
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="YYYY" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem v-for="i in 10" :key="i" :value="String(2024 + i)">
                    {{ 2024 + i }}
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          </FormField>
          
          <FormField v-slot="{ componentField }" name="cvv">
            <FormItem>
              <FormLabel>CVV</FormLabel>
              <FormControl>
                <div class="relative">
                  <Lock class="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    v-bind="componentField"
                    type="password"
                    placeholder="123"
                    maxlength="3"
                    class="pl-9"
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>
        </div>
        
        <div class="border-t pt-4">
          <h4 class="font-medium mb-3">Billing Address</h4>
          
          <div class="space-y-4">
            <FormField v-slot="{ componentField }" name="billingAddress">
              <FormItem>
                <FormLabel>Street Address</FormLabel>
                <FormControl>
                  <Input 
                    v-bind="componentField"
                    placeholder="123 Main St"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>
            
            <div class="grid grid-cols-2 gap-4">
              <FormField v-slot="{ componentField }" name="city">
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input 
                      v-bind="componentField" 
                      placeholder="New York" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              
              <FormField v-slot="{ componentField }" name="zipCode">
                <FormItem>
                  <FormLabel>ZIP Code</FormLabel>
                  <FormControl>
                    <Input 
                      v-bind="componentField" 
                      placeholder="10001" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
            </div>
            
            <FormField v-slot="{ componentField }" name="country">
              <FormItem>
                <FormLabel>Country</FormLabel>
                <Select v-bind="componentField">
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a country" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem v-for="country in countries" :key="country.value" :value="country.value">
                      {{ country.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            </FormField>
          </div>
        </div>
        
        <Button type="submit" class="w-full">
          Process Payment
        </Button>
      </Form>
    `,
  }),
}

// Multi-step form example
export const MultiStepForm: Story = {
  render: () => ({
    components: {
      Form,
      FormField,
      FormItem,
      FormLabel,
      FormControl,
      FormDescription,
      FormMessage,
      Input,
      Textarea,
      Button,
      Select,
      SelectContent,
      SelectItem,
      SelectTrigger,
      SelectValue,
      RadioGroup,
      RadioGroupItem,
      Label,
      User,
      Building,
      Briefcase,
      Check,
    },
    setup() {
      const currentStep = ref(1)
      const totalSteps = 3

      const formSchema = toTypedSchema(
        z.object({
          // Step 1: Personal
          firstName: z.string().min(1, 'First name is required'),
          lastName: z.string().min(1, 'Last name is required'),
          email: z.string().min(1, 'Email is required').email('Please enter a valid email'),
          phone: z.string().optional(),
          // Step 2: Company
          companyName: z.string().min(1, 'Company name is required'),
          industry: z.string().min(1, 'Please select an industry'),
          teamSize: z.string().min(1, 'Please select team size'),
          website: z.string().optional(),
          // Step 3: Project
          projectType: z.enum(['new', 'existing', 'consultation'], {
            required_error: 'Please select a project type',
          }),
          budget: z.string().min(1, 'Please select a budget range'),
          timeline: z.string().min(1, 'Please select a timeline'),
          description: z
            .string()
            .min(10, 'Please provide at least 10 characters for the description'),
        })
      )

      const form = useForm({
        validationSchema: formSchema,
      })

      const nextStep = () => {
        if (currentStep.value < totalSteps) {
          currentStep.value++
        }
      }

      const prevStep = () => {
        if (currentStep.value > 1) {
          currentStep.value--
        }
      }

      const onSubmit = form.handleSubmit((values) => {
        console.log('Form data:', values)
        alert('Form submitted successfully!')
      })

      return {
        form,
        currentStep,
        totalSteps,
        nextStep,
        prevStep,
        onSubmit,
        industries: mockFormData.industries,
        teamSizes: mockFormData.teamSizes,
      }
    },
    template: `
      <div class="w-[600px]">
        <!-- Progress Steps -->
        <div class="mb-8">
          <div class="flex items-center justify-between">
            <div 
              v-for="step in totalSteps" 
              :key="step"
              class="flex items-center"
            >
              <div 
                class="flex h-10 w-10 items-center justify-center rounded-full"
                :class="[
                  step <= currentStep 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                ]"
              >
                <Check v-if="step < currentStep" class="h-5 w-5" />
                <span v-else>{{ step }}</span>
              </div>
              <div 
                v-if="step < totalSteps"
                class="h-0.5 w-24"
                :class="[
                  step < currentStep ? 'bg-primary' : 'bg-muted'
                ]"
              />
            </div>
          </div>
          <div class="mt-4 flex justify-between text-sm">
            <span :class="{ 'font-medium': currentStep === 1 }">Personal Info</span>
            <span :class="{ 'font-medium': currentStep === 2 }">Company Details</span>
            <span :class="{ 'font-medium': currentStep === 3 }">Project Info</span>
          </div>
        </div>
        
        <Form @submit="onSubmit" class="space-y-4">
          <!-- Step 1: Personal Information -->
          <div v-if="currentStep === 1" class="space-y-4">
            <h3 class="text-lg font-medium mb-4 flex items-center gap-2">
              <User class="h-5 w-5" />
              Personal Information
            </h3>
            
            <div class="grid grid-cols-2 gap-4">
              <FormField v-slot="{ componentField }" name="firstName">
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input v-bind="componentField" placeholder="John" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              
              <FormField v-slot="{ componentField }" name="lastName">
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input v-bind="componentField" placeholder="Doe" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
            </div>
            
            <FormField v-slot="{ componentField }" name="email">
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input v-bind="componentField" type="email" placeholder="john@example.com" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>
            
            <FormField v-slot="{ componentField }" name="phone">
              <FormItem>
                <FormLabel>Phone (Optional)</FormLabel>
                <FormControl>
                  <Input v-bind="componentField" type="tel" placeholder="+1 (555) 123-4567" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>
          </div>
          
          <!-- Step 2: Company Details -->
          <div v-if="currentStep === 2" class="space-y-4">
            <h3 class="text-lg font-medium mb-4 flex items-center gap-2">
              <Building class="h-5 w-5" />
              Company Details
            </h3>
            
            <FormField v-slot="{ componentField }" name="companyName">
              <FormItem>
                <FormLabel>Company Name</FormLabel>
                <FormControl>
                  <Input v-bind="componentField" placeholder="Acme Inc." />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>
            
            <FormField v-slot="{ componentField }" name="industry">
              <FormItem>
                <FormLabel>Industry</FormLabel>
                <Select v-bind="componentField">
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your industry" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem v-for="industry in industries" :key="industry.value" :value="industry.value">
                      {{ industry.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            </FormField>
            
            <FormField v-slot="{ componentField }" name="teamSize">
              <FormItem>
                <FormLabel>Team Size</FormLabel>
                <Select v-bind="componentField">
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select team size" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem v-for="size in teamSizes" :key="size.value" :value="size.value">
                      {{ size.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            </FormField>
            
            <FormField v-slot="{ componentField }" name="website">
              <FormItem>
                <FormLabel>Website (Optional)</FormLabel>
                <FormControl>
                  <Input v-bind="componentField" placeholder="https://example.com" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>
          </div>
          
          <!-- Step 3: Project Information -->
          <div v-if="currentStep === 3" class="space-y-4">
            <h3 class="text-lg font-medium mb-4 flex items-center gap-2">
              <Briefcase class="h-5 w-5" />
              Project Information
            </h3>
            
            <FormField v-slot="{ componentField }" name="projectType">
              <FormItem>
                <FormLabel>Project Type</FormLabel>
                <FormControl>
                  <RadioGroup v-bind="componentField">
                    <div class="flex items-center space-x-2">
                      <RadioGroupItem value="new" id="new" />
                      <Label for="new">New Project</Label>
                    </div>
                    <div class="flex items-center space-x-2">
                      <RadioGroupItem value="existing" id="existing" />
                      <Label for="existing">Existing Project</Label>
                    </div>
                    <div class="flex items-center space-x-2">
                      <RadioGroupItem value="consultation" id="consultation" />
                      <Label for="consultation">Consultation Only</Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>
            
            <FormField v-slot="{ componentField }" name="budget">
              <FormItem>
                <FormLabel>Budget Range</FormLabel>
                <Select v-bind="componentField">
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select budget range" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="under-10k">Under $10,000</SelectItem>
                    <SelectItem value="10k-25k">$10,000 - $25,000</SelectItem>
                    <SelectItem value="25k-50k">$25,000 - $50,000</SelectItem>
                    <SelectItem value="50k-100k">$50,000 - $100,000</SelectItem>
                    <SelectItem value="over-100k">Over $100,000</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            </FormField>
            
            <FormField v-slot="{ componentField }" name="timeline">
              <FormItem>
                <FormLabel>Timeline</FormLabel>
                <Select v-bind="componentField">
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select timeline" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="asap">ASAP</SelectItem>
                    <SelectItem value="1-month">Within 1 month</SelectItem>
                    <SelectItem value="1-3-months">1-3 months</SelectItem>
                    <SelectItem value="3-6-months">3-6 months</SelectItem>
                    <SelectItem value="over-6-months">Over 6 months</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            </FormField>
            
            <FormField v-slot="{ componentField }" name="description">
              <FormItem>
                <FormLabel>Project Description</FormLabel>
                <FormControl>
                  <Textarea 
                    v-bind="componentField"
                    placeholder="Tell us about your project..."
                    rows="4"
                  />
                </FormControl>
                <FormDescription>
                  Please provide details about your project requirements
                </FormDescription>
                <FormMessage />
              </FormItem>
            </FormField>
          </div>
          
          <!-- Navigation Buttons -->
          <div class="flex justify-between pt-4">
            <Button 
              type="button" 
              variant="outline"
              @click="prevStep"
              :disabled="currentStep === 1"
            >
              Previous
            </Button>
            
            <Button 
              v-if="currentStep < totalSteps"
              type="button"
              @click="nextStep"
            >
              Next
            </Button>
            
            <Button 
              v-if="currentStep === totalSteps"
              type="submit"
            >
              Submit
            </Button>
          </div>
        </Form>
      </div>
    `,
  }),
}

// Form with all field types
export const ComprehensiveForm: Story = {
  render: () => ({
    components: {
      Form,
      FormField,
      FormItem,
      FormLabel,
      FormControl,
      FormDescription,
      FormMessage,
      Input,
      Textarea,
      Button,
      Checkbox,
      Switch,
      Label,
      RadioGroup,
      RadioGroupItem,
      Select,
      SelectContent,
      SelectItem,
      SelectTrigger,
      SelectValue,
      Info,
    },
    setup() {
      const formSchema = toTypedSchema(
        z.object({
          text: z.string().min(1, 'Text is required'),
          email: z.string().min(1, 'Email is required').email('Please enter a valid email'),
          password: z.string().min(8, 'Password must be at least 8 characters'),
          number: z.coerce.number().min(0, 'Number must be positive').optional(),
          date: z.string().optional(),
          time: z.string().optional(),
          textarea: z.string().min(10, 'Please enter at least 10 characters'),
          select: z.string().min(1, 'Please select an option'),
          checkbox: z.boolean().refine((val) => val === true, 'You must agree to continue'),
          checkboxGroup: z.array(z.string()).min(1, 'Please select at least one option'),
          radio: z.string().min(1, 'Please select a radio option'),
          switch: z.boolean().optional(),
        })
      )

      const form = useForm({
        validationSchema: formSchema,
        initialValues: {
          checkbox: false,
          checkboxGroup: [],
          switch: false,
        },
      })

      const onSubmit = form.handleSubmit((values) => {
        console.log('Form data:', values)
        alert('Form submitted with all field types!')
      })

      return {
        form,
        onSubmit,
        preferences: mockFormData.preferences,
      }
    },
    template: `
      <Form @submit="onSubmit" class="w-[600px] space-y-4">
        <div class="mb-6 p-4 border rounded-lg bg-muted/50">
          <div class="flex items-center gap-2 mb-2">
            <Info class="h-4 w-4" />
            <h4 class="font-medium">All Form Field Types</h4>
          </div>
          <p class="text-sm text-muted-foreground">
            This form demonstrates all available field types and their configurations.
          </p>
        </div>
        
        <FormField v-slot="{ componentField }" name="text">
          <FormItem>
            <FormLabel>Text Input</FormLabel>
            <FormControl>
              <Input v-bind="componentField" placeholder="Enter text" />
            </FormControl>
            <FormDescription>
              Standard text input field
            </FormDescription>
            <FormMessage />
          </FormItem>
        </FormField>
        
        <FormField v-slot="{ componentField }" name="email">
          <FormItem>
            <FormLabel>Email Input</FormLabel>
            <FormControl>
              <Input v-bind="componentField" type="email" placeholder="email@example.com" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>
        
        <FormField v-slot="{ componentField }" name="password">
          <FormItem>
            <FormLabel>Password Input</FormLabel>
            <FormControl>
              <Input v-bind="componentField" type="password" placeholder="••••••••" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>
        
        <div class="grid grid-cols-3 gap-4">
          <FormField v-slot="{ componentField }" name="number">
            <FormItem>
              <FormLabel>Number Input</FormLabel>
              <FormControl>
                <Input v-bind="componentField" type="number" placeholder="123" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>
          
          <FormField v-slot="{ componentField }" name="date">
            <FormItem>
              <FormLabel>Date Input</FormLabel>
              <FormControl>
                <Input v-bind="componentField" type="date" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>
          
          <FormField v-slot="{ componentField }" name="time">
            <FormItem>
              <FormLabel>Time Input</FormLabel>
              <FormControl>
                <Input v-bind="componentField" type="time" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>
        </div>
        
        <FormField v-slot="{ componentField }" name="textarea">
          <FormItem>
            <FormLabel>Textarea</FormLabel>
            <FormControl>
              <Textarea 
                v-bind="componentField"
                placeholder="Enter long text..."
                rows="3"
              />
            </FormControl>
            <FormDescription>
              Multi-line text input
            </FormDescription>
            <FormMessage />
          </FormItem>
        </FormField>
        
        <FormField v-slot="{ componentField }" name="select">
          <FormItem>
            <FormLabel>Select Dropdown</FormLabel>
            <Select v-bind="componentField">
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an option" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="option1">Option 1</SelectItem>
                <SelectItem value="option2">Option 2</SelectItem>
                <SelectItem value="option3">Option 3</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        </FormField>
        
        <FormField v-slot="{ value, handleChange }" name="checkbox" type="checkbox">
          <FormItem>
            <FormLabel>Single Checkbox</FormLabel>
            <div class="flex items-center space-x-2">
              <FormControl>
                <Checkbox 
                  :checked="value"
                  @update:checked="handleChange"
                />
              </FormControl>
              <Label class="text-sm font-normal">
                I agree to the terms and conditions
              </Label>
            </div>
            <FormMessage />
          </FormItem>
        </FormField>
        
        <FormField v-slot="{ value, handleChange }" name="checkboxGroup">
          <FormItem>
            <FormLabel>Checkbox Group</FormLabel>
            <div class="space-y-2">
              <div v-for="pref in preferences" :key="pref.id" class="flex items-start space-x-2">
                <Checkbox 
                  :id="pref.id"
                  :checked="value?.includes(pref.id) || false"
                  @update:checked="(checked) => {
                    const currentValue = value || []
                    if (checked) {
                      handleChange([...currentValue, pref.id])
                    } else {
                      handleChange(currentValue.filter(id => id !== pref.id))
                    }
                  }"
                />
                <div>
                  <Label :for="pref.id" class="text-sm font-medium">
                    {{ pref.label }}
                  </Label>
                  <p class="text-sm text-muted-foreground">
                    {{ pref.description }}
                  </p>
                </div>
              </div>
            </div>
            <FormDescription>
              Select your notification preferences
            </FormDescription>
            <FormMessage />
          </FormItem>
        </FormField>
        
        <FormField v-slot="{ componentField }" name="radio">
          <FormItem>
            <FormLabel>Radio Group</FormLabel>
            <FormControl>
              <RadioGroup v-bind="componentField">
                <div class="flex items-center space-x-2">
                  <RadioGroupItem value="option1" id="r1" />
                  <Label for="r1">Radio Option 1</Label>
                </div>
                <div class="flex items-center space-x-2">
                  <RadioGroupItem value="option2" id="r2" />
                  <Label for="r2">Radio Option 2</Label>
                </div>
                <div class="flex items-center space-x-2">
                  <RadioGroupItem value="option3" id="r3" />
                  <Label for="r3">Radio Option 3</Label>
                </div>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>
        
        <FormField v-slot="{ value, handleChange }" name="switch" type="checkbox">
          <FormItem class="flex items-center justify-between">
            <div>
              <FormLabel>Switch Toggle</FormLabel>
              <FormDescription>
                Enable or disable this feature
              </FormDescription>
            </div>
            <FormControl>
              <Switch 
                :checked="value"
                @update:checked="handleChange"
              />
            </FormControl>
          </FormItem>
        </FormField>
        
        <Button type="submit" class="w-full">
          Submit All Fields
        </Button>
      </Form>
    `,
  }),
}
