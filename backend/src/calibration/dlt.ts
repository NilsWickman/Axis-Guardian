/**
 * Direct Linear Transform (DLT) for Camera Calibration
 *
 * Computes initial camera matrix P from 2D-3D point correspondences,
 * then decomposes into K, R, T matrices.
 *
 * This provides much better initial values for subsequent Nelder-Mead optimization.
 */

import type { Point2D } from '../types.js'
import type { Vector3 } from './utils.js'

// ============================================================================
// Types
// ============================================================================

interface Correspondence {
  /** World point (x, y) on ground plane (z=0) */
  world: Point2D
  /** Image point (u, v) in pixels */
  image: Point2D
}

interface DLTResult {
  /** 3x4 camera matrix P */
  P: number[][]
  /** 3x3 intrinsic matrix K */
  K: number[][]
  /** 3x3 rotation matrix R */
  R: number[][]
  /** 3x1 translation vector T */
  T: Vector3
  /** Reprojection error */
  error: number
}

// ============================================================================
// Matrix Utilities
// ============================================================================

/**
 * Compute SVD of a matrix using power iteration
 * Returns the right singular vector corresponding to smallest singular value
 */
function svdSmallestRightSingularVector(A: number[][]): number[] {
  const m = A.length
  const n = A[0].length

  // Compute A^T * A
  const AtA: number[][] = []
  for (let i = 0; i < n; i++) {
    AtA[i] = []
    for (let j = 0; j < n; j++) {
      let sum = 0
      for (let k = 0; k < m; k++) {
        sum += A[k][i] * A[k][j]
      }
      AtA[i][j] = sum
    }
  }

  // Power iteration to find largest eigenvalue/vector of (AtA)^-1
  // We use inverse iteration: solve (AtA - sigma*I)x = b
  // For smallest eigenvalue, we iterate on AtA directly and take last converged

  // Simple approach: compute all eigenvalues via QR iteration (simplified)
  // For numerical stability in production, use a proper linear algebra library

  // For now, use a simpler approach: solve via least squares (pseudo-inverse)
  // The smallest singular vector is the null space of A

  // Gaussian elimination with partial pivoting to find null space
  const augmented = A.map((row) => [...row])

  // Row echelon form
  let pivotRow = 0
  for (let col = 0; col < n && pivotRow < m; col++) {
    // Find pivot
    let maxRow = pivotRow
    for (let row = pivotRow + 1; row < m; row++) {
      if (Math.abs(augmented[row][col]) > Math.abs(augmented[maxRow][col])) {
        maxRow = row
      }
    }

    if (Math.abs(augmented[maxRow][col]) < 1e-10) continue

    // Swap rows
    ;[augmented[pivotRow], augmented[maxRow]] = [augmented[maxRow], augmented[pivotRow]]

    // Eliminate
    for (let row = pivotRow + 1; row < m; row++) {
      const factor = augmented[row][col] / augmented[pivotRow][col]
      for (let j = col; j < n; j++) {
        augmented[row][j] -= factor * augmented[pivotRow][j]
      }
    }
    pivotRow++
  }

  // Back substitution to find null space vector
  const x = new Array(n).fill(0)
  x[n - 1] = 1 // Set last variable to 1

  for (let i = Math.min(pivotRow - 1, n - 2); i >= 0; i--) {
    let sum = 0
    let pivotCol = -1
    for (let j = 0; j < n; j++) {
      if (pivotCol < 0 && Math.abs(augmented[i][j]) > 1e-10) {
        pivotCol = j
      } else if (pivotCol >= 0) {
        sum += augmented[i][j] * x[j]
      }
    }
    if (pivotCol >= 0 && Math.abs(augmented[i][pivotCol]) > 1e-10) {
      x[pivotCol] = -sum / augmented[i][pivotCol]
    }
  }

  // Normalize
  const norm = Math.sqrt(x.reduce((s, v) => s + v * v, 0))
  return x.map((v) => v / norm)
}

/**
 * RQ decomposition of 3x3 matrix
 * Decomposes M = R * Q where R is upper triangular and Q is orthogonal
 */
