#!/usr/bin/env node
/**
 * Derive K/R/T from Sitemap Physical Parameters
 *
 * Uses the camera position, azimuth, elevation, height, and FOV from the sitemap
 * to derive physically-meaningful K/R/T matrices that project to sitemap coordinates.
 *
 * This replaces the incorrect "Auditorium dataset" matrices with properly derived ones.
 */

import { Command } from 'commander'
import { CameraRegistry } from '../detection/camera-registry.js'
import {
  loadGroundTruths,
  filterAnnotations,
  projectImageToWorld,
  type Vector3,
} from './utils.js'
import * as fs from 'fs/promises'

interface SitemapCamera {
  id: string
  name: string
  position: { x: number; y: number }
  azimuth: number      // degrees, compass bearing (0=N, 90=E, 180=S, 270=W)
  elevation: number    // degrees, tilt down from horizontal
  height: number       // meters above ground
  fieldOfView: number  // horizontal FOV in degrees
}

/**
 * Derive intrinsic matrix K from FOV and image dimensions
 */
function deriveK(fov: number, width: number = 1920, height: number = 1080): number[][] {
  const fovRad = fov * Math.PI / 180
  const f = (width / 2) / Math.tan(fovRad / 2)
  return [
    [f, 0, width / 2],
    [0, f, height / 2],
    [0, 0, 1]
  ]
}

/**
 * Derive rotation matrix R from azimuth and elevation
 *
 * Convention:
 * - Camera looks down the negative Z axis in camera coordinates
 * - Azimuth: rotation around vertical (Y up in world)
 * - Elevation: tilt down from horizontal
 */
function deriveR(azimuth: number, elevation: number): number[][] {
  const azRad = azimuth * Math.PI / 180
  const elRad = elevation * Math.PI / 180

  // Rotation around Y axis (azimuth) - looking direction
  // At azimuth=0, camera looks in +Y direction (North)
  // At azimuth=90, camera looks in +X direction (East)
  const cosAz = Math.cos(azRad)
  const sinAz = Math.sin(azRad)

  // Rotation around X axis (elevation/tilt)
  const cosEl = Math.cos(elRad)
  const sinEl = Math.sin(elRad)

  // R_az rotates the look direction
  // R_el tilts down
  // Combined: first rotate azimuth, then tilt

  // For a camera looking along the Z axis in camera frame,
  // we want world-to-camera transform such that:
  // - Points in front of camera (in viewing direction) have positive Z in camera coords
  // - X points right in image, Y points down in image

  // World coordinate system (sitemap):
  // - X increases to the right
  // - Y increases upward (toward camera mounting wall)
  // - Z is up (height)

  // Standard camera-to-world is: look along -Z_cam maps to look direction in world
  // We need world-to-camera, which is the inverse

  // Build rotation step by step:
  // 1. Align camera -Z with world look direction (determined by azimuth)
  // 2. Tilt camera down by elevation angle

  // For sitemap coordinates with Y pointing up (north):
  // azimuth 0 = look north (+Y), azimuth 90 = look east (+X)
  // azimuth 180 = look south (-Y), azimuth 270 = look west (-X)

  // Camera1: azimuth 197° = looking roughly south-southwest
  // Camera2: azimuth 129.5° = looking roughly southeast

  // R = R_el * R_az
  // where R_az rotates world such that world +Y goes to world look direction
  // and R_el tilts the camera down

  const Raz: number[][] = [
    [cosAz, 0, sinAz],
    [0, 1, 0],
    [-sinAz, 0, cosAz]
  ]

  const Rel: number[][] = [
    [1, 0, 0],
    [0, cosEl, sinEl],
    [0, -sinEl, cosEl]
  ]

  // Standard camera convention: camera looks along +Z in camera coords
  // But we typically have camera looking along -Z
  // Let's use the convention where:
  // - X_cam = right
  // - Y_cam = down
  // - Z_cam = forward (into the scene)

  // The rotation transforms world coords to camera coords
  // R_world_to_cam = R_el * R_az

  // Actually for a camera mounted at position P looking with azimuth/elevation:
  // Point in camera frame = R * (Point_world - Camera_position)

  // Let's derive R properly:
  // The camera's viewing direction in world coords is:
  // dir_world = [sin(az), cos(az), 0] rotated down by elevation
  // dir_world = [sin(az)*cos(el), cos(az)*cos(el), -sin(el)]

  // Camera X axis (right) is perpendicular to viewing direction and world up
  // Camera Y axis (down) is perpendicular to X and viewing direction

  const lookDir = [
    Math.sin(azRad) * cosEl,
    Math.cos(azRad) * cosEl,
    -sinEl
  ]

  const worldUp = [0, 0, 1]

  // Camera right = worldUp x lookDir (normalized)
  const right = [
    worldUp[1] * lookDir[2] - worldUp[2] * lookDir[1],
    worldUp[2] * lookDir[0] - worldUp[0] * lookDir[2],
    worldUp[0] * lookDir[1] - worldUp[1] * lookDir[0]
  ]
  const rightLen = Math.sqrt(right[0] ** 2 + right[1] ** 2 + right[2] ** 2)
  right[0] /= rightLen
  right[1] /= rightLen
  right[2] /= rightLen

  // Camera down = lookDir x right (normalized)
  const down = [
    lookDir[1] * right[2] - lookDir[2] * right[1],
    lookDir[2] * right[0] - lookDir[0] * right[2],
    lookDir[0] * right[1] - lookDir[1] * right[0]
  ]
  const downLen = Math.sqrt(down[0] ** 2 + down[1] ** 2 + down[2] ** 2)
  down[0] /= downLen
  down[1] /= downLen
  down[2] /= downLen

  // R transforms world to camera
  // Camera X = right, Y = down, Z = lookDir
  // [cam_x]   [right^T ]   [world_x]
  // [cam_y] = [down^T  ] * [world_y]
  // [cam_z]   [look^T  ]   [world_z]

  return [
    [right[0], right[1], right[2]],
    [down[0], down[1], down[2]],
    [lookDir[0], lookDir[1], lookDir[2]]
  ]
}

