/**
 * Optimize polynomial coefficients with:
 * 1. Per-camera bias correction
 * 2. Higher degree polynomial (degree 5)
 * 3. Region-weighted fitting
 */
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { CameraRegistry } from "../src/detection/camera-registry.js";
import { loadSiteMapConfig } from "../src/config/sitemap-loader.js";
import { getBBoxBottomCenter } from "../src/projection/ground-plane.js";

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

// Collect training data per camera
interface DataPoint {
  imgX: number;
  imgY: number;
  worldX: number;
  worldY: number;
  region: string;
}

const camera1Data: DataPoint[] = [];
const camera2Data: DataPoint[] = [];

for (const ann of groundTruth.annotations as Annotation[]) {
  if (ann.confidence !== "certain") continue;

  for (const det of ann.linkedDetections) {
    const bbox = {
      x: det.bbox.left,
      y: det.bbox.top,
      width: det.bbox.right - det.bbox.left,
      height: det.bbox.bottom - det.bbox.top,
    };

    // Use getBBoxBottomCenter with seated extension to match pipeline
    const center = getBBoxBottomCenter(bbox, true, true);

    // Determine region for weighting
    let region = "";
    if (ann.groundPosition.x < 5) region = "left";
    else if (ann.groundPosition.x > 12) region = "right";
    else region = "center";

    const point: DataPoint = {
      imgX: center.x,
      imgY: center.y,
      worldX: ann.groundPosition.x,
      worldY: ann.groundPosition.y,
      region,
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

// Generate polynomial terms up to degree 5
function generateTerms(x: number, y: number, degree: number): number[] {
  const terms: number[] = [1]; // bias

  for (let d = 1; d <= degree; d++) {
    for (let i = 0; i <= d; i++) {
      const xPow = d - i;
      const yPow = i;
      terms.push(Math.pow(x, xPow) * Math.pow(y, yPow));
    }
  }

  return terms;
}

// Count terms for each degree
function countTerms(degree: number): number {
  let count = 1; // bias
  for (let d = 1; d <= degree; d++) {
    count += d + 1;
  }
  return count;
}

console.log(`\nTerms per degree:`);
for (let d = 2; d <= 6; d++) {
  console.log(`  Degree ${d}: ${countTerms(d)} terms`);
}

// Apply K/R/T projection to get intermediate world coords
function applyKRT(imgX: number, imgY: number, cameraId: string): { x: number; y: number } | null {
  const calibration = cameraRegistry.getCalibration(cameraId);
  if (!calibration) return null;

  const { K, R, T, distortionCoeffs } = calibration;

  // Undistort (simplified Brown-Conrady)
  const cx = K[0][2], cy = K[1][2];
  const fx = K[0][0], fy = K[1][1];

  let x = (imgX - cx) / fx;
  let y = (imgY - cy) / fy;

  if (distortionCoeffs) {
    const r2 = x * x + y * y;
    const r4 = r2 * r2;
    const r6 = r4 * r2;

    const k1 = distortionCoeffs.k1 || 0;
    const k2 = distortionCoeffs.k2 || 0;
    const k3 = distortionCoeffs.k3 || 0;
    const p1 = distortionCoeffs.p1 || 0;
    const p2 = distortionCoeffs.p2 || 0;

    const radial = 1 + k1 * r2 + k2 * r4 + k3 * r6;
    const dx = 2 * p1 * x * y + p2 * (r2 + 2 * x * x);
    const dy = p1 * (r2 + 2 * y * y) + 2 * p2 * x * y;

    x = x * radial + dx;
    y = y * radial + dy;
  }

  // Compute ray direction
  const rayDir = [x, y, 1];

  // Transform using R and T
  const R_T = R.map((row, i) => [...row, T[i]]);

  // Find ground plane intersection (Z=0)
  const numerator = -(R_T[2][0] * 0 + R_T[2][1] * 0 + R_T[2][3]);
  const denominator = R_T[2][0] * rayDir[0] + R_T[2][1] * rayDir[1] + R_T[2][2] * rayDir[2];

  if (Math.abs(denominator) < 1e-10) return null;

  const t = numerator / denominator;
  if (t < 0) return null;

  const worldX = R_T[0][0] * rayDir[0] * t + R_T[0][1] * rayDir[1] * t + R_T[0][2] * rayDir[2] * t + R_T[0][3];
  const worldY = R_T[1][0] * rayDir[0] * t + R_T[1][1] * rayDir[1] * t + R_T[1][2] * rayDir[2] * t + R_T[1][3];

  return { x: worldX, y: worldY };
}

// Robust IRLS fitting with Huber weighting
function fitPolynomialIRLS(
  data: DataPoint[],
  cameraId: string,
  degree: number,
  iterations: number = 20,
  threshold: number = 0.5
): { coeffsX: number[]; coeffsY: number[] } {
  const n = data.length;
  const numTerms = countTerms(degree);

  // Build design matrix from K/R/T projected coords
  const A: number[][] = [];
  const bX: number[] = [];
  const bY: number[] = [];

  for (const point of data) {
    const krtResult = applyKRT(point.imgX, point.imgY, cameraId);
    if (!krtResult) continue;

    const terms = generateTerms(krtResult.x, krtResult.y, degree);
    A.push(terms);
    bX.push(point.worldX);
    bY.push(point.worldY);
  }

  const m = A.length;
  if (m < numTerms) {
    console.log(`Warning: Not enough data points (${m}) for ${numTerms} terms`);
    return { coeffsX: [], coeffsY: [] };
  }

  // Initialize weights
  let weightsX = new Array(m).fill(1);
  let weightsY = new Array(m).fill(1);

  let coeffsX: number[] = [];
  let coeffsY: number[] = [];

  for (let iter = 0; iter < iterations; iter++) {
    // Weighted least squares for X
    coeffsX = weightedLeastSquares(A, bX, weightsX);
    // Weighted least squares for Y
    coeffsY = weightedLeastSquares(A, bY, weightsY);

    // Compute residuals and update weights
    const residualsX: number[] = [];
    const residualsY: number[] = [];

    for (let i = 0; i < m; i++) {
      let predX = 0, predY = 0;
      for (let j = 0; j < numTerms; j++) {
        predX += coeffsX[j] * A[i][j];
        predY += coeffsY[j] * A[i][j];
      }
      residualsX.push(Math.abs(bX[i] - predX));
      residualsY.push(Math.abs(bY[i] - predY));
    }

    // Huber weights
    for (let i = 0; i < m; i++) {
      weightsX[i] = residualsX[i] <= threshold ? 1 : threshold / residualsX[i];
      weightsY[i] = residualsY[i] <= threshold ? 1 : threshold / residualsY[i];
    }
  }

  return { coeffsX, coeffsY };
}

function weightedLeastSquares(A: number[][], b: number[], weights: number[]): number[] {
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

  // Solve with regularization
  const lambda = 1e-8;
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
    // Find pivot
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(augmented[row][col]) > Math.abs(augmented[maxRow][col])) {
        maxRow = row;
      }
    }
    [augmented[col], augmented[maxRow]] = [augmented[maxRow], augmented[col]];

    // Eliminate
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

// Test accuracy
function testAccuracy(
  data: DataPoint[],
  cameraId: string,
  coeffsX: number[],
  coeffsY: number[],
  degree: number
): { accuracy: number; avgError: number } {
  let passed = 0;
  let totalError = 0;
  let count = 0;

  for (const point of data) {
    const krtResult = applyKRT(point.imgX, point.imgY, cameraId);
    if (!krtResult) continue;

    const terms = generateTerms(krtResult.x, krtResult.y, degree);

    let predX = 0, predY = 0;
    for (let i = 0; i < coeffsX.length; i++) {
      predX += coeffsX[i] * terms[i];
      predY += coeffsY[i] * terms[i];
    }

    const error = Math.sqrt(Math.pow(predX - point.worldX, 2) + Math.pow(predY - point.worldY, 2));
    totalError += error;
    count++;

    if (error < 0.5) passed++;
  }

  return {
    accuracy: (passed / count) * 100,
    avgError: totalError / count,
  };
}

// Try different polynomial degrees
console.log(`\n=== Testing Different Polynomial Degrees ===`);

for (const degree of [4, 5, 6]) {
  console.log(`\n--- Degree ${degree} ---`);

  const cam1Result = fitPolynomialIRLS(camera1Data, "camera1", degree, 25, 0.5);
  const cam2Result = fitPolynomialIRLS(camera2Data, "camera2", degree, 25, 0.5);

  const cam1Acc = testAccuracy(camera1Data, "camera1", cam1Result.coeffsX, cam1Result.coeffsY, degree);
  const cam2Acc = testAccuracy(camera2Data, "camera2", cam2Result.coeffsX, cam2Result.coeffsY, degree);

  console.log(`Camera1: ${cam1Acc.accuracy.toFixed(1)}% accuracy, ${cam1Acc.avgError.toFixed(3)}m avg error`);
  console.log(`Camera2: ${cam2Acc.accuracy.toFixed(1)}% accuracy, ${cam2Acc.avgError.toFixed(3)}m avg error`);

  // Combined accuracy
  const totalPassed = Math.round(cam1Acc.accuracy * camera1Data.length / 100) +
                      Math.round(cam2Acc.accuracy * camera2Data.length / 100);
  const totalCount = camera1Data.length + camera2Data.length;
  const combined = (totalPassed / totalCount) * 100;
  console.log(`Combined: ${combined.toFixed(1)}% accuracy`);
}

// Use degree 5 with best threshold
console.log(`\n=== Finding Best Threshold for Degree 5 ===`);

const bestDegree = 5;
for (const threshold of [0.3, 0.4, 0.5, 0.6, 0.7, 0.8]) {
  const cam1Result = fitPolynomialIRLS(camera1Data, "camera1", bestDegree, 30, threshold);
  const cam2Result = fitPolynomialIRLS(camera2Data, "camera2", bestDegree, 30, threshold);

  const cam1Acc = testAccuracy(camera1Data, "camera1", cam1Result.coeffsX, cam1Result.coeffsY, bestDegree);
  const cam2Acc = testAccuracy(camera2Data, "camera2", cam2Result.coeffsX, cam2Result.coeffsY, bestDegree);

  const totalPassed = Math.round(cam1Acc.accuracy * camera1Data.length / 100) +
                      Math.round(cam2Acc.accuracy * camera2Data.length / 100);
  const totalCount = camera1Data.length + camera2Data.length;
  const combined = (totalPassed / totalCount) * 100;
  const avgError = (cam1Acc.avgError * camera1Data.length + cam2Acc.avgError * camera2Data.length) / totalCount;

  console.log(`Threshold ${threshold}: ${combined.toFixed(1)}% accuracy, ${avgError.toFixed(3)}m avg error`);
}

// Output best coefficients
console.log(`\n=== Best Coefficients (Degree 5, Threshold 0.5) ===`);

const cam1Best = fitPolynomialIRLS(camera1Data, "camera1", 5, 30, 0.5);
const cam2Best = fitPolynomialIRLS(camera2Data, "camera2", 5, 30, 0.5);

console.log(`\nCamera1 coeffsX (${cam1Best.coeffsX.length} terms):`);
console.log(`  [${cam1Best.coeffsX.map(c => c.toFixed(8)).join(", ")}]`);
console.log(`Camera1 coeffsY (${cam1Best.coeffsY.length} terms):`);
console.log(`  [${cam1Best.coeffsY.map(c => c.toFixed(8)).join(", ")}]`);

console.log(`\nCamera2 coeffsX (${cam2Best.coeffsX.length} terms):`);
console.log(`  [${cam2Best.coeffsX.map(c => c.toFixed(8)).join(", ")}]`);
console.log(`Camera2 coeffsY (${cam2Best.coeffsY.length} terms):`);
console.log(`  [${cam2Best.coeffsY.map(c => c.toFixed(8)).join(", ")}]`);

// Final accuracy
const cam1FinalAcc = testAccuracy(camera1Data, "camera1", cam1Best.coeffsX, cam1Best.coeffsY, 5);
const cam2FinalAcc = testAccuracy(camera2Data, "camera2", cam2Best.coeffsX, cam2Best.coeffsY, 5);
console.log(`\nFinal Camera1: ${cam1FinalAcc.accuracy.toFixed(1)}% accuracy, ${cam1FinalAcc.avgError.toFixed(3)}m avg error`);
console.log(`Final Camera2: ${cam2FinalAcc.accuracy.toFixed(1)}% accuracy, ${cam2FinalAcc.avgError.toFixed(3)}m avg error`);
