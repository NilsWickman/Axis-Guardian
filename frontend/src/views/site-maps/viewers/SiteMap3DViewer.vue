<template>
  <div class="h-full w-full bg-background flex flex-col">
    <!-- Header -->
    <div class="border-b bg-card px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <router-link
            to="/site-maps"
            class="p-2 hover:bg-accent rounded transition-colors"
            title="Back to Site Maps"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m12 19-7-7 7-7"/>
              <path d="M19 12H5"/>
            </svg>
          </router-link>
          <div>
            <h1 class="text-2xl font-bold text-foreground">{{ siteMap?.name || 'Site Map 3D View' }}</h1>
            <p class="text-sm text-muted-foreground mt-1">
              3D Point Cloud Reconstruction
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <router-link
            :to="`/site-maps/${siteMapId}/view-2d`"
            class="px-3 py-2 border border-border rounded hover:bg-accent transition-colors text-sm"
          >
            View 2D
          </router-link>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <div class="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
        <p class="text-muted-foreground">Loading 3D model...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="flex-1 flex items-center justify-center">
      <div class="text-center max-w-md">
        <div class="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-destructive">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-foreground mb-2">Failed to Load 3D Model</h3>
        <p class="text-sm text-muted-foreground mb-4">{{ error }}</p>
        <button
          @click="loadSiteMap"
          class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>

    <!-- 3D Viewer -->
    <div v-else class="flex-1 flex overflow-hidden">
      <!-- Left Panel - Controls -->
      <div class="w-80 border-r bg-card p-6 overflow-y-auto">
        <h2 class="text-lg font-semibold mb-4">3D Viewer Controls</h2>

        <div class="space-y-6">
          <!-- Display Options -->
          <div>
            <h3 class="text-sm font-semibold mb-3">Display</h3>
            <div class="space-y-2">
              <label class="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  v-model="displayOptions.showPointCloud"
                  type="checkbox"
                  class="rounded border-gray-300"
                  @change="updateDisplay"
                />
                <span>Show Point Cloud</span>
              </label>
              <label class="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  v-model="displayOptions.showCameras"
                  type="checkbox"
                  class="rounded border-gray-300"
                  @change="updateDisplay"
                />
                <span>Show Cameras</span>
              </label>
              <label class="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  v-model="displayOptions.showWalls"
                  type="checkbox"
                  class="rounded border-gray-300"
                  @change="updateDisplay"
                />
                <span>Show Walls</span>
              </label>
              <label class="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  v-model="displayOptions.showGrid"
                  type="checkbox"
                  class="rounded border-gray-300"
                  @change="updateDisplay"
                />
                <span>Show Grid</span>
              </label>
              <label class="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  v-model="displayOptions.wireframe"
                  type="checkbox"
                  class="rounded border-gray-300"
                  @change="updateDisplay"
                />
                <span>Wireframe Mode</span>
              </label>
            </div>
          </div>

          <!-- Point Size -->
          <div>
            <label class="block text-sm font-semibold mb-2">
              Point Size: {{ displayOptions.pointSize.toFixed(2) }}
            </label>
            <input
              v-model.number="displayOptions.pointSize"
              type="range"
              min="0.01"
              max="0.1"
              step="0.01"
              class="w-full"
              @input="updateDisplay"
            />
          </div>

          <!-- Camera Info -->
          <div v-if="siteMap?.reconstruction?.cameraPoses" class="border-t pt-4">
            <h3 class="text-sm font-semibold mb-3">Cameras ({{ siteMap.reconstruction.cameraPoses.length }})</h3>
            <div class="space-y-2">
              <div
                v-for="pose in siteMap.reconstruction.cameraPoses"
                :key="pose.cameraId"
                class="p-2 bg-muted rounded text-xs"
              >
                <div class="font-medium mb-1">{{ pose.cameraId }}</div>
                <div class="text-muted-foreground space-y-0.5">
                  <div>Pos: ({{ pose.position[0].toFixed(1) }}, {{ pose.position[1].toFixed(1) }}, {{ pose.position[2].toFixed(1) }})</div>
                  <div>Confidence: {{ (pose.confidence * 100).toFixed(0) }}%</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Point Cloud Info -->
          <div v-if="siteMap?.reconstruction?.pointCloud" class="border-t pt-4">
            <h3 class="text-sm font-semibold mb-3">Point Cloud</h3>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-muted-foreground">Vertices:</span>
                <span class="font-medium">{{ siteMap.reconstruction.pointCloud.vertices.toLocaleString() }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">Format:</span>
                <span class="font-medium uppercase">{{ siteMap.reconstruction.pointCloud.format }}</span>
              </div>
            </div>
          </div>

          <!-- Quality Metrics -->
          <div v-if="siteMap?.reconstruction?.quality" class="border-t pt-4">
            <h3 class="text-sm font-semibold mb-3">Quality Metrics</h3>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-muted-foreground">Coverage:</span>
                <span class="font-medium">{{ (siteMap.reconstruction.quality.coverage * 100).toFixed(0) }}%</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">Feature Matches:</span>
                <span class="font-medium">{{ siteMap.reconstruction.quality.featureMatches }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">Reconstruction Error:</span>
                <span class="font-medium">{{ siteMap.reconstruction.quality.reconstructionError.toFixed(3) }}</span>
              </div>
            </div>
          </div>

          <!-- View Controls -->
          <div class="border-t pt-4">
            <h3 class="text-sm font-semibold mb-3">View Controls</h3>
            <div class="space-y-2">
              <button
                @click="resetCamera"
                class="w-full px-3 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors text-sm"
              >
                Reset View
              </button>
              <button
                @click="viewFromTop"
                class="w-full px-3 py-2 border border-border rounded hover:bg-accent transition-colors text-sm"
              >
                Top View
              </button>
              <button
                @click="viewFromSide"
                class="w-full px-3 py-2 border border-border rounded hover:bg-accent transition-colors text-sm"
              >
                Side View
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Center - 3D Canvas -->
      <div class="flex-1 relative bg-gray-900">
        <canvas
          ref="canvas"
          class="w-full h-full"
        ></canvas>

        <!-- Stats Overlay -->
        <div class="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-2 rounded text-sm font-mono space-y-1">
          <div>FPS: {{ fps }}</div>
          <div>Points: {{ pointsRendered.toLocaleString() }}</div>
          <div v-if="selectedCamera">Camera: {{ selectedCamera }}</div>
        </div>

        <!-- Instructions Overlay -->
        <div class="absolute top-4 right-4 bg-black/70 text-white px-4 py-3 rounded text-xs space-y-1 max-w-xs">
          <div class="font-semibold mb-2">Controls:</div>
          <div><kbd class="px-1 py-0.5 bg-white/20 rounded">Left Click</kbd> + Drag to rotate</div>
          <div><kbd class="px-1 py-0.5 bg-white/20 rounded">Right Click</kbd> + Drag to pan</div>
          <div><kbd class="px-1 py-0.5 bg-white/20 rounded">Scroll</kbd> to zoom</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type { EnhancedSiteMap } from '@/types/sitemap'

const route = useRoute()
const siteMapId = ref(route.params.id as string)

const loading = ref(true)
const error = ref<string | null>(null)
const siteMap = ref<EnhancedSiteMap | null>(null)

const canvas = ref<HTMLCanvasElement | null>(null)
const scene = ref<THREE.Scene | null>(null)
const camera = ref<THREE.PerspectiveCamera | null>(null)
const renderer = ref<THREE.WebGLRenderer | null>(null)
const controls = ref<OrbitControls | null>(null)

const pointCloud = ref<THREE.Points | null>(null)
const cameraMeshes = ref<THREE.Mesh[]>([])
const wallMeshes = ref<THREE.Line[]>([])
const gridHelper = ref<THREE.GridHelper | null>(null)

const fps = ref(60)
const pointsRendered = ref(0)
const selectedCamera = ref<string | null>(null)

const displayOptions = ref({
  showPointCloud: true,
  showCameras: true,
  showWalls: true,
  showGrid: true,
  wireframe: false,
  pointSize: 0.03
})

let animationFrameId: number | null = null
let lastFrameTime = Date.now()

async function loadSiteMap() {
  loading.value = true
  error.value = null

  try {
    // Mock data - replace with actual API call
    siteMap.value = {
      id: siteMapId.value,
      name: 'Auditorium Site Map',
      description: 'Auto-generated from 4 cameras using Structure from Motion',
      source: 'generated-sfm',
      width: 1800,
      height: 3200,
      scale: 50,
      origin: { x: 0, y: 0 },
      walls: [],
      cameras: [],
      reconstruction: {
        method: 'sfm',
        timestamp: new Date().toISOString(),
        pointCloud: {
          vertices: 124567,
          url: '/shared/site-maps/generated/sfm-auditorium-001/pointcloud.ply',
          format: 'ply'
        },
        cameraPoses: [
          {
            cameraId: 'camera1',
            position: [2.5, 1.68, 4.2],
            rotation: [0, 0.785, 0],
            confidence: 0.92
          },
          {
            cameraId: 'camera2',
            position: [6.0, 1.67, 8.0],
            rotation: [0, 2.356, 0],
            confidence: 0.88
          },
          {
            cameraId: 'camera3',
            position: [10.0, 2.62, 4.2],
            rotation: [0, 3.927, 0],
            confidence: 0.95
          },
          {
            cameraId: 'camera4',
            position: [14.0, 1.84, 8.0],
            rotation: [0, 5.498, 0],
            confidence: 0.90
          }
        ],
        quality: {
          featureMatches: 2456,
          reconstructionError: 0.043,
          coverage: 0.87
        }
      },
      generated_at: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Set loading to false first so the canvas element is rendered in the DOM
    loading.value = false

    // Wait for the DOM to update before initializing Three.js
    await nextTick()

    await initThreeJS()
    await loadPointCloudData()
    renderCameras()
    renderWalls()
    renderGrid()
    animate()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load site map'
    console.error('Error loading site map:', err)
    loading.value = false
  }
}

function initThreeJS() {
  if (!canvas.value) {
    throw new Error('Canvas not found')
  }

  // Scene
  scene.value = new THREE.Scene()
  scene.value.background = new THREE.Color(0x1a1a1a)
  scene.value.fog = new THREE.Fog(0x1a1a1a, 10, 50)

  // Camera
  const aspect = canvas.value.clientWidth / canvas.value.clientHeight
  camera.value = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000)
  camera.value.position.set(10, 15, 20)
  camera.value.lookAt(0, 0, 0)

  // Renderer
  renderer.value = new THREE.WebGLRenderer({
    canvas: canvas.value,
    antialias: true,
    alpha: false
  })
  renderer.value.setSize(canvas.value.clientWidth, canvas.value.clientHeight)
  renderer.value.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  // Controls
  controls.value = new OrbitControls(camera.value, renderer.value.domElement)
  controls.value.enableDamping = true
  controls.value.dampingFactor = 0.05
  controls.value.minDistance = 1
  controls.value.maxDistance = 100
  controls.value.target.set(0, 0, 0)

  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.value.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(10, 20, 10)
  directionalLight.castShadow = true
  scene.value.add(directionalLight)

  const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4)
  directionalLight2.position.set(-10, 10, -10)
  scene.value.add(directionalLight2)

  // Handle resize
  window.addEventListener('resize', handleResize)
}

async function loadPointCloudData() {
  if (!scene.value || !siteMap.value?.reconstruction?.pointCloud) return

  // Generate mock point cloud (in production, load from .ply file)
  const vertices = siteMap.value.reconstruction.pointCloud.vertices
  const geometry = new THREE.BufferGeometry()

  const positions = new Float32Array(vertices * 3)
  const colors = new Float32Array(vertices * 3)

  // Generate random points in a room-like shape
  for (let i = 0; i < vertices; i++) {
    const i3 = i * 3

    // Create room-like distribution
    positions[i3] = (Math.random() - 0.5) * 18 // x: -9 to 9
    positions[i3 + 1] = Math.random() * 3 // y: 0 to 3
    positions[i3 + 2] = (Math.random() - 0.5) * 32 // z: -16 to 16

    // Color based on height
    const heightRatio = positions[i3 + 1] / 3
    colors[i3] = 0.3 + heightRatio * 0.5
    colors[i3 + 1] = 0.5 + heightRatio * 0.3
    colors[i3 + 2] = 0.8 + heightRatio * 0.2
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  const material = new THREE.PointsMaterial({
    size: displayOptions.value.pointSize,
    vertexColors: true,
    sizeAttenuation: true
  })

  pointCloud.value = new THREE.Points(geometry, material)
  scene.value.add(pointCloud.value)

  pointsRendered.value = vertices
}

function renderCameras() {
  if (!scene.value || !siteMap.value?.reconstruction?.cameraPoses) return

  // Clear existing camera meshes
  cameraMeshes.value.forEach(mesh => scene.value!.remove(mesh))
  cameraMeshes.value = []

  siteMap.value.reconstruction.cameraPoses.forEach(pose => {
    // Camera body (cone)
    const geometry = new THREE.ConeGeometry(0.3, 0.8, 4)
    const material = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      metalness: 0.5,
      roughness: 0.5
    })
    const mesh = new THREE.Mesh(geometry, material)

    mesh.position.set(...pose.position)
    mesh.rotation.set(...pose.rotation)
    mesh.rotation.x = -Math.PI / 2 // Point cone forward

    scene.value!.add(mesh)
    cameraMeshes.value.push(mesh)

    // Camera label
    // TODO: Add text sprite for camera ID
  })
}

