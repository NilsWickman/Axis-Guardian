import type { Meta, StoryObj } from '@storybook/vue3-vite'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Package, Edit, Trash2, Eye, User } from 'lucide-vue-next'

// Mock data for different table scenarios
const mockUsers = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    role: 'Admin',
    status: 'active',
    joinDate: '2024-01-15',
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'User',
    status: 'active',
    joinDate: '2024-02-20',
  },
  {
    id: 3,
    name: 'Bob Johnson',
    email: 'bob@example.com',
    role: 'Editor',
    status: 'inactive',
    joinDate: '2024-03-10',
  },
  {
    id: 4,
    name: 'Alice Williams',
    email: 'alice@example.com',
    role: 'User',
    status: 'active',
    joinDate: '2024-04-05',
  },
  {
    id: 5,
    name: 'Charlie Brown',
    email: 'charlie@example.com',
    role: 'Admin',
    status: 'suspended',
    joinDate: '2024-05-12',
  },
]

const mockProducts = [
  {
    id: 1,
    name: 'Wireless Headphones',
    category: 'Electronics',
    price: 199,
    stock: 15,
    status: 'in-stock',
    sales: 1240,
  },
  {
    id: 2,
    name: 'Coffee Mug',
    category: 'Kitchen',
    price: 25,
    stock: 0,
    status: 'out-of-stock',
    sales: 856,
  },
  {
    id: 3,
    name: 'Laptop Stand',
    category: 'Office',
    price: 89,
    stock: 8,
    status: 'low-stock',
    sales: 432,
  },
  {
    id: 4,
    name: 'Bluetooth Speaker',
    category: 'Electronics',
    price: 149,
    stock: 32,
    status: 'in-stock',
    sales: 2150,
  },
  {
    id: 5,
    name: 'Notebook Set',
    category: 'Office',
    price: 45,
    stock: 25,
    status: 'in-stock',
    sales: 678,
  },
]

const meta = {
  title: 'UI Components/Table',
  component: Table,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A flexible table component for displaying structured data with responsive design and customizable styling.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Table>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => ({
    components: {
      Table,
      TableHeader,
      TableBody,
      TableHead,
      TableRow,
      TableCell,
    },
    setup() {
      return { mockUsers }
    },
    template: `
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="user in mockUsers" :key="user.id">
            <TableCell class="font-medium">{{ user.name }}</TableCell>
            <TableCell>{{ user.email }}</TableCell>
            <TableCell>{{ user.role }}</TableCell>
            <TableCell>{{ user.status }}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    `,
  }),
}

export const CompactTable: Story = {
  render: () => ({
    components: {
      Table,
      TableHeader,
      TableBody,
      TableHead,
      TableRow,
      TableCell,
      Badge,
    },
    setup() {
      const getUserStatusVariant = (status: string) => {
        if (status === 'active') return 'default'
        if (status === 'inactive') return 'destructive'
        return 'secondary'
      }

      return { mockUsers, getUserStatusVariant }
    },
    template: `
      <Table class="text-sm">
        <TableHeader>
          <TableRow>
            <TableHead class="h-8">Name</TableHead>
            <TableHead class="h-8">Role</TableHead>
            <TableHead class="h-8">Status</TableHead>
            <TableHead class="h-8">Join Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="user in mockUsers" :key="user.id" class="h-10">
            <TableCell class="font-medium py-1">{{ user.name }}</TableCell>
            <TableCell class="py-1">{{ user.role }}</TableCell>
            <TableCell class="py-1">
              <Badge :variant="getUserStatusVariant(user.status)" class="text-xs">
                {{ user.status }}
              </Badge>
            </TableCell>
            <TableCell class="text-muted-foreground py-1">{{ user.joinDate }}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    `,
  }),
}

