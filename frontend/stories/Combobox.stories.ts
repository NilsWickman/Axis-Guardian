import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { ref } from 'vue'
import {
  Combobox,
  ComboboxAnchor,
  ComboboxInput,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxItemIndicator,
  ComboboxTrigger,
} from '@/components/ui/combobox'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Check, ChevronDown, ChevronsUpDown, Search } from 'lucide-vue-next'

const frameworks = [
  { value: 'next.js', label: 'Next.js' },
  { value: 'sveltekit', label: 'SvelteKit' },
  { value: 'nuxt', label: 'Nuxt' },
  { value: 'remix', label: 'Remix' },
  { value: 'astro', label: 'Astro' },
]

const countries = [
  { value: 'us', label: 'United States', flag: '🇺🇸' },
  { value: 'uk', label: 'United Kingdom', flag: '🇬🇧' },
  { value: 'ca', label: 'Canada', flag: '🇨🇦' },
  { value: 'de', label: 'Germany', flag: '🇩🇪' },
  { value: 'fr', label: 'France', flag: '🇫🇷' },
]

const meta = {
  title: 'UI Components/Combobox',
  component: Combobox,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Combobox>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => ({
    components: {
      Combobox,
      ComboboxAnchor,
      ComboboxTrigger,
      ComboboxInput,
      ComboboxList,
      ComboboxItem,
      ComboboxEmpty,
      ComboboxGroup,
      ComboboxItemIndicator,
      Check,
      ChevronsUpDown,
    },
    setup() {
      const value = ref()
      return { value, frameworks }
    },
    template: `
      <div class="w-[300px]">
        <Combobox v-model="value" by="label">
          <ComboboxAnchor class="relative w-full max-w-sm items-center">
            <ComboboxInput :display-value="(val) => val?.label ?? ''" placeholder="Select framework..." class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pr-10" />
            <ComboboxTrigger class="absolute end-0 inset-y-0 flex items-center justify-center px-3">
              <ChevronsUpDown class="size-4 text-muted-foreground" />
            </ComboboxTrigger>
          </ComboboxAnchor>

          <ComboboxList>
            <ComboboxEmpty>
              No framework found.
            </ComboboxEmpty>

            <ComboboxGroup>
              <ComboboxItem
                v-for="framework in frameworks"
                :key="framework.value"
                :value="framework"
              >
                {{ framework.label }}
                <ComboboxItemIndicator>
                  <Check class="ml-auto h-4 w-4" />
                </ComboboxItemIndicator>
              </ComboboxItem>
            </ComboboxGroup>
          </ComboboxList>
        </Combobox>
        
        <p class="mt-4 text-sm text-muted-foreground">
          Selected: {{ value?.label || 'None' }}
        </p>
      </div>
    `,
  }),
}

export const TriggerVariant: Story = {
  render: () => ({
    components: {
      Combobox,
      ComboboxAnchor,
      ComboboxTrigger,
      ComboboxInput,
      ComboboxList,
      ComboboxItem,
      ComboboxEmpty,
      ComboboxGroup,
      ComboboxItemIndicator,
      Button,
      Check,
      ChevronsUpDown,
      Search,
    },
    setup() {
      const value = ref()
      return { value, frameworks }
    },
    template: `
      <div class="w-[300px]">
        <Combobox v-model="value" by="label">
          <ComboboxAnchor as-child>
            <ComboboxTrigger as-child>
              <Button variant="outline" class="justify-between w-full">
                {{ value?.label || 'Select framework' }}
                <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </ComboboxTrigger>
          </ComboboxAnchor>

          <ComboboxList>
            <div class="relative w-full items-center px-1 pb-1">
              <span class="absolute start-0 inset-y-0 flex items-center justify-center px-3">
                <Search class="size-4 text-muted-foreground" />
              </span>
              <ComboboxInput class="pl-9 pr-3 focus-visible:ring-0 border-0 border-b rounded-none h-10 w-full" placeholder="Search framework..." />
            </div>

            <ComboboxEmpty>
              No framework found.
            </ComboboxEmpty>

            <ComboboxGroup>
              <ComboboxItem
                v-for="framework in frameworks"
                :key="framework.value"
                :value="framework"
              >
                {{ framework.label }}
                <ComboboxItemIndicator>
                  <Check class="ml-auto h-4 w-4" />
                </ComboboxItemIndicator>
              </ComboboxItem>
            </ComboboxGroup>
          </ComboboxList>
        </Combobox>
        
        <p class="mt-4 text-sm text-muted-foreground">
          Selected: {{ value?.label || 'None' }}
        </p>
      </div>
    `,
  }),
}

