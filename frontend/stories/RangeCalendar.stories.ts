import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { RangeCalendar } from '@/components/ui/range-calendar'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ref, computed } from 'vue'
import type { DateRange } from 'reka-ui'
import { getLocalTimeZone, today, CalendarDate } from '@internationalized/date'

const meta = {
  title: 'UI Components/RangeCalendar',
  component: RangeCalendar,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A date range calendar component for selecting date ranges with various modes, restrictions, and customization options.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    modelValue: {
      control: false,
      description: 'The selected date range value',
    },
    numberOfMonths: {
      control: { type: 'number', min: 1, max: 6 },
      description: 'Number of months to display at once',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Whether the calendar is disabled',
    },
    readonly: {
      control: { type: 'boolean' },
      description: 'Whether the calendar is read-only',
    },
    maximumDays: {
      control: { type: 'number', min: 1, max: 365 },
      description: 'Maximum number of days that can be selected',
    },
    weekStartsOn: {
      control: {
        type: 'select',
        options: {
          Sunday: 0,
          Monday: 1,
          Tuesday: 2,
          Wednesday: 3,
          Thursday: 4,
          Friday: 5,
          Saturday: 6,
        },
      },
      description: 'Day of week to start calendar (0 = Sunday)',
    },
    locale: {
      control: { type: 'text' },
      description: 'Locale for formatting dates',
    },
    class: {
      control: { type: 'text' },
      description: 'Additional CSS classes',
    },
  },
  args: {
    numberOfMonths: 2,
    disabled: false,
    readonly: false,
    locale: 'en-US',
    weekStartsOn: 0,
  },
} satisfies Meta<typeof RangeCalendar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => ({
    components: { RangeCalendar },
    setup() {
      const start = today(getLocalTimeZone())
      const end = start.add({ days: 7 })

      const value = ref({
        start,
        end,
      }) as any

      return { args, value }
    },
    template: `
      <RangeCalendar v-model="value" v-bind="args" class="rounded-md border" />
    `,
  }),
}

export const MultipleMonths: Story = {
  render: () => ({
    components: { RangeCalendar },
    setup() {
      const start = today(getLocalTimeZone()).add({ days: 2 })
      const end = start.add({ days: 10 })

      const value = ref({
        start,
        end,
      }) as any

      return { value }
    },
    template: `
      <RangeCalendar 
        v-model="value" 
        :number-of-months="3" 
        class="rounded-md border" 
      />
    `,
  }),
}

export const WithRestrictions: Story = {
  render: () => ({
    components: { RangeCalendar, Card, CardContent, CardHeader, CardTitle },
    setup() {
      const value = ref() as any
      const maxDays = ref(10)

      // Disable weekends
      const isDateDisabled = (date: CalendarDate) => {
        const dayOfWeek = date.toDate(getLocalTimeZone()).getDay()
        return dayOfWeek === 0 || dayOfWeek === 6 // Sunday = 0, Saturday = 6
      }

      const formatDuration = (start: any, end: any) => {
        if (!start || !end) return 0
        return (
          Math.ceil(
            (end.toDate(getLocalTimeZone()).getTime() -
              start.toDate(getLocalTimeZone()).getTime()) /
              (1000 * 60 * 60 * 24)
          ) + 1
        )
      }

      return { value, maxDays, isDateDisabled, formatDuration }
    },
    template: `
      <Card class="w-fit">
        <CardHeader>
          <CardTitle>With Restrictions</CardTitle>
          <div class="text-sm text-muted-foreground">
            Weekends disabled, max {{ maxDays }} days
          </div>
        </CardHeader>
        <CardContent>
          <RangeCalendar 
            v-model="value" 
            :maximum-days="maxDays"
            :is-date-disabled="isDateDisabled"
            class="rounded-md border" 
          />
          <div v-if="value && value.start && value.end" class="mt-4 p-3 bg-muted rounded text-sm">
            <div><strong>Selected:</strong></div>
            <div>From: {{ value.start.toString() }}</div>
            <div>To: {{ value.end.toString() }}</div>
            <div class="mt-1 text-xs text-muted-foreground">
              Duration: {{ formatDuration(value.start, value.end) }} days
            </div>
          </div>
        </CardContent>
      </Card>
    `,
  }),
}

export const DisabledState: Story = {
  render: () => ({
    components: { RangeCalendar },
    setup() {
      const value = ref({
        start: today(getLocalTimeZone()).add({ days: 3 }),
        end: today(getLocalTimeZone()).add({ days: 8 }),
      }) as any

      return { value }
    },
    template: `
      <RangeCalendar 
        v-model="value"
        disabled
        :number-of-months="1"
        class="rounded-md border" 
      />
    `,
  }),
}

export const ControlledExample: Story = {
  render: () => ({
    components: { RangeCalendar, Button },
    setup() {
      const value = ref() as any

      const presets = [
        {
          name: 'Next 7 days',
          range: {
            start: today(getLocalTimeZone()).add({ days: 1 }),
            end: today(getLocalTimeZone()).add({ days: 7 }),
          },
        },
        {
          name: 'Next 30 days',
          range: {
            start: today(getLocalTimeZone()).add({ days: 1 }),
            end: today(getLocalTimeZone()).add({ days: 30 }),
          },
        },
      ]

      const applyPreset = (preset: { range: any }) => {
        value.value = preset.range
      }

      const clearSelection = () => {
        value.value = undefined
      }

      return { value, presets, applyPreset, clearSelection }
    },
    template: `
      <div class="space-y-4">
        <div class="flex gap-2">
          <Button 
            v-for="preset in presets" 
            :key="preset.name"
            @click="applyPreset(preset)"
            variant="outline"
            size="sm"
          >
            {{ preset.name }}
          </Button>
          <Button @click="clearSelection" variant="outline" size="sm">
            Clear
          </Button>
        </div>
        <RangeCalendar 
          v-model="value"
          :number-of-months="2"
          class="rounded-md border" 
        />
      </div>
    `,
  }),
}
