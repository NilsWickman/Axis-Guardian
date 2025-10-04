import type { Meta, StoryObj } from '@storybook/vue3-vite'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Heart,
  Star,
  ShoppingCart,
  Image as ImageIcon,
  Play,
  Clock,
  Users,
  MapPin,
  Calendar,
} from 'lucide-vue-next'

// Mock data for different carousel scenarios
const mockCarouselData = {
  basic: Array.from({ length: 5 }, (_, i) => ({
    id: i + 1,
    title: `Slide ${i + 1}`,
    content: `This is the content for slide ${i + 1}`,
  })),

  images: Array.from({ length: 6 }, (_, i) => ({
    id: i + 1,
    title: `Image ${i + 1}`,
    alt: `Sample image ${i + 1}`,
    color: [
      'bg-gradient-to-br from-blue-400 to-blue-600',
      'bg-gradient-to-br from-green-400 to-green-600',
      'bg-gradient-to-br from-purple-400 to-purple-600',
      'bg-gradient-to-br from-red-400 to-red-600',
      'bg-gradient-to-br from-yellow-400 to-yellow-600',
      'bg-gradient-to-br from-pink-400 to-pink-600',
    ][i % 6],
  })),

  products: [
    {
      id: 1,
      name: 'Wireless Headphones',
      price: '$199',
      originalPrice: '$249',
      rating: 4.5,
      reviews: 128,
      image: 'bg-gradient-to-br from-blue-100 to-blue-200',
      badge: 'Sale',
    },
    {
      id: 2,
      name: 'Smart Watch',
      price: '$299',
      rating: 4.8,
      reviews: 256,
      image: 'bg-gradient-to-br from-purple-100 to-purple-200',
      badge: 'New',
    },
    {
      id: 3,
      name: 'Bluetooth Speaker',
      price: '$99',
      originalPrice: '$129',
      rating: 4.3,
      reviews: 89,
      image: 'bg-gradient-to-br from-green-100 to-green-200',
      badge: 'Sale',
    },
    {
      id: 4,
      name: 'Phone Case',
      price: '$29',
      rating: 4.1,
      reviews: 45,
      image: 'bg-gradient-to-br from-red-100 to-red-200',
    },
    {
      id: 5,
      name: 'Charging Cable',
      price: '$19',
      originalPrice: '$25',
      rating: 4.0,
      reviews: 67,
      image: 'bg-gradient-to-br from-yellow-100 to-yellow-200',
      badge: 'Sale',
    },
  ],

  testimonials: [
    {
      id: 1,
      name: 'Sarah Johnson',
      role: 'Product Designer',
      company: 'TechCorp',
      content:
        'This product has completely transformed how we work. The interface is intuitive and the features are exactly what we needed.',
      avatar: 'bg-gradient-to-br from-blue-400 to-purple-500',
      rating: 5,
    },
    {
      id: 2,
      name: 'Michael Chen',
      role: 'Frontend Developer',
      company: 'StartupXYZ',
      content:
        'Amazing developer experience and great documentation. Implementation was smooth and the results exceeded our expectations.',
      avatar: 'bg-gradient-to-br from-green-400 to-teal-500',
      rating: 5,
    },
    {
      id: 3,
      name: 'Emma Davis',
      role: 'Marketing Manager',
      company: 'GrowthCo',
      content:
        'The analytics and insights provided have been invaluable for our marketing campaigns. Highly recommended!',
      avatar: 'bg-gradient-to-br from-pink-400 to-rose-500',
      rating: 5,
    },
    {
      id: 4,
      name: 'David Wilson',
      role: 'CEO',
      company: 'InnovateLabs',
      content:
        'Outstanding support team and robust features. This solution has helped us scale efficiently.',
      avatar: 'bg-gradient-to-br from-orange-400 to-red-500',
      rating: 5,
    },
  ],

  courses: [
    {
      id: 1,
      title: 'Vue.js Fundamentals',
      instructor: 'Jane Doe',
      duration: '6 hours',
      students: 1234,
      price: '$89',
      level: 'Beginner',
      image: 'bg-gradient-to-br from-green-400 to-emerald-600',
    },
    {
      id: 2,
      title: 'Advanced TypeScript',
      instructor: 'John Smith',
      duration: '8 hours',
      students: 892,
      price: '$129',
      level: 'Advanced',
      image: 'bg-gradient-to-br from-blue-400 to-cyan-600',
    },
    {
      id: 3,
      title: 'UI/UX Design Principles',
      instructor: 'Alice Johnson',
      duration: '4 hours',
      students: 567,
      price: '$69',
      level: 'Intermediate',
      image: 'bg-gradient-to-br from-purple-400 to-violet-600',
    },
    {
      id: 4,
      title: 'React Hooks Mastery',
      instructor: 'Bob Wilson',
      duration: '5 hours',
      students: 1456,
      price: '$99',
      level: 'Intermediate',
      image: 'bg-gradient-to-br from-red-400 to-pink-600',
    },
  ],

  events: [
    {
      id: 1,
      title: 'Vue.js Conference 2024',
      date: 'June 15-16',
      location: 'San Francisco',
      attendees: 500,
      price: 'Free',
      category: 'Conference',
      image: 'bg-gradient-to-br from-green-400 to-teal-500',
    },
    {
      id: 2,
      title: 'Design Systems Workshop',
      date: 'July 8',
      location: 'Online',
      attendees: 150,
      price: '$49',
      category: 'Workshop',
      image: 'bg-gradient-to-br from-blue-400 to-indigo-500',
    },
    {
      id: 3,
      title: 'TypeScript Bootcamp',
      date: 'August 12-14',
      location: 'New York',
      attendees: 200,
      price: '$299',
      category: 'Bootcamp',
      image: 'bg-gradient-to-br from-purple-400 to-pink-500',
    },
  ],
}

