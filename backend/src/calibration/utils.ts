/**
 * Calibration Utilities
 *
 * Core mathematical functions for camera calibration:
 * - Rodriguez rotation (axis-angle to matrix conversion)
 * - Reprojection (world to image coordinates)
 * - Matrix operations
 */

import type { Point2D, DistortionCoeffs, DetectionBBox } from '../types.js'

// ============================================================================
// Type Definitions
// ============================================================================

/** 3D point */
export interface Point3D {
  x: number
  y: number
  z: number
}

/** 3x3 matrix as flat array (row-major) or 2D array */
export type Matrix3x3 = number[][] | number[]

/** 3-element vector */
export type Vector3 = [number, number, number]

/** Calibration parameters for optimization */
export interface CalibrationParams {
  /** Rodriguez rotation vector (axis-angle representation) */
  rodriguez: Vector3
  /** Translation vector (camera position in world coords) */
  translation: Vector3
  /** Focal length (assuming square pixels) */
  focalLength: number
  /** Principal point */
  principalPoint: [number, number]
  /** Distortion coefficients */
  distortion?: DistortionCoeffs
}

/** Ground truth annotation from GroundTruths.json */
export interface GroundTruthAnnotation {
  id: string
  groundPosition: Point2D
  timestamp: number
  confidence: 'certain' | 'estimated' | 'uncertain'
  linkedDetections: Array<{
    cameraId: string
    frameNumber: number
    timestamp: number
    trackId: number
    bbox: {
      left: number
      top: number
      right: number
      bottom: number
    }
  }>
}

/** Ground truths file format */
export interface GroundTruthsFile {
  version: string
  room: { width: number; height: number }
  cameras: Array<{ cameraId: string; videoFile: string; detectionsFile: string }>
  annotations: GroundTruthAnnotation[]
}

/**
 * Convert ground truth bbox format {left, top, right, bottom} to DetectionBBox format {x, y, width, height}
 */
export function gtBboxToDetectionBBox(
  bbox: { left: number; top: number; right: number; bottom: number }
): DetectionBBox {
  return {
    x: bbox.left,
    y: bbox.top,
    width: bbox.right - bbox.left,
    height: bbox.bottom - bbox.top,
  }
}

// ============================================================================
// Rodriguez Rotation
// ============================================================================

/**
 * Convert Rodriguez rotation vector to 3x3 rotation matrix
 *
 * Rodriguez formula: R = I + sin(θ)·K + (1-cos(θ))·K²
 * where K is the skew-symmetric matrix of the unit axis
 *
 * @param rodriguez - [rx, ry, rz] axis-angle vector (axis × angle)
 * @returns 3x3 rotation matrix
 */
export function rodriguezToMatrix(rodriguez: Vector3): number[][] {
  const [rx, ry, rz] = rodriguez
  const theta = Math.sqrt(rx * rx + ry * ry + rz * rz)

  if (theta < 1e-10) {
    // Small angle approximation: R ≈ I + K
    return [
      [1, -rz, ry],
      [rz, 1, -rx],
      [-ry, rx, 1],
    ]
  }

  // Unit axis
  const kx = rx / theta
  const ky = ry / theta
  const kz = rz / theta

  const c = Math.cos(theta)
  const s = Math.sin(theta)
  const t = 1 - c

  // R = I·cos(θ) + (1-cos(θ))·k·kᵀ + sin(θ)·K
  return [
    [c + t * kx * kx, t * kx * ky - s * kz, t * kx * kz + s * ky],
    [t * ky * kx + s * kz, c + t * ky * ky, t * ky * kz - s * kx],
    [t * kz * kx - s * ky, t * kz * ky + s * kx, c + t * kz * kz],
  ]
}

/**
 * Convert 3x3 rotation matrix to Rodriguez vector
 *
 * @param R - 3x3 rotation matrix
 * @returns Rodriguez vector [rx, ry, rz]
 */
