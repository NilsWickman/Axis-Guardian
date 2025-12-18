/**
 * Optimize polynomial coefficients using EXACT same projection as pipeline
 * Uses projectWithKRT directly (without worldTransform) to get dataset coords,
 * then fits polynomial to map dataset coords -> ground truth
 */
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { CameraRegistry } from "../src/detection/camera-registry.js";
import { loadSiteMapConfig } from "../src/config/sitemap-loader.js";
import { getBBoxBottomCenter, projectWithKRT } from "../src/projection/ground-plane.js";
import { undistortPoint } from "../src/projection/lens-distortion.js";
import type { CameraCalibration, Point2D } from "../src/types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface LinkedDetection {
  cameraId: string;
  frameNumber: number;
  trackId: number;
  bbox: { left: number; top: number; right: number; bottom: number };
}

interface Annotation {
  groundPosition: { x: number; y: number };
  confidence: string;
  linkedDetections: LinkedDetection[];
}

// Load data
const groundTruthPath = join(__dirname, "../../GroundTruths.json");
const groundTruth = JSON.parse(readFileSync(groundTruthPath, "utf-8"));

const sitemapPath = join(__dirname, "../../shared/config/sitemap-rectangular-room.json");
const sitemapConfig = loadSiteMapConfig(sitemapPath);

const cameraRegistry = new CameraRegistry();
cameraRegistry.loadFromSiteMapConfig(sitemapConfig.cameras as any);

// Get calibrations without worldTransform to get raw dataset coords
function getCalibrationWithoutTransform(cameraId: string): CameraCalibration | null {
  const calib = cameraRegistry.getCalibration(cameraId);
  if (!calib) return null;

  // Return calibration without worldTransform
  return {
    K: calib.K,
    R: calib.R,
    T: calib.T,
    center: calib.center,
    scale: calib.scale,
    distortion: calib.distortion,
    // No worldTransform - we want raw dataset coords
  };
}

// Collect training data per camera
interface DataPoint {
  datasetX: number;  // Raw K/R/T output (dataset coords)
  datasetY: number;
  groundX: number;   // Ground truth (sitemap coords)
  groundY: number;
}

const camera1Data: DataPoint[] = [];
const camera2Data: DataPoint[] = [];

for (const ann of groundTruth.annotations as Annotation[]) {
  if (ann.confidence !== "certain") continue;

  for (const det of ann.linkedDetections) {
    const calibRaw = getCalibrationWithoutTransform(det.cameraId);
    if (!calibRaw) continue;

    const bbox = {
      x: det.bbox.left,
      y: det.bbox.top,
      width: det.bbox.right - det.bbox.left,
      height: det.bbox.bottom - det.bbox.top,
    };

    // Get feet position with seated extension (matching pipeline)
    const feetPos = getBBoxBottomCenter(bbox, null, [], true, 1920, 1080, true);
    let footX = feetPos.x;
    let footY = feetPos.y;

    // Apply distortion correction if available
    if (calibRaw.distortion) {
      const fx = calibRaw.K[0][0];
      const fy = calibRaw.K[1][1];
      const cx = calibRaw.center[0];
      const cy = calibRaw.center[1];
      const corrected = undistortPoint(footX, footY, fx, fy, cx, cy, calibRaw.distortion);
      footX = corrected.x;
      footY = corrected.y;
    }

    // Project to get raw dataset coords
    const result = projectWithKRT(footX, footY, calibRaw);
    if (!result.isValid) continue;

    const point: DataPoint = {
      datasetX: result.worldPoint.x,
      datasetY: result.worldPoint.y,
      groundX: ann.groundPosition.x,
      groundY: ann.groundPosition.y,
    };

    if (det.cameraId === "camera1") {
      camera1Data.push(point);
    } else {
      camera2Data.push(point);
    }
  }
}

console.log(`Camera1 data points: ${camera1Data.length}`);
console.log(`Camera2 data points: ${camera2Data.length}`);

// Show data ranges
function showDataRange(data: DataPoint[], name: string) {
  const minDX = Math.min(...data.map(d => d.datasetX));
  const maxDX = Math.max(...data.map(d => d.datasetX));
  const minDY = Math.min(...data.map(d => d.datasetY));
  const maxDY = Math.max(...data.map(d => d.datasetY));
  const minGX = Math.min(...data.map(d => d.groundX));
  const maxGX = Math.max(...data.map(d => d.groundX));
  const minGY = Math.min(...data.map(d => d.groundY));
  const maxGY = Math.max(...data.map(d => d.groundY));

  console.log(`\n${name} data ranges:`);
  console.log(`  Dataset X: ${minDX.toFixed(2)} to ${maxDX.toFixed(2)}`);
  console.log(`  Dataset Y: ${minDY.toFixed(2)} to ${maxDY.toFixed(2)}`);
  console.log(`  Ground X: ${minGX.toFixed(2)} to ${maxGX.toFixed(2)}`);
  console.log(`  Ground Y: ${minGY.toFixed(2)} to ${maxGY.toFixed(2)}`);
}

