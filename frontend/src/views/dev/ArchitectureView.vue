<script setup lang="ts">
import { onMounted, ref, nextTick, watch } from 'vue'
import mermaid from 'mermaid'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useTheme } from '@/composables/useTheme'
import { Check, X } from 'lucide-vue-next'

const { currentTheme } = useTheme()
const diagramsReady = ref(false)

const diagrams = {
  systemOverview: `flowchart LR
    subgraph Physical["Physical Space"]
        C1["📷 Camera 1"]
        C2["📷 Camera 2"]
        P["🚶 Person"]
    end
    subgraph System["Axis-Guardian"]
        TS["🧠 Tracking Service"]
    end
    subgraph Output["Visualization"]
        UI["📊 Dashboard"]
    end
    C1 -->|detects| TS
    C2 -->|detects| TS
    TS -->|tracks| UI
    P -.->|seen by| C1
    P -.->|seen by| C2`,

  trackLifecycle: `stateDiagram-v2
    [*] --> Unconfirmed: First detection
    Unconfirmed --> Confirmed: 3+ detections
    Confirmed --> Occluded: Lost from view
    Occluded --> Confirmed: Re-identified
    Occluded --> [*]: Timeout (5-7s)
    Confirmed --> [*]: Exits room`,

  dataFlow: `flowchart TB
    subgraph Sources["Data Sources"]
        CE["📹 Camera Emulator<br/><small>Pre-recorded video + detections</small>"]
        RC["📡 Real Cameras<br/><small>ACAP Analytics via MQTT</small>"]
    end

    subgraph Tracking["Tracking Service"]
        DP["Detection Processor<br/><small>Receives & validates</small>"]
        GP["Ground Projection<br/><small>Pixels → Meters (K/R/T)</small>"]
        HA["Hungarian Algorithm<br/><small>Optimal assignment</small>"]
        KF["Kalman Filter<br/><small>Smooth & predict</small>"]
        TM["Track Manager<br/><small>Lifecycle & identity</small>"]
    end

    subgraph Frontend["Frontend Dashboard"]
        WS["WebSocket Client"]
        SM["🗺️ Site Map View<br/><small>Bird's eye visualization</small>"]
        VF["📺 Video Feeds<br/><small>Live camera streams</small>"]
    end

    CE -->|HTTP POST| DP
    RC -->|MQTT| DP
    DP --> GP
    GP --> HA
    HA --> KF
    KF --> TM
    TM -->|WebSocket| WS
    WS --> SM
    CE -->|WebRTC| VF`,

  vapixCoverage: `pie showData
    title VAPIX Feature Coverage
    "Implemented (Analytics, Streaming)" : 20
    "Not Implemented (PTZ, Events, Storage, etc.)" : 80`
}

const initMermaid = async () => {
  const isDark = currentTheme.value !== 'light'

  mermaid.initialize({
    startOnLoad: false,
    theme: isDark ? 'dark' : 'default',
    flowchart: {
      useMaxWidth: true,
      htmlLabels: true,
      curve: 'basis'
    },
    themeVariables: isDark ? {
      primaryColor: '#3b82f6',
      primaryTextColor: '#fff',
      primaryBorderColor: '#60a5fa',
      lineColor: '#64748b',
      secondaryColor: '#1e293b',
      tertiaryColor: '#0f172a'
    } : {}
  })

  await nextTick()

  try {
    await mermaid.run({
      querySelector: '.mermaid'
    })
    diagramsReady.value = true
  } catch (e) {
    console.error('Mermaid rendering error:', e)
  }
}

onMounted(() => {
  initMermaid()
})

watch(currentTheme, () => {
  diagramsReady.value = false
  nextTick(() => {
    initMermaid()
  })
})

const implementedFeatures = [
  'Analytics scene metadata (ACAP/MQTT)',
  'Video streaming (WebRTC via mediasoup)',
  'Multi-camera person tracking',
  'Ground-plane projection (K/R/T matrices)',
  'Cross-camera identity correlation',
  'Kalman filtering for position smoothing'
]

const missingFeatures = [
  'PTZ control (pan/tilt/zoom)',
  'Camera configuration (exposure, focus, white balance)',
  'Event & alarm system',
  'Edge recording & storage management',
  'Two-way audio',
  'ONVIF compatibility',
  'Privacy masking',
  'Advanced analytics (line crossing, loitering, crowd detection)'
]
</script>