export function matrixToRodriguez(R: number[][]): Vector3 {
  // trace(R) = 1 + 2·cos(θ)
  const trace = R[0][0] + R[1][1] + R[2][2]
  const cosTheta = (trace - 1) / 2

  if (cosTheta > 0.9999) {
    // θ ≈ 0: R ≈ I + K, so extract from skew-symmetric part
    return [
      (R[2][1] - R[1][2]) / 2,
      (R[0][2] - R[2][0]) / 2,
      (R[1][0] - R[0][1]) / 2,
    ]
  }

  if (cosTheta < -0.9999) {
    // θ ≈ π: special case, use eigenvector method
    // Find largest diagonal element
    let i = 0
    if (R[1][1] > R[0][0]) i = 1
    if (R[2][2] > R[i][i]) i = 2

    const v = [0, 0, 0]
    v[i] = Math.sqrt((R[i][i] + 1) / 2)
    const j = (i + 1) % 3
    const k = (i + 2) % 3
    v[j] = R[i][j] / (2 * v[i])
    v[k] = R[i][k] / (2 * v[i])

    const theta = Math.PI
    return [v[0] * theta, v[1] * theta, v[2] * theta]
  }

  const theta = Math.acos(Math.max(-1, Math.min(1, cosTheta)))
  const sinTheta = Math.sin(theta)

  // k = (R - Rᵀ) / (2·sin(θ))
  const kx = (R[2][1] - R[1][2]) / (2 * sinTheta)
  const ky = (R[0][2] - R[2][0]) / (2 * sinTheta)
  const kz = (R[1][0] - R[0][1]) / (2 * sinTheta)

  return [kx * theta, ky * theta, kz * theta]
}

// ============================================================================
// Projection Functions
// ============================================================================

/**
 * Project world point to image coordinates using K, R, T matrices
 *
 * Formula: p = K · (R · X + T)
 * where X is world point, p is image point (homogeneous)
 *
 * @param worldPoint - 3D world point (x, y, z) in meters
 * @param K - 3x3 intrinsic matrix
 * @param R - 3x3 rotation matrix
 * @param T - 3x1 translation vector
 * @returns Image coordinates (u, v) and validity
 */
export function projectWorldToImage(
  worldPoint: Point3D,
  K: number[][],
  R: number[][],
  T: Vector3
): { u: number; v: number; isValid: boolean; depth: number } {
  // Camera coordinates: Xc = R · Xw + T
  const Xc = [
    R[0][0] * worldPoint.x + R[0][1] * worldPoint.y + R[0][2] * worldPoint.z + T[0],
    R[1][0] * worldPoint.x + R[1][1] * worldPoint.y + R[1][2] * worldPoint.z + T[1],
    R[2][0] * worldPoint.x + R[2][1] * worldPoint.y + R[2][2] * worldPoint.z + T[2],
  ]

  // Check if point is behind camera
  if (Xc[2] <= 0) {
    return { u: 0, v: 0, isValid: false, depth: Xc[2] }
  }

  // Image coordinates: p = K · Xc (homogeneous)
  const px = K[0][0] * Xc[0] + K[0][1] * Xc[1] + K[0][2] * Xc[2]
  const py = K[1][0] * Xc[0] + K[1][1] * Xc[1] + K[1][2] * Xc[2]
  const pz = K[2][0] * Xc[0] + K[2][1] * Xc[1] + K[2][2] * Xc[2]

  // Convert from homogeneous
  const u = px / pz
  const v = py / pz

  return { u, v, isValid: true, depth: Xc[2] }
}

/**
 * Project world point to image with distortion
 *
 * @param worldPoint - 3D world point
 * @param K - Intrinsic matrix
 * @param R - Rotation matrix
 * @param T - Translation vector
 * @param distortion - Lens distortion coefficients
 * @returns Distorted image coordinates
 */