/**
 * Derive translation vector T from camera position and height
 * T = -R * camera_position_world
 */
function deriveT(R: number[][], position: { x: number; y: number }, height: number): number[] {
  const P = [position.x, position.y, height]

  // T = -R * P
  return [
    -(R[0][0] * P[0] + R[0][1] * P[1] + R[0][2] * P[2]),
    -(R[1][0] * P[0] + R[1][1] * P[1] + R[1][2] * P[2]),
    -(R[2][0] * P[0] + R[2][1] * P[1] + R[2][2] * P[2])
  ]
}

/**
 * Project world point to image using K, R, T
 */
function projectWorldToImage(
  worldX: number, worldY: number, worldZ: number,
  K: number[][], R: number[][], T: number[]
): { u: number; v: number; valid: boolean } {
  // Camera coords = R * world + T
  const camX = R[0][0] * worldX + R[0][1] * worldY + R[0][2] * worldZ + T[0]
  const camY = R[1][0] * worldX + R[1][1] * worldY + R[1][2] * worldZ + T[1]
  const camZ = R[2][0] * worldX + R[2][1] * worldY + R[2][2] * worldZ + T[2]

  if (camZ <= 0) return { u: 0, v: 0, valid: false }

  // Project to image
  const u = K[0][0] * camX / camZ + K[0][2]
  const v = K[1][1] * camY / camZ + K[1][2]

  return { u, v, valid: true }
}

/**
 * Project image point to ground plane (Z=0) using K, R, T
 */
function projectImageToGround(
  u: number, v: number,
  K: number[][], R: number[][], T: number[]
): { x: number; y: number; valid: boolean } {
  // Inverse intrinsics
  const fx = K[0][0], fy = K[1][1], cx = K[0][2], cy = K[1][2]

  // Normalized image coordinates
  const x_norm = (u - cx) / fx
  const y_norm = (v - cy) / fy

  // Ray direction in camera coords
  const ray_cam = [x_norm, y_norm, 1]

  // Ray direction in world coords = R^T * ray_cam
  const ray_world = [
    R[0][0] * ray_cam[0] + R[1][0] * ray_cam[1] + R[2][0] * ray_cam[2],
    R[0][1] * ray_cam[0] + R[1][1] * ray_cam[1] + R[2][1] * ray_cam[2],
    R[0][2] * ray_cam[0] + R[1][2] * ray_cam[1] + R[2][2] * ray_cam[2]
  ]

  // Camera position in world coords = -R^T * T
  const cam_world = [
    -(R[0][0] * T[0] + R[1][0] * T[1] + R[2][0] * T[2]),
    -(R[0][1] * T[0] + R[1][1] * T[1] + R[2][1] * T[2]),
    -(R[0][2] * T[0] + R[1][2] * T[1] + R[2][2] * T[2])
  ]

  // Intersect with ground plane Z=0
  // cam_world + t * ray_world has Z = 0
  // t = -cam_world[2] / ray_world[2]

  if (Math.abs(ray_world[2]) < 1e-6) return { x: 0, y: 0, valid: false }

  const t = -cam_world[2] / ray_world[2]
  if (t < 0) return { x: 0, y: 0, valid: false }  // Behind camera

  const x = cam_world[0] + t * ray_world[0]
  const y = cam_world[1] + t * ray_world[1]

  return { x, y, valid: true }
}

