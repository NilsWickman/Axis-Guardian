import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { ref } from 'vue'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationFirst,
  PaginationItem,
  PaginationLast,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

// Mock data for different pagination scenarios
const mockPaginationData = {
  // Small dataset - blog posts
  blogPosts: {
    total: 47,
    itemsPerPage: 10,
    currentPage: 3,
    context: 'Blog Posts',
    description: 'Navigating through blog articles',
  },
  // Medium dataset - product catalog
  products: {
    total: 250,
    itemsPerPage: 24,
    currentPage: 5,
    context: 'Product Catalog',
    description: 'Browsing through product listings',
  },
  // Large dataset - search results
  searchResults: {
    total: 1247,
    itemsPerPage: 20,
    currentPage: 15,
    context: 'Search Results',
    description: 'Navigating through search results',
  },
  // Very large dataset - data table
  dataTable: {
    total: 10000,
    itemsPerPage: 100,
    currentPage: 42,
    context: 'Data Table',
    description: 'Large dataset pagination for data tables',
  },
  // Small total - few pages
  gallery: {
    total: 23,
    itemsPerPage: 12,
    currentPage: 1,
    context: 'Image Gallery',
    description: 'Small gallery with minimal pagination',
  },
  // Edge case - single page
  singlePage: {
    total: 8,
    itemsPerPage: 10,
    currentPage: 1,
    context: 'Single Page',
    description: 'Dataset that fits on one page',
  },
}

const meta = {
  title: 'UI Components/Pagination',
  component: Pagination,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A pagination component for navigating through large datasets. Built on top of reka-ui primitives with full keyboard navigation and accessibility support.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    page: {
      control: { type: 'number', min: 1 },
      description: 'The controlled value of the current page',
    },
    defaultPage: {
      control: { type: 'number', min: 1 },
      description: 'The default page when initially rendered',
    },
    itemsPerPage: {
      control: { type: 'number', min: 1, max: 100 },
      description: 'Number of items per page',
    },
    total: {
      control: { type: 'number', min: 0 },
      description: 'Total number of items',
    },
    siblingCount: {
      control: { type: 'number', min: 0, max: 5 },
      description: 'Number of siblings shown around current page',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Disable all pagination interactions',
    },
    showEdges: {
      control: { type: 'boolean' },
      description: 'Always show first page, last page, and ellipsis',
    },
  },
} satisfies Meta<typeof Pagination>

export default meta
type Story = StoryObj<typeof meta>

// Default pagination example
export const Default: Story = {
  args: {
    total: mockPaginationData.blogPosts.total,
    itemsPerPage: mockPaginationData.blogPosts.itemsPerPage,
    defaultPage: mockPaginationData.blogPosts.currentPage,
    siblingCount: 1,
    showEdges: true,
  },
  render: (args) => ({
    components: {
      Pagination,
      PaginationContent,
      PaginationEllipsis,
      PaginationItem,
      PaginationNext,
      PaginationPrevious,
    },
    setup() {
      return { args }
    },
    template: `
      <div class="space-y-4">
        <Pagination v-slot="{ page }" v-bind="args" class="mx-auto">
          <PaginationContent v-slot="{ items }">
            <PaginationPrevious />

            <template v-for="(item, index) in items" :key="index">
              <PaginationItem
                v-if="item.type === 'page'"
                :value="item.value"
                :is-active="item.value === page"
              >
                {{ item.value }}
              </PaginationItem>
              <PaginationEllipsis v-else-if="item.type === 'ellipsis'" />
            </template>

            <PaginationNext />
          </PaginationContent>
          <div class="text-sm text-muted-foreground text-center mt-4">
            Showing page {{ page }} of {{ Math.ceil(args.total / args.itemsPerPage) }} 
            ({{ args.total }} total items)
          </div>
        </Pagination>
      </div>
    `,
  }),
}