const meta = {
  title: 'UI Components/Carousel',
  component: Carousel,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A flexible carousel component for displaying content in slides with navigation controls.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    orientation: {
      control: { type: 'select' },
      options: ['horizontal', 'vertical'],
      description: 'Orientation of the carousel',
    },
    opts: {
      control: { type: 'object' },
      description: 'Embla carousel options',
    },
    class: {
      control: { type: 'text' },
      description: 'Additional CSS classes',
    },
  },
} satisfies Meta<typeof Carousel>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => ({
    components: {
      Carousel,
      CarouselContent,
      CarouselItem,
      CarouselNext,
      CarouselPrevious,
      Card,
      CardContent,
    },
    setup() {
      const slides = mockCarouselData.basic
      return { args, slides }
    },
    template: `
      <Carousel v-bind="args" class="w-full max-w-xs">
        <CarouselContent>
          <CarouselItem v-for="slide in slides" :key="slide.id">
            <div class="p-1">
              <Card>
                <CardContent class="flex aspect-square items-center justify-center p-6">
                  <span class="text-4xl font-semibold">{{ slide.id }}</span>
                </CardContent>
              </Card>
            </div>
          </CarouselItem>
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    `,
  }),
}

export const WithImages: Story = {
  render: (args) => ({
    components: {
      Carousel,
      CarouselContent,
      CarouselItem,
      CarouselNext,
      CarouselPrevious,
      Card,
      CardContent,
      ImageIcon,
    },
    setup() {
      const images = mockCarouselData.images
      return { args, images }
    },
    template: `
      <Carousel v-bind="args" class="w-full max-w-md">
        <CarouselContent>
          <CarouselItem v-for="image in images" :key="image.id">
            <div class="p-1">
              <Card class="py-0">
                <CardContent class="flex aspect-video items-center justify-center p-0">
                  <div :class="['w-full h-full rounded-xl flex items-center justify-center', image.color]">
                    <div class="text-center text-white">
                      <ImageIcon class="h-12 w-12 mx-auto mb-2 opacity-80" />
                      <p class="text-lg font-medium">{{ image.title }}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CarouselItem>
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    `,
  }),
}

export const ProductShowcase: Story = {
  render: (args) => ({
    components: {
      Carousel,
      CarouselContent,
      CarouselItem,
      CarouselNext,
      CarouselPrevious,
      Card,
      CardContent,
      Button,
      Badge,
      Star,
      ShoppingCart,
    },
    setup() {
      const products = mockCarouselData.products
      return { args, products }
    },
    template: `
      <Carousel v-bind="args" class="w-full max-w-4xl">
        <CarouselContent class="-ml-2 md:-ml-4">
          <CarouselItem 
            v-for="product in products" 
            :key="product.id" 
            class="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3"
          >
            <Card class="h-full py-0">
              <CardContent class="p-0">
                <div :class="['aspect-square flex items-center justify-center rounded-t-xl relative', product.image]">
                  <div class="w-20 h-20 bg-white rounded-full shadow-lg"></div>
                  <Badge 
                    v-if="product.badge" 
                    :variant="product.badge === 'Sale' ? 'destructive' : 'default'"
                    class="absolute top-2 right-2"
                  >
                    {{ product.badge }}
                  </Badge>
                </div>
                <div class="p-4 space-y-3">
                  <div>
                    <h3 class="font-semibold text-lg leading-tight">{{ product.name }}</h3>
                    <div class="flex items-center gap-1 mt-1">
                      <Star class="h-4 w-4 fill-current text-yellow-400" />
                      <span class="text-sm">{{ product.rating }}</span>
                      <span class="text-sm text-muted-foreground">({{ product.reviews }})</span>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-xl font-bold">{{ product.price }}</span>
                    <span 
                      v-if="product.originalPrice" 
                      class="text-sm text-muted-foreground line-through"
                    >
                      {{ product.originalPrice }}
                    </span>
                  </div>
                  <Button class="w-full" size="sm">
                    <ShoppingCart class="mr-2 h-4 w-4" />
                    Add to Cart
                  </Button>
                </div>
              </CardContent>
            </Card>
          </CarouselItem>
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    `,
  }),
}