export function projectWorldToImageWithDistortion(
  worldPoint: Point3D,
  K: number[][],
  R: number[][],
  T: Vector3,
  distortion: DistortionCoeffs
): { u: number; v: number; isValid: boolean; depth: number } {
  // Camera coordinates
  const Xc = [
    R[0][0] * worldPoint.x + R[0][1] * worldPoint.y + R[0][2] * worldPoint.z + T[0],
    R[1][0] * worldPoint.x + R[1][1] * worldPoint.y + R[1][2] * worldPoint.z + T[1],
    R[2][0] * worldPoint.x + R[2][1] * worldPoint.y + R[2][2] * worldPoint.z + T[2],
  ]

  if (Xc[2] <= 0) {
    return { u: 0, v: 0, isValid: false, depth: Xc[2] }
  }

  // Normalized camera coordinates
  const x = Xc[0] / Xc[2]
  const y = Xc[1] / Xc[2]

  // Apply distortion (Brown-Conrady model)
  const r2 = x * x + y * y
  const r4 = r2 * r2
  const r6 = r4 * r2

  const { k1, k2, k3, p1, p2 } = distortion
  const radial = 1 + k1 * r2 + k2 * r4 + k3 * r6
  const xd = x * radial + 2 * p1 * x * y + p2 * (r2 + 2 * x * x)
  const yd = y * radial + p1 * (r2 + 2 * y * y) + 2 * p2 * x * y

  // Apply intrinsics
  const fx = K[0][0]
  const fy = K[1][1]
  const cx = K[0][2]
  const cy = K[1][2]

  const u = fx * xd + cx
  const v = fy * yd + cy

  return { u, v, isValid: true, depth: Xc[2] }
}

/**
 * Compute reprojection error between ground truth and bbox
 *
 * Projects world point to image and compares with bbox bottom-center
 *
 * @param groundTruth - World position (x, y in meters, z=0 for ground plane)
 * @param bbox - Normalized bounding box
 * @param K - Intrinsic matrix
 * @param R - Rotation matrix
 * @param T - Translation vector
 * @param imageWidth - Image width in pixels
 * @param imageHeight - Image height in pixels
 * @param distortion - Optional lens distortion
 * @returns Squared pixel error
 */
export function computeReprojectionError(
  groundTruth: Point2D,
  bbox: { left: number; top: number; right: number; bottom: number },
  K: number[][],
  R: number[][],
  T: Vector3,
  imageWidth: number = 1920,
  imageHeight: number = 1080,
  distortion?: DistortionCoeffs
): { error: number; projected: { u: number; v: number }; target: { u: number; v: number }; isValid: boolean } {
  // World point on ground plane
  const worldPoint: Point3D = { x: groundTruth.x, y: groundTruth.y, z: 0 }

  // Project to image
  const projection = distortion
    ? projectWorldToImageWithDistortion(worldPoint, K, R, T, distortion)
    : projectWorldToImage(worldPoint, K, R, T)

  if (!projection.isValid) {
    return {
      error: Infinity,
      projected: { u: 0, v: 0 },
      target: { u: 0, v: 0 },
      isValid: false,
    }
  }

  // Bbox bottom-center in pixels
  const bboxCenterX = (bbox.left + bbox.right) / 2 * imageWidth
  const bboxBottomY = bbox.bottom * imageHeight

  // Squared error in pixels
  const dx = projection.u - bboxCenterX
  const dy = projection.v - bboxBottomY
  const error = dx * dx + dy * dy

  return {
    error,
    projected: { u: projection.u, v: projection.v },
    target: { u: bboxCenterX, v: bboxBottomY },
    isValid: true,
  }
}

// ============================================================================
// Matrix Utilities
// ============================================================================

/**
 * Multiply two 3x3 matrices
 */
export function matMul3x3(A: number[][], B: number[][]): number[][] {
  const result: number[][] = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ]
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      for (let k = 0; k < 3; k++) {
        result[i][j] += A[i][k] * B[k][j]
      }
    }
  }
  return result
}

/**
 * Multiply 3x3 matrix by 3x1 vector
 */