// Different sibling count
export const WithSiblings: Story = {
  args: {
    total: mockPaginationData.products.total,
    itemsPerPage: mockPaginationData.products.itemsPerPage,
    defaultPage: 5,
    siblingCount: 2,
    showEdges: true,
  },
  render: (args) => ({
    components: {
      Pagination,
      PaginationContent,
      PaginationEllipsis,
      PaginationItem,
      PaginationNext,
      PaginationPrevious,
    },
    setup() {
      return { args }
    },
    template: `
      <div class="space-y-4">
        <div class="text-center">
          <h3 class="text-lg font-semibold">Pagination with 2 Siblings</h3>
          <p class="text-muted-foreground text-sm">
            Shows 2 page numbers on each side of current page
          </p>
        </div>
        
        <Pagination v-slot="{ page }" v-bind="args" class="mx-auto">
          <PaginationContent v-slot="{ items }">
            <PaginationPrevious />

            <template v-for="(item, index) in items" :key="index">
              <PaginationItem
                v-if="item.type === 'page'"
                :value="item.value"
                :is-active="item.value === page"
              >
                {{ item.value }}
              </PaginationItem>
              <PaginationEllipsis v-else-if="item.type === 'ellipsis'" />
            </template>

            <PaginationNext />
          </PaginationContent>
          <div class="text-sm text-muted-foreground text-center mt-4">
            Page {{ page }} of {{ Math.ceil(args.total / args.itemsPerPage) }}
          </div>
        </Pagination>
      </div>
    `,
  }),
}

// Without edges
export const WithoutEdges: Story = {
  args: {
    total: 300,
    itemsPerPage: 15,
    defaultPage: 8,
    siblingCount: 1,
    showEdges: false,
  },
  render: (args) => ({
    components: {
      Pagination,
      PaginationContent,
      PaginationEllipsis,
      PaginationItem,
      PaginationNext,
      PaginationPrevious,
    },
    setup() {
      return { args }
    },
    template: `
      <div class="space-y-4">
        <div class="text-center">
          <h3 class="text-lg font-semibold">Without Edges</h3>
          <p class="text-muted-foreground text-sm">
            More compact pagination without always showing first/last pages
          </p>
        </div>
        
        <Pagination v-slot="{ page }" v-bind="args" class="mx-auto">
          <PaginationContent v-slot="{ items }">
            <PaginationPrevious />

            <template v-for="(item, index) in items" :key="index">
              <PaginationItem
                v-if="item.type === 'page'"
                :value="item.value"
                :is-active="item.value === page"
              >
                {{ item.value }}
              </PaginationItem>
              <PaginationEllipsis v-else-if="item.type === 'ellipsis'" />
            </template>

            <PaginationNext />
          </PaginationContent>
          <div class="text-sm text-muted-foreground text-center mt-4">
            Page {{ page }} of {{ Math.ceil(args.total / args.itemsPerPage) }}
          </div>
        </Pagination>
      </div>
    `,
  }),
}

// Disabled state
export const Disabled: Story = {
  args: {
    total: mockPaginationData.blogPosts.total,
    itemsPerPage: mockPaginationData.blogPosts.itemsPerPage,
    defaultPage: 3,
    disabled: true,
    siblingCount: 1,
    showEdges: true,
  },
  render: (args) => ({
    components: {
      Pagination,
      PaginationContent,
      PaginationEllipsis,
      PaginationItem,
      PaginationNext,
      PaginationPrevious,
    },
    setup() {
      return { args }
    },
    template: `
      <div class="space-y-4">
        <div class="text-center">
          <h3 class="text-lg font-semibold text-muted-foreground">Loading Content...</h3>
          <p class="text-muted-foreground">Pagination is disabled while content loads</p>
        </div>
        
        <Pagination v-slot="{ page }" v-bind="args" class="mx-auto">
          <PaginationContent v-slot="{ items }">
            <PaginationPrevious />

            <template v-for="(item, index) in items" :key="index">
              <PaginationItem
                v-if="item.type === 'page'"
                :value="item.value"
                :is-active="item.value === page"
              >
                {{ item.value }}
              </PaginationItem>
              <PaginationEllipsis v-else-if="item.type === 'ellipsis'" />
            </template>

            <PaginationNext />
          </PaginationContent>
          <div class="text-sm text-muted-foreground text-center mt-4">
            Page {{ page }} of {{ Math.ceil(args.total / args.itemsPerPage) }}
          </div>
        </Pagination>
      </div>
    `,
  }),
}
