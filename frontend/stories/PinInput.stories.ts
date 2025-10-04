import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { PinInput, PinInputGroup, PinInputSlot, PinInputSeparator } from '@/components/ui/pin-input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ref } from 'vue'

const meta = {
  title: 'UI Components/PinInput',
  component: PinInput,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A sequence of one-character alphanumeric inputs for collecting PIN codes, OTP verification, or license keys.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof PinInput>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => ({
    components: { PinInput, PinInputGroup, PinInputSlot },
    setup() {
      const value = ref(['1', '2', '3'])
      const handleComplete = (e) => alert(e.join(''))
      return { value, handleComplete }
    },
    template: `
      <PinInput 
        v-model="value" 
        placeholder="○" 
        @complete="handleComplete"
      >
        <PinInputGroup>
          <PinInputSlot 
            v-for="(id, index) in 5" 
            :key="id" 
            :index="index" 
          />
        </PinInputGroup>
      </PinInput>
    `,
  }),
}

export const MaskedInput: Story = {
  render: () => ({
    components: { PinInput, PinInputGroup, PinInputSlot, Label },
    setup() {
      const pinValue = ref([])
      return { pinValue }
    },
    template: `
      <div class="space-y-3 max-w-md">
        <Label class="text-sm font-medium">Security PIN</Label>
        <p class="text-sm text-muted-foreground">Enter your 4-digit security PIN</p>
        <PinInput v-model="pinValue" type="number" mask>
          <PinInputGroup>
            <PinInputSlot 
              v-for="(id, index) in 4" 
              :key="id" 
              :index="index" 
            />
          </PinInputGroup>
        </PinInput>
      </div>
    `,
  }),
}

export const WithSeparators: Story = {
  render: () => ({
    components: { PinInput, PinInputGroup, PinInputSlot, PinInputSeparator, Label },
    setup() {
      const value = ref([])
      const handleComplete = (e) => alert(e.join(''))
      return { value, handleComplete }
    },
    template: `
      <div class="space-y-3 max-w-lg">
        <Label class="text-sm font-medium">PIN with Separators</Label>
        <p class="text-sm text-muted-foreground">Enter your 5-character code</p>
        <PinInput 
          v-model="value" 
          placeholder="○" 
          @complete="handleComplete"
        >
          <PinInputGroup class="gap-1">
            <template v-for="(id, index) in 5" :key="id">
              <PinInputSlot 
                class="rounded-md border" 
                :index="index" 
              />
              <template v-if="index !== 4">
                <PinInputSeparator />
              </template>
            </template>
          </PinInputGroup>
        </PinInput>
      </div>
    `,
  }),
}

export const FormExample: Story = {
  render: () => ({
    components: { PinInput, PinInputGroup, PinInputSlot, Label, Button },
    setup() {
      const verificationCode = ref([])
      const isComplete = ref(false)
      const isVerifying = ref(false)

      const handleComplete = (value) => {
        isComplete.value = value.length === 6 && value.every((v) => v !== '')
      }

      const handleVerify = () => {
        isVerifying.value = true
        setTimeout(() => {
          isVerifying.value = false
          console.log('Verification completed with code:', verificationCode.value.join(''))
        }, 2000)
      }

      const handleResend = () => {
        console.log('Resending verification code...')
        verificationCode.value = []
        isComplete.value = false
      }

      return {
        verificationCode,
        isComplete,
        isVerifying,
        handleComplete,
        handleVerify,
        handleResend,
      }
    },
    template: `
      <div class="max-w-sm space-y-6 p-6 border rounded-lg">
        <div class="space-y-2 text-center">
          <h3 class="text-lg font-semibold">Two-Factor Authentication</h3>
          <p class="text-sm text-muted-foreground">
            Enter the 6-digit code from your authenticator app
          </p>
        </div>
        
        <div class="space-y-4">
          <div class="space-y-2">
            <Label class="text-sm font-medium">Verification Code</Label>
            <PinInput 
              v-model="verificationCode" 
              type="number" 
              otp
              :disabled="isVerifying"
              @complete="handleComplete"
              class="justify-center"
            >
              <PinInputGroup>
                <PinInputSlot 
                  v-for="(id, index) in 6" 
                  :key="id" 
                  :index="index" 
                />
              </PinInputGroup>
            </PinInput>
          </div>
          
          <div class="space-y-2">
            <Button 
              @click="handleVerify"
              :disabled="!isComplete || isVerifying"
              class="w-full"
            >
              {{ isVerifying ? 'Verifying...' : 'Verify Code' }}
            </Button>
            
            <Button 
              @click="handleResend"
              variant="outline"
              :disabled="isVerifying"
              class="w-full"
            >
              Resend Code
            </Button>
          </div>
        </div>
      </div>
    `,
  }),
}