showDataRange(camera1Data, "Camera1");
showDataRange(camera2Data, "Camera2");

// Generate polynomial terms up to given degree
function generateTerms(x: number, y: number, degree: number): number[] {
  const terms: number[] = [1, x, y, x*x, y*y, x*y];

  if (degree >= 3) {
    terms.push(x*x*x, y*y*y, x*x*y, x*y*y);
  }

  if (degree >= 4) {
    terms.push(x*x*x*x, y*y*y*y, x*x*x*y, x*y*y*y, x*x*y*y);
  }

  return terms;
}

// Weighted least squares with regularization
function weightedLeastSquares(A: number[][], b: number[], weights: number[], lambda: number = 1e-6): number[] {
  const m = A.length;
  const n = A[0].length;

  // A^T * W * A
  const AtWA: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));
  // A^T * W * b
  const AtWb: number[] = Array(n).fill(0);

  for (let i = 0; i < m; i++) {
    const w = weights[i];
    for (let j = 0; j < n; j++) {
      AtWb[j] += w * A[i][j] * b[i];
      for (let k = 0; k < n; k++) {
        AtWA[j][k] += w * A[i][j] * A[i][k];
      }
    }
  }

  // Regularization
  for (let i = 0; i < n; i++) {
    AtWA[i][i] += lambda;
  }

  return solveLinear(AtWA, AtWb);
}

function solveLinear(A: number[][], b: number[]): number[] {
  const n = A.length;
  const augmented = A.map((row, i) => [...row, b[i]]);

  // Gaussian elimination with partial pivoting
  for (let col = 0; col < n; col++) {
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(augmented[row][col]) > Math.abs(augmented[maxRow][col])) {
        maxRow = row;
      }
    }
    [augmented[col], augmented[maxRow]] = [augmented[maxRow], augmented[col]];

    for (let row = col + 1; row < n; row++) {
      const factor = augmented[row][col] / augmented[col][col];
      for (let j = col; j <= n; j++) {
        augmented[row][j] -= factor * augmented[col][j];
      }
    }
  }

  // Back substitution
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    x[i] = augmented[i][n];
    for (let j = i + 1; j < n; j++) {
      x[i] -= augmented[i][j] * x[j];
    }
    x[i] /= augmented[i][i];
  }

  return x;
}

// IRLS fitting with Huber weighting
function fitPolynomialIRLS(
  data: DataPoint[],
  degree: number,
  iterations: number = 25,
  threshold: number = 0.5
): { coeffsX: number[]; coeffsY: number[] } {
  const n = data.length;
  const numTerms = generateTerms(0, 0, degree).length;

  // Build design matrix
  const A: number[][] = [];
  const bX: number[] = [];
  const bY: number[] = [];

  for (const point of data) {
    const terms = generateTerms(point.datasetX, point.datasetY, degree);
    A.push(terms);
    bX.push(point.groundX);
    bY.push(point.groundY);
  }

  // Initialize weights
  let weightsX = new Array(n).fill(1);
  let weightsY = new Array(n).fill(1);

  let coeffsX: number[] = [];
  let coeffsY: number[] = [];

  for (let iter = 0; iter < iterations; iter++) {
    coeffsX = weightedLeastSquares(A, bX, weightsX);
    coeffsY = weightedLeastSquares(A, bY, weightsY);

    // Compute residuals and update weights (Huber)
    for (let i = 0; i < n; i++) {
      let predX = 0, predY = 0;
      for (let j = 0; j < numTerms; j++) {
        predX += coeffsX[j] * A[i][j];
        predY += coeffsY[j] * A[i][j];
      }
      const resX = Math.abs(bX[i] - predX);
      const resY = Math.abs(bY[i] - predY);

      weightsX[i] = resX <= threshold ? 1 : threshold / resX;
      weightsY[i] = resY <= threshold ? 1 : threshold / resY;
    }
  }

  return { coeffsX, coeffsY };
}

// Test accuracy using same method as verify-test-accuracy.ts
function testAccuracy(
  data: DataPoint[],
  coeffsX: number[],
  coeffsY: number[],
  degree: number
): { accuracy: number; avgError: number; errors: number[] } {
  const errors: number[] = [];

  for (const point of data) {
    const terms = generateTerms(point.datasetX, point.datasetY, degree);

    let predX = 0, predY = 0;
    for (let i = 0; i < coeffsX.length; i++) {
      predX += coeffsX[i] * terms[i];
      predY += coeffsY[i] * terms[i];
    }

    const error = Math.sqrt(Math.pow(predX - point.groundX, 2) + Math.pow(predY - point.groundY, 2));
    errors.push(error);
  }

  const passed = errors.filter(e => e < 0.5).length;
  const avgError = errors.reduce((a, b) => a + b, 0) / errors.length;

  return {
    accuracy: (passed / errors.length) * 100,
    avgError,
    errors,
  };
}

// Test different degrees
console.log(`\n=== Testing Different Polynomial Degrees ===`);

