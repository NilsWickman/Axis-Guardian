import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { Calendar } from '@/components/ui/calendar'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ref, computed } from 'vue'
import type { DateValue } from '@internationalized/date'
import {
  CalendarDate,
  getLocalTimeZone,
  today,
  startOfMonth,
  endOfMonth,
  isWeekend,
} from '@internationalized/date'

// Mock data for different calendar scenarios
const mockCalendarData = {
  singleDate: {
    today: today(getLocalTimeZone()),
    futureDate: today(getLocalTimeZone()).add({ days: 7 }),
    pastDate: today(getLocalTimeZone()).subtract({ days: 30 }),
  },
  multipleDates: [
    today(getLocalTimeZone()),
    today(getLocalTimeZone()).add({ days: 2 }),
    today(getLocalTimeZone()).add({ days: 5 }),
    today(getLocalTimeZone()).add({ days: 10 }),
  ],
  dateRanges: {
    thisWeek: {
      start: today(getLocalTimeZone()).subtract({ days: today(getLocalTimeZone()).day }),
      end: today(getLocalTimeZone()).add({ days: 6 - today(getLocalTimeZone()).day }),
    },
    thisMonth: {
      start: startOfMonth(today(getLocalTimeZone())),
      end: endOfMonth(today(getLocalTimeZone())),
    },
  },
  restrictions: {
    minDate: today(getLocalTimeZone()).subtract({ days: 30 }),
    maxDate: today(getLocalTimeZone()).add({ days: 90 }),
    disabledWeekends: (date: CalendarDate) => isWeekend(date, getLocalTimeZone()),
  },
  locales: [
    { code: 'en-US', name: 'English (US)' },
    { code: 'en-GB', name: 'English (UK)' },
    { code: 'es-ES', name: 'Spanish' },
    { code: 'fr-FR', name: 'French' },
    { code: 'de-DE', name: 'German' },
    { code: 'ja-JP', name: 'Japanese' },
  ],
}

const meta = {
  title: 'UI Components/Calendar',
  component: Calendar,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A date calendar component for date selection with various modes, restrictions, and customization options.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    modelValue: {
      control: false,
      description: 'The selected date(s) value',
    },
    multiple: {
      control: { type: 'boolean' },
      description: 'Whether multiple dates can be selected',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Whether the calendar is disabled',
    },
    locale: {
      control: { type: 'text' },
      description: 'The locale to use for formatting dates',
    },
    minValue: {
      control: false,
      description: 'The minimum selectable date',
    },
    maxValue: {
      control: false,
      description: 'The maximum selectable date',
    },
    calendarLabel: {
      control: { type: 'text' },
      description: 'Accessible label for the calendar',
    },
    class: {
      control: { type: 'text' },
      description: 'Additional CSS classes',
    },
  },
  args: {
    multiple: false,
    disabled: false,
    locale: 'en-US',
    calendarLabel: 'Select a date',
  },
} satisfies Meta<typeof Calendar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => ({
    components: { Calendar },
    setup() {
      const selectedDate = ref<CalendarDate>()
      return { args, selectedDate }
    },
    template: `
      <Calendar 
        v-model="selectedDate"
        v-bind="args" 
      />
    `,
  }),
}

export const WithSelectedDate: Story = {
  render: () => ({
    components: { Calendar, Label },
    setup() {
      const { singleDate } = mockCalendarData
      const selectedDate = ref(singleDate.today)

      return { selectedDate }
    },
    template: `
      <div class="space-y-4 max-w-md">
        <div class="space-y-2">
          <Label>Calendar with Today Selected</Label>
          <Calendar v-model="selectedDate" />
        </div>
        <div v-if="selectedDate" class="text-sm text-muted-foreground">
          Selected: {{ selectedDate.toString() }}
        </div>
      </div>
    `,
  }),
}

export const MultipleSelection: Story = {
  render: () => ({
    components: { Calendar, Label, Card, CardHeader, CardTitle, CardContent },
    setup() {
      const { multipleDates } = mockCalendarData
      const selectedDates = ref([...multipleDates])

      const dateList = computed(() => selectedDates.value.map((date) => date.toString()).join(', '))

      return { selectedDates, dateList }
    },
    template: `
      <div class="space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Multiple Date Selection</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar 
              v-model="selectedDates"
              :multiple="true"
            />
            <div v-if="selectedDates.length > 0" class="mt-4 text-sm">
              <strong>Selected dates ({{ selectedDates.length }}):</strong>
              <div class="text-muted-foreground mt-1">{{ dateList }}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    `,
  }),
}

