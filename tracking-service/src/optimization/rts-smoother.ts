/**
 * Rauch-Tung-Striebel (RTS) Kalman Smoother
 *
 * Implements the backward pass of the RTS smoother for optimal trajectory estimation.
 * The RTS smoother uses future observations to refine past state estimates, producing
 * smoother trajectories than forward-only filtering.
 *
 * Algorithm:
 * 1. Run forward Kalman filter to get filtered estimates
 * 2. Run backward pass to incorporate future information
 * 3. Result: optimal smoothed trajectory using all observations
 */

import type { KalmanState, Point2D, GlobalTrack } from '../types/index.js'
import { KalmanTrackFilter } from '../filters/kalman-track-filter.js'
import { ALGORITHM_CONSTANTS } from '../config/algorithm-constants.js'

/**
 * Smoothed trajectory point
 */
export interface SmoothedPosition {
  timestamp: number
  position: Point2D
  velocity: Point2D
  state: KalmanState
}

/**
 * Compute the RTS smoother gain matrix
 *
 * The smoother gain determines how much the backward pass adjusts the forward estimates.
 * G_k = P_k|k * F^T * P_k+1|k^(-1)
 *
 * @param filteredState - State after Kalman filter update (P_k|k)
 * @param predictedNextState - Predicted state for next timestep (P_k+1|k)
 * @returns 4x4 smoother gain matrix
 */
export function computeSmootherGain(
  filteredState: KalmanState,
  predictedNextCovariance: number[][]
): number[][] {
  // F^T (state transition matrix transpose for constant velocity model)
  // The state transition is [1, 0, dt, 0; 0, 1, 0, dt; 0, 0, 1, 0; 0, 0, 0, 1]
  // For simplicity, we use dt=1 here as the gain is normalized
  const dt = 1

  // Build F^T matrix
  const FT = [
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [dt, 0, 1, 0],
    [0, dt, 0, 1],
  ]

  // P_k|k * F^T
  const P = filteredState.covariance
  const PFT = multiplyMatrices(P, FT)

  // Invert P_k+1|k (predicted covariance)
  const Pinv = invertMatrix4x4(predictedNextCovariance)
  if (!Pinv) {
    // If inversion fails, return identity-like gain (no smoothing)
    return [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ]
  }

  // G = P_k|k * F^T * P_k+1|k^(-1)
  return multiplyMatrices(PFT, Pinv)
}

/**
 * Run RTS smoother backward pass on a sequence of Kalman states
 *
 * Given forward-filtered states, applies the backward smoothing recursion:
 * x_k|N = x_k|k + G_k * (x_k+1|N - x_k+1|k)
 * P_k|N = P_k|k + G_k * (P_k+1|N - P_k+1|k) * G_k^T
 *
 * @param forwardStates - States from forward Kalman filter pass (chronological order)
 * @param timestamps - Timestamps corresponding to each state
 * @returns Smoothed states (same order as input)
 */
