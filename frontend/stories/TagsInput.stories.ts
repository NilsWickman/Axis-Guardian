import type { Meta, StoryObj } from '@storybook/vue3-vite'
import {
  TagsInput,
  TagsInputInput,
  TagsInputItem,
  TagsInputItemDelete,
  TagsInputItemText,
} from '@/components/ui/tags-input'
import {
  Combobox,
  ComboboxInput,
  ComboboxList,
  ComboboxItem,
  ComboboxTrigger,
  ComboboxEmpty,
  ComboboxItemIndicator,
} from '@/components/ui/combobox'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, ChevronsUpDown } from 'lucide-vue-next'
import { ref, computed } from 'vue'

const meta = {
  title: 'UI Components/TagsInput',
  component: TagsInput,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A tags input component that allows users to add, edit, and remove tags. Supports keyboard navigation, custom validation, and flexible styling.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    modelValue: {
      control: { type: 'object' },
      description: 'Array of tag strings (v-model)',
    },
    defaultValue: {
      control: { type: 'object' },
      description: 'Default array of tags when uncontrolled',
    },
    max: {
      control: { type: 'number' },
      description: 'Maximum number of tags allowed',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Whether the tags input is disabled',
    },
    placeholder: {
      control: { type: 'text' },
      description: 'Placeholder text for the input field',
    },
    class: {
      control: { type: 'text' },
      description: 'Additional CSS classes for the container',
    },
  },
  args: {
    modelValue: [],
    disabled: false,
    placeholder: 'Add tags...',
  },
} satisfies Meta<typeof TagsInput>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => ({
    components: {
      TagsInput,
      TagsInputInput,
      TagsInputItem,
      TagsInputItemText,
      TagsInputItemDelete,
    },
    setup() {
      const tags = ref(args.modelValue || [])
      return { args, tags }
    },
    template: `
      <TagsInput v-model="tags" class="w-full max-w-sm" v-bind="args">
        <TagsInputItem v-for="item in tags" :key="item" :value="item">
          <TagsInputItemText />
          <TagsInputItemDelete />
        </TagsInputItem>
        <TagsInputInput :placeholder="args.placeholder" />
      </TagsInput>
    `,
  }),
}

export const WithInitialTags: Story = {
  render: () => ({
    components: {
      TagsInput,
      TagsInputInput,
      TagsInputItem,
      TagsInputItemText,
      TagsInputItemDelete,
    },
    setup() {
      const tags = ref(['JavaScript', 'TypeScript', 'Vue.js'])
      return { tags }
    },
    template: `
      <TagsInput v-model="tags" class="w-full max-w-sm">
        <TagsInputItem v-for="item in tags" :key="item" :value="item">
          <TagsInputItemText />
          <TagsInputItemDelete />
        </TagsInputItem>
        <TagsInputInput placeholder="Add more skills..." />
      </TagsInput>
    `,
  }),
}

export const DisabledState: Story = {
  render: () => ({
    components: {
      TagsInput,
      TagsInputInput,
      TagsInputItem,
      TagsInputItemText,
      TagsInputItemDelete,
      Label,
    },
    setup() {
      const tags = ref(['Readonly', 'Disabled', 'Tags'])
      return { tags }
    },
    template: `
      <div class="space-y-3 w-full max-w-sm">
        <Label>Disabled Tags Input</Label>
        <TagsInput v-model="tags" disabled class="opacity-60">
          <TagsInputItem v-for="item in tags" :key="item" :value="item">
            <TagsInputItemText />
            <TagsInputItemDelete />
          </TagsInputItem>
          <TagsInputInput placeholder="Cannot add tags..." />
        </TagsInput>
        <p class="text-xs text-muted-foreground">This tags input is disabled and cannot be modified</p>
      </div>
    `,
  }),
}

export const LimitedTags: Story = {
  render: () => ({
    components: {
      TagsInput,
      TagsInputInput,
      TagsInputItem,
      TagsInputItemText,
      TagsInputItemDelete,
      Label,
    },
    setup() {
      const tags = ref(['Tag 1', 'Tag 2'])
      const maxTags = 3
      return { tags, maxTags }
    },
    template: `
      <div class="space-y-3 w-full max-w-sm">
        <Label>Limited to 3 Tags</Label>
        <TagsInput v-model="tags" :max="maxTags" class="min-h-12">
          <TagsInputItem v-for="item in tags" :key="item" :value="item">
            <TagsInputItemText />
            <TagsInputItemDelete />
          </TagsInputItem>
          <TagsInputInput 
            :placeholder="tags.length >= maxTags ? 'Maximum tags reached' : 'Add tags...'"
            :disabled="tags.length >= maxTags"
          />
        </TagsInput>
        <div class="flex justify-between text-xs text-muted-foreground">
          <span>Tags: {{ tags.length }}/{{ maxTags }}</span>
          <span :class="tags.length >= maxTags ? 'text-orange-600' : ''">
            {{ tags.length >= maxTags ? 'Limit reached' : (maxTags - tags.length) + ' remaining' }}
          </span>
        </div>
      </div>
    `,
  }),
}

