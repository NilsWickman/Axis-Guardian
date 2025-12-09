/**
 * Deep dive into the worst failing cases to find patterns or potential GT errors
 */
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { TrackManager } from "../src/tracks/track-manager.js";
import { DetectionProcessor } from "../src/detection/detection-processor.js";
import { CameraRegistry } from "../src/detection/camera-registry.js";
import { loadSiteMapConfig } from "../src/config/sitemap-loader.js";
import { getBBoxBottomCenter, projectWithKRT } from "../src/projection/ground-plane.js";

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

// Collect all results with errors
const certainAnnotations = groundTruth.annotations.filter((a: Annotation) => a.confidence === "certain");

interface Result {
  annotation: Annotation;
  error: number;
  projected: { x: number; y: number };
  cameraDetails: Array<{
    cameraId: string;
    frameNumber: number;
    trackId: number;
    bbox: { left: number; top: number; right: number; bottom: number };
    bboxWidth: number;
    bboxHeight: number;
    aspectRatio: number;
    projected: { x: number; y: number };
    error: number;
  }>;
}

const results: Result[] = [];
let mockTime = 1000;

for (const annotation of certainAnnotations) {
  const trackManager = new TrackManager({
    clock: () => mockTime,
    idGenerator: (() => { let id = 0; return () => `global-${++id}`; })(),
  });
  const detectionProcessor = new DetectionProcessor(trackManager, cameraRegistry);

  mockTime = Math.floor(annotation.timestamp * 1000) + 1000;

  const cameraDetails: Result["cameraDetails"] = [];

  for (const det of annotation.linkedDetections) {
    // Get individual projection details
    const tempTrackManager = new TrackManager({
      clock: () => mockTime,
      idGenerator: (() => { let id = 0; return () => `temp-${++id}`; })(),
    });
    const tempProcessor = new DetectionProcessor(tempTrackManager, cameraRegistry);

    const bbox = convertBbox(det);
    const track = tempProcessor.processInjection(det.cameraId, bbox, 0.95, det.trackId);

    if (track) {
      const bboxWidth = det.bbox.right - det.bbox.left;
      const bboxHeight = det.bbox.bottom - det.bbox.top;
      const aspectRatio = (bboxHeight * 1080) / (bboxWidth * 1920);

      cameraDetails.push({
        cameraId: det.cameraId,
        frameNumber: det.frameNumber,
        trackId: det.trackId,
        bbox: det.bbox,
        bboxWidth,
        bboxHeight,
        aspectRatio,
        projected: { ...track.currentPosition },
        error: distance(track.currentPosition, annotation.groundPosition),
      });
    }

    // Process in main manager
    detectionProcessor.processInjection(det.cameraId, bbox, 0.95, det.trackId);
    mockTime += 10;
  }

  const activeTracks = trackManager.getAllActiveTracks();
  if (activeTracks.length === 0) continue;

  const projected = activeTracks[0].currentPosition;
  const error = distance(projected, annotation.groundPosition);

  results.push({
    annotation,
    error,
    projected,
    cameraDetails,
  });
}

// Sort by error (worst first)
results.sort((a, b) => b.error - a.error);

console.log(`=== Top 20 Worst Cases ===\n`);

for (const r of results.slice(0, 20)) {
  console.log(`Annotation: ${r.annotation.id}`);
  console.log(`  Ground truth: (${r.annotation.groundPosition.x.toFixed(2)}, ${r.annotation.groundPosition.y.toFixed(2)})`);
  console.log(`  Final projected: (${r.projected.x.toFixed(2)}, ${r.projected.y.toFixed(2)})`);
  console.log(`  Error: ${r.error.toFixed(3)}m`);
  console.log(`  Detections:`);

  for (const det of r.cameraDetails) {
    console.log(`    ${det.cameraId} frame=${det.frameNumber} track=${det.trackId}:`);
    console.log(`      bbox: [${det.bbox.left.toFixed(3)}, ${det.bbox.top.toFixed(3)}, ${det.bbox.right.toFixed(3)}, ${det.bbox.bottom.toFixed(3)}]`);
    console.log(`      size: ${(det.bboxWidth*1920).toFixed(0)}x${(det.bboxHeight*1080).toFixed(0)}px, aspect=${det.aspectRatio.toFixed(2)}`);
    console.log(`      projected: (${det.projected.x.toFixed(2)}, ${det.projected.y.toFixed(2)}) error=${det.error.toFixed(3)}m`);
  }
  console.log("");
}

// Analyze patterns in failures
const failures = results.filter(r => r.error >= 0.5);

console.log(`\n=== Failure Pattern Analysis ===\n`);

// By ground position region
console.log(`By ground truth region:`);
const regions = {
  nearWall: failures.filter(r => r.annotation.groundPosition.y < 2).length,
  middle: failures.filter(r => r.annotation.groundPosition.y >= 2 && r.annotation.groundPosition.y < 8).length,
  farWall: failures.filter(r => r.annotation.groundPosition.y >= 8).length,
};
console.log(`  Near wall (y<2m): ${regions.nearWall}`);
console.log(`  Middle (2-8m): ${regions.middle}`);
console.log(`  Far wall (y>=8m): ${regions.farWall}`);

// By bbox aspect ratio
const lowAspect = failures.filter(r => r.cameraDetails.some(d => d.aspectRatio < 1.2)).length;
const normalAspect = failures.filter(r => r.cameraDetails.every(d => d.aspectRatio >= 1.2)).length;
console.log(`\nBy bbox aspect ratio:`);
console.log(`  Has low aspect ratio (likely seated): ${lowAspect}`);
console.log(`  All normal aspect ratios: ${normalAspect}`);

// By bbox position in image
const edgeCases = failures.filter(r => r.cameraDetails.some(d =>
  d.bbox.left < 0.1 || d.bbox.right > 0.9 || d.bbox.top < 0.1 || d.bbox.bottom > 0.9
)).length;
console.log(`\nNear image edge: ${edgeCases}`);

// Check for potential GT errors (very large errors with normal bbox)
console.log(`\n=== Potential Ground Truth Issues ===`);
const suspiciousCases = results.filter(r => {
  // Error > 2m and bbox looks normal (high aspect ratio, normal position)
  return r.error > 2.0 &&
    r.cameraDetails.every(d => d.aspectRatio > 1.2) &&
    r.cameraDetails.every(d => d.bbox.left > 0.1 && d.bbox.right < 0.9);
});

console.log(`Cases with error >2m and normal-looking bbox: ${suspiciousCases.length}`);
for (const s of suspiciousCases) {
  console.log(`  ${s.annotation.id}: GT=(${s.annotation.groundPosition.x.toFixed(2)}, ${s.annotation.groundPosition.y.toFixed(2)}), error=${s.error.toFixed(2)}m`);
}