function rqDecomposition3x3(M: number[][]): { R: number[][]; Q: number[][] } {
  // Flip M, do QR, flip back
  // This gives RQ decomposition

  // Reverse rows and columns
  const Mrev: number[][] = [
    [M[2][2], M[2][1], M[2][0]],
    [M[1][2], M[1][1], M[1][0]],
    [M[0][2], M[0][1], M[0][0]],
  ]

  // QR decomposition using Gram-Schmidt
  const { Q: Qrev, R: Rrev } = qrDecomposition3x3(Mrev)

  // Reverse back
  const R: number[][] = [
    [Rrev[2][2], Rrev[2][1], Rrev[2][0]],
    [Rrev[1][2], Rrev[1][1], Rrev[1][0]],
    [Rrev[0][2], Rrev[0][1], Rrev[0][0]],
  ]

  const Q: number[][] = [
    [Qrev[2][2], Qrev[2][1], Qrev[2][0]],
    [Qrev[1][2], Qrev[1][1], Qrev[1][0]],
    [Qrev[0][2], Qrev[0][1], Qrev[0][0]],
  ]

  return { R, Q }
}

/**
 * QR decomposition using Gram-Schmidt
 */
function qrDecomposition3x3(A: number[][]): { Q: number[][]; R: number[][] } {
  // Column vectors
  const a0 = [A[0][0], A[1][0], A[2][0]]
  const a1 = [A[0][1], A[1][1], A[2][1]]
  const a2 = [A[0][2], A[1][2], A[2][2]]

  // Gram-Schmidt
  const u0 = a0
  const e0 = normalize(u0)

  const u1 = subtract(a1, scale(e0, dot(e0, a1)))
  const e1 = normalize(u1)

  const u2 = subtract(subtract(a2, scale(e0, dot(e0, a2))), scale(e1, dot(e1, a2)))
  const e2 = normalize(u2)

  const Q: number[][] = [
    [e0[0], e1[0], e2[0]],
    [e0[1], e1[1], e2[1]],
    [e0[2], e1[2], e2[2]],
  ]

  const R: number[][] = [
    [dot(e0, a0), dot(e0, a1), dot(e0, a2)],
    [0, dot(e1, a1), dot(e1, a2)],
    [0, 0, dot(e2, a2)],
  ]

  return { Q, R }
}

function dot(a: number[], b: number[]): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

function normalize(v: number[]): number[] {
  const len = Math.sqrt(dot(v, v))
  return len > 1e-10 ? [v[0] / len, v[1] / len, v[2] / len] : [0, 0, 0]
}

function scale(v: number[], s: number): number[] {
  return [v[0] * s, v[1] * s, v[2] * s]
}

function subtract(a: number[], b: number[]): number[] {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
}

// ============================================================================
// DLT Algorithm
// ============================================================================

/**
 * Build DLT matrix A from correspondences
 * For ground plane (z=0), we use simplified 2D homography approach
 */
function buildDLTMatrix(correspondences: Correspondence[]): number[][] {
  const A: number[][] = []

  for (const { world, image } of correspondences) {
    const X = world.x
    const Y = world.y
    const u = image.x
    const v = image.y

    // For z=0 ground plane, the projection simplifies to:
    // u = (p11*X + p12*Y + p14) / (p31*X + p32*Y + p34)
    // v = (p21*X + p22*Y + p24) / (p31*X + p32*Y + p34)

    // This gives us equations for a 3x3 homography H:
    // [u]   [h11 h12 h13] [X]
    // [v] = [h21 h22 h23] [Y]
    // [1]   [h31 h32 h33] [1]

    // Cross product form: u × (H * X) = 0
    // Gives us 2 linearly independent equations per point

    A.push([X, Y, 1, 0, 0, 0, -u * X, -u * Y, -u])
    A.push([0, 0, 0, X, Y, 1, -v * X, -v * Y, -v])
  }

  return A
}

/**
 * Compute homography from correspondences using DLT
 */
function computeHomography(correspondences: Correspondence[]): number[][] {
  if (correspondences.length < 4) {
    throw new Error('Need at least 4 correspondences for homography')
  }

  const A = buildDLTMatrix(correspondences)
  const h = svdSmallestRightSingularVector(A)

  // Reshape to 3x3 homography
  const H: number[][] = [
    [h[0], h[1], h[2]],
    [h[3], h[4], h[5]],
    [h[6], h[7], h[8]],
  ]

  // Normalize so H[2][2] = 1
  const scale = H[2][2]
  if (Math.abs(scale) > 1e-10) {
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        H[i][j] /= scale
      }
    }
  }

  return H
}

/**
 * Decompose homography to K, R, T for ground plane case
 *
 * For z=0 ground plane:
 * H = K * [r1 | r2 | t]
 *
 * where r1, r2 are first two columns of R, and r3 = r1 × r2
 */