export const FormIntegration: Story = {
  render: () => ({
    components: {
      TagsInput,
      TagsInputInput,
      TagsInputItem,
      TagsInputItemText,
      TagsInputItemDelete,
      Combobox,
      ComboboxInput,
      ComboboxList,
      ComboboxItem,
      ComboboxTrigger,
      ComboboxEmpty,
      ComboboxItemIndicator,
      Card,
      CardHeader,
      CardTitle,
      CardDescription,
      CardContent,
      Label,
      Button,
      Check,
      ChevronsUpDown,
    },
    setup() {
      const formData = ref({
        skills: ['JavaScript', 'Vue.js'],
        interests: ['Web Development'],
        languages: ['English'],
      })

      // Predefined options for combobox
      const skillOptions = [
        'JavaScript',
        'TypeScript',
        'Vue.js',
        'React',
        'Angular',
        'Node.js',
        'Python',
        'Java',
        'C#',
        'PHP',
        'Ruby',
        'Go',
        'Rust',
        'Swift',
        'HTML',
        'CSS',
        'SASS',
        'Tailwind CSS',
        'Bootstrap',
      ]

      const comboboxQuery = ref('')
      const comboboxOpen = ref(false)

      const filteredSkills = computed(() => {
        return skillOptions.filter(
          (skill) =>
            skill.toLowerCase().includes(comboboxQuery.value.toLowerCase()) &&
            !formData.value.skills.includes(skill)
        )
      })

      const addSkillFromCombobox = (skill: string) => {
        if (!formData.value.skills.includes(skill)) {
          formData.value.skills.push(skill)
        }
        comboboxQuery.value = ''
        comboboxOpen.value = false
      }

      const handleSubmit = () => {
        console.log('Form submitted:', formData.value)
        alert('Form data logged to console')
      }

      const resetForm = () => {
        formData.value = {
          skills: [],
          interests: [],
          languages: [],
        }
        comboboxQuery.value = ''
      }

      return {
        formData,
        handleSubmit,
        resetForm,
        skillOptions,
        comboboxQuery,
        comboboxOpen,
        filteredSkills,
        addSkillFromCombobox,
      }
    },
    template: `
      <Card class="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Profile Form</CardTitle>
          <CardDescription>
            Fill in your profile information using tags for better organization
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-6">
          <div class="space-y-2">
            <Label for="skills">Technical Skills</Label>
            <TagsInput id="skills" v-model="formData.skills" class="min-h-12">
              <TagsInputItem v-for="item in formData.skills" :key="item" :value="item">
                <TagsInputItemText />
                <TagsInputItemDelete />
              </TagsInputItem>
              <TagsInputInput placeholder="Add technical skills..." />
            </TagsInput>
          </div>

          <div class="space-y-2">
            <Label>Technical Skills (Searchable Alternative)</Label>
            <Combobox v-model:open="comboboxOpen" v-model:searchTerm="comboboxQuery">
              <ComboboxTrigger class="w-full justify-between">
                {{ comboboxQuery || 'Search and select skills...' }}
                <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </ComboboxTrigger>
              <ComboboxList class="w-full p-0">
                <ComboboxEmpty>No skills found</ComboboxEmpty>
                <ComboboxItem 
                  v-for="skill in filteredSkills" 
                  :key="skill" 
                  :value="skill"
                  @select="addSkillFromCombobox(skill)"
                  class="cursor-pointer"
                >
                  {{ skill }}
                  <ComboboxItemIndicator>
                    <Check class="h-4 w-4" />
                  </ComboboxItemIndicator>
                </ComboboxItem>
              </ComboboxList>
            </Combobox>
            <p class="text-xs text-muted-foreground">Search for predefined skills to add to your profile</p>
          </div>

          <div class="space-y-2">
            <Label for="interests">Interests</Label>
            <TagsInput id="interests" v-model="formData.interests" :max="5" class="min-h-12">
              <TagsInputItem v-for="item in formData.interests" :key="item" :value="item" class="bg-green-100 text-green-800">
                <TagsInputItemText />
                <TagsInputItemDelete />
              </TagsInputItem>
              <TagsInputInput placeholder="Add interests (max 5)..." />
            </TagsInput>
          </div>

          <div class="space-y-2">
            <Label for="languages">Languages</Label>
            <TagsInput id="languages" v-model="formData.languages" class="min-h-12">
              <TagsInputItem v-for="item in formData.languages" :key="item" :value="item" class="bg-blue-100 text-blue-800">
                <TagsInputItemText />
                <TagsInputItemDelete />
              </TagsInputItem>
              <TagsInputInput placeholder="Add languages..." />
            </TagsInput>
          </div>

          <div class="flex space-x-2 pt-4">
            <Button @click="handleSubmit" class="flex-1">Submit Profile</Button>
            <Button @click="resetForm" variant="outline">Reset</Button>
          </div>
        </CardContent>
      </Card>
    `,
  }),
}
