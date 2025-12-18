/**
 * Try degree 5 polynomial to capture more complex distortions
 */
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { CameraRegistry } from '../src/detection/camera-registry.js'
import { loadSiteMapConfig, siteMapCameraToCameraParams } from '../src/config/sitemap-loader.js'
import { getBBoxBottomCenter } from '../src/projection/ground-plane.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

interface LinkedDetection {
  cameraId: string
  bbox: { left: number; top: number; right: number; bottom: number }
}

interface Annotation {
  id: string
  groundPosition: { x: number; y: number }
  confidence: string
  linkedDetections: LinkedDetection[]
}

interface Point2D {
  x: number
  y: number
}

function distance(p1: Point2D, p2: Point2D): number {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2))
}

function buildFeatures(x: number, y: number, degree: number): number[] {
  const features = [1, x, y, x*x, y*y, x*y]
  if (degree >= 3) features.push(x*x*x, y*y*y, x*x*y, x*y*y)
  if (degree >= 4) features.push(x*x*x*x, y*y*y*y, x*x*x*y, x*y*y*y, x*x*y*y)
  if (degree >= 5) features.push(
    x*x*x*x*x, y*y*y*y*y,  // x^5, y^5
    x*x*x*x*y, x*y*y*y*y,  // x^4*y, x*y^4
    x*x*x*y*y, x*x*y*y*y   // x^3*y^2, x^2*y^3
  )
  return features
}

function applyPolynomial(x: number, y: number, coeffsX: number[], coeffsY: number[], degree: number): Point2D {
  const features = buildFeatures(x, y, degree)
  let px = 0, py = 0
  for (let i = 0; i < features.length && i < coeffsX.length; i++) {
    px += coeffsX[i] * features[i]
    py += coeffsY[i] * features[i]
  }
  return { x: px, y: py }
}

function getRawKRT(feetX: number, feetY: number, calibration: any): Point2D {
  const { K, R, T, center, scale } = calibration
  const x = feetX * scale
  const y = feetY * scale

  const KR: number[][] = [[0,0,0],[0,0,0],[0,0,0]]
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      for (let k = 0; k < 3; k++) {
        KR[i][j] += K[i][k] * R[k][j]
      }
    }
  }

  const A = [
    [KR[0][0], KR[0][1], center[0] - x],
    [KR[1][0], KR[1][1], center[1] - y],
    [KR[2][0], KR[2][1], -1],
  ]

  const KRTvec = [
    KR[0][0] * T[0] + KR[0][1] * T[1] + KR[0][2] * T[2],
    KR[1][0] * T[0] + KR[1][1] * T[1] + KR[1][2] * T[2],
    KR[2][0] * T[0] + KR[2][1] * T[1] + KR[2][2] * T[2],
  ]

  const det3x3 = (m: number[][]) =>
    m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
    m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
    m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0])

  const detA = det3x3(A)
  if (Math.abs(detA) < 1e-10) return { x: 0, y: 0 }

  const Ax = A.map((row, ri) => row.map((val, ci) => ci === 0 ? KRTvec[ri] : val))
  const Ay = A.map((row, ri) => row.map((val, ci) => ci === 1 ? KRTvec[ri] : val))

  return { x: det3x3(Ax) / detA, y: det3x3(Ay) / detA }
}