export const Testimonials: Story = {
  render: (args) => ({
    components: {
      Carousel,
      CarouselContent,
      CarouselItem,
      CarouselNext,
      CarouselPrevious,
      Card,
      CardContent,
      Star,
    },
    setup() {
      const testimonials = mockCarouselData.testimonials
      return { args, testimonials }
    },
    template: `
      <Carousel v-bind="args" class="w-full max-w-4xl">
        <CarouselContent class="-ml-4">
          <CarouselItem 
            v-for="testimonial in testimonials" 
            :key="testimonial.id" 
            class="pl-4 md:basis-1/2"
          >
            <Card class="h-full">
              <CardContent class="p-6">
                <div class="space-y-4">
                  <div class="flex">
                    <Star v-for="n in testimonial.rating" :key="n" class="h-4 w-4 fill-current text-yellow-400" />
                  </div>
                  <blockquote class="text-lg italic text-muted-foreground">
                    "{{ testimonial.content }}"
                  </blockquote>
                  <div class="flex items-center gap-3 pt-4 border-t">
                    <div :class="['w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold', testimonial.avatar]">
                      {{ testimonial.name.split(' ').map(n => n[0]).join('') }}
                    </div>
                    <div>
                      <div class="font-semibold">{{ testimonial.name }}</div>
                      <div class="text-sm text-muted-foreground">
                        {{ testimonial.role }} at {{ testimonial.company }}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </CarouselItem>
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    `,
  }),
}

export const CourseCards: Story = {
  render: (args) => ({
    components: {
      Carousel,
      CarouselContent,
      CarouselItem,
      CarouselNext,
      CarouselPrevious,
      Card,
      CardContent,
      Button,
      Badge,
      Play,
      Clock,
      Users,
    },
    setup() {
      const courses = mockCarouselData.courses
      return { args, courses }
    },
    template: `
      <Carousel v-bind="args" class="w-full max-w-5xl">
        <CarouselContent class="-ml-4">
          <CarouselItem 
            v-for="course in courses" 
            :key="course.id" 
            class="pl-4 md:basis-1/2 lg:basis-1/3"
          >
            <Card class="h-full py-0">
              <CardContent class="p-0">
                <div :class="['aspect-video flex items-center justify-center rounded-t-xl relative', course.image]">
                  <div class="bg-white/20 backdrop-blur-sm rounded-full p-4">
                    <Play class="h-8 w-8 text-white fill-current" />
                  </div>
                  <Badge class="absolute top-3 left-3">{{ course.level }}</Badge>
                </div>
                <div class="p-4 space-y-3">
                  <div>
                    <h3 class="font-semibold text-lg leading-tight">{{ course.title }}</h3>
                    <p class="text-sm text-muted-foreground">by {{ course.instructor }}</p>
                  </div>
                  <div class="flex items-center gap-4 text-sm text-muted-foreground">
                    <span class="flex items-center gap-1">
                      <Clock class="h-4 w-4" />
                      {{ course.duration }}
                    </span>
                    <span class="flex items-center gap-1">
                      <Users class="h-4 w-4" />
                      {{ course.students }}
                    </span>
                  </div>
                  <div class="flex items-center justify-between pt-2">
                    <span class="text-xl font-bold">{{ course.price }}</span>
                    <Button size="sm">Enroll Now</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </CarouselItem>
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    `,
  }),
}

