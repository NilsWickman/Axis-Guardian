# Storybook Organization

This directory contains all Storybook stories organized by component type.

## Structure

```
src/stories/
├── index.ts                 # Central exports for all stories
├── README.md               # This documentation
└── *.stories.ts           # Individual component stories
```

## Folder Organization in Storybook

All stories are organized under the **"UI Components"** folder in Storybook for easy browsing:

- `UI Components/Alert` - Alert component variations
- `UI Components/Avatar` - Avatar component with fallbacks and states
- `UI Components/Badge` - Badge component for status, categories, and counts
- `UI Components/Button` - Button component with all variants and sizes
- `UI Components/Card` - Card component for different content types
- `UI Components/Combobox` - Searchable dropdown component with keyboard navigation
- `UI Components/Input` - Input component with various types and states

## Adding New Stories

To add a new component story:

1. Create a new `ComponentName.stories.ts` file
2. Use the title format: `'UI Components/ComponentName'`
3. Include comprehensive mock data for different scenarios
4. Add export to `index.ts`

### Template Structure

```typescript
import type { Meta, StoryObj } from '@storybook/vue3'
import { ComponentName } from '@/components/ui/component-name'

// Mock data for different scenarios
const mockData = {
  // organized scenarios
}

const meta = {
  title: 'UI Components/ComponentName',
  component: ComponentName,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Component description here.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    // component props
  },
} satisfies Meta<typeof ComponentName>

export default meta
type Story = StoryObj<typeof meta>

// Stories here...
```

## Available Components to Add

From `src/components/, components are organized into distinct directories that mirrors the storybook implementation.

## Future Expansion

You can create additional folder structures for:

- **Layout Components** - Navigation, sidebars, headers
- **Form Components** - Complex form patterns and validation
- **Data Display** - Tables, lists, data visualization
- **Feedback** - Loading states, notifications, modals
- **Utility** - Overlays, portals, providers

Each new category should follow the same pattern of centralized organization and comprehensive mock data.