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
            <h1 class="text-2xl font-bold text-foreground">Generate Site Map</h1>
            <p class="text-sm text-muted-foreground mt-1">
              Automatically create a site map from camera images
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Wizard Steps -->
    <div class="border-b bg-card px-6 py-3">
      <div class="flex items-center gap-2">
        <div
          v-for="(step, index) in steps"
          :key="step.id"
          class="flex items-center"
        >
          <div
            :class="[
              'flex items-center gap-2 px-3 py-2 rounded-md transition-colors',
              currentStep === step.id ? 'bg-primary text-primary-foreground' :
              completedSteps.includes(step.id) ? 'bg-accent text-accent-foreground' :
              'text-muted-foreground'
            ]"
          >
            <div
              :class="[
                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold',
                currentStep === step.id ? 'bg-primary-foreground text-primary' :
                completedSteps.includes(step.id) ? 'bg-green-500 text-white' :
                'bg-muted'
              ]"
            >
              <svg
                v-if="completedSteps.includes(step.id)"
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span v-else>{{ index + 1 }}</span>
            </div>
            <span class="text-sm font-medium">{{ step.label }}</span>
          </div>
          <svg
            v-if="index < steps.length - 1"
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="mx-2 text-muted-foreground"
          >
            <path d="m9 18 6-6-6-6"/>
          </svg>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-6">
      <div class="max-w-4xl mx-auto">
        <!-- Step 1: Method Selection -->
        <div v-if="currentStep === 'method'" class="space-y-6">
          <div>
            <h2 class="text-xl font-semibold mb-2">Choose Generation Method</h2>
            <p class="text-sm text-muted-foreground">
              Select how you want to generate the site map
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- SfM Method -->
            <button
              @click="selectMethod('sfm')"
              :class="[
                'p-6 border-2 rounded-lg text-left transition-all hover:shadow-lg',
                selectedMethod === 'sfm' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
              ]"
            >
              <div class="flex items-start gap-4">
                <div class="p-3 bg-blue-500/10 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-500">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                    <line x1="12" y1="22.08" x2="12" y2="12"/>
                  </svg>
                </div>
                <div class="flex-1">
                  <h3 class="font-semibold mb-1">Structure from Motion (SfM)</h3>
                  <p class="text-sm text-muted-foreground mb-3">
                    Best for indoor environments. Automatically computes camera positions and creates 3D reconstruction.
                  </p>
                  <div class="space-y-1 text-xs">
                    <div class="flex items-center gap-1 text-green-600">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      No GPS required
                    </div>
                    <div class="flex items-center gap-1 text-green-600">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      5-10cm accuracy
                    </div>
                    <div class="flex items-center gap-1 text-green-600">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Multi-room support
                    </div>
                    <div class="flex items-center gap-1 text-green-600">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      3D point cloud output
                    </div>
                  </div>
                </div>
              </div>
              <div v-if="selectedMethod === 'sfm'" class="mt-4 pt-4 border-t">
                <div class="text-xs text-muted-foreground">
                  <strong>Requirements:</strong> Cameras must have overlapping field of view
                </div>
              </div>
            </button>

            <!-- Geometric Method -->
            <button
              @click="selectMethod('geometric')"
              :class="[
                'p-6 border-2 rounded-lg text-left transition-all hover:shadow-lg',
                selectedMethod === 'geometric' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
              ]"
            >
              <div class="flex items-start gap-4">
                <div class="p-3 bg-green-500/10 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-500">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                </div>
                <div class="flex-1">
                  <h3 class="font-semibold mb-1">GPS-Based Geometric</h3>
                  <p class="text-sm text-muted-foreground mb-3">
                    Best for outdoor areas with GPS. Uses camera coordinates and semantic segmentation.
                  </p>
                  <div class="space-y-1 text-xs">
                    <div class="flex items-center gap-1 text-green-600">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Large outdoor areas
                    </div>
                    <div class="flex items-center gap-1 text-green-600">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Works without overlapping views
                    </div>
                    <div class="flex items-center gap-1 text-amber-600">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="m3 11 18-5v12L3 14v-3z"/>
                      </svg>
                      Requires GPS coordinates
                    </div>
                    <div class="flex items-center gap-1 text-amber-600">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="m3 11 18-5v12L3 14v-3z"/>
                      </svg>
                      3-5m accuracy
                    </div>
                  </div>
                </div>
              </div>
              <div v-if="selectedMethod === 'geometric'" class="mt-4 pt-4 border-t">
                <div class="text-xs text-muted-foreground">
                  <strong>Requirements:</strong> GPS coordinates for each camera
                </div>
              </div>
            </button>
          </div>
        </div>

        <!-- Step 2: Camera Selection -->
        <div v-if="currentStep === 'cameras'" class="space-y-6">
          <div>
            <h2 class="text-xl font-semibold mb-2">Select Cameras</h2>
            <p class="text-sm text-muted-foreground">
              Choose at least {{ minCameras }} cameras with overlapping field of view
            </p>
          </div>

          <div v-if="onlineCameras.length === 0" class="p-8 border-2 border-dashed rounded-lg text-center">
            <div class="text-muted-foreground">
              <p class="mb-2">No online cameras available</p>
              <p class="text-sm">Please ensure cameras are connected and online</p>
            </div>
          </div>

          <div v-else class="space-y-3">
            <button
              v-for="camera in onlineCameras"
              :key="camera.id"
              @click="toggleCamera(camera.id)"
              :class="[
                'w-full text-left p-4 border-2 rounded-lg cursor-pointer transition-all',
                selectedCameras.includes(camera.id) ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
              ]"
            >
              <div class="flex items-start gap-4">
                <div class="flex-shrink-0 pt-1">
                  <div
                    :class="[
                      'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                      selectedCameras.includes(camera.id) ? 'border-primary bg-primary' : 'border-border'
                    ]"
                  >
                    <svg
                      v-if="selectedCameras.includes(camera.id)"
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="3"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      class="text-primary-foreground"
                    >
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                </div>
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-2">
                    <h3 class="font-semibold">{{ camera.name }}</h3>
                    <span class="px-2 py-0.5 text-xs bg-green-500/10 text-green-600 rounded">Online</span>
                  </div>
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <span class="text-muted-foreground">Location:</span>
                      <span class="ml-1 font-medium">{{ camera.location }}</span>
                    </div>
                    <div>
                      <span class="text-muted-foreground">Height:</span>
                      <span class="ml-1 font-medium">{{ camera.position.z }}m</span>
                    </div>
                    <div>
                      <span class="text-muted-foreground">Resolution:</span>
                      <span class="ml-1 font-medium">{{ camera.capabilities.resolution }}</span>
                    </div>
                    <div>
                      <span class="text-muted-foreground">FOV:</span>
                      <span class="ml-1 font-medium">{{ camera.fov }}°</span>
                    </div>
                  </div>
                </div>
              </div>
            </button>
          </div>

          <div v-if="selectedCameras.length < minCameras" class="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <div class="flex items-start gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-amber-600 flex-shrink-0 mt-0.5">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <div class="text-sm">
                <div class="font-medium text-amber-900 dark:text-amber-100">
                  Select at least {{ minCameras.toString() }} cameras
                </div>
                <div class="text-amber-800 dark:text-amber-200 mt-1">
                  You have selected {{ selectedCameras.length }} of {{ minCameras.toString() }} required cameras
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 3: Settings -->
        <div v-if="(currentStep as string) === 'settings'" class="space-y-6">
          <div>
            <h2 class="text-xl font-semibold mb-2">Generation Settings</h2>
            <p class="text-sm text-muted-foreground">
              Configure parameters for {{ selectedMethod === 'sfm' ? 'Structure from Motion' : 'GPS-based' }} generation
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Feature Type (SfM only) -->
            <div v-if="selectedMethod === 'sfm'">
              <label class="block text-sm font-medium mb-2">Feature Type</label>
              <select
                v-model="settings.featureType"
                class="w-full px-3 py-2 border rounded-lg bg-background"
              >
                <option value="sift">SIFT (Most Robust)</option>
                <option value="orb">ORB (Faster)</option>
                <option value="akaze">AKAZE (Balanced)</option>
              </select>
              <p class="text-xs text-muted-foreground mt-1">
                SIFT provides best accuracy, ORB is fastest
              </p>
            </div>

            <!-- Max Features -->
            <div>
              <label class="block text-sm font-medium mb-2">
                Max Features: {{ settings.maxFeatures.toLocaleString() }}
              </label>
              <input
                v-model.number="settings.maxFeatures"
                type="range"
                min="1000"
                max="20000"
                step="1000"
                class="w-full"
              />
              <p class="text-xs text-muted-foreground mt-1">
                More features = better accuracy but slower
              </p>
            </div>

            <!-- Grid Resolution -->
            <div>
              <label class="block text-sm font-medium mb-2">
                Grid Resolution: {{ (settings.gridResolution * 100).toFixed(0) }}cm
              </label>
              <input
                v-model.number="settings.gridResolution"
                type="range"
                min="0.01"
                max="0.2"
                step="0.01"
                class="w-full"
              />
              <p class="text-xs text-muted-foreground mt-1">
                Smaller = more detail, larger = smoother
              </p>
            </div>

            <!-- Wall Detection Threshold -->
            <div>
              <label class="block text-sm font-medium mb-2">
                Wall Detection Threshold: {{ (settings.wallDetectionThreshold * 100).toFixed(0) }}%
              </label>
              <input
                v-model.number="settings.wallDetectionThreshold"
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                class="w-full"
              />
              <p class="text-xs text-muted-foreground mt-1">
                Lower = more walls detected, higher = only confident walls
              </p>
            </div>

            <!-- Min Wall Length -->
            <div>
              <label class="block text-sm font-medium mb-2">
                Minimum Wall Length: {{ settings.minWallLength.toFixed(1) }}m
              </label>
              <input
                v-model.number="settings.minWallLength"
                type="range"
                min="0.1"
                max="3.0"
                step="0.1"
                class="w-full"
              />
              <p class="text-xs text-muted-foreground mt-1">
                Ignore wall segments shorter than this
              </p>
            </div>

            <!-- Export Formats -->
            <div>
              <label class="block text-sm font-medium mb-2">Export Formats</label>
              <div class="space-y-2">
                <label class="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    v-model="settings.exportFormats"
                    type="checkbox"
                    value="2d"
                    class="rounded border-gray-300"
                  />
                  <span>2D Site Map (PNG)</span>
                </label>
                <label class="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    v-model="settings.exportFormats"
                    type="checkbox"
                    value="3d"
                    class="rounded border-gray-300"
                  />
                  <span>3D Point Cloud (PLY)</span>
                </label>
                <label class="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    v-model="settings.exportFormats"
                    type="checkbox"
                    value="json"
                    class="rounded border-gray-300"
                  />
                  <span>JSON Data</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 4: Generate -->
        <div v-if="(currentStep as string) === 'generate'" class="space-y-6">
          <div>
            <h2 class="text-xl font-semibold mb-2">
              {{ isGenerating ? 'Generating Site Map...' : generationComplete ? 'Generation Complete' : 'Ready to Generate' }}
            </h2>
            <p class="text-sm text-muted-foreground">
              {{ isGenerating ? 'This may take 1-2 minutes' : generationComplete ? 'Your site map has been created' : 'Review settings and start generation' }}
            </p>
          </div>

          <!-- Summary -->
          <div v-if="!isGenerating && !generationComplete" class="p-6 border rounded-lg bg-muted/50">
            <h3 class="font-semibold mb-4">Summary</h3>
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-muted-foreground">Method:</span>
                <span class="ml-2 font-medium">{{ selectedMethod === 'sfm' ? 'Structure from Motion' : 'GPS-Based' }}</span>
              </div>
              <div>
                <span class="text-muted-foreground">Cameras:</span>
                <span class="ml-2 font-medium">{{ selectedCameras.length }}</span>
              </div>
              <div>
                <span class="text-muted-foreground">Feature Type:</span>
                <span class="ml-2 font-medium uppercase">{{ settings.featureType }}</span>
              </div>
              <div>
                <span class="text-muted-foreground">Grid Resolution:</span>
                <span class="ml-2 font-medium">{{ (settings.gridResolution * 100).toFixed(0) }}cm</span>
              </div>
            </div>
          </div>

          <!-- Progress -->
          <div v-if="isGenerating" class="space-y-4">
            <div class="p-6 border rounded-lg">
              <div class="mb-4">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm font-medium">{{ progressMessage }}</span>
                  <span class="text-sm text-muted-foreground">{{ progress }}%</span>
                </div>
                <div class="w-full bg-muted rounded-full h-2">
                  <div
                    class="bg-primary h-2 rounded-full transition-all duration-300"
                    :style="{ width: `${progress}%` }"
                  ></div>
                </div>
              </div>

              <div class="flex justify-center">
                <div class="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              </div>
            </div>
          </div>

          <!-- Results -->
          <div v-if="generationComplete && generatedSiteMap" class="space-y-4">
            <div class="p-6 border border-green-500/20 bg-green-500/5 rounded-lg">
              <div class="flex items-start gap-3 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-600">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                <div>
                  <h3 class="font-semibold text-green-900 dark:text-green-100">Site Map Generated Successfully</h3>
                  <p class="text-sm text-green-800 dark:text-green-200 mt-1">
                    Your site map is ready to view
                  </p>
                </div>
              </div>

              <div class="grid grid-cols-3 gap-4 text-sm">
                <div class="text-center p-3 bg-background rounded">
                  <div class="text-muted-foreground mb-1">Walls Detected</div>
                  <div class="text-2xl font-bold">{{ generatedSiteMap.walls.length }}</div>
                </div>
                <div class="text-center p-3 bg-background rounded">
                  <div class="text-muted-foreground mb-1">Cameras Positioned</div>
                  <div class="text-2xl font-bold">{{ generatedSiteMap.cameras.length }}</div>
                </div>
                <div class="text-center p-3 bg-background rounded">
                  <div class="text-muted-foreground mb-1">Area</div>
                  <div class="text-2xl font-bold">{{ Math.round((generatedSiteMap.width / generatedSiteMap.scale) * (generatedSiteMap.height / generatedSiteMap.scale)) }}m²</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer Actions -->
    <div class="border-t bg-card px-6 py-4">
      <div class="max-w-4xl mx-auto flex items-center justify-between">
        <button
          v-if="currentStepIndex > 0 && !isGenerating"
          @click="previousStep"
          class="px-4 py-2 border border-border rounded hover:bg-accent transition-colors"
        >
          Previous
        </button>
        <div v-else></div>

        <div class="flex items-center gap-3">
          <router-link
            v-if="!isGenerating"
            to="/site-maps"
            class="px-4 py-2 border border-border rounded hover:bg-accent transition-colors"
          >
            Cancel
          </router-link>

          <button
            v-if="currentStep === 'generate' && generationComplete"
            @click="viewSiteMap"
            class="px-6 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
          >
            View Site Map
          </button>

          <button
            v-else-if="currentStep === 'generate' && !isGenerating && !generationComplete"
            @click="startGeneration"
            class="px-6 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
          >
            Generate Site Map
          </button>

          <button
            v-else-if="!isGenerating && !generationComplete && currentStep !== 'generate'"
            @click="nextStep"
            :disabled="!canProceed"
            class="px-6 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import type { SfMSettings, EnhancedSiteMap } from '@/types/sitemap'