for (const degree of [2, 3, 4]) {
  console.log(`\n--- Degree ${degree} ---`);

  const cam1Result = fitPolynomialIRLS(camera1Data, degree, 30, 0.5);
  const cam2Result = fitPolynomialIRLS(camera2Data, degree, 30, 0.5);

  const cam1Acc = testAccuracy(camera1Data, cam1Result.coeffsX, cam1Result.coeffsY, degree);
  const cam2Acc = testAccuracy(camera2Data, cam2Result.coeffsX, cam2Result.coeffsY, degree);

  console.log(`Camera1: ${cam1Acc.accuracy.toFixed(1)}% accuracy, ${cam1Acc.avgError.toFixed(3)}m avg error`);
  console.log(`Camera2: ${cam2Acc.accuracy.toFixed(1)}% accuracy, ${cam2Acc.avgError.toFixed(3)}m avg error`);

  // Combined
  const totalPassed = Math.round(cam1Acc.accuracy * camera1Data.length / 100) +
                      Math.round(cam2Acc.accuracy * camera2Data.length / 100);
  const combined = (totalPassed / (camera1Data.length + camera2Data.length)) * 100;
  console.log(`Combined: ${combined.toFixed(1)}% accuracy`);
}

// Find best threshold for degree 4
console.log(`\n=== Finding Best Threshold for Degree 4 ===`);

let bestThreshold = 0.5;
let bestCombined = 0;

for (const threshold of [0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 1.0]) {
  const cam1Result = fitPolynomialIRLS(camera1Data, 4, 30, threshold);
  const cam2Result = fitPolynomialIRLS(camera2Data, 4, 30, threshold);

  const cam1Acc = testAccuracy(camera1Data, cam1Result.coeffsX, cam1Result.coeffsY, 4);
  const cam2Acc = testAccuracy(camera2Data, cam2Result.coeffsX, cam2Result.coeffsY, 4);

  const totalPassed = Math.round(cam1Acc.accuracy * camera1Data.length / 100) +
                      Math.round(cam2Acc.accuracy * camera2Data.length / 100);
  const combined = (totalPassed / (camera1Data.length + camera2Data.length)) * 100;
  const avgError = (cam1Acc.avgError * camera1Data.length + cam2Acc.avgError * camera2Data.length) /
                   (camera1Data.length + camera2Data.length);

  console.log(`Threshold ${threshold}: ${combined.toFixed(1)}% accuracy, ${avgError.toFixed(3)}m avg error`);

  if (combined > bestCombined) {
    bestCombined = combined;
    bestThreshold = threshold;
  }
}

// Output best coefficients
console.log(`\n=== Best Coefficients (Degree 4, Threshold ${bestThreshold}) ===`);

const cam1Best = fitPolynomialIRLS(camera1Data, 4, 30, bestThreshold);
const cam2Best = fitPolynomialIRLS(camera2Data, 4, 30, bestThreshold);

console.log(`\nCamera1 (CAMERA1_WORLD_TRANSFORM):`);
console.log(`  polynomial: {`);
console.log(`    degree: 4 as const,`);
console.log(`    coeffsX: [${cam1Best.coeffsX.map(c => c.toFixed(8)).join(", ")}],`);
console.log(`    coeffsY: [${cam1Best.coeffsY.map(c => c.toFixed(8)).join(", ")}],`);
console.log(`  },`);

console.log(`\nCamera2 (CAMERA2_WORLD_TRANSFORM):`);
console.log(`  polynomial: {`);
console.log(`    degree: 4 as const,`);
console.log(`    coeffsX: [${cam2Best.coeffsX.map(c => c.toFixed(8)).join(", ")}],`);
console.log(`    coeffsY: [${cam2Best.coeffsY.map(c => c.toFixed(8)).join(", ")}],`);
console.log(`  },`);

// Final accuracy
const cam1FinalAcc = testAccuracy(camera1Data, cam1Best.coeffsX, cam1Best.coeffsY, 4);
const cam2FinalAcc = testAccuracy(camera2Data, cam2Best.coeffsX, cam2Best.coeffsY, 4);
console.log(`\nFinal Camera1: ${cam1FinalAcc.accuracy.toFixed(1)}% accuracy, ${cam1FinalAcc.avgError.toFixed(3)}m avg error`);
console.log(`Final Camera2: ${cam2FinalAcc.accuracy.toFixed(1)}% accuracy, ${cam2FinalAcc.avgError.toFixed(3)}m avg error`);

// Show error breakdown
console.log(`\n=== Error Breakdown ===`);
const allErrors = [...cam1FinalAcc.errors, ...cam2FinalAcc.errors];
allErrors.sort((a, b) => a - b);

const percentiles = [50, 75, 90, 95, 99];
for (const p of percentiles) {
  const idx = Math.floor(allErrors.length * p / 100);
  console.log(`  ${p}th percentile: ${allErrors[idx].toFixed(3)}m`);
}

// Show outliers
console.log(`\n=== Largest Errors ===`);
const sortedErrors = allErrors.slice().sort((a, b) => b - a);
for (let i = 0; i < Math.min(10, sortedErrors.length); i++) {
  console.log(`  ${i + 1}. ${sortedErrors[i].toFixed(3)}m`);
}