function renderWalls() {
  if (!scene.value || !siteMap.value?.walls) return

  // Clear existing wall meshes
  wallMeshes.value.forEach(line => scene.value!.remove(line))
  wallMeshes.value = []

  // TODO: Render walls from site map data
  // For now, skip as mock data has no walls
}

function renderGrid() {
  if (!scene.value) return

  gridHelper.value = new THREE.GridHelper(40, 40, 0x444444, 0x222222)
  scene.value.add(gridHelper.value)
}

function animate() {
  animationFrameId = requestAnimationFrame(animate)

  if (!renderer.value || !scene.value || !camera.value || !controls.value) return

  // Update FPS
  const now = Date.now()
  const delta = now - lastFrameTime
  fps.value = Math.round(1000 / delta)
  lastFrameTime = now

  controls.value.update()
  renderer.value.render(scene.value, camera.value)
}

function updateDisplay() {
  if (!pointCloud.value || !scene.value) return

  // Update point cloud
  pointCloud.value.visible = displayOptions.value.showPointCloud
  if (pointCloud.value.material instanceof THREE.PointsMaterial) {
    pointCloud.value.material.size = displayOptions.value.pointSize
  }

  // Update cameras
  cameraMeshes.value.forEach(mesh => {
    mesh.visible = displayOptions.value.showCameras
  })

  // Update walls
  wallMeshes.value.forEach(line => {
    line.visible = displayOptions.value.showWalls
  })

  // Update grid
  if (gridHelper.value) {
    gridHelper.value.visible = displayOptions.value.showGrid
  }
}