function decomposeHomography(
  H: number[][],
  imageWidth: number = 1920,
  imageHeight: number = 1080
): { K: number[][]; R: number[][]; T: Vector3 } {
  // Initial guess for K based on image size
  const focalGuess = Math.max(imageWidth, imageHeight) * 1.2
  const cx = imageWidth / 2
  const cy = imageHeight / 2

  // K inverse
  const Kinv: number[][] = [
    [1 / focalGuess, 0, -cx / focalGuess],
    [0, 1 / focalGuess, -cy / focalGuess],
    [0, 0, 1],
  ]

  // M = K^-1 * H = [r1 | r2 | t]
  const M: number[][] = [
    [
      Kinv[0][0] * H[0][0] + Kinv[0][1] * H[1][0] + Kinv[0][2] * H[2][0],
      Kinv[0][0] * H[0][1] + Kinv[0][1] * H[1][1] + Kinv[0][2] * H[2][1],
      Kinv[0][0] * H[0][2] + Kinv[0][1] * H[1][2] + Kinv[0][2] * H[2][2],
    ],
    [
      Kinv[1][0] * H[0][0] + Kinv[1][1] * H[1][0] + Kinv[1][2] * H[2][0],
      Kinv[1][0] * H[0][1] + Kinv[1][1] * H[1][1] + Kinv[1][2] * H[2][1],
      Kinv[1][0] * H[0][2] + Kinv[1][1] * H[1][2] + Kinv[1][2] * H[2][2],
    ],
    [
      Kinv[2][0] * H[0][0] + Kinv[2][1] * H[1][0] + Kinv[2][2] * H[2][0],
      Kinv[2][0] * H[0][1] + Kinv[2][1] * H[1][1] + Kinv[2][2] * H[2][1],
      Kinv[2][0] * H[0][2] + Kinv[2][1] * H[1][2] + Kinv[2][2] * H[2][2],
    ],
  ]

  // Extract r1, r2, t
  const r1 = [M[0][0], M[1][0], M[2][0]]
  const r2 = [M[0][1], M[1][1], M[2][1]]
  const t = [M[0][2], M[1][2], M[2][2]]

  // Compute scale factor (r1 and r2 should be unit vectors)
  const lambda1 = Math.sqrt(r1[0] * r1[0] + r1[1] * r1[1] + r1[2] * r1[2])
  const lambda2 = Math.sqrt(r2[0] * r2[0] + r2[1] * r2[1] + r2[2] * r2[2])
  const lambda = (lambda1 + lambda2) / 2

  // Normalize
  const r1n = [r1[0] / lambda, r1[1] / lambda, r1[2] / lambda]
  const r2n = [r2[0] / lambda, r2[1] / lambda, r2[2] / lambda]
  const tn: Vector3 = [t[0] / lambda, t[1] / lambda, t[2] / lambda]

  // r3 = r1 × r2
  const r3 = [
    r1n[1] * r2n[2] - r1n[2] * r2n[1],
    r1n[2] * r2n[0] - r1n[0] * r2n[2],
    r1n[0] * r2n[1] - r1n[1] * r2n[0],
  ]

  // Build R (may not be perfectly orthogonal due to noise)
  let R: number[][] = [
    [r1n[0], r2n[0], r3[0]],
    [r1n[1], r2n[1], r3[1]],
    [r1n[2], r2n[2], r3[2]],
  ]

  // Orthogonalize R using SVD (approximate)
  R = orthogonalizeRotation(R)

  // Build K
  const K: number[][] = [
    [focalGuess, 0, cx],
    [0, focalGuess, cy],
    [0, 0, 1],
  ]

  return { K, R, T: tn }
}

/**
 * Orthogonalize a near-rotation matrix to ensure det(R)=1 and R^T*R=I
 */