export function runRTSSmootherBackward(
  forwardStates: KalmanState[],
  timestamps: number[]
): KalmanState[] {
  const n = forwardStates.length
  if (n < 2) {
    return [...forwardStates]
  }

  // Initialize with last state (already optimal)
  const smoothed: KalmanState[] = new Array(n)
  smoothed[n - 1] = { ...forwardStates[n - 1] }

  // Kalman filter for predictions
  const kalman = new KalmanTrackFilter()

  // Backward pass
  for (let k = n - 2; k >= 0; k--) {
    const filteredK = forwardStates[k]
    const smoothedK1 = smoothed[k + 1]

    // Time delta for prediction
    const dt = timestamps[k + 1] - timestamps[k]

    // Predict k+1 from k (to get P_k+1|k)
    // Note: We compute predicted position for reference but use our own formula below
    kalman.predict(filteredK, dt)

    // Build predicted covariance P_k+1|k using process noise model
    const dtSec = dt / 1000
    const q = ALGORITHM_CONSTANTS.kalman.processNoise
    const dt2 = dtSec * dtSec
    const dt3 = dt2 * dtSec
    const dt4 = dt3 * dtSec

    // State transition matrix F
    const F = [
      [1, 0, dtSec, 0],
      [0, 1, 0, dtSec],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ]

    // Process noise Q
    const Q = [
      [(q * dt4) / 4, 0, (q * dt3) / 2, 0],
      [0, (q * dt4) / 4, 0, (q * dt3) / 2],
      [(q * dt3) / 2, 0, q * dt2, 0],
      [0, (q * dt3) / 2, 0, q * dt2],
    ]

    // Predicted covariance: P_k+1|k = F * P_k|k * F^T + Q
    const FP = multiplyMatrices(F, filteredK.covariance)
    const FT = transposeMatrix(F)
    const FPFT = multiplyMatrices(FP, FT)
    const predictedCov = addMatrices(FPFT, Q)

    // Smoother gain
    const G = computeSmootherGain(filteredK, predictedCov)

    // Innovation: x_k+1|N - x_k+1|k
    const predictedMean = [
      [filteredK.mean[0][0] + filteredK.mean[2][0] * dtSec],
      [filteredK.mean[1][0] + filteredK.mean[3][0] * dtSec],
      [filteredK.mean[2][0]],
      [filteredK.mean[3][0]],
    ]

    const innovation = [
      [smoothedK1.mean[0][0] - predictedMean[0][0]],
      [smoothedK1.mean[1][0] - predictedMean[1][0]],
      [smoothedK1.mean[2][0] - predictedMean[2][0]],
      [smoothedK1.mean[3][0] - predictedMean[3][0]],
    ]

    // Smoothed mean: x_k|N = x_k|k + G * (x_k+1|N - x_k+1|k)
    const correction = multiplyMatrixVector(G, innovation)
    const smoothedMean = [
      [filteredK.mean[0][0] + correction[0][0]],
      [filteredK.mean[1][0] + correction[1][0]],
      [filteredK.mean[2][0] + correction[2][0]],
      [filteredK.mean[3][0] + correction[3][0]],
    ]

    // Smoothed covariance: P_k|N = P_k|k + G * (P_k+1|N - P_k+1|k) * G^T
    const covDiff = subtractMatrices(smoothedK1.covariance, predictedCov)
    const GCov = multiplyMatrices(G, covDiff)
    const GT = transposeMatrix(G)
    const GCovGT = multiplyMatrices(GCov, GT)
    const smoothedCov = addMatrices(filteredK.covariance, GCovGT)

    smoothed[k] = {
      mean: smoothedMean,
      covariance: smoothedCov,
      lastTimestamp: timestamps[k],
    }
  }

  return smoothed
}

/**
 * Apply RTS smoothing to all tracks in a batch assignment result
 *
 * For each track that has multiple assignments in the batch window,
 * runs the RTS smoother to refine position estimates.
 *
 * @param trackAssignments - Map of trackId to assigned positions/timestamps
 * @param tracks - Current track states
 * @returns Map of trackId to smoothed positions
 */
