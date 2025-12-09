/**
 * Test if preferring camera1 in split track cases improves accuracy
 *
 * Analysis showed:
 * - 9 split track cases where cameras create separate tracks
 * - 8/9 would pass if we picked the best track
 * - Camera1 overall: 73.2% pass rate
 * - Camera2 overall: ~62% pass rate
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

let mockTime = 1000;

// Test different track selection strategies
interface Result {
  current: number;  // activeTracks[0]
  preferCam1: number;  // Prefer track with camera1
  preferMostDetections: number;  // Prefer track with most detections
  preferBestBbox: number;  // Prefer track with larger/better bbox
}

const results: Result = {
  current: 0,
  preferCam1: 0,
  preferMostDetections: 0,
  preferBestBbox: 0,
};

let splitCases = 0;
let totalPasses = {
  current: 0,
  preferCam1: 0,
  preferMostDetections: 0,
};

for (const annotation of certainAnnotations) {
  const trackManager = new TrackManager({
    clock: () => mockTime,
    idGenerator: (() => { let id = 0; return () => `global-${++id}`; })(),
  });
  const detectionProcessor = new DetectionProcessor(trackManager, cameraRegistry);

  mockTime = Math.floor(annotation.timestamp * 1000) + 1000;

  // Track bbox info per camera
  const bboxByCamera: Record<string, { width: number; height: number }> = {};

  for (const det of annotation.linkedDetections) {
    const bbox = convertBbox(det);
    bboxByCamera[det.cameraId] = {
      width: bbox.width,
      height: bbox.height,
    };
    detectionProcessor.processInjection(det.cameraId, bbox, 0.95, det.trackId);
    mockTime += 10;
  }

  const activeTracks = trackManager.getAllActiveTracks();
  if (activeTracks.length === 0) continue;

  // Current behavior: pick first track
  const currentError = distance(activeTracks[0].currentPosition, annotation.groundPosition);
  if (currentError < 0.5) totalPasses.current++;

  // Strategy 1: Prefer track with camera1 association
  let cam1Track = activeTracks.find(t => t.cameraAssociations.has("camera1"));
  if (!cam1Track) cam1Track = activeTracks[0];
  const cam1Error = distance(cam1Track.currentPosition, annotation.groundPosition);
  if (cam1Error < 0.5) totalPasses.preferCam1++;

  // Strategy 2: Prefer track with most detections
  const mostDetections = activeTracks.reduce((best, t) =>
    t.detectionCount > best.detectionCount ? t : best
  );
  const mostDetectionsError = distance(mostDetections.currentPosition, annotation.groundPosition);
  if (mostDetectionsError < 0.5) totalPasses.preferMostDetections++;

  // Track split cases
  if (activeTracks.length > 1) {
    splitCases++;

    // Analyze split case
    const cam1SplitTrack = activeTracks.find(t => t.cameraAssociations.has("camera1") && !t.cameraAssociations.has("camera2"));
    const cam2SplitTrack = activeTracks.find(t => t.cameraAssociations.has("camera2") && !t.cameraAssociations.has("camera1"));

    if (cam1SplitTrack && cam2SplitTrack) {
      const cam1Err = distance(cam1SplitTrack.currentPosition, annotation.groundPosition);
      const cam2Err = distance(cam2SplitTrack.currentPosition, annotation.groundPosition);

      if (cam1Err < 0.5) results.preferCam1++;
      if (cam2Err < 0.5) results.current++;  // cam2 often comes first

      // Which camera has better bbox (larger)?
      const bbox1 = bboxByCamera["camera1"];
      const bbox2 = bboxByCamera["camera2"];
      if (bbox1 && bbox2) {
        const area1 = bbox1.width * bbox1.height;
        const area2 = bbox2.width * bbox2.height;
        if (area1 > area2) {
          if (cam1Err < 0.5) results.preferBestBbox++;
        } else {
          if (cam2Err < 0.5) results.preferBestBbox++;
        }
      }
    }
  }
}

console.log(`=== Track Selection Strategy Comparison ===`);
console.log(`Total annotations: ${certainAnnotations.length}`);
console.log(`Split track cases: ${splitCases}`);
console.log(`\nOverall accuracy by strategy:`);
console.log(`  Current (activeTracks[0]): ${totalPasses.current}/${certainAnnotations.length} (${(totalPasses.current/certainAnnotations.length*100).toFixed(1)}%)`);
console.log(`  Prefer camera1 track: ${totalPasses.preferCam1}/${certainAnnotations.length} (${(totalPasses.preferCam1/certainAnnotations.length*100).toFixed(1)}%)`);
console.log(`  Prefer most detections: ${totalPasses.preferMostDetections}/${certainAnnotations.length} (${(totalPasses.preferMostDetections/certainAnnotations.length*100).toFixed(1)}%)`);

console.log(`\nSplit track case analysis:`);
console.log(`  Current picks cam2 (usually first): ${results.current}/${splitCases} pass`);
console.log(`  If we picked cam1: ${results.preferCam1}/${splitCases} pass`);
console.log(`  If we picked larger bbox: ${results.preferBestBbox}/${splitCases} pass`);

// What's the gap?
const gap = totalPasses.preferCam1 - totalPasses.current;
console.log(`\nPotential improvement from preferring camera1: ${gap > 0 ? '+' : ''}${gap} passes`);