const router = useRouter()

// Mock camera data
const onlineCameras = ref([
  {
    id: 'camera1',
    name: 'Camera 1',
    location: 'Auditorium North',
    position: { x: 2.5, y: 4.2, z: 1.68, azimuth: 45, elevation: -15 },
    capabilities: { resolution: '1920x1080', fps: 30 },
    fov: 92,
    ipAddress: '192.168.1.101'
  },
  {
    id: 'camera2',
    name: 'Camera 2',
    location: 'Auditorium South',
    position: { x: 6.0, y: 8.0, z: 1.67, azimuth: 135, elevation: -15 },
    capabilities: { resolution: '1920x1080', fps: 30 },
    fov: 92,
    ipAddress: '192.168.1.102'
  },
  {
    id: 'camera3',
    name: 'Camera 3',
    location: 'Auditorium East',
    position: { x: 10.0, y: 4.2, z: 2.62, azimuth: 225, elevation: -15 },
    capabilities: { resolution: '1920x1080', fps: 30 },
    fov: 92,
    ipAddress: '192.168.1.103'
  },
  {
    id: 'camera4',
    name: 'Camera 4',
    location: 'Auditorium West',
    position: { x: 14.0, y: 8.0, z: 1.84, azimuth: 315, elevation: -15 },
    capabilities: { resolution: '1920x1080', fps: 30 },
    fov: 92,
    ipAddress: '192.168.1.104'
  }
])