export const WithMinMaxDates: Story = {
  render: () => ({
    components: { Calendar, Label, Card, CardHeader, CardTitle, CardContent, CardDescription },
    setup() {
      const { restrictions } = mockCalendarData
      const selectedDate = ref<CalendarDate>()

      const minDateStr = restrictions.minDate.toString()
      const maxDateStr = restrictions.maxDate.toString()

      return {
        selectedDate,
        minDate: restrictions.minDate,
        maxDate: restrictions.maxDate,
        minDateStr,
        maxDateStr,
      }
    },
    template: `
      <div class="space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Date Range Restrictions</CardTitle>
            <CardDescription>
              Only dates between {{ minDateStr }} and {{ maxDateStr }} can be selected
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar 
              v-model="selectedDate"
              :min-value="minDate"
              :max-value="maxDate"
            />
            <div v-if="selectedDate" class="mt-4 text-sm text-muted-foreground">
              Selected: {{ selectedDate.toString() }}
            </div>
          </CardContent>
        </Card>
      </div>
    `,
  }),
}

export const DisabledCalendar: Story = {
  render: () => ({
    components: { Calendar, Label, Card, CardHeader, CardTitle, CardContent },
    setup() {
      const { singleDate } = mockCalendarData
      const selectedDate = ref(singleDate.today)

      return { selectedDate }
    },
    template: `
      <div class="space-y-6 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Disabled Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar 
              v-model="selectedDate"
              disabled
            />
            <div class="mt-4 text-sm text-muted-foreground">
              Calendar is disabled for interaction
            </div>
          </CardContent>
        </Card>
      </div>
    `,
  }),
}

export const DifferentLocales: Story = {
  render: () => ({
    components: { Calendar, Label, Card, CardHeader, CardTitle, CardContent },
    setup() {
      const { locales } = mockCalendarData
      const selectedDate = ref<CalendarDate>()
      const currentLocale = ref('en-US')

      return {
        selectedDate,
        currentLocale,
        locales,
      }
    },
    template: `
      <div class="space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Calendar with Different Locales</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="space-y-2">
              <Label for="locale-select">Select Locale</Label>
              <select 
                id="locale-select"
                v-model="currentLocale"
                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              >
                <option 
                  v-for="locale in locales" 
                  :key="locale.code" 
                  :value="locale.code"
                >
                  {{ locale.name }}
                </option>
              </select>
            </div>
            
            <Calendar 
              v-model="selectedDate"
              :locale="currentLocale"
            />
            
            <div v-if="selectedDate" class="text-sm text-muted-foreground">
              Selected: {{ selectedDate.toString() }} ({{ currentLocale }})
            </div>
          </CardContent>
        </Card>
      </div>
    `,
  }),
}

export const CalendarStates: Story = {
  render: () => ({
    components: { Calendar, Label, Card, CardHeader, CardTitle, CardContent },
    setup() {
      const { singleDate } = mockCalendarData
      const todayDate = ref(singleDate.today)
      const futureDate = ref(singleDate.futureDate)
      const pastDate = ref(singleDate.pastDate)

      return { todayDate, futureDate, pastDate }
    },
    template: `
      <div class="space-y-6">
        <div class="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle class="text-base">Today Selected</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar v-model="todayDate" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle class="text-base">Future Date</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar v-model="futureDate" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle class="text-base">Past Date</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar v-model="pastDate" />
            </CardContent>
          </Card>
        </div>
      </div>
    `,
  }),
}

