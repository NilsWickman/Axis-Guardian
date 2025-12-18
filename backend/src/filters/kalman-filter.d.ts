/**
 * Type declarations for kalman-filter npm package
 */

declare module 'kalman-filter' {
  interface KalmanFilterOptions {
    observation: {
      dimension: number
      stateProjection?: number[][]
      covariance?: number[][]
    }
    dynamic: {
      dimension: number
      init?: {
        mean: number[][]
        covariance: number[][]
      }
      transition?: (params?: { deltaTime?: number }) => number[][]
      covariance?: number[][] | ((params?: { deltaTime?: number }) => number[][])
    }
  }

  interface FilterResult {
    predicted: {
      mean: number[][]
      covariance: number[][]
    }
    corrected: {
      mean: number[][]
      covariance: number[][]
    }
  }

  interface FilterInput {
    previousCorrected?: {
      mean: number[][]
      covariance?: number[][]
    }
    observation: number[][]
    deltaTime?: number
  }

  export class KalmanFilter {
    constructor(options: KalmanFilterOptions)
    filter(input: FilterInput): FilterResult
    predict(input: { previousCorrected: { mean: number[][]; covariance: number[][] } }): FilterResult['predicted']
  }
}
