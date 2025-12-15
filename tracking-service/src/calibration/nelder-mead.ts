/**
 * Nelder-Mead Simplex Optimizer
 *
 * Gradient-free optimization algorithm for 6-9 parameter problems.
 * Used for camera calibration where numerical gradients are expensive.
 *
 * Reference: Nelder & Mead (1965), "A simplex method for function minimization"
 */

/** Optimizer configuration */
export interface NelderMeadConfig {
  /** Maximum iterations (default: 1000) */
  maxIterations: number
  /** Convergence tolerance for function values (default: 1e-8) */
  tolerance: number
  /** Convergence tolerance for simplex size (default: 1e-8) */
  xTolerance: number
  /** Reflection coefficient (default: 1.0) */
  alpha: number
  /** Expansion coefficient (default: 2.0) */
  gamma: number
  /** Contraction coefficient (default: 0.5) */
  rho: number
  /** Shrink coefficient (default: 0.5) */
  sigma: number
  /** Callback for progress updates */
  onProgress?: (iteration: number, bestValue: number, params: number[]) => void
}

/** Optimization result */
export interface NelderMeadResult {
  /** Optimal parameters */
  params: number[]
  /** Optimal function value */
  value: number
  /** Number of iterations */
  iterations: number
  /** Number of function evaluations */
  evaluations: number
  /** Convergence status */
  converged: boolean
  /** Reason for termination */
  reason: 'tolerance' | 'xTolerance' | 'maxIterations'
}

/** Default configuration */
const DEFAULT_CONFIG: NelderMeadConfig = {
  maxIterations: 1000,
  tolerance: 1e-8,
  xTolerance: 1e-8,
  alpha: 1.0,
  gamma: 2.0,
  rho: 0.5,
  sigma: 0.5,
}

/**
 * Minimize a function using Nelder-Mead simplex algorithm
 *
 * @param f - Objective function to minimize
 * @param initial - Initial parameter vector
 * @param config - Optimizer configuration
 * @returns Optimization result
 */
export function nelderMead(
  f: (params: number[]) => number,
  initial: number[],
  config: Partial<NelderMeadConfig> = {}
): NelderMeadResult {
  const cfg: NelderMeadConfig = { ...DEFAULT_CONFIG, ...config }
  const n = initial.length
  let evaluations = 0

  // Wrapper to count evaluations
  const evaluate = (params: number[]): number => {
    evaluations++
    return f(params)
  }

  // Initialize simplex with n+1 vertices
  // First vertex is initial point, others are perturbed
  const simplex: { params: number[]; value: number }[] = []

  // Initial point
  simplex.push({ params: [...initial], value: evaluate(initial) })

  // Perturbed points (5% perturbation or 0.00025 if near zero)
  for (let i = 0; i < n; i++) {
    const perturbed = [...initial]
    const delta = Math.abs(initial[i]) > 1e-10 ? initial[i] * 0.05 : 0.00025
    perturbed[i] += delta
    simplex.push({ params: perturbed, value: evaluate(perturbed) })
  }

  let iterations = 0

  while (iterations < cfg.maxIterations) {
    // Sort simplex by function value (ascending)
    simplex.sort((a, b) => a.value - b.value)

    const best = simplex[0]
    const worst = simplex[n]
    const secondWorst = simplex[n - 1]

    // Check convergence
    const fRange = worst.value - best.value
    if (fRange < cfg.tolerance) {
      return {
        params: best.params,
        value: best.value,
        iterations,
        evaluations,
        converged: true,
        reason: 'tolerance',
      }
    }

    // Check simplex size
    let maxDist = 0
    for (let i = 1; i <= n; i++) {
      let dist = 0
      for (let j = 0; j < n; j++) {
        dist += (simplex[i].params[j] - best.params[j]) ** 2
      }
      maxDist = Math.max(maxDist, Math.sqrt(dist))
    }
    if (maxDist < cfg.xTolerance) {
      return {
        params: best.params,
        value: best.value,
        iterations,
        evaluations,
        converged: true,
        reason: 'xTolerance',
      }
    }

    // Compute centroid of all points except worst
    const centroid: number[] = new Array(n).fill(0)
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        centroid[j] += simplex[i].params[j]
      }
    }
    for (let j = 0; j < n; j++) {
      centroid[j] /= n
    }

    // Reflection: xr = centroid + alpha * (centroid - worst)
    const reflected: number[] = new Array(n)
    for (let j = 0; j < n; j++) {
      reflected[j] = centroid[j] + cfg.alpha * (centroid[j] - worst.params[j])
    }
    const fr = evaluate(reflected)

    if (fr < secondWorst.value && fr >= best.value) {
      // Accept reflection
      simplex[n] = { params: reflected, value: fr }
    } else if (fr < best.value) {
      // Expansion: xe = centroid + gamma * (reflected - centroid)
      const expanded: number[] = new Array(n)
      for (let j = 0; j < n; j++) {
        expanded[j] = centroid[j] + cfg.gamma * (reflected[j] - centroid[j])
      }
      const fe = evaluate(expanded)

      if (fe < fr) {
        simplex[n] = { params: expanded, value: fe }
      } else {
        simplex[n] = { params: reflected, value: fr }
      }
    } else {
      // Contraction
      const useOutside = fr < worst.value
      const contractFrom = useOutside ? reflected : worst.params
      const fc = useOutside ? fr : worst.value

      const contracted: number[] = new Array(n)
      for (let j = 0; j < n; j++) {
        contracted[j] = centroid[j] + cfg.rho * (contractFrom[j] - centroid[j])
      }
      const fcon = evaluate(contracted)

      if (fcon < fc) {
        simplex[n] = { params: contracted, value: fcon }
      } else {
        // Shrink: move all vertices toward best
        for (let i = 1; i <= n; i++) {
          for (let j = 0; j < n; j++) {
            simplex[i].params[j] = best.params[j] + cfg.sigma * (simplex[i].params[j] - best.params[j])
          }
          simplex[i].value = evaluate(simplex[i].params)
        }
      }
    }

    iterations++

    // Progress callback
    if (cfg.onProgress && iterations % 10 === 0) {
      simplex.sort((a, b) => a.value - b.value)
      cfg.onProgress(iterations, simplex[0].value, simplex[0].params)
    }
  }

  // Max iterations reached
  simplex.sort((a, b) => a.value - b.value)
  return {
    params: simplex[0].params,
    value: simplex[0].value,
    iterations,
    evaluations,
    converged: false,
    reason: 'maxIterations',
  }
}