export const InteractiveExample: Story = {
  render: () => ({
    components: {
      Calendar,
      Label,
      Button,
      Card,
      CardHeader,
      CardTitle,
      CardContent,
      CardDescription,
    },
    setup() {
      const selectedDate = ref<CalendarDate>()
      const showMultiple = ref(false)
      const selectedDates = ref<CalendarDate[]>([])
      const isDisabled = ref(false)

      const clearSelection = () => {
        selectedDate.value = undefined
        selectedDates.value = []
      }

      const selectToday = () => {
        const todayDate = today(getLocalTimeZone())
        if (showMultiple.value) {
          selectedDates.value = [todayDate]
        } else {
          selectedDate.value = todayDate
        }
      }

      const toggleMode = () => {
        showMultiple.value = !showMultiple.value
        clearSelection()
      }

      const currentSelection = computed(() => {
        if (showMultiple.value) {
          return selectedDates.value.length > 0
            ? selectedDates.value.map((d) => d.toString()).join(', ')
            : 'No dates selected'
        } else {
          return selectedDate.value ? selectedDate.value.toString() : 'No date selected'
        }
      })

      return {
        selectedDate,
        selectedDates,
        showMultiple,
        isDisabled,
        clearSelection,
        selectToday,
        toggleMode,
        currentSelection,
      }
    },
    template: `
      <div class="space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Interactive Calendar Demo</CardTitle>
            <CardDescription>
              Try different calendar modes and interactions
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <!-- Controls -->
            <div class="flex flex-wrap gap-2">
              <Button 
                @click="toggleMode" 
                variant="outline"
                size="sm"
              >
                {{ showMultiple ? 'Single Selection' : 'Multiple Selection' }}
              </Button>
              <Button 
                @click="selectToday" 
                variant="outline"
                size="sm"
                :disabled="isDisabled"
              >
                Select Today
              </Button>
              <Button 
                @click="clearSelection" 
                variant="outline"
                size="sm"
                :disabled="isDisabled"
              >
                Clear
              </Button>
              <Button 
                @click="isDisabled = !isDisabled" 
                variant="outline"
                size="sm"
              >
                {{ isDisabled ? 'Enable' : 'Disable' }}
              </Button>
            </div>
            
            <!-- Calendar -->
            <Calendar 
              v-if="showMultiple"
              v-model="selectedDates"
              :multiple="true"
              :disabled="isDisabled"
            />
            <Calendar 
              v-else
              v-model="selectedDate"
              :disabled="isDisabled"
            />
            
            <!-- Selection Display -->
            <div class="space-y-2">
              <Label>Current Selection:</Label>
              <div class="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                <div><strong>Mode:</strong> {{ showMultiple ? 'Multiple' : 'Single' }}</div>
                <div><strong>Status:</strong> {{ isDisabled ? 'Disabled' : 'Enabled' }}</div>
                <div><strong>Selection:</strong> {{ currentSelection }}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    `,
  }),
}

export const DatePickerUseCase: Story = {
  render: () => ({
    components: { Calendar, Label, Button, Card, CardHeader, CardTitle, CardContent },
    setup() {
      const appointmentDate = ref<CalendarDate>()
      const eventDates = ref<CalendarDate[]>([])
      const { restrictions } = mockCalendarData

      const submitAppointment = () => {
        if (appointmentDate.value) {
          alert(`Appointment scheduled for: ${appointmentDate.value.toString()}`)
        }
      }

      const addToEvents = () => {
        if (
          appointmentDate.value &&
          !eventDates.value.some((d) => d.compare(appointmentDate.value!) === 0)
        ) {
          eventDates.value.push(appointmentDate.value)
        }
      }

      return {
        appointmentDate,
        eventDates,
        minDate: restrictions.minDate,
        maxDate: restrictions.maxDate,
        submitAppointment,
        addToEvents,
      }
    },
    template: `
      <div class="space-y-6">
        <div class="grid gap-6 lg:grid-cols-2">
          <!-- Single Appointment Booking -->
          <Card>
            <CardHeader>
              <CardTitle>Book Appointment</CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
              <div class="space-y-2">
                <Label>Select appointment date</Label>
                <Calendar 
                  v-model="appointmentDate"
                  :min-value="minDate"
                  :max-value="maxDate"
                />
              </div>
              
              <div class="flex gap-2">
                <Button 
                  @click="submitAppointment"
                  :disabled="!appointmentDate"
                  size="sm"
                >
                  Book Appointment
                </Button>
                <Button 
                  @click="addToEvents"
                  variant="outline"
                  :disabled="!appointmentDate"
                  size="sm"
                >
                  Add to Events
                </Button>
              </div>
              
              <div v-if="appointmentDate" class="text-sm text-muted-foreground">
                Selected: {{ appointmentDate.toString() }}
              </div>
            </CardContent>
          </Card>
          
          <!-- Event Planning -->
          <Card>
            <CardHeader>
              <CardTitle>Event Planning</CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
              <div class="space-y-2">
                <Label>Select multiple event dates</Label>
                <Calendar 
                  v-model="eventDates"
                  :multiple="true"
                  :min-value="minDate"
                  :max-value="maxDate"
                />
              </div>
              
              <div v-if="eventDates.length > 0" class="space-y-2">
                <Label>Planned Events ({{ eventDates.length }}):</Label>
                <ul class="text-sm text-muted-foreground space-y-1">
                  <li 
                    v-for="(date, index) in eventDates" 
                    :key="date.toString()"
                    class="flex items-center justify-between"
                  >
                    <span>{{ date.toString() }}</span>
                    <Button 
                      @click="eventDates.splice(index, 1)"
                      variant="ghost"
                      size="sm"
                    >
                      Remove
                    </Button>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    `,
  }),
}