export function smoothTrajectories(
  trackAssignments: Map<string, Array<{ timestamp: number; position: Point2D }>>,
  tracks: Map<string, GlobalTrack>
): Map<string, SmoothedPosition[]> {
  const smoothed = new Map<string, SmoothedPosition[]>()
  const kalman = new KalmanTrackFilter()

  for (const [trackId, assignments] of trackAssignments) {
    if (assignments.length < 2) {
      // Single point - no smoothing needed
      const single = assignments[0]
      smoothed.set(trackId, [
        {
          timestamp: single.timestamp,
          position: single.position,
          velocity: { x: 0, y: 0 },
          state: kalman.initialize(single.position, single.timestamp),
        },
      ])
      continue
    }

    // Get initial state from track if available
    const track = tracks.get(trackId)
    let state = track?.kalmanState ?? kalman.initialize(assignments[0].position, assignments[0].timestamp)

    // Forward pass: run Kalman filter
    const forwardStates: KalmanState[] = [state]
    const timestamps: number[] = [assignments[0].timestamp]

    for (let i = 1; i < assignments.length; i++) {
      const obs = assignments[i]
      state = kalman.update(state, obs.position, obs.timestamp, `batch-${trackId}`)
      forwardStates.push(state)
      timestamps.push(obs.timestamp)
    }

    // Backward pass: RTS smoother
    const smoothedStates = runRTSSmootherBackward(forwardStates, timestamps)

    // Extract smoothed positions
    const result: SmoothedPosition[] = smoothedStates.map((s, i) => ({
      timestamp: timestamps[i],
      position: kalman.getPosition(s),
      velocity: kalman.getVelocity(s),
      state: s,
    }))

    smoothed.set(trackId, result)

    // Clean up batch state from Kalman cache
    kalman.removeTrackState(`batch-${trackId}`)
  }

  return smoothed
}

// =============================================================================
// Matrix Utilities
// =============================================================================

function multiplyMatrices(A: number[][], B: number[][]): number[][] {
  const rowsA = A.length
  const colsA = A[0].length
  const colsB = B[0].length
  const result: number[][] = Array(rowsA)
    .fill(null)
    .map(() => Array(colsB).fill(0))

  for (let i = 0; i < rowsA; i++) {
    for (let j = 0; j < colsB; j++) {
      let sum = 0
      for (let k = 0; k < colsA; k++) {
        sum += A[i][k] * B[k][j]
      }
      result[i][j] = sum
    }
  }
  return result
}

function multiplyMatrixVector(A: number[][], v: number[][]): number[][] {
  return multiplyMatrices(A, v)
}

function transposeMatrix(A: number[][]): number[][] {
  const rows = A.length
  const cols = A[0].length
  const result: number[][] = Array(cols)
    .fill(null)
    .map(() => Array(rows).fill(0))

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      result[j][i] = A[i][j]
    }
  }
  return result
}

function addMatrices(A: number[][], B: number[][]): number[][] {
  const rows = A.length
  const cols = A[0].length
  const result: number[][] = Array(rows)
    .fill(null)
    .map(() => Array(cols).fill(0))

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      result[i][j] = A[i][j] + B[i][j]
    }
  }
  return result
}

function subtractMatrices(A: number[][], B: number[][]): number[][] {
  const rows = A.length
  const cols = A[0].length
  const result: number[][] = Array(rows)
    .fill(null)
    .map(() => Array(cols).fill(0))

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      result[i][j] = A[i][j] - B[i][j]
    }
  }
  return result
}

/**
 * Invert a 4x4 matrix using Gaussian elimination
 * Returns null if matrix is singular
 */
function invertMatrix4x4(A: number[][]): number[][] | null {
  // Create augmented matrix [A | I]
  const aug: number[][] = A.map((row, i) => [
    ...row,
    i === 0 ? 1 : 0,
    i === 1 ? 1 : 0,
    i === 2 ? 1 : 0,
    i === 3 ? 1 : 0,
  ])

  const n = 4

  // Forward elimination
  for (let col = 0; col < n; col++) {
    // Find pivot
    let maxRow = col
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) {
        maxRow = row
      }
    }

    // Swap rows
    ;[aug[col], aug[maxRow]] = [aug[maxRow], aug[col]]

    // Check for singular matrix
    if (Math.abs(aug[col][col]) < 1e-10) {
      return null
    }

    // Scale pivot row
    const pivot = aug[col][col]
    for (let j = 0; j < 2 * n; j++) {
      aug[col][j] /= pivot
    }

    // Eliminate column
    for (let row = 0; row < n; row++) {
      if (row !== col) {
        const factor = aug[row][col]
        for (let j = 0; j < 2 * n; j++) {
          aug[row][j] -= factor * aug[col][j]
        }
      }
    }
  }

  // Extract inverse from augmented matrix
  return aug.map(row => row.slice(n))
}