export function matMulVec(M: number[][], v: number[]): Vector3 {
  return [
    M[0][0] * v[0] + M[0][1] * v[1] + M[0][2] * v[2],
    M[1][0] * v[0] + M[1][1] * v[1] + M[1][2] * v[2],
    M[2][0] * v[0] + M[2][1] * v[1] + M[2][2] * v[2],
  ]
}

/**
 * Transpose 3x3 matrix
 */
export function transpose3x3(M: number[][]): number[][] {
  return [
    [M[0][0], M[1][0], M[2][0]],
    [M[0][1], M[1][1], M[2][1]],
    [M[0][2], M[1][2], M[2][2]],
  ]
}

/**
 * Create identity matrix
 */
export function identity3x3(): number[][] {
  return [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ]
}

/**
 * Create intrinsic matrix K from focal length and principal point
 */
export function createK(focalLength: number, cx: number, cy: number): number[][] {
  return [
    [focalLength, 0, cx],
    [0, focalLength, cy],
    [0, 0, 1],
  ]
}

/**
 * Solve 3x3 linear system Ax = b using Cramer's rule
 */
function solve3x3(A: number[][], b: number[]): Vector3 | null {
  // Compute determinant of A
  const detA =
    A[0][0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1]) -
    A[0][1] * (A[1][0] * A[2][2] - A[1][2] * A[2][0]) +
    A[0][2] * (A[1][0] * A[2][1] - A[1][1] * A[2][0])

  if (Math.abs(detA) < 1e-10) {
    return null // Singular matrix
  }

  // Cramer's rule for x, y, z
  const detX =
    b[0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1]) -
    A[0][1] * (b[1] * A[2][2] - A[1][2] * b[2]) +
    A[0][2] * (b[1] * A[2][1] - A[1][1] * b[2])

  const detY =
    A[0][0] * (b[1] * A[2][2] - A[1][2] * b[2]) -
    b[0] * (A[1][0] * A[2][2] - A[1][2] * A[2][0]) +
    A[0][2] * (A[1][0] * b[2] - b[1] * A[2][0])

  const detZ =
    A[0][0] * (A[1][1] * b[2] - b[1] * A[2][1]) -
    A[0][1] * (A[1][0] * b[2] - b[1] * A[2][0]) +
    b[0] * (A[1][0] * A[2][1] - A[1][1] * A[2][0])

  return [detX / detA, detY / detA, detZ / detA]
}

/**
 * Project image point to world ground plane using K/R/T
 *
 * This is the inverse of projectWorldToImage - given image coordinates,
 * find the world point on z=0 ground plane.
 *
 * @param imageX - Image X coordinate in pixels
 * @param imageY - Image Y coordinate in pixels
 * @param K - Intrinsic matrix (should have principal point at K[0][2], K[1][2])
 * @param R - Rotation matrix
 * @param T - Translation vector
 * @param center - Optional explicit principal point [cx, cy] (overrides K if provided)
 * @returns World point on ground plane (z=0)
 */
export function projectImageToWorld(
  imageX: number,
  imageY: number,
  K: number[][],
  R: number[][],
  T: Vector3,
  center?: [number, number]
): { worldPoint: Point2D; isValid: boolean } {
  // Principal point - use explicit center if provided, otherwise from K
  const cx = center ? center[0] : K[0][2]
  const cy = center ? center[1] : K[1][2]

  // A = K * R
  const KR = matMul3x3(K, R)

  // Build modified A matrix for solving ground plane intersection
  // [KR(:,1:2), [cx-x; cy-y; -1]]
  const A: number[][] = [
    [KR[0][0], KR[0][1], cx - imageX],
    [KR[1][0], KR[1][1], cy - imageY],
    [KR[2][0], KR[2][1], -1],
  ]

  // KRT = K * R * T
  const KRT = matMulVec(KR, T)

  // Solve A * p = KRT for p = [world_x, world_y, lambda]
  const p = solve3x3(A, KRT)

  if (!p) {
    return { worldPoint: { x: 0, y: 0 }, isValid: false }
  }

  return {
    worldPoint: { x: p[0], y: p[1] },
    isValid: true,
  }
}

