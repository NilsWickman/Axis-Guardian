/**
 * Analyze what region-specific corrections could improve accuracy
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
  id: string;
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

// Collect all detection data with detailed information
interface DetectionData {
  cameraId: string;
  bboxCenterX: number;
  bboxCenterY: number;
  groundTruthX: number;
  groundTruthY: number;
  projectedX: number;
  projectedY: number;
  errorX: number;
  errorY: number;
  error: number;
}

const detectionData: DetectionData[] = [];
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

    if (track) {
      detectionData.push({
        cameraId: det.cameraId,
        bboxCenterX: (det.bbox.left + det.bbox.right) / 2,
        bboxCenterY: (det.bbox.top + det.bbox.bottom) / 2,
        groundTruthX: annotation.groundPosition.x,
        groundTruthY: annotation.groundPosition.y,
        projectedX: track.currentPosition.x,
        projectedY: track.currentPosition.y,
        errorX: track.currentPosition.x - annotation.groundPosition.x,
        errorY: track.currentPosition.y - annotation.groundPosition.y,
        error: distance(track.currentPosition, annotation.groundPosition),
      });
    }
  }
}

console.log(`Total detections: ${detectionData.length}\n`);

// Define regions for each camera
interface Region {
  name: string;
  filter: (d: DetectionData) => boolean;
}

const cam1Regions: Region[] = [
  { name: "left (x<0.33)", filter: d => d.cameraId === "camera1" && d.bboxCenterX < 0.33 },
  { name: "center (0.33-0.67)", filter: d => d.cameraId === "camera1" && d.bboxCenterX >= 0.33 && d.bboxCenterX <= 0.67 },
  { name: "right (x>0.67)", filter: d => d.cameraId === "camera1" && d.bboxCenterX > 0.67 },
];

const cam2Regions: Region[] = [
  { name: "left (x<0.33)", filter: d => d.cameraId === "camera2" && d.bboxCenterX < 0.33 },
  { name: "center (0.33-0.67)", filter: d => d.cameraId === "camera2" && d.bboxCenterX >= 0.33 && d.bboxCenterX <= 0.67 },
  { name: "right (x>0.67)", filter: d => d.cameraId === "camera2" && d.bboxCenterX > 0.67 },
];

function analyzeRegion(data: DetectionData[], name: string) {
  if (data.length === 0) {
    console.log(`  ${name}: no data`);
    return;
  }

  const avgErrorX = data.reduce((s, d) => s + d.errorX, 0) / data.length;
  const avgErrorY = data.reduce((s, d) => s + d.errorY, 0) / data.length;
  const avgError = data.reduce((s, d) => s + d.error, 0) / data.length;
  const passRate = data.filter(d => d.error < 0.5).length / data.length * 100;

  // What if we applied a correction?
  const correctedData = data.map(d => ({
    ...d,
    correctedError: distance(
      { x: d.projectedX - avgErrorX, y: d.projectedY - avgErrorY },
      { x: d.groundTruthX, y: d.groundTruthY }
    ),
  }));
  const correctedPassRate = correctedData.filter(d => d.correctedError < 0.5).length / data.length * 100;

  console.log(`  ${name}: n=${data.length}, avgErr=${avgError.toFixed(3)}m, pass=${passRate.toFixed(1)}%`);
  console.log(`    bias: dx=${avgErrorX.toFixed(3)}m, dy=${avgErrorY.toFixed(3)}m`);
  console.log(`    if corrected: pass=${correctedPassRate.toFixed(1)}% (${(correctedPassRate-passRate).toFixed(1)}% gain)`);
}

console.log("=== Camera1 Region Analysis ===");
for (const region of cam1Regions) {
  const regionData = detectionData.filter(region.filter);
  analyzeRegion(regionData, region.name);
}

console.log("\n=== Camera2 Region Analysis ===");
for (const region of cam2Regions) {
  const regionData = detectionData.filter(region.filter);
  analyzeRegion(regionData, region.name);
}

// Also analyze by Y position (distance from camera)
console.log("\n=== Camera1 by bbox Y position ===");
const cam1Data = detectionData.filter(d => d.cameraId === "camera1");
analyzeRegion(cam1Data.filter(d => d.bboxCenterY < 0.5), "top (y<0.5)");
analyzeRegion(cam1Data.filter(d => d.bboxCenterY >= 0.5 && d.bboxCenterY < 0.75), "middle (0.5-0.75)");
analyzeRegion(cam1Data.filter(d => d.bboxCenterY >= 0.75), "bottom (y>=0.75)");

console.log("\n=== Camera2 by bbox Y position ===");
const cam2Data = detectionData.filter(d => d.cameraId === "camera2");
analyzeRegion(cam2Data.filter(d => d.bboxCenterY < 0.5), "top (y<0.5)");
analyzeRegion(cam2Data.filter(d => d.bboxCenterY >= 0.5 && d.bboxCenterY < 0.75), "middle (0.5-0.75)");
analyzeRegion(cam2Data.filter(d => d.bboxCenterY >= 0.75), "bottom (y>=0.75)");

// Simulate applying optimal corrections
console.log("\n=== Simulation: Apply Region-Specific Corrections ===");

interface RegionCorrection {
  camera: string;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  dx: number;
  dy: number;
}

// Calculate optimal corrections for each region
function calculateCorrection(data: DetectionData[]): { dx: number; dy: number } {
  if (data.length === 0) return { dx: 0, dy: 0 };
  const avgErrorX = data.reduce((s, d) => s + d.errorX, 0) / data.length;
  const avgErrorY = data.reduce((s, d) => s + d.errorY, 0) / data.length;
  return { dx: avgErrorX, dy: avgErrorY };
}

const corrections: RegionCorrection[] = [];

// Camera1 by X region
for (const xRange of [[0, 0.33], [0.33, 0.67], [0.67, 1.0]]) {
  const data = cam1Data.filter(d => d.bboxCenterX >= xRange[0] && d.bboxCenterX < xRange[1]);
  const correction = calculateCorrection(data);
  corrections.push({
    camera: "camera1",
    xMin: xRange[0],
    xMax: xRange[1],
    yMin: 0,
    yMax: 1,
    ...correction,
  });
}

// Camera2 by X region
for (const xRange of [[0, 0.33], [0.33, 0.67], [0.67, 1.0]]) {
  const data = cam2Data.filter(d => d.bboxCenterX >= xRange[0] && d.bboxCenterX < xRange[1]);
  const correction = calculateCorrection(data);
  corrections.push({
    camera: "camera2",
    xMin: xRange[0],
    xMax: xRange[1],
    yMin: 0,
    yMax: 1,
    ...correction,
  });
}

console.log("\nOptimal corrections per region:");
for (const c of corrections) {
  console.log(`  ${c.camera} x=[${c.xMin.toFixed(2)},${c.xMax.toFixed(2)}]: dx=${c.dx.toFixed(3)}m, dy=${c.dy.toFixed(3)}m`);
}

// Apply corrections and see improvement
function applyCorrection(d: DetectionData, corrections: RegionCorrection[]): { x: number; y: number } {
  const correction = corrections.find(c =>
    c.camera === d.cameraId &&
    d.bboxCenterX >= c.xMin && d.bboxCenterX < c.xMax &&
    d.bboxCenterY >= c.yMin && d.bboxCenterY < c.yMax
  );

  if (!correction) return { x: d.projectedX, y: d.projectedY };

  return {
    x: d.projectedX - correction.dx,
    y: d.projectedY - correction.dy,
  };
}

// Recalculate accuracy with corrections
let correctedPasses = 0;
let originalPasses = 0;

for (const d of detectionData) {
  if (d.error < 0.5) originalPasses++;

  const corrected = applyCorrection(d, corrections);
  const correctedError = distance(corrected, { x: d.groundTruthX, y: d.groundTruthY });
  if (correctedError < 0.5) correctedPasses++;
}

console.log(`\nIndividual projection accuracy:`);
console.log(`  Original: ${originalPasses}/${detectionData.length} (${(originalPasses/detectionData.length*100).toFixed(1)}%)`);
console.log(`  With region corrections: ${correctedPasses}/${detectionData.length} (${(correctedPasses/detectionData.length*100).toFixed(1)}%)`);

// Now test actual annotation-level accuracy (the test uses track merging)
console.log(`\n=== Full Annotation-Level Simulation ===`);

// To properly test, we'd need to modify the actual projection code
// For now, let's estimate the potential improvement
const cam1AvgBias = calculateCorrection(cam1Data);
const cam2AvgBias = calculateCorrection(cam2Data);

console.log(`\nOverall camera biases:`);
console.log(`  Camera1: dx=${cam1AvgBias.dx.toFixed(3)}m, dy=${cam1AvgBias.dy.toFixed(3)}m`);
console.log(`  Camera2: dx=${cam2AvgBias.dx.toFixed(3)}m, dy=${cam2AvgBias.dy.toFixed(3)}m`);
