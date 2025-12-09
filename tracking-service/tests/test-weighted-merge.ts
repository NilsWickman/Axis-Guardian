/**
 * Test if weighted merging based on camera accuracy helps
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

// Camera accuracy weights (based on earlier analysis: cam1=72.6%, cam2=61.2%)
const CAMERA_WEIGHTS: Record<string, number> = {
  camera1: 1.2,  // Higher weight for more accurate camera
  camera2: 0.8,  // Lower weight for less accurate camera
};

// Simulate weighted merge
function weightedMerge(projections: Array<{ cameraId: string; position: { x: number; y: number } }>) {
  let totalWeight = 0;
  let weightedX = 0;
  let weightedY = 0;

  for (const proj of projections) {
    const weight = CAMERA_WEIGHTS[proj.cameraId] || 1.0;
    totalWeight += weight;
    weightedX += proj.position.x * weight;
    weightedY += proj.position.y * weight;
  }

  return {
    x: weightedX / totalWeight,
    y: weightedY / totalWeight,
  };
}

let mockTime = 1000;

// Test current behavior vs weighted merge
let currentPasses = 0;
let weightedPasses = 0;
let cam1OnlyPasses = 0;
let totalMultiCam = 0;

for (const annotation of certainAnnotations) {
  const trackManager = new TrackManager({
    clock: () => mockTime,
    idGenerator: (() => { let id = 0; return () => `global-${++id}`; })(),
  });
  const detectionProcessor = new DetectionProcessor(trackManager, cameraRegistry);

  mockTime = Math.floor(annotation.timestamp * 1000) + 1000;

  const projections: Array<{ cameraId: string; position: { x: number; y: number } }> = [];

  // Get individual projections
  for (const det of annotation.linkedDetections) {
    const tempTrackManager = new TrackManager({
      clock: () => mockTime,
      idGenerator: (() => { let id = 0; return () => `temp-${++id}`; })(),
    });
    const tempProcessor = new DetectionProcessor(tempTrackManager, cameraRegistry);

    const bbox = convertBbox(det);
    const track = tempProcessor.processInjection(det.cameraId, bbox, 0.95, det.trackId);
    if (track) {
      projections.push({ cameraId: det.cameraId, position: { ...track.currentPosition } });
    }
  }

  // Process in actual track manager
  for (const det of annotation.linkedDetections) {
    const bbox = convertBbox(det);
    detectionProcessor.processInjection(det.cameraId, bbox, 0.95, det.trackId);
    mockTime += 10;
  }

  const activeTracks = trackManager.getAllActiveTracks();
  if (activeTracks.length === 0) continue;

  // Current behavior
  const currentPosition = activeTracks[0].currentPosition;
  const currentError = distance(currentPosition, annotation.groundPosition);
  if (currentError < 0.5) currentPasses++;

  // Multi-camera specific tests
  if (projections.length >= 2) {
    totalMultiCam++;

    // Weighted merge
    const weightedPos = weightedMerge(projections);
    const weightedError = distance(weightedPos, annotation.groundPosition);
    if (weightedError < 0.5) weightedPasses++;

    // Camera1 only (if available)
    const cam1Proj = projections.find(p => p.cameraId === "camera1");
    if (cam1Proj) {
      const cam1Error = distance(cam1Proj.position, annotation.groundPosition);
      if (cam1Error < 0.5) cam1OnlyPasses++;
    }
  }
}

console.log(`=== Weighted Merge Analysis (Multi-Camera Only) ===`);
console.log(`Total multi-camera annotations: ${totalMultiCam}`);
console.log(`\nResults:`);
console.log(`  Current behavior: ${currentPasses}/${certainAnnotations.length} (${(currentPasses/certainAnnotations.length*100).toFixed(1)}%)`);
console.log(`  Using weighted merge: ${weightedPasses}/${totalMultiCam} multi-camera`);
console.log(`  Using camera1 only: ${cam1OnlyPasses}/${totalMultiCam} multi-camera`);

// Simulate what happens if we use camera1 only for multi-camera, current for single-camera
const singleCamAnnotations = certainAnnotations.filter((a: Annotation) => a.linkedDetections.length === 1);
let singleCamPasses = 0;

for (const annotation of singleCamAnnotations) {
  const trackManager = new TrackManager({
    clock: () => mockTime,
    idGenerator: (() => { let id = 0; return () => `global-${++id}`; })(),
  });
  const detectionProcessor = new DetectionProcessor(trackManager, cameraRegistry);

  mockTime = Math.floor(annotation.timestamp * 1000) + 1000;

  for (const det of annotation.linkedDetections) {
    const bbox = convertBbox(det);
    detectionProcessor.processInjection(det.cameraId, bbox, 0.95, det.trackId);
    mockTime += 10;
  }

  const activeTracks = trackManager.getAllActiveTracks();
  if (activeTracks.length === 0) continue;

  const error = distance(activeTracks[0].currentPosition, annotation.groundPosition);
  if (error < 0.5) singleCamPasses++;
}

console.log(`\n=== Combined Strategy ===`);
console.log(`Single-camera annotations: ${singleCamAnnotations.length}`);
console.log(`  Single-camera passes: ${singleCamPasses}/${singleCamAnnotations.length}`);
console.log(`\nIf we use cam1-only for multi-camera + current for single-camera:`);
const combinedPasses = singleCamPasses + cam1OnlyPasses;
console.log(`  Total passes: ${combinedPasses}/${certainAnnotations.length} (${(combinedPasses/certainAnnotations.length*100).toFixed(1)}%)`);
