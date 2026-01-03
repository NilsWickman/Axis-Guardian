/**
 * Projection Optimizer
 *
 * TypeScript wrapper that calls the Python optimization script
 * to find optimal K/R/T calibration parameters.
 */

import { spawn } from 'child_process'
import { writeFileSync, readFileSync, unlinkSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import type { CrossCameraMatch, CalibrationOutput, OptimizationResult } from './types.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ============================================================================
// Configuration
// ============================================================================

export interface OptimizationConfig {
  /** Maximum optimization iterations */
  maxIterations: number
  /** Convergence tolerance */
  convergenceTolerance: number
  /** Path to Python script */
  pythonScript?: string
  /** Python executable */
  pythonExecutable?: string
  /** Verbose output */
  verbose?: boolean
}

const DEFAULT_CONFIG: OptimizationConfig = {
  maxIterations: 500,
  convergenceTolerance: 0.001,
  pythonExecutable: 'python3',
  verbose: true,
}

// ============================================================================
// Python Script Execution
// ============================================================================

/**
 * Run the Python optimization script
 *
 * @param matchesPath Path to matches JSON file
 * @param sitemapPath Path to sitemap JSON file
 * @param outputPath Path for output calibration JSON
 * @param config Optimization configuration
 * @returns Promise resolving to the calibration output
 */
async function runPythonOptimizer(
  matchesPath: string,
  sitemapPath: string,
  outputPath: string,
  config: OptimizationConfig
): Promise<CalibrationOutput> {
  const scriptPath = config.pythonScript ?? resolve(__dirname, '../../../scripts/optimize-calibration.py')

  if (!existsSync(scriptPath)) {
    throw new Error(`Python optimization script not found: ${scriptPath}`)
  }

  const args = [
    scriptPath,
    '--matches', matchesPath,
    '--sitemap', sitemapPath,
    '--output', outputPath,
    '--max-iterations', String(config.maxIterations),
  ]

  if (!config.verbose) {
    args.push('--quiet')
  }

  return new Promise((resolve, reject) => {
    const python = spawn(config.pythonExecutable ?? 'python3', args, {
      stdio: config.verbose ? ['inherit', 'inherit', 'inherit'] : ['pipe', 'pipe', 'pipe'],
    })

    let stderr = ''

    if (!config.verbose) {
      python.stderr?.on('data', (data) => {
        stderr += data.toString()
      })
    }

    python.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python optimizer exited with code ${code}: ${stderr}`))
        return
      }

      try {
        const output = JSON.parse(readFileSync(outputPath, 'utf-8')) as CalibrationOutput
        resolve(output)
      } catch (err) {
        reject(new Error(`Failed to parse optimization output: ${err}`))
      }
    })

    python.on('error', (err) => {
      reject(new Error(`Failed to run Python optimizer: ${err.message}`))
    })
  })
}

// ============================================================================
// Main Optimization Function
// ============================================================================

/**
 * Run projection optimization on cross-camera matches
 *
 * @param matches Cross-camera matches from matcher
 * @param sitemapPath Path to sitemap JSON file
 * @param config Optimization configuration
 * @returns Calibration output with optimized parameters
 */
export async function optimizeProjection(
  matches: CrossCameraMatch[],
  sitemapPath: string,
  config: Partial<OptimizationConfig> = {}
): Promise<{ calibration: CalibrationOutput; metrics: OptimizationResult }> {
  const cfg = { ...DEFAULT_CONFIG, ...config }

  if (matches.length === 0) {
    throw new Error('No matches provided for optimization')
  }

  // Convert matches to JSON-serializable format
  const serializableMatches = matches.map(m => ({
    timestamp: m.timestamp,
    detection1: {
      cameraId: m.detection1.cameraId,
      frameNumber: m.detection1.frameNumber,
      timestamp: m.detection1.timestamp,
      trackId: m.detection1.trackId,
      bbox: m.detection1.bbox,
      embedding: m.detection1.embedding,
      embeddingQuality: m.detection1.embeddingQuality,
      confidence: m.detection1.confidence,
    },
    detection2: {
      cameraId: m.detection2.cameraId,
      frameNumber: m.detection2.frameNumber,
      timestamp: m.detection2.timestamp,
      trackId: m.detection2.trackId,
      bbox: m.detection2.bbox,
      embedding: m.detection2.embedding,
      embeddingQuality: m.detection2.embeddingQuality,
      confidence: m.detection2.confidence,
    },
    similarity: m.similarity,
    personId: m.personId,
    isValidated: m.isValidated,
  }))

  // Create temp files for Python script
  const tempDir = resolve(__dirname, '../../../')
  const matchesPath = resolve(tempDir, `.matches-temp-${Date.now()}.json`)
  const outputPath = resolve(tempDir, `.calibration-temp-${Date.now()}.json`)

  try {
    // Write matches to temp file
    writeFileSync(matchesPath, JSON.stringify(serializableMatches, null, 2))

    // Run Python optimizer
    const calibration = await runPythonOptimizer(matchesPath, sitemapPath, outputPath, cfg)

    // Build metrics from calibration output
    const metrics: OptimizationResult = {
      cameraParams: new Map(),
      initialMeanError: calibration.metrics.initialMeanError,
      finalMeanError: calibration.metrics.finalMeanError,
      iterations: calibration.metrics.iterations,
      matchesUsed: calibration.metrics.matchesUsed,
      validatedMatches: calibration.metrics.validatedMatches,
    }

    // Extract camera params
    for (const cam of calibration.cameras) {
      metrics.cameraParams.set(cam.cameraId, {
        focalLength: cam.calibration_params.focal_length,
        azimuthOffset: cam.calibration_params.azimuth_offset,
        elevationOffset: cam.calibration_params.elevation_offset,
        principalPointXOffset: 0,
        principalPointYOffset: 0,
      })
    }

    return { calibration, metrics }
  } finally {
    // Clean up temp files
    try {
      if (existsSync(matchesPath)) unlinkSync(matchesPath)
      if (existsSync(outputPath)) unlinkSync(outputPath)
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Save calibration output to file
 */
export function saveCalibration(calibration: CalibrationOutput, outputPath: string): void {
  writeFileSync(outputPath, JSON.stringify(calibration, null, 2))
}