function resetCamera() {
  if (!camera.value || !controls.value) return

  camera.value.position.set(10, 15, 20)
  camera.value.lookAt(0, 0, 0)
  controls.value.target.set(0, 0, 0)
  controls.value.update()
}

function viewFromTop() {
  if (!camera.value || !controls.value) return

  camera.value.position.set(0, 30, 0)
  camera.value.lookAt(0, 0, 0)
  controls.value.target.set(0, 0, 0)
  controls.value.update()
}

function viewFromSide() {
  if (!camera.value || !controls.value) return

  camera.value.position.set(30, 5, 0)
  camera.value.lookAt(0, 0, 0)
  controls.value.target.set(0, 0, 0)
  controls.value.update()
}

function handleResize() {
  if (!camera.value || !renderer.value || !canvas.value) return

  const width = canvas.value.clientWidth
  const height = canvas.value.clientHeight

  camera.value.aspect = width / height
  camera.value.updateProjectionMatrix()

  renderer.value.setSize(width, height)
}

function cleanup() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }

  window.removeEventListener('resize', handleResize)

  if (renderer.value) {
    renderer.value.dispose()
  }

  if (pointCloud.value) {
    pointCloud.value.geometry.dispose()
    if (pointCloud.value.material instanceof THREE.Material) {
      pointCloud.value.material.dispose()
    }
  }

  cameraMeshes.value.forEach(mesh => {
    mesh.geometry.dispose()
    if (mesh.material instanceof THREE.Material) {
      mesh.material.dispose()
    }
  })

  wallMeshes.value.forEach(line => {
    line.geometry.dispose()
    if (line.material instanceof THREE.Material) {
      line.material.dispose()
    }
  })
}

onMounted(() => {
  loadSiteMap()
})

onUnmounted(() => {
  cleanup()
})

watch(() => route.params.id, (newId) => {
  if (newId) {
    siteMapId.value = newId as string
    cleanup()
    loadSiteMap()
  }
})
</script>
