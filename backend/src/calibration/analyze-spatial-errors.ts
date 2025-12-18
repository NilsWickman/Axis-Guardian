#!/usr/bin/env node
/**
 * Spatial Error Pattern Analyzer
 *
 * Analyzes the spatial distribution of projection errors to identify
 * what type of distortion model is needed. Looks for:
 * - Radial patterns (barrel/pincushion distortion)
 * - Directional bias (systematic shift)
 * - Region-specific errors (edge vs center)
 * - Asymmetric patterns (thin prism, tilted sensor)
 *
 * Usage:
 *   npx tsx src/calibration/analyze-spatial-errors.ts --ground-truth ../GroundTruths.json
 */

import { Command } from 'commander'
import { CameraRegistry } from '../detection/camera-registry.js'
import {
  loadGroundTruths,
  filterAnnotations,
  projectImageToWorld,
  type Vector3,
  type GroundTruthAnnotation,
} from './utils.js'

interface ErrorSample {
  // Image coordinates (pixels)
  imageX: number
  imageY: number
  // Normalized image coords (from center, -1 to 1)
  normX: number
  normY: number
  // Radial distance from center (normalized)
  radius: number
  // Angle from center
  angle: number
  // Ground truth world position
  gtX: number
  gtY: number
  // Projected world position
  projX: number
  projY: number
  // Error vector (projected - ground truth)
  errorX: number
  errorY: number
  // Error magnitude
  errorMag: number
}

interface SpatialAnalysis {
  cameraId: string
  samples: ErrorSample[]
  // Global stats
  meanError: number
  stdDevError: number
  // Radial analysis
  radialCorrelation: number // Correlation between radius and error
  radialBias: 'barrel' | 'pincushion' | 'none' | 'mixed'
  // Directional analysis
  meanErrorX: number
  meanErrorY: number
  directionalBias: { magnitude: number; direction: number }
  // Zone analysis (divide image into 9 zones)
  zoneErrors: Map<string, { mean: number; count: number }>
  // Asymmetry
  leftRightAsymmetry: number
  topBottomAsymmetry: number
}