function fitPolynomialRobust(
  data: Array<{ rawX: number; rawY: number; targetX: number; targetY: number }>,
  degree: number,
  iterations: number = 30,
  threshold: number = 0.5,
  lambda: number = 1e-5
): { coeffsX: number[]; coeffsY: number[] } {
  const nFeatures = degree === 2 ? 6 : degree === 3 ? 10 : degree === 4 ? 15 : 21
  const n = data.length

  let weights = data.map(() => 1.0)
  let coeffsX: number[] = []
  let coeffsY: number[] = []

  for (let iter = 0; iter < iterations; iter++) {
    // Build weighted design matrix
    const X: number[][] = []
    const targetsX: number[] = []
    const targetsY: number[] = []

    for (let i = 0; i < n; i++) {
      const d = data[i]
      const w = Math.sqrt(weights[i])
      const features = buildFeatures(d.rawX, d.rawY, degree).map(f => f * w)
      X.push(features)
      targetsX.push(d.targetX * w)
      targetsY.push(d.targetY * w)
    }

    // X'X with regularization
    const XtX: number[][] = Array(nFeatures).fill(0).map(() => Array(nFeatures).fill(0))
    for (let i = 0; i < nFeatures; i++) {
      for (let j = 0; j < nFeatures; j++) {
        for (let k = 0; k < n; k++) {
          XtX[i][j] += X[k][i] * X[k][j]
        }
      }
      XtX[i][i] += lambda
    }

    // X'y
    const XtyX: number[] = Array(nFeatures).fill(0)
    const XtyY: number[] = Array(nFeatures).fill(0)
    for (let i = 0; i < nFeatures; i++) {
      for (let k = 0; k < n; k++) {
        XtyX[i] += X[k][i] * targetsX[k]
        XtyY[i] += X[k][i] * targetsY[k]
      }
    }

    // Solve using Gaussian elimination
    function solve(A: number[][], b: number[]): number[] {
      const n = A.length
      const aug = A.map((row, i) => [...row, b[i]])

      for (let col = 0; col < n; col++) {
        let maxRow = col
        for (let row = col + 1; row < n; row++) {
          if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) {
            maxRow = row
          }
        }
        [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]]

        if (Math.abs(aug[col][col]) < 1e-12) continue

        for (let row = col + 1; row < n; row++) {
          const factor = aug[row][col] / aug[col][col]
          for (let j = col; j <= n; j++) {
            aug[row][j] -= factor * aug[col][j]
          }
        }
      }

      const x = Array(n).fill(0)
      for (let i = n - 1; i >= 0; i--) {
        x[i] = aug[i][n]
        for (let j = i + 1; j < n; j++) {
          x[i] -= aug[i][j] * x[j]
        }
        if (Math.abs(aug[i][i]) > 1e-12) {
          x[i] /= aug[i][i]
        }
      }
      return x
    }

    coeffsX = solve(XtX.map(row => [...row]), [...XtyX])
    coeffsY = solve(XtX.map(row => [...row]), [...XtyY])

    // Update weights using Huber
    const residuals: number[] = []
    for (const d of data) {
      const pred = applyPolynomial(d.rawX, d.rawY, coeffsX, coeffsY, degree)
      const err = distance(pred, { x: d.targetX, y: d.targetY })
      residuals.push(err)
    }

    for (let i = 0; i < n; i++) {
      const r = residuals[i]
      if (r < threshold) {
        weights[i] = 1.0
      } else if (r < threshold * 2) {
        weights[i] = threshold / r
      } else {
        weights[i] = threshold / (r * r)
      }
    }
  }

  return { coeffsX, coeffsY }
}