<template>
  <div class="h-full w-full bg-background overflow-auto">
    <div class="max-w-5xl mx-auto p-6 space-y-8">
      <!-- Header -->
      <div class="space-y-2">
        <h1 class="text-3xl font-bold tracking-tight">System Architecture</h1>
        <p class="text-muted-foreground">
          A progressive guide to understanding the Axis-Guardian multi-camera tracking system.
        </p>
      </div>

      <Separator />

      <!-- Section 1: What the System Is -->
      <Card>
        <CardHeader>
          <div class="flex items-center gap-2">
            <Badge variant="outline" class="text-xs">1</Badge>
            <CardTitle>What the System Is</CardTitle>
          </div>
          <CardDescription>
            Multi-camera person tracking with real-time visualization
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <p class="text-sm text-muted-foreground">
            Axis-Guardian is a surveillance system that tracks people as they move through a physical space
            monitored by multiple cameras. Unlike simple motion detection, this system maintains
            <strong>consistent identity</strong> for each person—even as they move between camera views
            or become temporarily hidden behind obstacles.
          </p>

          <div class="bg-card border rounded-lg p-4 overflow-x-auto">
            <pre class="mermaid text-center">{{ diagrams.systemOverview }}</pre>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div class="p-3 bg-muted/50 rounded-lg">
              <h4 class="font-medium mb-1">Cameras</h4>
              <p class="text-muted-foreground text-xs">Detect people in their field of view and send bounding box data</p>
            </div>
            <div class="p-3 bg-muted/50 rounded-lg">
              <h4 class="font-medium mb-1">Tracking Service</h4>
              <p class="text-muted-foreground text-xs">Correlates detections, maintains track identity, smooths positions</p>
            </div>
            <div class="p-3 bg-muted/50 rounded-lg">
              <h4 class="font-medium mb-1">Dashboard</h4>
              <p class="text-muted-foreground text-xs">Visualizes tracks on a site map with live video feeds</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Section 2: What It Achieves -->
      <Card>
        <CardHeader>
          <div class="flex items-center gap-2">
            <Badge variant="outline" class="text-xs">2</Badge>
            <CardTitle>What the System Achieves</CardTitle>
          </div>
          <CardDescription>
            Key capabilities and track lifecycle management
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div class="space-y-3">
              <h4 class="font-medium">Core Capabilities</h4>
              <ul class="space-y-2 text-muted-foreground">
                <li class="flex items-start gap-2">
                  <span class="text-green-500 mt-0.5">✓</span>
                  <span><strong>Cross-camera tracking</strong> — Same person gets same ID across all cameras</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-green-500 mt-0.5">✓</span>
                  <span><strong>Position smoothing</strong> — Filters out noisy detections for stable tracking</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-green-500 mt-0.5">✓</span>
                  <span><strong>Occlusion handling</strong> — Tracks persist when people walk behind pillars</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-green-500 mt-0.5">✓</span>
                  <span><strong>Real-world coordinates</strong> — Positions in meters on a floor plan, not pixels</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-green-500 mt-0.5">✓</span>
                  <span><strong>Velocity estimation</strong> — Speed and direction for each tracked person</span>
                </li>
              </ul>
            </div>
            <div class="space-y-3">
              <h4 class="font-medium">Track Lifecycle</h4>
              <p class="text-xs text-muted-foreground mb-2">
                Tracks go through distinct states to prevent false positives and handle temporary occlusions:
              </p>
              <div class="bg-card border rounded-lg p-4 overflow-x-auto">
                <pre class="mermaid text-center">{{ diagrams.trackLifecycle }}</pre>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Section 3: How It Works -->
      <Card>
        <CardHeader>
          <div class="flex items-center gap-2">
            <Badge variant="outline" class="text-xs">3</Badge>
            <CardTitle>How This is Achieved</CardTitle>
          </div>
          <CardDescription>
            Three-service architecture with advanced tracking algorithms
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-6">
          <p class="text-sm text-muted-foreground">
            The system uses a pipeline of specialized algorithms to transform raw camera detections
            into accurate, persistent tracks:
          </p>

          <div class="bg-card border rounded-lg p-4 overflow-x-auto">
            <pre class="mermaid text-center">{{ diagrams.dataFlow }}</pre>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-3 text-sm">
              <h4 class="font-medium">Key Algorithms (Simplified)</h4>
              <div class="space-y-2">
                <div class="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <h5 class="font-medium text-blue-400">Ground Projection</h5>
                  <p class="text-xs text-muted-foreground mt-1">
                    Converts camera pixel coordinates to real-world meters using camera calibration
                    matrices (K/R/T). Like translating "person at pixel (400, 300)" to "person at (5.2m, 3.1m)".
                  </p>
                </div>
                <div class="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                  <h5 class="font-medium text-purple-400">Hungarian Algorithm</h5>
                  <p class="text-xs text-muted-foreground mt-1">
                    Finds the globally optimal way to match new detections to existing tracks.
                    Unlike greedy matching, it considers all possibilities to minimize total assignment cost.
                  </p>
                </div>
                <div class="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <h5 class="font-medium text-green-400">Kalman Filter</h5>
                  <p class="text-xs text-muted-foreground mt-1">
                    Smooths noisy position measurements and predicts where people will be next.
                    This helps maintain tracks during brief detection gaps.
                  </p>
                </div>
              </div>
            </div>

            <div class="space-y-3 text-sm">
              <h4 class="font-medium">Services</h4>
              <div class="space-y-2">
                <div class="p-3 bg-muted/50 rounded-lg">
                  <h5 class="font-medium">Frontend (Vue 3)</h5>
                  <p class="text-xs text-muted-foreground mt-1">
                    Real-time dashboard with site map visualization, WebRTC video feeds,
                    and track overlays. Uses Three.js for rendering.
                  </p>
                </div>
                <div class="p-3 bg-muted/50 rounded-lg">
                  <h5 class="font-medium">Tracking Service (Node.js/Fastify)</h5>
                  <p class="text-xs text-muted-foreground mt-1">
                    Core tracking engine. Processes detections, runs algorithms,
                    manages track lifecycle, broadcasts updates via WebSocket.
                  </p>
                </div>
                <div class="p-3 bg-muted/50 rounded-lg">
                  <h5 class="font-medium">Camera Emulator</h5>
                  <p class="text-xs text-muted-foreground mt-1">
                    Simulates Axis cameras using pre-recorded video and detection data.
                    Streams via WebRTC (mediasoup) for development/testing.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Section 4: VAPIX Gap Analysis -->
      <Card>
        <CardHeader>
          <div class="flex items-center gap-2">
            <Badge variant="outline" class="text-xs">4</Badge>
            <CardTitle>VAPIX Integration Status</CardTitle>
          </div>
          <CardDescription>
            What's implemented vs. full Axis camera API capabilities
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-6">
          <p class="text-sm text-muted-foreground">
            <strong>VAPIX</strong> is Axis Communications' comprehensive HTTP-based API for their network cameras.
            It provides complete control over camera settings, video streaming, analytics, events, and more.
            The current system implements a focused subset for tracking purposes.
          </p>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="md:col-span-1">
              <div class="bg-card border rounded-lg p-4 overflow-x-auto">
                <pre class="mermaid text-center">{{ diagrams.vapixCoverage }}</pre>
              </div>
            </div>

            <div class="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="space-y-2">
                <h4 class="font-medium text-sm flex items-center gap-2">
                  <Check class="w-4 h-4 text-green-500" />
                  Implemented
                </h4>
                <ul class="space-y-1">
                  <li v-for="feature in implementedFeatures" :key="feature"
                      class="text-xs text-muted-foreground flex items-start gap-2">
                    <span class="text-green-500 mt-0.5 shrink-0">•</span>
                    {{ feature }}
                  </li>
                </ul>
              </div>

              <div class="space-y-2">
                <h4 class="font-medium text-sm flex items-center gap-2">
                  <X class="w-4 h-4 text-red-500" />
                  Not Implemented
                </h4>
                <ul class="space-y-1">
                  <li v-for="feature in missingFeatures" :key="feature"
                      class="text-xs text-muted-foreground flex items-start gap-2">
                    <span class="text-red-500 mt-0.5 shrink-0">•</span>
                    {{ feature }}
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div class="p-4 bg-muted/50 rounded-lg text-sm">
            <h4 class="font-medium mb-2">What This Means</h4>
            <p class="text-muted-foreground text-xs">
              The system is optimized for <strong>person tracking and visualization</strong>—not full camera management.
              It excels at cross-camera correlation and position tracking, which goes beyond standard VAPIX analytics.
              However, for a complete surveillance solution, additional VAPIX modules (events, PTZ, recording) would be needed.
            </p>
          </div>
        </CardContent>
      </Card>

      <!-- Footer -->
      <div class="text-center text-xs text-muted-foreground py-4">
        Last updated: Architecture documentation for Axis-Guardian
      </div>
    </div>
  </div>
</template>
