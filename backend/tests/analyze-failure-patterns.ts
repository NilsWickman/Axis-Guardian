/**
 * Analyze failure patterns to identify systematic issues
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
  videoFile: string;
  frameNumber: number;
  timestamp: number;
  trackId: number;
  bbox: {
    left: number;
    top: number;
    right: number;
    bottom: number;
  };
}

interface Annotation {
  id: string;
  groundPosition: { x: number; y: number };
  timestamp: number;
  confidence: "certain" | "estimated" | "uncertain";
  linkedDetections: LinkedDetection[];
}

interface GroundTruthDataset {
  version: string;
  annotations: Annotation[];
}

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

// Load ground truth and sitemap
const groundTruthPath = join(__dirname, "../../GroundTruths.json");
const groundTruth: GroundTruthDataset = JSON.parse(readFileSync(groundTruthPath, "utf-8"));

const sitemapPath = join(__dirname, "../../shared/config/sitemap-rectangular-room.json");
const sitemapConfig = loadSiteMapConfig(sitemapPath);

// Initialize camera registry
const cameraRegistry = new CameraRegistry();
cameraRegistry.loadFromSiteMapConfig(sitemapConfig.cameras as any);

// Filter certain annotations
const certainAnnotations = groundTruth.annotations.filter((a) => a.confidence === "certain");

interface FailureCase {
  annotation: Annotation;
  detection: LinkedDetection;
  projected: { x: number; y: number };
  error: number;
  bboxCenter: { x: number; y: number };
  region: string;
}

const failures: FailureCase[] = [];
const successes: FailureCase[] = [];

// Process all annotations
let mockTime = 1000;

for (const annotation of certainAnnotations) {
  // Process each detection independently
  for (const det of annotation.linkedDetections) {
    // Create fresh processor for each detection
    const trackManager = new TrackManager({
      clock: () => mockTime,
      idGenerator: (() => {
        let id = 0;
        return () => `temp-${++id}`;
      })(),
    });
    const processor = new DetectionProcessor(trackManager, cameraRegistry);

    const bbox = convertBbox(det);
    const track = processor.processInjection(det.cameraId, bbox, 0.95, det.trackId);

    if (!track) continue;

    const projected = track.currentPosition;
    const error = distance(projected, annotation.groundPosition);

    // Determine region based on ground truth position
    let region = "";
    if (annotation.groundPosition.x < 5) region += "left-";
    else if (annotation.groundPosition.x > 12) region += "right-";
    else region += "center-";

    if (annotation.groundPosition.y < 4) region += "bottom";
    else if (annotation.groundPosition.y > 8) region += "top";
    else region += "middle";

    // Calculate bbox center in pixel space (1920x1080)
    const bboxCenter = {
      x: (det.bbox.left + det.bbox.right) / 2 * 1920,
      y: det.bbox.bottom * 1080, // Bottom edge
    };

    const caseData: FailureCase = {
      annotation,
      detection: det,
      projected,
      error,
      bboxCenter,
      region,
    };

    if (error >= 0.5) {
      failures.push(caseData);
    } else {
      successes.push(caseData);
    }
  }
}

console.log(`Total detections: ${failures.length + successes.length}`);
console.log(`Failures (>=0.5m): ${failures.length}`);
console.log(`Successes (<0.5m): ${successes.length}`);
console.log(`Accuracy: ${((successes.length / (failures.length + successes.length)) * 100).toFixed(1)}%`);

// Analyze by camera
const cam1Failures = failures.filter((f) => f.detection.cameraId === "camera1");
const cam2Failures = failures.filter((f) => f.detection.cameraId === "camera2");
const cam1Total =
  failures.filter((f) => f.detection.cameraId === "camera1").length +
  successes.filter((f) => f.detection.cameraId === "camera1").length;
const cam2Total =
  failures.filter((f) => f.detection.cameraId === "camera2").length +
  successes.filter((f) => f.detection.cameraId === "camera2").length;

console.log(`\n=== By Camera ===`);
console.log(
  `Camera1: ${cam1Failures.length} failures / ${cam1Total} total (${(((cam1Total - cam1Failures.length) / cam1Total) * 100).toFixed(1)}% accuracy)`
);
console.log(
  `Camera2: ${cam2Failures.length} failures / ${cam2Total} total (${(((cam2Total - cam2Failures.length) / cam2Total) * 100).toFixed(1)}% accuracy)`
);

// Analyze by region
console.log(`\n=== By Region ===`);
const regions = new Map<string, { failures: number; total: number }>();
for (const f of [...failures, ...successes]) {
  const existing = regions.get(f.region) || { failures: 0, total: 0 };
  existing.total++;
  if (f.error >= 0.5) existing.failures++;
  regions.set(f.region, existing);
}
for (const [region, data] of [...regions.entries()].sort((a, b) => b[1].failures - a[1].failures)) {
  const accuracy = (((data.total - data.failures) / data.total) * 100).toFixed(1);
  console.log(`  ${region}: ${data.failures} failures / ${data.total} total (${accuracy}% accuracy)`);
}

// Analyze by error magnitude
console.log(`\n=== Error Distribution ===`);
const errorBuckets = [0.5, 0.75, 1.0, 1.5, 2.0, 3.0];
for (const threshold of errorBuckets) {
  const count = failures.filter((f) => f.error < threshold).length;
  console.log(`  Errors < ${threshold}m: ${count} / ${failures.length}`);
}

// Show worst failures
console.log(`\n=== Worst 10 Failures ===`);
failures.sort((a, b) => b.error - a.error);
for (const f of failures.slice(0, 10)) {
  console.log(`  Frame ${f.detection.frameNumber}, ${f.detection.cameraId}, trackId ${f.detection.trackId}`);
  console.log(`    Ground: (${f.annotation.groundPosition.x.toFixed(2)}, ${f.annotation.groundPosition.y.toFixed(2)})`);
  console.log(`    Projected: (${f.projected.x.toFixed(2)}, ${f.projected.y.toFixed(2)})`);
  console.log(`    Error: ${f.error.toFixed(3)}m, Region: ${f.region}`);
  console.log(`    BBox center: (${f.bboxCenter.x.toFixed(1)}, ${f.bboxCenter.y.toFixed(1)})`);
}

// Analyze bbox position patterns
console.log(`\n=== BBox Position Analysis (failures vs successes) ===`);
const avgFailBboxX = failures.reduce((s, f) => s + f.bboxCenter.x, 0) / failures.length;
const avgFailBboxY = failures.reduce((s, f) => s + f.bboxCenter.y, 0) / failures.length;
const avgSuccBboxX = successes.reduce((s, f) => s + f.bboxCenter.x, 0) / successes.length;
const avgSuccBboxY = successes.reduce((s, f) => s + f.bboxCenter.y, 0) / successes.length;
console.log(`  Failures avg bbox center: (${avgFailBboxX.toFixed(1)}, ${avgFailBboxY.toFixed(1)})`);
console.log(`  Successes avg bbox center: (${avgSuccBboxX.toFixed(1)}, ${avgSuccBboxY.toFixed(1)})`);

// Analyze by camera and region combined
console.log(`\n=== By Camera + Region ===`);
const camRegions = new Map<string, { failures: number; total: number; avgError: number; errors: number[] }>();
for (const f of [...failures, ...successes]) {
  const key = `${f.detection.cameraId}-${f.region}`;
  const existing = camRegions.get(key) || { failures: 0, total: 0, avgError: 0, errors: [] };
  existing.total++;
  existing.errors.push(f.error);
  if (f.error >= 0.5) existing.failures++;
  camRegions.set(key, existing);
}
for (const [key, data] of [...camRegions.entries()].sort((a, b) => b[1].failures - a[1].failures)) {
  if (data.total >= 3) {
    const accuracy = (((data.total - data.failures) / data.total) * 100).toFixed(1);
    const avgErr = (data.errors.reduce((a, b) => a + b, 0) / data.errors.length).toFixed(3);
    console.log(`  ${key}: ${data.failures} failures / ${data.total} total (${accuracy}% accuracy, avg ${avgErr}m)`);
  }
}

// Analyze error direction (systematic bias)
console.log(`\n=== Error Direction Analysis ===`);
const cam1Errors = [...failures, ...successes].filter((f) => f.detection.cameraId === "camera1");
const cam2Errors = [...failures, ...successes].filter((f) => f.detection.cameraId === "camera2");

function analyzeDirection(cases: FailureCase[], name: string) {
  const dxSum = cases.reduce((s, f) => s + (f.projected.x - f.annotation.groundPosition.x), 0);
  const dySum = cases.reduce((s, f) => s + (f.projected.y - f.annotation.groundPosition.y), 0);
  const avgDx = dxSum / cases.length;
  const avgDy = dySum / cases.length;
  console.log(`  ${name}: avg dx=${avgDx.toFixed(3)}m, avg dy=${avgDy.toFixed(3)}m (bias direction)`);
}

analyzeDirection(cam1Errors, "Camera1");
analyzeDirection(cam2Errors, "Camera2");
