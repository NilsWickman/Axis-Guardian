import { reactive } from 'vue'

export interface PersonOverlay {
  id: string
  svgPath: string
  x: number // starting x position (percentage)
  y: number // y position (percentage)
  speed: number // pixels per second
  scale: number // scale of the SVG (0.5 to 1.5)
  direction: 'left-to-right' | 'right-to-left'
  startTime: number
}

const overlays = reactive<Map<string, PersonOverlay[]>>(new Map())

const availablePeople = [
  '/people/person_1.svg',
  '/people/person_3.svg',
  '/people/person_4.svg',
  '/people/person_5.svg',
]

export function useCameraOverlays() {
  const addRandomPersonOverlay = (cameraId: string) => {
    const randomPerson = availablePeople[Math.floor(Math.random() * availablePeople.length)]
    const direction = Math.random() > 0.5 ? 'left-to-right' : 'right-to-left'
    const startX = direction === 'left-to-right' ? 0 : 100 // Start at edges (0% or 100%)
    const randomY = 50 + (Math.random() * 30 - 15) // Between 35% and 65%
    const randomSpeed = 40 + Math.random() * 60 // Between 40 and 100 pixels per second (faster)
    const randomScale = 0.6 + Math.random() * 0.6 // Between 0.6 and 1.2

    const overlay: PersonOverlay = {
      id: `person-${Date.now()}-${Math.random()}`,
      svgPath: randomPerson,
      x: startX,
      y: randomY,
      speed: randomSpeed,
      scale: randomScale,
      direction,
      startTime: Date.now(),
    }

    if (!overlays.has(cameraId)) {
      overlays.set(cameraId, [])
    }

    overlays.get(cameraId)!.push(overlay)

    // Remove overlay after it crosses the screen (estimate 10 seconds)
    setTimeout(() => {
      removeOverlay(cameraId, overlay.id)
    }, 15000)

    return overlay.id
  }

  const removeOverlay = (cameraId: string, overlayId: string) => {
    const cameraOverlays = overlays.get(cameraId)
    if (cameraOverlays) {
      const index = cameraOverlays.findIndex(o => o.id === overlayId)
      if (index !== -1) {
        cameraOverlays.splice(index, 1)
      }
    }
  }

  const getOverlays = (cameraId: string): PersonOverlay[] => {
    return overlays.get(cameraId) || []
  }

  const clearOverlays = (cameraId: string) => {
    overlays.delete(cameraId)
  }

  const clearAllOverlays = () => {
    overlays.clear()
  }

  return {
    overlays,
    addRandomPersonOverlay,
    removeOverlay,
    getOverlays,
    clearOverlays,
    clearAllOverlays,
  }
}
