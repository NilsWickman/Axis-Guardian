/**
 * Optimize simple bias corrections per camera
 * Test if a simple linear offset can improve accuracy
 */
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { TrackManager } from "../src/tracks/track-manager.js";
import { DetectionProcessor } from "../src/detection/detection-processor.js";
import { CameraRegistry } from "../src/detection/camera-registry.js";
import { loadSiteMapConfig } from "../src/config/sitemap-loader.js";

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

const groundTruthPath = join(__dirname, "../../GroundTruths.json");
const groundTruth = JSON.parse(readFileSync(groundTruthPath, "utf-8"));

const sitemapPath = join(__dirname, "../../shared/config/sitemap-rectangular-room.json");
const sitemapConfig = loadSiteMapConfig(sitemapPath);

const cameraRegistry = new CameraRegistry();
cameraRegistry.loadFromSiteMapConfig(sitemapConfig.cameras as any);

const certainAnnotations = groundTruth.annotations.filter((a: Annotation) => a.confidence === "certain");

function convertBbox(det: LinkedDetection) {
  return {
    x: det.bbox.left,
    y: det.bbox.top,
    width: det.bbox.right - det.bbox.left,
    height: det.bbox.bottom - det.bbox.top,
  };
}

function distance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

// Collect projection errors per camera
interface ProjectionResult {
  annotation: Annotation;
  cameraId: string;
  projected: { x: number; y: number };
  groundTruth: { x: number; y: number };
  errorX: number;
  errorY: number;
}

const projectionResults: ProjectionResult[] = [];
let mockTime = 1000;

for (const annotation of certainAnnotations) {
  for (const det of annotation.linkedDetections) {
    const trackManager = new TrackManager({
      clock: () => mockTime,
      idGenerator: (() => { let id = 0; return () => `temp-${++id}`; })(),
    });
    const processor = new DetectionProcessor(trackManager, cameraRegistry);

    const bbox = convertBbox(det);
    const track = processor.processInjection(det.cameraId, bbox, 0.95, det.trackId);

    if (!track) continue;

    const projected = track.currentPosition;
    projectionResults.push({
      annotation,
      cameraId: det.cameraId,
      projected,
      groundTruth: annotation.groundPosition,
      errorX: projected.x - annotation.groundPosition.x,
      errorY: projected.y - annotation.groundPosition.y,
    });
  }
}

// Calculate mean errors per camera
function getMeanErrors(results: ProjectionResult[], cameraId: string): { meanX: number; meanY: number } {
  const cameraResults = results.filter(r => r.cameraId === cameraId);
  const meanX = cameraResults.reduce((s, r) => s + r.errorX, 0) / cameraResults.length;
  const meanY = cameraResults.reduce((s, r) => s + r.errorY, 0) / cameraResults.length;
  return { meanX, meanY };
}

const cam1MeanErrors = getMeanErrors(projectionResults, "camera1");
const cam2MeanErrors = getMeanErrors(projectionResults, "camera2");

console.log(`=== Current Mean Errors (bias) ===`);
console.log(`Camera1: meanX=${cam1MeanErrors.meanX.toFixed(3)}m, meanY=${cam1MeanErrors.meanY.toFixed(3)}m`);
console.log(`Camera2: meanX=${cam2MeanErrors.meanX.toFixed(3)}m, meanY=${cam2MeanErrors.meanY.toFixed(3)}m`);

// Test accuracy with bias corrections
function testAccuracyWithBias(
  results: ProjectionResult[],
  biases: Map<string, { x: number; y: number }>
): { passed: number; total: number; avgError: number } {
  let passed = 0;
  let totalError = 0;

  for (const r of results) {
    const bias = biases.get(r.cameraId) || { x: 0, y: 0 };
    const correctedX = r.projected.x - bias.x;
    const correctedY = r.projected.y - bias.y;
    const error = distance({ x: correctedX, y: correctedY }, r.groundTruth);

    totalError += error;
    if (error < 0.5) passed++;
  }

  return { passed, total: results.length, avgError: totalError / results.length };
}

// Test without bias correction
const noBias = new Map<string, { x: number; y: number }>();
noBias.set("camera1", { x: 0, y: 0 });
noBias.set("camera2", { x: 0, y: 0 });

const resultNoBias = testAccuracyWithBias(projectionResults, noBias);
console.log(`\n=== Without Bias Correction ===`);
console.log(`Accuracy: ${(resultNoBias.passed / resultNoBias.total * 100).toFixed(1)}% (${resultNoBias.passed}/${resultNoBias.total})`);
console.log(`Avg error: ${resultNoBias.avgError.toFixed(3)}m`);

// Test with mean bias correction
const meanBias = new Map<string, { x: number; y: number }>();
meanBias.set("camera1", { x: cam1MeanErrors.meanX, y: cam1MeanErrors.meanY });
meanBias.set("camera2", { x: cam2MeanErrors.meanX, y: cam2MeanErrors.meanY });