export const FormExample: Story = {
  render: () => ({
    components: {
      Combobox,
      ComboboxAnchor,
      ComboboxInput,
      ComboboxList,
      ComboboxItem,
      ComboboxEmpty,
      ComboboxItemIndicator,
      ComboboxTrigger,
      Label,
      Button,
      Check,
      ChevronDown,
      Search,
    },
    setup() {
      const formData = ref({
        framework: null,
        country: null,
      })

      const handleSubmit = () => {
        console.log('Form submitted:', formData.value)
      }

      return { formData, frameworks, countries, handleSubmit }
    },
    template: `
      <form @submit.prevent="handleSubmit" class="max-w-md space-y-6 p-6 border rounded-lg">
        <div class="space-y-2 text-center">
          <h3 class="text-lg font-semibold">Preferences Form</h3>
          <p class="text-sm text-muted-foreground">Select your preferences</p>
        </div>
        
        <div class="space-y-4">
          <div class="space-y-2">
            <Label for="framework">Framework</Label>
            <Combobox v-model="formData.framework" by="label">
              <ComboboxAnchor class="relative w-full items-center">
                <ComboboxInput 
                  :display-value="(val) => val?.label ?? ''" 
                  placeholder="Select framework..." 
                  class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pr-10"
                />
                <ComboboxTrigger class="absolute end-0 inset-y-0 flex items-center justify-center px-3">
                  <ChevronDown class="size-4 text-muted-foreground" />
                </ComboboxTrigger>
              </ComboboxAnchor>

              <ComboboxList>
                <ComboboxEmpty>No framework found.</ComboboxEmpty>
                <ComboboxItem
                  v-for="framework in frameworks"
                  :key="framework.value"
                  :value="framework"
                >
                  {{ framework.label }}
                  <ComboboxItemIndicator>
                    <Check class="ml-auto h-4 w-4" />
                  </ComboboxItemIndicator>
                </ComboboxItem>
              </ComboboxList>
            </Combobox>
          </div>
          
          <div class="space-y-2">
            <Label for="country">Country</Label>
            <Combobox v-model="formData.country" by="label">
              <ComboboxAnchor as-child>
                <ComboboxTrigger as-child>
                  <Button variant="outline" class="justify-between w-full">
                    {{ formData.country?.flag ? formData.country.flag + ' ' + formData.country.label : 'Select country' }}
                    <ChevronDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </ComboboxTrigger>
              </ComboboxAnchor>

              <ComboboxList>
                <div class="relative w-full items-center px-1 pb-1">
                  <span class="absolute start-0 inset-y-0 flex items-center justify-center px-3">
                    <Search class="size-4 text-muted-foreground" />
                  </span>
                  <ComboboxInput class="pl-9 pr-3 focus-visible:ring-0 border-0 border-b rounded-none h-10 w-full" placeholder="Search country..." />
                </div>

                <ComboboxEmpty>No country found.</ComboboxEmpty>
                <ComboboxItem
                  v-for="country in countries"
                  :key="country.value"
                  :value="country"
                >
                  <span class="mr-2">{{ country.flag }}</span>
                  {{ country.label }}
                  <ComboboxItemIndicator>
                    <Check class="ml-auto h-4 w-4" />
                  </ComboboxItemIndicator>
                </ComboboxItem>
              </ComboboxList>
            </Combobox>
          </div>
          
          <Button type="submit" class="w-full">
            Submit Form
          </Button>
        </div>
        
        <div class="text-sm text-muted-foreground">
          <h4 class="font-medium mb-2">Current Selection:</h4>
          <div class="space-y-1">
            <p>Framework: {{ formData.framework?.label || 'None' }}</p>
            <p>Country: {{ formData.country?.label || 'None' }}</p>
          </div>
        </div>
      </form>
    `,
  }),
}