async function main() {
  const program = new Command()
    .name('derive-krt-from-sitemap')
    .description('Derive K/R/T matrices from sitemap physical camera parameters')
    .requiredOption('-s, --sitemap <file>', 'Path to sitemap JSON')
    .requiredOption('-g, --ground-truth <file>', 'Path to GroundTruths.json')
    .parse(process.argv)

  const opts = program.opts()

  console.log('=== Deriving K/R/T from Sitemap Parameters ===\n')

  // Load sitemap
  const sitemapContent = await fs.readFile(opts.sitemap, 'utf-8')
  const sitemap = JSON.parse(sitemapContent)
  const cameras: SitemapCamera[] = sitemap.cameras

  // Load ground truth
  const groundTruths = await loadGroundTruths(opts.groundTruth)
  const registry = new CameraRegistry()

  for (const cam of cameras) {
    console.log(`--- ${cam.id} (${cam.name}) ---`)
    console.log(`Position: (${cam.position.x}, ${cam.position.y}) at height ${cam.height}m`)
    console.log(`Azimuth: ${cam.azimuth}°, Elevation: ${cam.elevation}°, FOV: ${cam.fieldOfView}°`)
    console.log()

    // Derive K/R/T
    const K = deriveK(cam.fieldOfView)
    const R = deriveR(cam.azimuth, cam.elevation)
    const T = deriveT(R, cam.position, cam.height)

    console.log('Derived K:')
    console.log(`  [[${K[0].map(v => v.toFixed(2)).join(', ')}],`)
    console.log(`   [${K[1].map(v => v.toFixed(2)).join(', ')}],`)
    console.log(`   [${K[2].map(v => v.toFixed(2)).join(', ')}]]`)

    console.log('\nDerived R:')
    console.log(`  [[${R[0].map(v => v.toFixed(6)).join(', ')}],`)
    console.log(`   [${R[1].map(v => v.toFixed(6)).join(', ')}],`)
    console.log(`   [${R[2].map(v => v.toFixed(6)).join(', ')}]]`)

    console.log(`\nDerived T: [${T.map(v => v.toFixed(4)).join(', ')}]`)

    // Test projection accuracy
    const annotations = filterAnnotations(groundTruths.annotations, cam.id, ['certain'])

    if (annotations.length === 0) {
      console.log('\nNo ground truth annotations for this camera\n')
      continue
    }

    // Test image-to-ground projection
    let passCount = 0
    let totalError = 0
    const errors: number[] = []

    for (const { annotation, detection } of annotations) {
      const imageX = ((detection.bbox.left + detection.bbox.right) / 2) * 1920
      const imageY = detection.bbox.bottom * 1080

      const projected = projectImageToGround(imageX, imageY, K, R, T)

      if (projected.valid) {
        const error = Math.sqrt(
          (projected.x - annotation.groundPosition.x) ** 2 +
          (projected.y - annotation.groundPosition.y) ** 2
        )
        errors.push(error)
        totalError += error
        if (error < 0.5) passCount++
      }
    }

    const meanError = totalError / errors.length
    const passRate = passCount / errors.length

    console.log(`\nDirect K/R/T projection accuracy:`)
    console.log(`  Pass rate (<0.5m): ${(passRate * 100).toFixed(1)}%`)
    console.log(`  Mean error: ${meanError.toFixed(3)}m`)

    // Compare with original K/R/T
    const oldCal = registry.getCalibration(cam.id)
    if (oldCal) {
      let oldPassCount = 0
      let oldTotalError = 0

      for (const { annotation, detection } of annotations) {
        const imageX = ((detection.bbox.left + detection.bbox.right) / 2) * 1920
        const imageY = detection.bbox.bottom * 1080

        const result = projectImageToWorld(
          imageX, imageY,
          oldCal.K, oldCal.R,
          [oldCal.T[0], oldCal.T[1], oldCal.T[2]] as Vector3,
          oldCal.center as [number, number]
        )

        if (result.isValid) {
          const error = Math.sqrt(
            (result.worldPoint.x - annotation.groundPosition.x) ** 2 +
            (result.worldPoint.y - annotation.groundPosition.y) ** 2
          )
          oldTotalError += error
          if (error < 0.5) oldPassCount++
        }
      }

      console.log(`\nOriginal K/R/T (raw, no polynomial):`)
      console.log(`  Pass rate (<0.5m): ${(oldPassCount / annotations.length * 100).toFixed(1)}%`)
      console.log(`  Mean error: ${(oldTotalError / annotations.length).toFixed(3)}m`)
    }

    // Output code snippet for camera-registry.ts
    console.log(`\n// Sitemap-derived K/R/T for ${cam.id}`)
    console.log(`${cam.id}: {`)
    console.log(`  K: [`)
    console.log(`    [${K[0].map(v => v.toFixed(0)).join(', ')}, 0],`)
    console.log(`    [0, ${K[1][1].toFixed(0)}, 0],`)
    console.log(`    [0, 0, 1],`)
    console.log(`  ],`)
    console.log(`  R: [`)
    console.log(`    [${R[0].map(v => v.toFixed(8)).join(', ')}],`)
    console.log(`    [${R[1].map(v => v.toFixed(8)).join(', ')}],`)
    console.log(`    [${R[2].map(v => v.toFixed(8)).join(', ')}],`)
    console.log(`  ],`)
    console.log(`  T: [${T.map(v => v.toFixed(8)).join(', ')}],`)
    console.log(`  center: [960, 540],`)
    console.log(`  scale: 1,`)
    console.log(`},`)

    console.log()
  }
}

main().catch(console.error)
