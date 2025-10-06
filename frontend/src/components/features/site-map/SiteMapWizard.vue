<template>
  <Dialog :open="open" @update:open="handleOpenChange">
    <DialogContent class="max-w-2xl">
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
        <DialogDescription>
          {{ description }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4 py-4">
        <!-- Creation Mode Tabs -->
        <div class="flex gap-2 p-1 bg-muted rounded-lg">
          <button
            @click="creationMode = 'upload'"
            class="flex-1 px-3 py-2 text-sm rounded transition-colors"
            :class="creationMode === 'upload' ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground'"
          >
            📁 Upload Floor Plan
          </button>
          <button
            @click="creationMode = 'blank'"
            class="flex-1 px-3 py-2 text-sm rounded transition-colors"
            :class="creationMode === 'blank' ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground'"
          >
            📐 Blank Canvas
          </button>
        </div>

        <!-- Name Input -->
        <div class="space-y-2">
          <label for="map-name" class="text-sm font-medium">Name *</label>
          <input
            id="map-name"
            v-model="form.name"
            type="text"
            placeholder="e.g., Building A - Floor 1"
            class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        <!-- Description Input -->
        <div class="space-y-2">
          <label for="map-description" class="text-sm font-medium">Description</label>
          <textarea
            id="map-description"
            v-model="form.description"
            placeholder="Optional description of this site map"
            rows="3"
            class="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
          ></textarea>
        </div>

        <!-- Upload Mode -->
        <div v-if="creationMode === 'upload'" class="space-y-2">
          <label for="floor-plan" class="text-sm font-medium">Floor Plan Image *</label>
          <div class="border-2 border-dashed border-input rounded-lg p-6 hover:border-primary/50 transition-colors">
            <input
              id="floor-plan"
              ref="fileInputRef"
              type="file"
              accept="image/*"
              @change="handleFileSelect"
              class="hidden"
            />

            <div v-if="!form.floorPlanFile" class="text-center">
              <svg
                class="mx-auto h-12 w-12 text-muted-foreground"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <div class="mt-4">
                <button
                  type="button"
                  @click="fileInputRef?.click()"
                  class="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
                >
                  Choose File
                </button>
                <p class="mt-2 text-xs text-muted-foreground">
                  PNG, JPG, GIF up to 10MB
                </p>
              </div>
            </div>

            <div v-else class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="h-16 w-16 rounded border overflow-hidden bg-muted">
                  <img
                    v-if="form.floorPlanPreview"
                    :src="form.floorPlanPreview"
                    :alt="form.floorPlanFile.name"
                    class="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <p class="text-sm font-medium">{{ form.floorPlanFile.name }}</p>
                  <p class="text-xs text-muted-foreground">
                    {{ formatFileSize(form.floorPlanFile.size) }}
                  </p>
                </div>
              </div>
              <button
                type="button"
                @click="clearFile"
                class="text-sm text-destructive hover:text-destructive/90"
              >
                Remove
              </button>
            </div>
          </div>
        </div>

        <!-- Blank Canvas Mode -->
        <div v-if="creationMode === 'blank'" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label for="canvas-width" class="text-sm font-medium">Width (px) *</label>
              <input
                id="canvas-width"
                v-model.number="form.width"
                type="number"
                min="100"
                max="5000"
                placeholder="1000"
                class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div class="space-y-2">
              <label for="canvas-height" class="text-sm font-medium">Height (px) *</label>
              <input
                id="canvas-height"
                v-model.number="form.height"
                type="number"
                min="100"
                max="5000"
                placeholder="800"
                class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </div>
          <div class="space-y-2">
            <label for="pixels-per-meter" class="text-sm font-medium">Scale (pixels per meter)</label>
            <input
              id="pixels-per-meter"
              v-model.number="form.scale"
              type="number"
              min="10"
              max="200"
              placeholder="50"
              class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <p class="text-xs text-muted-foreground">
              Default is 50px/m. Higher values mean more detail.
            </p>
          </div>
        </div>
      </div>

      <DialogFooter>
        <button
          type="button"
          @click="handleCancel"
          class="px-4 py-2 border rounded-md hover:bg-accent text-sm transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          @click.prevent="handleSubmit"
          :disabled="!canSubmit"
          class="px-4 py-2 rounded-md text-sm transition-colors"
          :class="canSubmit
            ? 'bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer'
            : 'bg-muted text-muted-foreground cursor-not-allowed'"
        >
          Create Site Map
        </button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../ui/dialog'

interface Props {
  open: boolean
  title?: string
  description?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Create New Site Map',
  description: 'Upload a floor plan image or create a blank canvas to start mapping your cameras.'
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  'submit': [data: {
    name: string
    description?: string
    imagePath?: string
    width: number
    height: number
    scale: number
  }]
}>()

const creationMode = ref<'upload' | 'blank'>('upload')
const fileInputRef = ref<HTMLInputElement | null>(null)

const form = reactive({
  name: '',
  description: '',
  floorPlanFile: null as File | null,
  floorPlanPreview: null as string | null,
  width: 1000,
  height: 800,
  scale: 50
})

const canSubmit = computed(() => {
  if (!form.name.trim()) return false

  if (creationMode.value === 'upload') {
    return form.floorPlanFile !== null
  } else {
    return form.width > 0 && form.height > 0 && form.scale > 0
  }
})

const handleOpenChange = (value: boolean) => {
  if (!value) {
    resetForm()
  }
  emit('update:open', value)
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (file) {
    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      alert('File size must be less than 10MB')
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    form.floorPlanFile = file

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      form.floorPlanPreview = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

const clearFile = () => {
  form.floorPlanFile = null
  form.floorPlanPreview = null
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

const handleCancel = () => {
  emit('update:open', false)
  resetForm()
}

const handleSubmit = async () => {
  if (!canSubmit.value) return

  let width = form.width
  let height = form.height
  let imagePath: string | undefined = undefined

  // If upload mode and floor plan is provided, get its dimensions
  if (creationMode.value === 'upload' && form.floorPlanFile && form.floorPlanPreview) {
    const img = new Image()
    await new Promise((resolve, reject) => {
      img.onload = () => {
        width = img.width
        height = img.height
        resolve(null)
      }
      img.onerror = reject
      img.src = form.floorPlanPreview!
    })
    imagePath = form.floorPlanPreview
  }

  emit('submit', {
    name: form.name,
    description: form.description || undefined,
    imagePath,
    width,
    height,
    scale: form.scale
  })

  emit('update:open', false)
  resetForm()
}

const resetForm = () => {
  form.name = ''
  form.description = ''
  form.floorPlanFile = null
  form.floorPlanPreview = null
  form.width = 1000
  form.height = 800
  form.scale = 50
  creationMode.value = 'upload'
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}
</script>