const steps = [
  { id: 'method', label: 'Method' },
  { id: 'cameras', label: 'Cameras' },
  { id: 'settings', label: 'Settings' },
  { id: 'generate', label: 'Generate' }
]

const currentStep = ref<'method' | 'cameras' | 'settings' | 'generate'>('method')
const completedSteps = ref<string[]>([])

const selectedMethod = ref<'sfm' | 'geometric' | null>(null)
const selectedCameras = ref<string[]>([])
const minCameras = computed(() => selectedMethod.value === 'sfm' ? 2 : 1)

const settings = ref<SfMSettings>({
  featureType: 'sift',
  maxFeatures: 8000,
  gridResolution: 0.05,
  wallDetectionThreshold: 0.7,
  minWallLength: 0.5,
  exportFormats: ['2d', 'json']
})

const isGenerating = ref(false)
const progress = ref(0)
const progressMessage = ref('')
const generationComplete = ref(false)
const generatedSiteMap = ref<EnhancedSiteMap | null>(null)

const currentStepIndex = computed(() => {
  return steps.findIndex(s => s.id === currentStep.value)
})

const canProceed = computed(() => {
  switch (currentStep.value) {
    case 'method':
      return selectedMethod.value !== null
    case 'cameras':
      return selectedCameras.value.length >= minCameras.value
    case 'settings':
      return settings.value.exportFormats.length > 0
    default:
      return false
  }
})

