/**
 * Detailed analysis of failing test cases
 * Understand exactly why each case fails and categorize the failures
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

interface FailureAnalysis {
  annotationId: string;
  groundTruth: { x: number; y: number };
  finalPosition: { x: number; y: number };
  error: number;
  numCameras: number;
  cameraProjections: Array<{
    cameraId: string;
    projected: { x: number; y: number };
    error: number;
  }>;
  failureCategory: string;
  frameNumbers: number[];
}

const failures: FailureAnalysis[] = [];
const successes: FailureAnalysis[] = [];

let mockTime = 1000;

for (const annotation of certainAnnotations) {
  const trackManager = new TrackManager({
    clock: () => mockTime,
    idGenerator: (() => { let id = 0; return () => `global-${++id}`; })(),
  });
  const detectionProcessor = new DetectionProcessor(trackManager, cameraRegistry);

  mockTime = Math.floor(annotation.timestamp * 1000) + 1000;

  // Collect individual camera projections
  const cameraProjections: Array<{ cameraId: string; projected: { x: number; y: number }; error: number }> = [];

  for (const det of annotation.linkedDetections) {
    // Get individual projection
    const tempTrackManager = new TrackManager({
      clock: () => mockTime,
      idGenerator: (() => { let id = 0; return () => `temp-${++id}`; })(),
    });
    const tempProcessor = new DetectionProcessor(tempTrackManager, cameraRegistry);

    const bbox = convertBbox(det);
    const track = tempProcessor.processInjection(det.cameraId, bbox, 0.95, det.trackId);

    if (track) {
      const error = distance(track.currentPosition, annotation.groundPosition);
      cameraProjections.push({
        cameraId: det.cameraId,
        projected: { ...track.currentPosition },
        error,
      });
    }

    // Process in main processor for merged result
    detectionProcessor.processInjection(det.cameraId, bbox, 0.95, det.trackId);
    mockTime += 10;
  }

  // Get final merged position
  const activeTracks = trackManager.getAllActiveTracks();
  if (activeTracks.length === 0) continue;

  const finalPosition = activeTracks[0].currentPosition;
  const error = distance(finalPosition, annotation.groundPosition);

  // Categorize failure
  let failureCategory = "unknown";
  if (cameraProjections.length === 1) {
    // Single camera - failure is purely due to that camera's projection
    failureCategory = `single_camera_${cameraProjections[0].cameraId}`;
  } else if (cameraProjections.length >= 2) {
    const cam1 = cameraProjections.find(p => p.cameraId === "camera1");
    const cam2 = cameraProjections.find(p => p.cameraId === "camera2");

    if (cam1 && cam2) {
      const cam1Good = cam1.error < 0.5;
      const cam2Good = cam2.error < 0.5;
      const divergence = distance(cam1.projected, cam2.projected);

      if (cam1Good && cam2Good) {
        failureCategory = "both_good_but_merged_bad";
      } else if (cam1Good && !cam2Good) {
        failureCategory = "cam1_good_cam2_bad";
      } else if (!cam1Good && cam2Good) {
        failureCategory = "cam1_bad_cam2_good";
      } else {
        failureCategory = "both_cameras_bad";
      }

      if (divergence > 1.0) {
        failureCategory += "_high_divergence";
      }
    }
  }

  const analysis: FailureAnalysis = {
    annotationId: annotation.id,
    groundTruth: annotation.groundPosition,
    finalPosition,
    error,
    numCameras: annotation.linkedDetections.length,
    cameraProjections,
    failureCategory,
    frameNumbers: annotation.linkedDetections.map(d => d.frameNumber),
  };

  if (error >= 0.5) {
    failures.push(analysis);
  } else {
    successes.push(analysis);
  }
}

console.log(`Total: ${failures.length + successes.length}`);
console.log(`Failures: ${failures.length}`);
console.log(`Successes: ${successes.length}`);
console.log(`Accuracy: ${(successes.length / (failures.length + successes.length) * 100).toFixed(1)}%`);

// Category breakdown
console.log(`\n=== Failure Categories ===`);
const categories = new Map<string, number>();
for (const f of failures) {
  categories.set(f.failureCategory, (categories.get(f.failureCategory) || 0) + 1);
}
for (const [cat, count] of [...categories.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${cat}: ${count}`);
}

// Single vs multi-camera failures
const singleCamFailures = failures.filter(f => f.numCameras === 1);
const multiCamFailures = failures.filter(f => f.numCameras >= 2);

console.log(`\n=== Single vs Multi-Camera ===`);
console.log(`Single-camera failures: ${singleCamFailures.length}`);
console.log(`Multi-camera failures: ${multiCamFailures.length}`);

// For multi-camera failures, which camera is typically worse?
console.log(`\n=== Multi-Camera Failure Analysis ===`);
let cam1WorseThanCam2 = 0;
let cam2WorseThanCam1 = 0;
let bothSimilar = 0;

for (const f of multiCamFailures) {
  const cam1 = f.cameraProjections.find(p => p.cameraId === "camera1");
  const cam2 = f.cameraProjections.find(p => p.cameraId === "camera2");

  if (cam1 && cam2) {
    if (Math.abs(cam1.error - cam2.error) < 0.1) {
      bothSimilar++;
    } else if (cam1.error > cam2.error) {
      cam1WorseThanCam2++;
    } else {
      cam2WorseThanCam1++;
    }
  }
}
console.log(`  Camera1 worse: ${cam1WorseThanCam2}`);
console.log(`  Camera2 worse: ${cam2WorseThanCam1}`);
console.log(`  Similar: ${bothSimilar}`);

// Error magnitudes
console.log(`\n=== Error Magnitude Distribution ===`);
const errorBuckets = [0.5, 0.75, 1.0, 1.5, 2.0, 3.0];
for (const bucket of errorBuckets) {
  const count = failures.filter(f => f.error < bucket).length;
  console.log(`  < ${bucket}m: ${count}/${failures.length}`);
}

// Detailed list of worst failures
console.log(`\n=== Worst 15 Failures (Details) ===`);
failures.sort((a, b) => b.error - a.error);
for (const f of failures.slice(0, 15)) {
  console.log(`\n${f.annotationId} (Frames: ${f.frameNumbers.join(", ")})`);
  console.log(`  Ground truth: (${f.groundTruth.x.toFixed(2)}, ${f.groundTruth.y.toFixed(2)})`);
  console.log(`  Final position: (${f.finalPosition.x.toFixed(2)}, ${f.finalPosition.y.toFixed(2)})`);
  console.log(`  Error: ${f.error.toFixed(3)}m`);
  console.log(`  Category: ${f.failureCategory}`);
  console.log(`  Camera projections:`);
  for (const cp of f.cameraProjections) {
    console.log(`    ${cp.cameraId}: (${cp.projected.x.toFixed(2)}, ${cp.projected.y.toFixed(2)}) - error ${cp.error.toFixed(3)}m`);
  }
}

// Summarize potential fixes
console.log(`\n=== Potential Fix Analysis ===`);

// How many would pass if we could perfectly fix one camera?
let fixableByCam1 = 0;
let fixableByCam2 = 0;
for (const f of multiCamFailures) {
  const cam1 = f.cameraProjections.find(p => p.cameraId === "camera1");
  const cam2 = f.cameraProjections.find(p => p.cameraId === "camera2");

  if (cam1 && cam1.error < 0.5) fixableByCam1++;
  if (cam2 && cam2.error < 0.5) fixableByCam2++;
}

console.log(`Multi-camera failures that have a good cam1 projection: ${fixableByCam1}/${multiCamFailures.length}`);
console.log(`Multi-camera failures that have a good cam2 projection: ${fixableByCam2}/${multiCamFailures.length}`);

// How many are borderline (0.5-0.6m)?
const borderline = failures.filter(f => f.error >= 0.5 && f.error < 0.6).length;
console.log(`Borderline failures (0.5-0.6m): ${borderline}`);