function orthogonalizeRotation(R: number[][]): number[][] {
  // Use iterative orthogonalization
  const result = R.map((row) => [...row])

  for (let iter = 0; iter < 10; iter++) {
    // Compute R^T * R
    const RtR: number[][] = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ]
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        for (let k = 0; k < 3; k++) {
          RtR[i][j] += result[k][i] * result[k][j]
        }
      }
    }

    // Check if already orthogonal
    const error =
      Math.abs(RtR[0][0] - 1) +
      Math.abs(RtR[1][1] - 1) +
      Math.abs(RtR[2][2] - 1) +
      Math.abs(RtR[0][1]) +
      Math.abs(RtR[0][2]) +
      Math.abs(RtR[1][2])

    if (error < 1e-10) break

    // R_new = R * (3I - R^T*R) / 2
    const correction: number[][] = [
      [(3 - RtR[0][0]) / 2, -RtR[0][1] / 2, -RtR[0][2] / 2],
      [-RtR[1][0] / 2, (3 - RtR[1][1]) / 2, -RtR[1][2] / 2],
      [-RtR[2][0] / 2, -RtR[2][1] / 2, (3 - RtR[2][2]) / 2],
    ]

    const newR: number[][] = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ]
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        for (let k = 0; k < 3; k++) {
          newR[i][j] += result[i][k] * correction[k][j]
        }
      }
    }

    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        result[i][j] = newR[i][j]
      }
    }
  }

  // Ensure det(R) = 1 (not -1)
  const det =
    result[0][0] * (result[1][1] * result[2][2] - result[1][2] * result[2][1]) -
    result[0][1] * (result[1][0] * result[2][2] - result[1][2] * result[2][0]) +
    result[0][2] * (result[1][0] * result[2][1] - result[1][1] * result[2][0])

  if (det < 0) {
    for (let i = 0; i < 3; i++) {
      result[i][2] = -result[i][2]
    }
  }

  return result
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Compute camera calibration from 2D-3D correspondences using DLT
 *
 * @param correspondences - Array of world-image point correspondences
 * @param imageWidth - Image width in pixels
 * @param imageHeight - Image height in pixels
 * @returns DLT result with K, R, T matrices
 */
export function computeDLT(
  correspondences: Correspondence[],
  imageWidth: number = 1920,
  imageHeight: number = 1080
): DLTResult {
  if (correspondences.length < 4) {
    throw new Error('Need at least 4 correspondences for DLT')
  }

  // Compute homography
  const H = computeHomography(correspondences)

  // Decompose to K, R, T
  const { K, R, T } = decomposeHomography(H, imageWidth, imageHeight)

  // Build full projection matrix P = K * [R | T]
  const P: number[][] = [
    [
      K[0][0] * R[0][0] + K[0][1] * R[1][0] + K[0][2] * R[2][0],
      K[0][0] * R[0][1] + K[0][1] * R[1][1] + K[0][2] * R[2][1],
      K[0][0] * R[0][2] + K[0][1] * R[1][2] + K[0][2] * R[2][2],
      K[0][0] * T[0] + K[0][1] * T[1] + K[0][2] * T[2],
    ],
    [
      K[1][0] * R[0][0] + K[1][1] * R[1][0] + K[1][2] * R[2][0],
      K[1][0] * R[0][1] + K[1][1] * R[1][1] + K[1][2] * R[2][1],
      K[1][0] * R[0][2] + K[1][1] * R[1][2] + K[1][2] * R[2][2],
      K[1][0] * T[0] + K[1][1] * T[1] + K[1][2] * T[2],
    ],
    [
      K[2][0] * R[0][0] + K[2][1] * R[1][0] + K[2][2] * R[2][0],
      K[2][0] * R[0][1] + K[2][1] * R[1][1] + K[2][2] * R[2][1],
      K[2][0] * R[0][2] + K[2][1] * R[1][2] + K[2][2] * R[2][2],
      K[2][0] * T[0] + K[2][1] * T[1] + K[2][2] * T[2],
    ],
  ]

  // Compute reprojection error
  let totalError = 0
  for (const { world, image } of correspondences) {
    const X = world.x
    const Y = world.y
    const Z = 0

    const w = P[2][0] * X + P[2][1] * Y + P[2][2] * Z + P[2][3]
    const u = (P[0][0] * X + P[0][1] * Y + P[0][2] * Z + P[0][3]) / w
    const v = (P[1][0] * X + P[1][1] * Y + P[1][2] * Z + P[1][3]) / w

    totalError += (u - image.x) ** 2 + (v - image.y) ** 2
  }
  const error = Math.sqrt(totalError / correspondences.length)

  return { P, K, R, T, error }
}

/**
 * Create correspondences from ground truth annotations
 */
export function annotationsToCorrespondences(
  annotations: Array<{
    annotation: { groundPosition: Point2D }
    detection: { bbox: { left: number; top: number; right: number; bottom: number } }
  }>,
  imageWidth: number = 1920,
  imageHeight: number = 1080
): Correspondence[] {
  return annotations.map(({ annotation, detection }) => ({
    world: annotation.groundPosition,
    image: {
      x: ((detection.bbox.left + detection.bbox.right) / 2) * imageWidth,
      y: detection.bbox.bottom * imageHeight,
    },
  }))
}