/**
 * Multi-start Nelder-Mead optimization
 *
 * Runs optimization from multiple starting points to avoid local minima.
 *
 * @param f - Objective function to minimize
 * @param initialPoints - Array of initial parameter vectors
 * @param config - Optimizer configuration
 * @returns Best result across all starts
 */
export function multiStartNelderMead(
  f: (params: number[]) => number,
  initialPoints: number[][],
  config: Partial<NelderMeadConfig> = {}
): NelderMeadResult & { allResults: NelderMeadResult[] } {
  const results: NelderMeadResult[] = []

  for (const initial of initialPoints) {
    const result = nelderMead(f, initial, config)
    results.push(result)
  }

  // Find best result
  let best = results[0]
  for (const result of results) {
    if (result.value < best.value) {
      best = result
    }
  }

  return { ...best, allResults: results }
}

/**
 * Generate grid of initial points for multi-start optimization
 *
 * @param bounds - Parameter bounds [[min, max], ...]
 * @param pointsPerDim - Number of points per dimension (default: 3)
 * @returns Array of initial points
 */
export function generateGridStartPoints(
  bounds: [number, number][],
  pointsPerDim: number = 3
): number[][] {
  const n = bounds.length
  const points: number[][] = []

  // Generate grid indices
  const generateIndices = (dim: number, current: number[]): void => {
    if (dim === n) {
      points.push([...current])
      return
    }

    const [min, max] = bounds[dim]
    for (let i = 0; i < pointsPerDim; i++) {
      const t = pointsPerDim > 1 ? i / (pointsPerDim - 1) : 0.5
      current[dim] = min + t * (max - min)
      generateIndices(dim + 1, current)
    }
  }

  generateIndices(0, new Array(n))
  return points
}

/**
 * Generate random initial points for multi-start optimization
 *
 * @param bounds - Parameter bounds [[min, max], ...]
 * @param numPoints - Number of random points to generate
 * @param seed - Optional random seed for reproducibility
 * @returns Array of initial points
 */
export function generateRandomStartPoints(
  bounds: [number, number][],
  numPoints: number,
  seed?: number
): number[][] {
  // Simple seeded random for reproducibility
  let rng = seed !== undefined ? createSeededRandom(seed) : Math.random

  const points: number[][] = []
  for (let i = 0; i < numPoints; i++) {
    const point = bounds.map(([min, max]) => min + rng() * (max - min))
    points.push(point)
  }
  return points
}

/**
 * Create seeded random number generator (simple LCG)
 */
function createSeededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
}

/**
 * Bound-constrained Nelder-Mead
 *
 * Applies penalty for out-of-bounds parameters.
 *
 * @param f - Objective function
 * @param initial - Initial parameters
 * @param bounds - Parameter bounds [[min, max], ...]
 * @param config - Optimizer configuration
 * @param penalty - Penalty factor for constraint violations (default: 1e6)
 * @returns Optimization result with bounded parameters
 */
export function boundedNelderMead(
  f: (params: number[]) => number,
  initial: number[],
  bounds: [number, number][],
  config: Partial<NelderMeadConfig> = {},
  penalty: number = 1e6
): NelderMeadResult {
  // Penalized objective function
  const penalizedF = (params: number[]): number => {
    let p = 0
    for (let i = 0; i < params.length; i++) {
      const [min, max] = bounds[i]
      if (params[i] < min) {
        p += penalty * (min - params[i]) ** 2
      } else if (params[i] > max) {
        p += penalty * (params[i] - max) ** 2
      }
    }
    return f(params) + p
  }

  // Clamp initial point to bounds
  const clampedInitial = initial.map((v, i) => {
    const [min, max] = bounds[i]
    return Math.max(min, Math.min(max, v))
  })

  const result = nelderMead(penalizedF, clampedInitial, config)

  // Clamp final result to bounds
  result.params = result.params.map((v, i) => {
    const [min, max] = bounds[i]
    return Math.max(min, Math.min(max, v))
  })

  // Re-evaluate without penalty
  result.value = f(result.params)

  return result
}