const resultMeanBias = testAccuracyWithBias(projectionResults, meanBias);
console.log(`\n=== With Mean Bias Correction ===`);
console.log(`Accuracy: ${(resultMeanBias.passed / resultMeanBias.total * 100).toFixed(1)}% (${resultMeanBias.passed}/${resultMeanBias.total})`);
console.log(`Avg error: ${resultMeanBias.avgError.toFixed(3)}m`);
console.log(`Biases: cam1=(${cam1MeanErrors.meanX.toFixed(3)}, ${cam1MeanErrors.meanY.toFixed(3)}), cam2=(${cam2MeanErrors.meanX.toFixed(3)}, ${cam2MeanErrors.meanY.toFixed(3)})`);

// Grid search for optimal bias
console.log(`\n=== Grid Search for Optimal Bias ===`);

let bestAccuracy = 0;
let bestBias = { cam1X: 0, cam1Y: 0, cam2X: 0, cam2Y: 0 };

for (let cam1X = -0.3; cam1X <= 0.3; cam1X += 0.05) {
  for (let cam1Y = -0.3; cam1Y <= 0.3; cam1Y += 0.05) {
    for (let cam2X = -0.3; cam2X <= 0.3; cam2X += 0.05) {
      for (let cam2Y = -0.3; cam2Y <= 0.3; cam2Y += 0.05) {
        const testBias = new Map<string, { x: number; y: number }>();
        testBias.set("camera1", { x: cam1X, y: cam1Y });
        testBias.set("camera2", { x: cam2X, y: cam2Y });

        const result = testAccuracyWithBias(projectionResults, testBias);
        if (result.passed > bestAccuracy) {
          bestAccuracy = result.passed;
          bestBias = { cam1X, cam1Y, cam2X, cam2Y };
        }
      }
    }
  }
}

console.log(`Best accuracy: ${(bestAccuracy / projectionResults.length * 100).toFixed(1)}% (${bestAccuracy}/${projectionResults.length})`);
console.log(`Best biases: cam1=(${bestBias.cam1X.toFixed(2)}, ${bestBias.cam1Y.toFixed(2)}), cam2=(${bestBias.cam2X.toFixed(2)}, ${bestBias.cam2Y.toFixed(2)})`);

// Fine-tune around best
console.log(`\n=== Fine-tuning Around Best ===`);

for (let cam1X = bestBias.cam1X - 0.05; cam1X <= bestBias.cam1X + 0.05; cam1X += 0.01) {
  for (let cam1Y = bestBias.cam1Y - 0.05; cam1Y <= bestBias.cam1Y + 0.05; cam1Y += 0.01) {
    for (let cam2X = bestBias.cam2X - 0.05; cam2X <= bestBias.cam2X + 0.05; cam2X += 0.01) {
      for (let cam2Y = bestBias.cam2Y - 0.05; cam2Y <= bestBias.cam2Y + 0.05; cam2Y += 0.01) {
        const testBias = new Map<string, { x: number; y: number }>();
        testBias.set("camera1", { x: cam1X, y: cam1Y });
        testBias.set("camera2", { x: cam2X, y: cam2Y });

        const result = testAccuracyWithBias(projectionResults, testBias);
        if (result.passed > bestAccuracy) {
          bestAccuracy = result.passed;
          bestBias = { cam1X, cam1Y, cam2X, cam2Y };
        }
      }
    }
  }
}

const finalBias = new Map<string, { x: number; y: number }>();
finalBias.set("camera1", { x: bestBias.cam1X, y: bestBias.cam1Y });
finalBias.set("camera2", { x: bestBias.cam2X, y: bestBias.cam2Y });
const finalResult = testAccuracyWithBias(projectionResults, finalBias);

console.log(`Final accuracy: ${(finalResult.passed / finalResult.total * 100).toFixed(1)}% (${finalResult.passed}/${finalResult.total})`);
console.log(`Final avg error: ${finalResult.avgError.toFixed(3)}m`);
console.log(`Final biases:`);
console.log(`  CAMERA_BIAS_CORRECTIONS.camera1 = { x: ${bestBias.cam1X.toFixed(3)}, y: ${bestBias.cam1Y.toFixed(3)} }`);
console.log(`  CAMERA_BIAS_CORRECTIONS.camera2 = { x: ${bestBias.cam2X.toFixed(3)}, y: ${bestBias.cam2Y.toFixed(3)} }`);

// Per-camera accuracy with optimal bias
console.log(`\n=== Per-Camera Results with Optimal Bias ===`);
for (const cam of ["camera1", "camera2"]) {
  const camResults = projectionResults.filter(r => r.cameraId === cam);
  let passed = 0;
  let totalError = 0;

  const bias = finalBias.get(cam) || { x: 0, y: 0 };
  for (const r of camResults) {
    const correctedX = r.projected.x - bias.x;
    const correctedY = r.projected.y - bias.y;
    const error = distance({ x: correctedX, y: correctedY }, r.groundTruth);
    totalError += error;
    if (error < 0.5) passed++;
  }

  console.log(`${cam}: ${(passed / camResults.length * 100).toFixed(1)}% accuracy, ${(totalError / camResults.length).toFixed(3)}m avg error`);
}
