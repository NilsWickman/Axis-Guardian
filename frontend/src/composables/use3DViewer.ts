/**
 * Composable for 3D site map visualization using Three.js
 */

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

interface SceneObjects {
  floor: THREE.Object3D[]
  walls: THREE.Object3D[]
  cameras: THREE.Object3D[]
  pointCloud: THREE.Object3D[]
  grid: THREE.GridHelper | null
}

interface SceneInfo {
  cameras: number
  walls: number
  points: number
}

interface VisibilityOptions {
  floor: boolean
  walls: boolean
  cameras: boolean
  pointCloud: boolean
  grid: boolean
}

export function use3DViewer() {
  let scene: THREE.Scene | null = null
  let camera: THREE.PerspectiveCamera | null = null
  let renderer: THREE.WebGLRenderer | null = null
  let controls: OrbitControls | null = null
  let animationFrameId: number | null = null

  const sceneObjects: SceneObjects = {
    floor: [],
    walls: [],
    cameras: [],
    pointCloud: [],
    grid: null
  }

  /**
   * Initialize the 3D viewer
   */
  function initViewer(canvas: HTMLCanvasElement) {
    // Create scene
    scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1a1a2e)
    scene.fog = new THREE.Fog(0x1a1a2e, 10, 50)

    // Create camera
    const aspect = canvas.clientWidth / canvas.clientHeight
    camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000)
    camera.position.set(10, 8, 10)
    camera.lookAt(0, 0, 0)

    // Create renderer
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    renderer.setSize(canvas.clientWidth, canvas.clientHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap

    // Create controls
    controls = new OrbitControls(camera, canvas)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.minDistance = 2
    controls.maxDistance = 100
    controls.maxPolarAngle = Math.PI / 2 - 0.1 // Prevent going below floor

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(5, 10, 7)
    directionalLight.castShadow = true
    directionalLight.shadow.camera.near = 0.1
    directionalLight.shadow.camera.far = 50
    directionalLight.shadow.camera.left = -20
    directionalLight.shadow.camera.right = 20
    directionalLight.shadow.camera.top = 20
    directionalLight.shadow.camera.bottom = -20
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    scene.add(directionalLight)

    // Add hemisphere light
    const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x545454, 0.4)
    scene.add(hemisphereLight)

    // Add grid
    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222)
    scene.add(gridHelper)
    sceneObjects.grid = gridHelper

    // Handle window resize
    const handleResize = () => {
      if (!camera || !renderer || !canvas) return

      const width = canvas.clientWidth
      const height = canvas.clientHeight

      camera.aspect = width / height
      camera.updateProjectionMatrix()

      renderer.setSize(width, height)
    }

    window.addEventListener('resize', handleResize)

    // Start animation loop
    function animate() {
      animationFrameId = requestAnimationFrame(animate)

      if (controls) {
        controls.update()
      }

      if (renderer && scene && camera) {
        renderer.render(scene, camera)
      }
    }

    animate()
  }

  /**
   * Load GLTF model from URL
   */
  async function loadModel(url: string): Promise<SceneInfo> {
    if (!scene) {
      throw new Error('Viewer not initialized')
    }

    // Clear existing model
    clearScene()

    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader()

      loader.load(
        url,
        (gltf) => {
          if (!scene) return

          // Process loaded scene
          let cameraCount = 0
          let wallCount = 0
          let pointCount = 0

          gltf.scene.traverse((child) => {
            // Handle all object types (Mesh, Line, Points)
            if (child instanceof THREE.Mesh || child instanceof THREE.Line || child instanceof THREE.Points) {
              if (child instanceof THREE.Mesh) {
                child.castShadow = true
                child.receiveShadow = true
              }

              // Categorize objects by name
              const name = child.name.toLowerCase()

              console.log(`Found object: ${child.name} (type: ${child.type})`)

              if (name.includes('floor')) {
                sceneObjects.floor.push(child)
              } else if (name.includes('wall')) {
                sceneObjects.walls.push(child)
                wallCount++
              } else if (name.includes('camera') || name.includes('frustum')) {
                sceneObjects.cameras.push(child)
                if (name.includes('camera')) cameraCount++
              } else if (name.includes('point')) {
                sceneObjects.pointCloud.push(child)
                if (child.geometry instanceof THREE.BufferGeometry) {
                  pointCount += child.geometry.attributes.position.count
                }
              }
            }
          })

          scene.add(gltf.scene)

          // Fit camera to scene
          fitCameraToScene(gltf.scene)

          resolve({
            cameras: cameraCount,
            walls: wallCount,
            points: pointCount
          })
        },
        (progress) => {
          const percent = (progress.loaded / progress.total) * 100
          console.log(`Loading: ${percent.toFixed(0)}%`)
        },
        (error) => {
          console.error('Error loading GLTF:', error)
          reject(error)
        }
      )
    })
  }

  /**
   * Clear all objects from scene
   */
  function clearScene() {
    if (!scene) return

    // Remove all meshes except lights and grid
    const objectsToRemove: THREE.Object3D[] = []

    scene.traverse((child) => {
      if (
        child instanceof THREE.Mesh ||
        (child instanceof THREE.Group && child !== scene)
      ) {
        objectsToRemove.push(child)
      }
    })

    objectsToRemove.forEach((obj) => {
      scene?.remove(obj)
    })

    // Reset object tracking
    sceneObjects.floor = []
    sceneObjects.walls = []
    sceneObjects.cameras = []
    sceneObjects.pointCloud = []
  }

  /**
   * Fit camera to view entire scene
   */
  function fitCameraToScene(object: THREE.Object3D) {
    if (!camera || !controls) return

    const box = new THREE.Box3().setFromObject(object)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())

    const maxDim = Math.max(size.x, size.y, size.z)
    const fov = camera.fov * (Math.PI / 180)
    let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2))

    cameraZ *= 1.5 // Add some padding

    camera.position.set(center.x + cameraZ * 0.5, center.y + cameraZ * 0.8, center.z + cameraZ * 0.5)
    camera.lookAt(center)

    controls.target.copy(center)
    controls.update()
  }

  /**
   * Update visibility of scene objects
   */
  function updateVisibility(options: VisibilityOptions) {
    sceneObjects.floor.forEach((obj) => {
      obj.visible = options.floor
    })

    sceneObjects.walls.forEach((obj) => {
      obj.visible = options.walls
    })

    sceneObjects.cameras.forEach((obj) => {
      obj.visible = options.cameras
    })

    sceneObjects.pointCloud.forEach((obj) => {
      obj.visible = options.pointCloud
    })

    if (sceneObjects.grid) {
      sceneObjects.grid.visible = options.grid
    }
  }

  /**
   * Reset camera to default position
   */
  function resetCamera() {
    if (!camera || !controls) return

    camera.position.set(10, 8, 10)
    camera.lookAt(0, 0, 0)
    controls.target.set(0, 0, 0)
    controls.update()
  }

  /**
   * Cleanup resources
   */
  function cleanup() {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId)
    }

    if (controls) {
      controls.dispose()
    }

    if (renderer) {
      renderer.dispose()
    }

    // Dispose geometries and materials
    if (scene) {
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose()

          if (Array.isArray(child.material)) {
            child.material.forEach((material) => material.dispose())
          } else {
            child.material.dispose()
          }
        }
      })
    }

    scene = null
    camera = null
    renderer = null
    controls = null
  }

  return {
    initViewer,
    loadModel,
    updateVisibility,
    resetCamera,
    cleanup
  }
}