export const ResponsiveTable: Story = {
  render: () => ({
    components: {
      Table,
      TableHeader,
      TableBody,
      TableHead,
      TableRow,
      TableCell,
      Badge,
      Button,
      Package,
      Edit,
      Trash2,
    },
    setup() {
      const getStockVariant = (stock: number) => {
        if (stock === 0) return 'destructive'
        if (stock < 20) return 'secondary'
        return 'default'
      }

      const getStatusVariant = (status: string) => {
        if (status === 'in-stock') return 'default'
        if (status === 'out-of-stock') return 'destructive'
        return 'secondary'
      }

      const formatStatus = (status: string) => {
        return status.replace('-', ' ')
      }

      return { mockProducts, getStockVariant, getStatusVariant, formatStatus }
    },
    template: `
      <div class="w-full overflow-auto">
        <Table class="min-w-[600px]">
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead class="hidden sm:table-cell">Category</TableHead>
              <TableHead class="text-right">Price</TableHead>
              <TableHead class="text-center hidden md:table-cell">Stock</TableHead>
              <TableHead class="hidden lg:table-cell">Status</TableHead>
              <TableHead class="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="product in mockProducts" :key="product.id">
              <TableCell>
                <div class="flex items-center space-x-2">
                  <Package class="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div class="font-medium">{{ product.name }}</div>
                    <div class="text-sm text-muted-foreground sm:hidden">{{ product.category }}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell class="hidden sm:table-cell">{{ product.category }}</TableCell>
              <TableCell class="text-right font-medium">{{ '$' + product.price }}</TableCell>
              <TableCell class="text-center hidden md:table-cell">
                <Badge :variant="getStockVariant(product.stock)">
                  {{ product.stock }}
                </Badge>
              </TableCell>
              <TableCell class="hidden lg:table-cell">
                <Badge :variant="getStatusVariant(product.status)">
                  {{ formatStatus(product.status) }}
                </Badge>
              </TableCell>
              <TableCell class="text-right">
                <div class="flex justify-end space-x-1">
                  <Button variant="ghost" size="sm">
                    <Edit class="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Trash2 class="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    `,
  }),
}

export const EmptyStateTable: Story = {
  render: () => ({
    components: {
      Table,
      TableHeader,
      TableBody,
      TableHead,
      TableRow,
      TableCell,
    },
    template: `
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell colspan="4" class="h-24 text-center">
              No results found.
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    `,
  }),
}

export const StripedTable: Story = {
  render: () => ({
    components: {
      Table,
      TableHeader,
      TableBody,
      TableHead,
      TableRow,
      TableCell,
      Badge,
    },
    setup() {
      const getUserStatusVariant = (status: string) => {
        if (status === 'active') return 'default'
        if (status === 'inactive') return 'destructive'
        return 'secondary'
      }

      return { mockUsers, getUserStatusVariant }
    },
    template: `
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Join Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow 
            v-for="(user, index) in mockUsers" 
            :key="user.id"
            :class="index % 2 === 1 ? 'bg-muted/50' : ''"
          >
            <TableCell class="font-medium">{{ user.name }}</TableCell>
            <TableCell>{{ user.role }}</TableCell>
            <TableCell>
              <Badge :variant="getUserStatusVariant(user.status)">
                {{ user.status }}
              </Badge>
            </TableCell>
            <TableCell class="text-muted-foreground">{{ user.joinDate }}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    `,
  }),
}

export const SelectableRowsTable: Story = {
  render: () => ({
    components: {
      Table,
      TableHeader,
      TableBody,
      TableHead,
      TableRow,
      TableCell,
      TableCaption,
      Avatar,
      AvatarImage,
      AvatarFallback,
      Badge,
      Button,
      Checkbox,
      Edit,
      Trash2,
      Eye,
      User,
    },
    setup() {
      const getUserStatusVariant = (status: string) => {
        if (status === 'active') return 'default'
        if (status === 'inactive') return 'destructive'
        return 'secondary'
      }

      return { mockUsers, getUserStatusVariant }
    },
    template: `
      <Table>
        <TableCaption>A list of users in your organization</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead class="w-12">
              <Checkbox />
            </TableHead>
            <TableHead>User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead class="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="user in mockUsers" :key="user.id">
            <TableCell>
              <Checkbox />
            </TableCell>
            <TableCell>
              <div class="flex items-center space-x-3">
                <Avatar class="h-8 w-8">
                  <AvatarImage :src="'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.name" />
                  <AvatarFallback>
                    <User class="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div class="font-medium">{{ user.name }}</div>
                  <div class="text-sm text-muted-foreground">{{ user.email }}</div>
                </div>
              </div>
            </TableCell>
            <TableCell>{{ user.role }}</TableCell>
            <TableCell>
              <Badge :variant="getUserStatusVariant(user.status)">
                {{ user.status }}
              </Badge>
            </TableCell>
            <TableCell class="text-right">
              <div class="flex justify-end space-x-1">
                <Button variant="ghost" size="sm">
                  <Eye class="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Edit class="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Trash2 class="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    `,
  }),
}