async function main() {
  const groundTruthPath = join(__dirname, '../../GroundTruths.json')
  const content = readFileSync(groundTruthPath, 'utf-8')
  const groundTruth = JSON.parse(content)

  const sitemapPath = join(__dirname, '../../shared/config/sitemap-rectangular-room.json')
  const sitemapConfig = loadSiteMapConfig(sitemapPath)

  const cameraRegistry = new CameraRegistry()
  cameraRegistry.loadFromSiteMapConfig(sitemapConfig.cameras as any)

  const cam1Config = sitemapConfig.cameras.find((c: any) => c.id === 'camera1')
  const cam2Config = sitemapConfig.cameras.find((c: any) => c.id === 'camera2')
  const cam1Params = cam1Config ? siteMapCameraToCameraParams(cam1Config as any) : null
  const cam2Params = cam2Config ? siteMapCameraToCameraParams(cam2Config as any) : null

  const certainAnnotations = groundTruth.annotations.filter((a: Annotation) => a.confidence === 'certain')

  // Prepare data
  const cam1Data: Array<{ rawX: number; rawY: number; targetX: number; targetY: number }> = []
  const cam2Data: Array<{ rawX: number; rawY: number; targetX: number; targetY: number }> = []

  for (const ann of certainAnnotations) {
    for (const det of ann.linkedDetections) {
      const bbox = {
        x: det.bbox.left,
        y: det.bbox.top,
        width: det.bbox.right - det.bbox.left,
        height: det.bbox.bottom - det.bbox.top,
      }

      const camera = det.cameraId === 'camera1' ? cam1Params : cam2Params
      const feetPos = getBBoxBottomCenter(bbox, camera, [], true, 1920, 1080, true)

      const calibration = cameraRegistry.getCalibration(det.cameraId)
      if (!calibration) continue

      const rawKRT = getRawKRT(feetPos.x, feetPos.y, calibration)

      const data = {
        rawX: rawKRT.x,
        rawY: rawKRT.y,
        targetX: ann.groundPosition.x,
        targetY: ann.groundPosition.y,
      }

      if (det.cameraId === 'camera1') cam1Data.push(data)
      else if (det.cameraId === 'camera2') cam2Data.push(data)
    }
  }

  console.log(`Camera1 data points: ${cam1Data.length}`)
  console.log(`Camera2 data points: ${cam2Data.length}`)
  console.log()

  // Test different degrees and regularization
  const configs = [
    { degree: 4, lambda: 1e-5, name: 'Degree 4, lambda=1e-5' },
    { degree: 4, lambda: 1e-4, name: 'Degree 4, lambda=1e-4' },
    { degree: 5, lambda: 1e-4, name: 'Degree 5, lambda=1e-4' },
    { degree: 5, lambda: 1e-3, name: 'Degree 5, lambda=1e-3' },
    { degree: 5, lambda: 1e-2, name: 'Degree 5, lambda=1e-2' },
  ]

  let bestResult: any = null
  let bestAccuracy = 0

  for (const config of configs) {
    console.log(`=== Testing: ${config.name} ===`)

    const cam1Result = fitPolynomialRobust(cam1Data, config.degree, 30, 0.5, config.lambda)
    const cam2Result = fitPolynomialRobust(cam2Data, config.degree, 30, 0.5, config.lambda)

    // Evaluate
    let passed = 0
    let total = 0
    let totalError = 0
    let converged = 0
    let multiCameraCount = 0

    for (const ann of certainAnnotations) {
      const projections: Point2D[] = []

      for (const det of ann.linkedDetections) {
        const bbox = {
          x: det.bbox.left,
          y: det.bbox.top,
          width: det.bbox.right - det.bbox.left,
          height: det.bbox.bottom - det.bbox.top,
        }

        const camera = det.cameraId === 'camera1' ? cam1Params : cam2Params
        const feetPos = getBBoxBottomCenter(bbox, camera, [], true, 1920, 1080, true)

        const calibration = cameraRegistry.getCalibration(det.cameraId)
        if (!calibration) continue

        const rawKRT = getRawKRT(feetPos.x, feetPos.y, calibration)

        const coeffs = det.cameraId === 'camera1' ? cam1Result : cam2Result
        const transformed = applyPolynomial(rawKRT.x, rawKRT.y, coeffs.coeffsX, coeffs.coeffsY, config.degree)

        projections.push(transformed)
      }

      if (projections.length === 0) continue

      let finalPosition: Point2D
      if (projections.length === 1) {
        finalPosition = projections[0]
      } else {
        finalPosition = {
          x: projections.reduce((s, p) => s + p.x, 0) / projections.length,
          y: projections.reduce((s, p) => s + p.y, 0) / projections.length,
        }

        let maxDist = 0
        for (let i = 0; i < projections.length; i++) {
          for (let j = i + 1; j < projections.length; j++) {
            maxDist = Math.max(maxDist, distance(projections[i], projections[j]))
          }
        }
        if (maxDist <= 0.6) converged++
        multiCameraCount++
      }

      const error = distance(finalPosition, ann.groundPosition)
      totalError += error
      total++

      if (error < 0.5) passed++
    }

    const accuracy = passed / total
    const avgError = totalError / total
    const convergenceRate = multiCameraCount > 0 ? converged / multiCameraCount : 0

    console.log(`  Accuracy: ${(accuracy * 100).toFixed(1)}% (${passed}/${total})`)
    console.log(`  Avg Error: ${avgError.toFixed(3)}m`)
    console.log(`  Convergence: ${(convergenceRate * 100).toFixed(1)}%`)
    console.log()

    if (accuracy > bestAccuracy) {
      bestAccuracy = accuracy
      bestResult = {
        config,
        cam1: cam1Result,
        cam2: cam2Result,
        accuracy,
        avgError,
        convergenceRate,
      }
    }
  }

  if (bestResult) {
    console.log(`\n=== BEST RESULT: ${bestResult.config.name} ===`)
    console.log(`Accuracy: ${(bestResult.accuracy * 100).toFixed(1)}%`)
    console.log(`Average Error: ${bestResult.avgError.toFixed(3)}m`)
    console.log(`Convergence: ${(bestResult.convergenceRate * 100).toFixed(1)}%`)

    if (bestResult.accuracy > 0.72) {
      const formatCoeffs = (coeffs: number[]) => coeffs.map(c => c.toFixed(8)).join(', ')
      console.log('\n=== CODE SNIPPET ===\n')
      console.log(`// Degree ${bestResult.config.degree} polynomial`)
      console.log(`CAMERA1_coeffsX: [${formatCoeffs(bestResult.cam1.coeffsX)}]`)
      console.log(`CAMERA1_coeffsY: [${formatCoeffs(bestResult.cam1.coeffsY)}]`)
      console.log(`CAMERA2_coeffsX: [${formatCoeffs(bestResult.cam2.coeffsX)}]`)
      console.log(`CAMERA2_coeffsY: [${formatCoeffs(bestResult.cam2.coeffsY)}]`)
    }
  }
}

main().catch(console.error)