// ============================================================================
// Data Loading
// ============================================================================

/**
 * Load ground truth annotations from file
 */
export async function loadGroundTruths(filepath: string): Promise<GroundTruthsFile> {
  const fs = await import('fs/promises')
  const content = await fs.readFile(filepath, 'utf-8')
  return JSON.parse(content) as GroundTruthsFile
}

/**
 * Filter annotations by camera and confidence
 */
export function filterAnnotations(
  annotations: GroundTruthAnnotation[],
  cameraId: string,
  confidenceFilter: ('certain' | 'estimated' | 'uncertain')[] = ['certain']
): Array<{
  annotation: GroundTruthAnnotation
  detection: GroundTruthAnnotation['linkedDetections'][0]
}> {
  const results: Array<{
    annotation: GroundTruthAnnotation
    detection: GroundTruthAnnotation['linkedDetections'][0]
  }> = []

  for (const ann of annotations) {
    if (!confidenceFilter.includes(ann.confidence)) continue

    const detection = ann.linkedDetections.find((d) => d.cameraId === cameraId)
    if (detection) {
      results.push({ annotation: ann, detection })
    }
  }

  return results
}

/**
 * Get annotations with detections from multiple cameras
 */
export function getMultiCameraAnnotations(
  annotations: GroundTruthAnnotation[],
  cameraIds: string[],
  confidenceFilter: ('certain' | 'estimated' | 'uncertain')[] = ['certain']
): Array<{
  annotation: GroundTruthAnnotation
  detections: Map<string, GroundTruthAnnotation['linkedDetections'][0]>
}> {
  const results: Array<{
    annotation: GroundTruthAnnotation
    detections: Map<string, GroundTruthAnnotation['linkedDetections'][0]>
  }> = []

  for (const ann of annotations) {
    if (!confidenceFilter.includes(ann.confidence)) continue

    const detections = new Map<string, GroundTruthAnnotation['linkedDetections'][0]>()
    for (const cameraId of cameraIds) {
      const detection = ann.linkedDetections.find((d) => d.cameraId === cameraId)
      if (detection) {
        detections.set(cameraId, detection)
      }
    }

    // Only include if we have detections from all requested cameras
    if (detections.size === cameraIds.length) {
      results.push({ annotation: ann, detections })
    }
  }

  return results
}

// ============================================================================
// Statistics
// ============================================================================

/**
 * Compute statistics for an array of errors
 */
export function computeErrorStats(errors: number[]): {
  mean: number
  median: number
  stdDev: number
  min: number
  max: number
  passRate: number
  threshold: number
} {
  const threshold = 0.5 // meters
  const valid = errors.filter((e) => isFinite(e))

  if (valid.length === 0) {
    return { mean: Infinity, median: Infinity, stdDev: 0, min: Infinity, max: Infinity, passRate: 0, threshold }
  }

  const sorted = [...valid].sort((a, b) => a - b)
  const sum = valid.reduce((a, b) => a + b, 0)
  const mean = sum / valid.length
  const median = sorted[Math.floor(sorted.length / 2)]
  const variance = valid.reduce((acc, e) => acc + (e - mean) ** 2, 0) / valid.length
  const stdDev = Math.sqrt(variance)
  const passRate = valid.filter((e) => e < threshold).length / valid.length

  return {
    mean,
    median,
    stdDev,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    passRate,
    threshold,
  }
}

/**
 * Format error stats for display
 */
export function formatErrorStats(stats: ReturnType<typeof computeErrorStats>): string {
  return [
    `Mean: ${stats.mean.toFixed(3)}m`,
    `Median: ${stats.median.toFixed(3)}m`,
    `StdDev: ${stats.stdDev.toFixed(3)}m`,
    `Min: ${stats.min.toFixed(3)}m`,
    `Max: ${stats.max.toFixed(3)}m`,
    `Pass Rate (<${stats.threshold}m): ${(stats.passRate * 100).toFixed(1)}%`,
  ].join('\n')
}
