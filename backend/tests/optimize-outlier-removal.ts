/**
 * Optimize with outlier removal - identify and remove problematic data points
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
  id: string;
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

function getCalibrationWithoutTransform(cameraId: string): CameraCalibration | null {
  const calib = cameraRegistry.getCalibration(cameraId);
  if (!calib) return null;
  return { K: calib.K, R: calib.R, T: calib.T, center: calib.center, scale: calib.scale, distortion: calib.distortion };
}

interface DataPoint {
  datasetX: number;
  datasetY: number;
  groundX: number;
  groundY: number;
  annotationId: string;
  frameNumber: number;
  trackId: number;
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

    const feetPos = getBBoxBottomCenter(bbox, null, [], true, 1920, 1080, true);
    let footX = feetPos.x;
    let footY = feetPos.y;

    if (calibRaw.distortion) {
      const fx = calibRaw.K[0][0];
      const fy = calibRaw.K[1][1];
      const cx = calibRaw.center[0];
      const cy = calibRaw.center[1];
      const corrected = undistortPoint(footX, footY, fx, fy, cx, cy, calibRaw.distortion);
      footX = corrected.x;
      footY = corrected.y;
    }

    const result = projectWithKRT(footX, footY, calibRaw);
    if (!result.isValid) continue;

    const point: DataPoint = {
      datasetX: result.worldPoint.x,
      datasetY: result.worldPoint.y,
      groundX: ann.groundPosition.x,
      groundY: ann.groundPosition.y,
      annotationId: ann.id,
      frameNumber: det.frameNumber,
      trackId: det.trackId,
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

// Generate polynomial terms
function generateTerms(x: number, y: number, degree: number): number[] {
  const terms: number[] = [1, x, y, x*x, y*y, x*y];
  if (degree >= 3) terms.push(x*x*x, y*y*y, x*x*y, x*y*y);
  if (degree >= 4) terms.push(x*x*x*x, y*y*y*y, x*x*x*y, x*y*y*y, x*x*y*y);
  return terms;
}

function weightedLeastSquares(A: number[][], b: number[], weights: number[], lambda: number = 1e-6): number[] {
  const m = A.length;
  const n = A[0].length;

  const AtWA: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));
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

  for (let i = 0; i < n; i++) AtWA[i][i] += lambda;
  return solveLinear(AtWA, AtWb);
}

function solveLinear(A: number[][], b: number[]): number[] {
  const n = A.length;
  const augmented = A.map((row, i) => [...row, b[i]]);

  for (let col = 0; col < n; col++) {
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(augmented[row][col]) > Math.abs(augmented[maxRow][col])) maxRow = row;
    }
    [augmented[col], augmented[maxRow]] = [augmented[maxRow], augmented[col]];

    for (let row = col + 1; row < n; row++) {
      const factor = augmented[row][col] / augmented[col][col];
      for (let j = col; j <= n; j++) augmented[row][j] -= factor * augmented[col][j];
    }
  }

  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    x[i] = augmented[i][n];
    for (let j = i + 1; j < n; j++) x[i] -= augmented[i][j] * x[j];
    x[i] /= augmented[i][i];
  }
  return x;
}

// Fit polynomial with optional outlier removal
function fitPolynomial(
  data: DataPoint[],
  degree: number,
  iterations: number = 25,
  threshold: number = 0.5,
  removeOutliers: boolean = false,
  outlierThreshold: number = 1.5
): { coeffsX: number[]; coeffsY: number[]; filteredData: DataPoint[] } {
  let filteredData = [...data];

  // Optional: Remove initial outliers based on simple heuristics
  if (removeOutliers) {
    // First pass: fit with all data
    const initialFit = fitPolynomialInner(filteredData, degree, iterations, threshold);

    // Calculate errors
    const errors = filteredData.map(point => {
      const terms = generateTerms(point.datasetX, point.datasetY, degree);
      let predX = 0, predY = 0;
      for (let i = 0; i < initialFit.coeffsX.length; i++) {
        predX += initialFit.coeffsX[i] * terms[i];
        predY += initialFit.coeffsY[i] * terms[i];
      }
      return Math.sqrt(Math.pow(predX - point.groundX, 2) + Math.pow(predY - point.groundY, 2));
    });

    // Remove points with error > outlierThreshold
    filteredData = filteredData.filter((_, i) => errors[i] < outlierThreshold);
    console.log(`  Removed ${data.length - filteredData.length} outliers (>${outlierThreshold}m error)`);
  }

  const result = fitPolynomialInner(filteredData, degree, iterations, threshold);
  return { ...result, filteredData };
}

function fitPolynomialInner(
  data: DataPoint[],
  degree: number,
  iterations: number,
  threshold: number
): { coeffsX: number[]; coeffsY: number[] } {
  const n = data.length;
  const numTerms = generateTerms(0, 0, degree).length;

  const A: number[][] = [];
  const bX: number[] = [];
  const bY: number[] = [];

  for (const point of data) {
    A.push(generateTerms(point.datasetX, point.datasetY, degree));
    bX.push(point.groundX);
    bY.push(point.groundY);
  }

  let weightsX = new Array(n).fill(1);
  let weightsY = new Array(n).fill(1);
  let coeffsX: number[] = [];
  let coeffsY: number[] = [];

  for (let iter = 0; iter < iterations; iter++) {
    coeffsX = weightedLeastSquares(A, bX, weightsX);
    coeffsY = weightedLeastSquares(A, bY, weightsY);

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

// Test accuracy on original data (not filtered)
function testAccuracy(
  data: DataPoint[],
  coeffsX: number[],
  coeffsY: number[],
  degree: number
): { accuracy: number; avgError: number; errors: { point: DataPoint; error: number }[] } {
  const errors: { point: DataPoint; error: number }[] = [];

  for (const point of data) {
    const terms = generateTerms(point.datasetX, point.datasetY, degree);
    let predX = 0, predY = 0;
    for (let i = 0; i < coeffsX.length; i++) {
      predX += coeffsX[i] * terms[i];
      predY += coeffsY[i] * terms[i];
    }
    const error = Math.sqrt(Math.pow(predX - point.groundX, 2) + Math.pow(predY - point.groundY, 2));
    errors.push({ point, error });
  }

  const passed = errors.filter(e => e.error < 0.5).length;
  const avgError = errors.reduce((a, b) => a + b.error, 0) / errors.length;

  return { accuracy: (passed / errors.length) * 100, avgError, errors };
}

// Test with different outlier removal thresholds
console.log(`\n=== Testing Outlier Removal ===`);

for (const outlierThresh of [Infinity, 2.0, 1.5, 1.2, 1.0]) {
  console.log(`\n--- Outlier threshold: ${outlierThresh === Infinity ? 'None' : outlierThresh + 'm'} ---`);

  const cam1Result = fitPolynomial(camera1Data, 4, 30, 0.5, outlierThresh !== Infinity, outlierThresh);
  const cam2Result = fitPolynomial(camera2Data, 4, 30, 0.5, outlierThresh !== Infinity, outlierThresh);

  // Test on ORIGINAL data (not filtered)
  const cam1Acc = testAccuracy(camera1Data, cam1Result.coeffsX, cam1Result.coeffsY, 4);
  const cam2Acc = testAccuracy(camera2Data, cam2Result.coeffsX, cam2Result.coeffsY, 4);

  console.log(`Camera1: ${cam1Acc.accuracy.toFixed(1)}% accuracy, ${cam1Acc.avgError.toFixed(3)}m avg error`);
  console.log(`Camera2: ${cam2Acc.accuracy.toFixed(1)}% accuracy, ${cam2Acc.avgError.toFixed(3)}m avg error`);

  const combined = (cam1Acc.accuracy * camera1Data.length + cam2Acc.accuracy * camera2Data.length) /
                   (camera1Data.length + camera2Data.length);
  console.log(`Combined: ${combined.toFixed(1)}% accuracy`);
}

// Show the worst outliers for Camera2
console.log(`\n=== Camera2 Worst Outliers ===`);

const cam2InitialFit = fitPolynomial(camera2Data, 4, 30, 0.5, false, Infinity);
const cam2Errors = testAccuracy(camera2Data, cam2InitialFit.coeffsX, cam2InitialFit.coeffsY, 4);

cam2Errors.errors.sort((a, b) => b.error - a.error);
for (const e of cam2Errors.errors.slice(0, 10)) {
  console.log(`  Frame ${e.point.frameNumber}, Track ${e.point.trackId}: ${e.error.toFixed(3)}m`);
  console.log(`    Dataset: (${e.point.datasetX.toFixed(2)}, ${e.point.datasetY.toFixed(2)})`);
  console.log(`    Ground:  (${e.point.groundX.toFixed(2)}, ${e.point.groundY.toFixed(2)})`);
}

// Best coefficients with 1.5m outlier removal
console.log(`\n=== Best Coefficients (Outlier Removal at 1.5m) ===`);

const cam1Best = fitPolynomial(camera1Data, 4, 30, 0.5, true, 1.5);
const cam2Best = fitPolynomial(camera2Data, 4, 30, 0.5, true, 1.5);

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

// Final test
const cam1FinalAcc = testAccuracy(camera1Data, cam1Best.coeffsX, cam1Best.coeffsY, 4);
const cam2FinalAcc = testAccuracy(camera2Data, cam2Best.coeffsX, cam2Best.coeffsY, 4);
const finalCombined = (cam1FinalAcc.accuracy * camera1Data.length + cam2FinalAcc.accuracy * camera2Data.length) /
                      (camera1Data.length + camera2Data.length);

console.log(`\nFinal Results (tested on ALL data):`);
console.log(`  Camera1: ${cam1FinalAcc.accuracy.toFixed(1)}% accuracy, ${cam1FinalAcc.avgError.toFixed(3)}m avg error`);
console.log(`  Camera2: ${cam2FinalAcc.accuracy.toFixed(1)}% accuracy, ${cam2FinalAcc.avgError.toFixed(3)}m avg error`);
console.log(`  Combined: ${finalCombined.toFixed(1)}% accuracy`);