function analyzeCamera(
  cameraId: string,
  annotations: Array<{
    annotation: GroundTruthAnnotation
    detection: GroundTruthAnnotation['linkedDetections'][0]
  }>,
  K: number[][],
  R: number[][],
  T: Vector3,
  center: [number, number]
): SpatialAnalysis {
  const samples: ErrorSample[] = []
  const imageWidth = 1920
  const imageHeight = 1080

  // Principal point (image center for normalization)
  const cx = center[0]
  const cy = center[1]

  for (const { annotation, detection } of annotations) {
    // Image coordinates
    const imageX = ((detection.bbox.left + detection.bbox.right) / 2) * imageWidth
    const imageY = detection.bbox.bottom * imageHeight

    // Normalized coordinates (-1 to 1)
    const normX = (imageX - cx) / (imageWidth / 2)
    const normY = (imageY - cy) / (imageHeight / 2)

    // Radial distance and angle
    const radius = Math.sqrt(normX * normX + normY * normY)
    const angle = Math.atan2(normY, normX)

    // Project to world
    const result = projectImageToWorld(imageX, imageY, K, R, T, center)
    if (!result.isValid) continue

    // Error vector
    const errorX = result.worldPoint.x - annotation.groundPosition.x
    const errorY = result.worldPoint.y - annotation.groundPosition.y
    const errorMag = Math.sqrt(errorX * errorX + errorY * errorY)

    samples.push({
      imageX,
      imageY,
      normX,
      normY,
      radius,
      angle,
      gtX: annotation.groundPosition.x,
      gtY: annotation.groundPosition.y,
      projX: result.worldPoint.x,
      projY: result.worldPoint.y,
      errorX,
      errorY,
      errorMag,
    })
  }

  // Compute stats
  const errors = samples.map((s) => s.errorMag)
  const meanError = errors.reduce((a, b) => a + b, 0) / errors.length
  const variance = errors.reduce((acc, e) => acc + (e - meanError) ** 2, 0) / errors.length
  const stdDevError = Math.sqrt(variance)

  // Directional bias
  const meanErrorX = samples.reduce((a, s) => a + s.errorX, 0) / samples.length
  const meanErrorY = samples.reduce((a, s) => a + s.errorY, 0) / samples.length
  const biasMag = Math.sqrt(meanErrorX ** 2 + meanErrorY ** 2)
  const biasDir = Math.atan2(meanErrorY, meanErrorX) * (180 / Math.PI)

  // Radial correlation
  const radii = samples.map((s) => s.radius)
  const meanRadius = radii.reduce((a, b) => a + b, 0) / radii.length
  let numerator = 0
  let denomRadius = 0
  let denomError = 0
  for (let i = 0; i < samples.length; i++) {
    const dr = radii[i] - meanRadius
    const de = errors[i] - meanError
    numerator += dr * de
    denomRadius += dr ** 2
    denomError += de ** 2
  }
  const radialCorrelation =
    denomRadius > 0 && denomError > 0 ? numerator / Math.sqrt(denomRadius * denomError) : 0

  // Radial bias type
  let radialBias: SpatialAnalysis['radialBias'] = 'none'
  if (Math.abs(radialCorrelation) > 0.3) {
    if (radialCorrelation > 0) {
      radialBias = 'barrel' // Error increases with radius (undercompensated)
    } else {
      radialBias = 'pincushion' // Error decreases with radius (overcompensated)
    }
  }

  // Zone analysis (3x3 grid)
  const zoneErrors = new Map<string, { mean: number; count: number; errors: number[] }>()
  for (const s of samples) {
    const zoneX = s.normX < -0.33 ? 'L' : s.normX > 0.33 ? 'R' : 'C'
    const zoneY = s.normY < -0.33 ? 'T' : s.normY > 0.33 ? 'B' : 'M'
    const zone = zoneY + zoneX
    if (!zoneErrors.has(zone)) {
      zoneErrors.set(zone, { mean: 0, count: 0, errors: [] })
    }
    const z = zoneErrors.get(zone)!
    z.errors.push(s.errorMag)
    z.count++
  }
  // Compute means
  for (const [zone, data] of zoneErrors) {
    data.mean = data.errors.reduce((a, b) => a + b, 0) / data.errors.length
  }

  // Asymmetry analysis
  const leftErrors = samples.filter((s) => s.normX < 0).map((s) => s.errorMag)
  const rightErrors = samples.filter((s) => s.normX > 0).map((s) => s.errorMag)
  const topErrors = samples.filter((s) => s.normY < 0).map((s) => s.errorMag)
  const bottomErrors = samples.filter((s) => s.normY > 0).map((s) => s.errorMag)

  const leftMean = leftErrors.length > 0 ? leftErrors.reduce((a, b) => a + b, 0) / leftErrors.length : 0
  const rightMean = rightErrors.length > 0 ? rightErrors.reduce((a, b) => a + b, 0) / rightErrors.length : 0
  const topMean = topErrors.length > 0 ? topErrors.reduce((a, b) => a + b, 0) / topErrors.length : 0
  const bottomMean =
    bottomErrors.length > 0 ? bottomErrors.reduce((a, b) => a + b, 0) / bottomErrors.length : 0

  const leftRightAsymmetry = Math.abs(leftMean - rightMean) / Math.max(leftMean, rightMean, 0.001)
  const topBottomAsymmetry = Math.abs(topMean - bottomMean) / Math.max(topMean, bottomMean, 0.001)

  return {
    cameraId,
    samples,
    meanError,
    stdDevError,
    radialCorrelation,
    radialBias,
    meanErrorX,
    meanErrorY,
    directionalBias: { magnitude: biasMag, direction: biasDir },
    zoneErrors: new Map([...zoneErrors].map(([k, v]) => [k, { mean: v.mean, count: v.count }])),
    leftRightAsymmetry,
    topBottomAsymmetry,
  }
}

function printAnalysis(analysis: SpatialAnalysis) {
  console.log(`\n=== ${analysis.cameraId.toUpperCase()} SPATIAL ERROR ANALYSIS ===\n`)

  console.log('--- Global Statistics ---')
  console.log(`  Samples: ${analysis.samples.length}`)
  console.log(`  Mean error: ${analysis.meanError.toFixed(3)}m`)
  console.log(`  StdDev: ${analysis.stdDevError.toFixed(3)}m`)

  console.log('\n--- Directional Bias ---')
  console.log(`  Mean error vector: (${analysis.meanErrorX.toFixed(3)}m, ${analysis.meanErrorY.toFixed(3)}m)`)
  console.log(
    `  Bias magnitude: ${analysis.directionalBias.magnitude.toFixed(3)}m at ${analysis.directionalBias.direction.toFixed(1)}°`
  )
  if (analysis.directionalBias.magnitude > 0.5) {
    console.log('  ⚠️  SIGNIFICANT DIRECTIONAL BIAS - suggests translation or orientation error')
  }

  console.log('\n--- Radial Pattern ---')
  console.log(`  Radial correlation: ${analysis.radialCorrelation.toFixed(3)}`)
  console.log(`  Pattern type: ${analysis.radialBias}`)
  if (analysis.radialBias !== 'none') {
    console.log('  ⚠️  RADIAL DISTORTION DETECTED - needs k1/k2/k3 coefficients')
  }

  console.log('\n--- Zone Analysis (error by image region) ---')
  const zones = ['TL', 'TC', 'TR', 'ML', 'MC', 'MR', 'BL', 'BC', 'BR']
  const zoneGrid: string[][] = [[], [], []]
  for (const zone of zones) {
    const data = analysis.zoneErrors.get(zone)
    const row = zone[0] === 'T' ? 0 : zone[0] === 'M' ? 1 : 2
    if (data) {
      zoneGrid[row].push(`${data.mean.toFixed(2)}m (${data.count})`)
    } else {
      zoneGrid[row].push('-')
    }
  }
  console.log('  +--------+--------+--------+')
  for (let i = 0; i < 3; i++) {
    console.log(`  | ${zoneGrid[i].join(' | ').padEnd(24)} |`)
    console.log('  +--------+--------+--------+')
  }

  console.log('\n--- Asymmetry Analysis ---')
  console.log(`  Left/Right asymmetry: ${(analysis.leftRightAsymmetry * 100).toFixed(1)}%`)
  console.log(`  Top/Bottom asymmetry: ${(analysis.topBottomAsymmetry * 100).toFixed(1)}%`)
  if (analysis.leftRightAsymmetry > 0.2 || analysis.topBottomAsymmetry > 0.2) {
    console.log('  ⚠️  SIGNIFICANT ASYMMETRY - suggests thin prism distortion (s1-s4)')
  }

  console.log('\n--- Recommendations ---')
  const recs: string[] = []
  if (analysis.directionalBias.magnitude > 0.5) {
    recs.push('- Re-optimize camera translation (T) and rotation (R)')
  }
  if (analysis.radialBias !== 'none') {
    recs.push('- Add higher-order radial distortion (k4, k5, k6)')
  }
  if (analysis.leftRightAsymmetry > 0.2 || analysis.topBottomAsymmetry > 0.2) {
    recs.push('- Add thin prism distortion model (s1, s2, s3, s4)')
  }
  if (analysis.stdDevError > analysis.meanError) {
    recs.push('- High variance suggests systematic non-linear distortion')
  }
  if (recs.length === 0) {
    recs.push('- Current model appears adequate')
  }
  for (const rec of recs) {
    console.log(`  ${rec}`)
  }
}