function selectMethod(method: 'sfm' | 'geometric') {
  selectedMethod.value = method
}

function toggleCamera(cameraId: string) {
  const index = selectedCameras.value.indexOf(cameraId)
  if (index === -1) {
    selectedCameras.value.push(cameraId)
  } else {
    selectedCameras.value.splice(index, 1)
  }
}

function nextStep() {
  if (!canProceed.value) return

  completedSteps.value.push(currentStep.value)

  const nextIndex = currentStepIndex.value + 1
  if (nextIndex < steps.length) {
    currentStep.value = steps[nextIndex].id as any
  }
}

function previousStep() {
  const prevIndex = currentStepIndex.value - 1
  if (prevIndex >= 0) {
    currentStep.value = steps[prevIndex].id as any
  }
}

async function startGeneration() {
  isGenerating.value = true
  progress.value = 0
  progressMessage.value = 'Initializing...'

  // Simulate generation progress
  const progressSteps = [
    { progress: 10, message: 'Capturing camera snapshots...' },
    { progress: 25, message: 'Extracting features...' },
    { progress: 45, message: 'Matching features across cameras...' },
    { progress: 60, message: 'Computing camera poses...' },
    { progress: 75, message: 'Generating 3D point cloud...' },
    { progress: 85, message: 'Projecting to 2D...' },
    { progress: 95, message: 'Detecting walls...' },
    { progress: 100, message: 'Finalizing...' }
  ]

  for (const step of progressSteps) {
    await new Promise(resolve => setTimeout(resolve, 1500))
    progress.value = step.progress
    progressMessage.value = step.message
  }

  // Mock generated site map
  generatedSiteMap.value = {
    id: 'sfm-' + Date.now(),
    name: 'Generated Site Map',
    description: `Auto-generated from ${selectedCameras.value.length} cameras using ${selectedMethod.value === 'sfm' ? 'Structure from Motion' : 'GPS-based geometric'}`,
    source: selectedMethod.value === 'sfm' ? 'generated-sfm' : 'generated-geometric',
    width: 1800,
    height: 3200,
    scale: 50,
    origin: { x: 0, y: 0 },
    walls: Array(24).fill(null).map((_, i) => ({
      id: `wall-${i}`,
      start: { x: Math.random() * 1800, y: Math.random() * 3200 },
      end: { x: Math.random() * 1800, y: Math.random() * 3200 },
      type: i % 4 === 0 ? 'external' : 'internal' as const,
      confidence: 0.7 + Math.random() * 0.3
    })),
    cameras: selectedCameras.value.map((id, index) => {
      const cam = onlineCameras.value.find(c => c.id === id)!
      return {
        cameraId: id,
        x: cam.position.x * 50,
        y: cam.position.y * 50,
        rotation: cam.position.azimuth,
        angle: cam.position.elevation,
        height: cam.position.z,
        fov: cam.fov,
        viewDistance: 300,
        autoCalculateDistance: true,
        color: ['blue-500', 'green-500', 'red-500', 'purple-500'][index % 4]
      }
    }),
    reconstruction: selectedMethod.value === 'sfm' ? {
      method: 'sfm',
      timestamp: new Date().toISOString(),
      pointCloud: {
        vertices: 124567,
        url: '/shared/site-maps/generated/temp/pointcloud.ply',
        format: 'ply'
      },
      quality: {
        featureMatches: settings.value.maxFeatures,
        reconstructionError: 0.043,
        coverage: 0.87
      }
    } : undefined,
    generated_at: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  isGenerating.value = false
  generationComplete.value = true
}

function viewSiteMap() {
  if (!generatedSiteMap.value) return

  if (selectedMethod.value === 'sfm') {
    router.push(`/site-maps/${generatedSiteMap.value.id}/view-3d`)
  } else {
    router.push(`/site-maps/${generatedSiteMap.value.id}/view-2d`)
  }
}
</script>