export const EventCards: Story = {
  render: (args) => ({
    components: {
      Carousel,
      CarouselContent,
      CarouselItem,
      CarouselNext,
      CarouselPrevious,
      Card,
      CardContent,
      Button,
      Badge,
      Calendar,
      MapPin,
      Users,
    },
    setup() {
      const events = mockCarouselData.events
      return { args, events }
    },
    template: `
      <Carousel v-bind="args" class="w-full max-w-4xl">
        <CarouselContent class="-ml-4">
          <CarouselItem 
            v-for="event in events" 
            :key="event.id" 
            class="pl-4 md:basis-1/2"
          >
            <Card class="h-full py-0">
              <CardContent class="p-0">
                <div :class="['h-32 flex items-center justify-center rounded-t-xl relative', event.image]">
                  <h3 class="text-xl font-bold text-white text-center px-4">{{ event.title }}</h3>
                  <Badge variant="secondary" class="absolute top-3 right-3">{{ event.category }}</Badge>
                </div>
                <div class="p-4 space-y-3">
                  <div class="space-y-2">
                    <div class="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar class="h-4 w-4" />
                      {{ event.date }}
                    </div>
                    <div class="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin class="h-4 w-4" />
                      {{ event.location }}
                    </div>
                    <div class="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users class="h-4 w-4" />
                      {{ event.attendees }} attendees
                    </div>
                  </div>
                  <div class="flex items-center justify-between pt-2">
                    <span class="text-xl font-bold">{{ event.price }}</span>
                    <Button size="sm">Register</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </CarouselItem>
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    `,
  }),
}

export const VerticalOrientation: Story = {
  args: {
    orientation: 'vertical',
  },
  render: (args) => ({
    components: {
      Carousel,
      CarouselContent,
      CarouselItem,
      CarouselNext,
      CarouselPrevious,
      Card,
      CardContent,
    },
    setup() {
      const slides = mockCarouselData.basic.slice(0, 4)
      return { args, slides }
    },
    template: `
      <Carousel v-bind="args" class="w-full max-w-xs mx-auto">
        <CarouselContent class="h-80">
          <CarouselItem v-for="slide in slides" :key="slide.id" class="pt-1 md:basis-1/2">
            <div class="p-1">
              <Card>
                <CardContent class="flex items-center justify-center p-6">
                  <span class="text-2xl font-semibold">{{ slide.id }}</span>
                </CardContent>
              </Card>
            </div>
          </CarouselItem>
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    `,
  }),
}

export const MultipleItemsVisible: Story = {
  render: (args) => ({
    components: {
      Carousel,
      CarouselContent,
      CarouselItem,
      CarouselNext,
      CarouselPrevious,
      Card,
      CardContent,
    },
    setup() {
      const slides = Array.from({ length: 8 }, (_, i) => ({ id: i + 1 }))
      return { args, slides }
    },
    template: `
      <Carousel v-bind="args" class="w-full max-w-4xl">
        <CarouselContent class="-ml-1">
          <CarouselItem 
            v-for="slide in slides" 
            :key="slide.id" 
            class="pl-1 md:basis-1/2 lg:basis-1/3"
          >
            <div class="p-1">
              <Card>
                <CardContent class="flex aspect-square items-center justify-center p-6">
                  <span class="text-4xl font-semibold">{{ slide.id }}</span>
                </CardContent>
              </Card>
            </div>
          </CarouselItem>
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    `,
  }),
}

export const WithAutoplay: Story = {
  args: {
    opts: {
      loop: true,
    },
    plugins: [
      // Note: Autoplay plugin would need to be imported and configured
      // This is a placeholder showing the structure
    ],
  },
  render: (args) => ({
    components: {
      Carousel,
      CarouselContent,
      CarouselItem,
      CarouselNext,
      CarouselPrevious,
      Card,
      CardContent,
    },
    setup() {
      const slides = mockCarouselData.images
      return { args, slides }
    },
    template: `
      <Carousel v-bind="args" class="w-full max-w-lg">
        <CarouselContent>
          <CarouselItem v-for="image in slides" :key="image.id">
            <div class="p-1">
              <Card class="py-0">
                <CardContent class="flex aspect-video items-center justify-center p-0">
                  <div :class="['w-full h-full rounded-xl flex items-center justify-center', image.color]">
                    <div class="text-center text-white">
                      <ImageIcon class="h-12 w-12 mx-auto mb-2 opacity-80" />
                      <p class="text-lg font-medium">{{ image.title }}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CarouselItem>
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    `,
  }),
}

export const NoNavigation: Story = {
  render: (args) => ({
    components: {
      Carousel,
      CarouselContent,
      CarouselItem,
      Card,
      CardContent,
    },
    setup() {
      const slides = mockCarouselData.basic.slice(0, 3)
      return { args, slides }
    },
    template: `
      <Carousel v-bind="args" class="w-full max-w-xs">
        <CarouselContent>
          <CarouselItem v-for="slide in slides" :key="slide.id">
            <div class="p-1">
              <Card>
                <CardContent class="flex aspect-square items-center justify-center p-6">
                  <span class="text-4xl font-semibold">{{ slide.id }}</span>
                </CardContent>
              </Card>
            </div>
          </CarouselItem>
        </CarouselContent>
      </Carousel>
    `,
  }),
}