function printErrorDistribution(samples: ErrorSample[]) {
  console.log('\n--- Error Distribution by Radius ---')
  const bins = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5]
  console.log('  Radius | Samples | Mean Error')
  console.log('  -------|---------|----------')
  let prevBin = 0
  for (const bin of bins) {
    const inBin = samples.filter((s) => s.radius >= prevBin && s.radius < bin)
    if (inBin.length > 0) {
      const mean = inBin.reduce((a, s) => a + s.errorMag, 0) / inBin.length
      console.log(`  ${prevBin.toFixed(2)}-${bin.toFixed(2)} | ${inBin.length.toString().padStart(7)} | ${mean.toFixed(3)}m`)
    }
    prevBin = bin
  }
}

async function main() {
  const program = new Command()
    .name('analyze-spatial-errors')
    .description('Analyze spatial distribution of projection errors')
    .requiredOption('-g, --ground-truth <file>', 'Path to GroundTruths.json')
    .option('-c, --camera <id>', 'Analyze specific camera only')
    .option('--csv <file>', 'Export samples to CSV')
    .parse(process.argv)

  const opts = program.opts()

  console.log('=== Spatial Error Pattern Analyzer ===\n')

  const groundTruths = await loadGroundTruths(opts.groundTruth)
  console.log(`Loaded ${groundTruths.annotations.length} annotations\n`)

  const registry = new CameraRegistry()
  const cameraIds = opts.camera ? [opts.camera] : ['camera1', 'camera2']

  const allSamples: ErrorSample[] = []

  for (const camId of cameraIds) {
    const cal = registry.getCalibration(camId)
    if (!cal) {
      console.log(`Camera ${camId} not found`)
      continue
    }

    const annotations = filterAnnotations(groundTruths.annotations, camId, ['certain'])
    console.log(`${camId}: ${annotations.length} annotations`)

    const analysis = analyzeCamera(
      camId,
      annotations,
      cal.K,
      cal.R,
      [cal.T[0], cal.T[1], cal.T[2]],
      cal.center as [number, number]
    )

    printAnalysis(analysis)
    printErrorDistribution(analysis.samples)

    allSamples.push(...analysis.samples.map((s) => ({ ...s, cameraId: camId } as ErrorSample)))
  }

  // Export to CSV if requested
  if (opts.csv) {
    const fs = await import('fs')
    const headers = 'cameraId,imageX,imageY,normX,normY,radius,angle,gtX,gtY,projX,projY,errorX,errorY,errorMag\n'
    const rows = allSamples.map(
      (s) =>
        `${(s as ErrorSample & { cameraId: string }).cameraId || 'unknown'},${s.imageX.toFixed(1)},${s.imageY.toFixed(1)},${s.normX.toFixed(4)},${s.normY.toFixed(4)},${s.radius.toFixed(4)},${s.angle.toFixed(4)},${s.gtX.toFixed(4)},${s.gtY.toFixed(4)},${s.projX.toFixed(4)},${s.projY.toFixed(4)},${s.errorX.toFixed(4)},${s.errorY.toFixed(4)},${s.errorMag.toFixed(4)}`
    )
    fs.writeFileSync(opts.csv, headers + rows.join('\n'))
    console.log(`\nExported ${allSamples.length} samples to ${opts.csv}`)
  }
}

main().catch(console.error)
