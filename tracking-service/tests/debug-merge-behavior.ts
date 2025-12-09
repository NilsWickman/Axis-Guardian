/**
 * Debug the merging behavior for specific failing cases
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

// Get the specific failing cases
const certainAnnotations = groundTruth.annotations.filter((a: Annotation) => a.confidence === "certain");
const multiCameraAnnotations = certainAnnotations.filter((a: Annotation) => a.linkedDetections.length >= 2);

console.log(`=== Debugging Multi-Camera Merge Behavior ===\n`);

// Pick a few specific failing cases to debug
const testCases = [
  // Frame 926 - cam1 good (0.487m), cam2 bad (2.99m)
  multiCameraAnnotations.find((a: Annotation) => a.linkedDetections.some(d => d.frameNumber === 926)),
  // Frame 416 - cam1 good (0.154m), cam2 bad (2.425m)
  multiCameraAnnotations.find((a: Annotation) => a.linkedDetections.some(d => d.frameNumber === 416)),
].filter(Boolean);

let mockTime = 1000;

for (const annotation of testCases.slice(0, 3)) {
  console.log(`\n--- Annotation: ${annotation.id} ---`);
  console.log(`Frame numbers: ${annotation.linkedDetections.map((d: LinkedDetection) => d.frameNumber).join(", ")}`);
  console.log(`Ground truth: (${annotation.groundPosition.x.toFixed(2)}, ${annotation.groundPosition.y.toFixed(2)})`);

  // Process like the test does
  const trackManager = new TrackManager({
    clock: () => mockTime,
    idGenerator: (() => { let id = 0; return () => `global-${++id}`; })(),
  });
  const detectionProcessor = new DetectionProcessor(trackManager, cameraRegistry);

  mockTime = Math.floor(annotation.timestamp * 1000) + 1000;

  const projectedPositions: Array<{ camera: string; position: { x: number; y: number }; trackId: string }> = [];

  console.log(`\nProcessing detections in order:`);
  for (const det of annotation.linkedDetections) {
    const bbox = convertBbox(det);
    console.log(`  ${det.cameraId}: bbox=(${bbox.x.toFixed(3)}, ${bbox.y.toFixed(3)}, ${bbox.width.toFixed(3)}, ${bbox.height.toFixed(3)})`);

    const track = detectionProcessor.processInjection(det.cameraId, bbox, 0.95, det.trackId);
    if (track) {
      console.log(`    -> Projected to: (${track.currentPosition.x.toFixed(2)}, ${track.currentPosition.y.toFixed(2)})`);
      console.log(`    -> Assigned to track: ${track.globalTrackId}`);
      projectedPositions.push({
        camera: det.cameraId,
        position: { ...track.currentPosition },
        trackId: track.globalTrackId,
      });
    }
    mockTime += 10;
  }

  // Check how many tracks were created
  const activeTracks = trackManager.getAllActiveTracks();
  console.log(`\nActive tracks after processing: ${activeTracks.length}`);
  for (const track of activeTracks) {
    const cameras = Array.from(track.cameraAssociations.keys());
    console.log(`  Track ${track.globalTrackId}: position=(${track.currentPosition.x.toFixed(2)}, ${track.currentPosition.y.toFixed(2)}), cameras=[${cameras.join(", ")}]`);
  }

  // Calculate distance between camera projections
  if (projectedPositions.length >= 2) {
    const proj1 = projectedPositions[0];
    const proj2 = projectedPositions[1];
    const projDist = distance(proj1.position, proj2.position);
    console.log(`\nProjection distance between cameras: ${projDist.toFixed(3)}m`);

    if (proj1.trackId !== proj2.trackId) {
      console.log(`  -> Cameras created SEPARATE tracks! (projDist > correlationDistanceM)`);
    } else {
      console.log(`  -> Cameras merged into SAME track`);
    }
  }

  // What the test picks
  const finalPosition = activeTracks[0]?.currentPosition || { x: 0, y: 0 };
  const finalError = distance(finalPosition, annotation.groundPosition);
  console.log(`\nTest picks activeTracks[0]: (${finalPosition.x.toFixed(2)}, ${finalPosition.y.toFixed(2)})`);
  console.log(`Error: ${finalError.toFixed(3)}m ${finalError < 0.5 ? '✓ PASS' : '✗ FAIL'}`);

  // What if we used the centroid of all tracks?
  if (activeTracks.length > 1) {
    const centroid = {
      x: activeTracks.reduce((s, t) => s + t.currentPosition.x, 0) / activeTracks.length,
      y: activeTracks.reduce((s, t) => s + t.currentPosition.y, 0) / activeTracks.length,
    };
    const centroidError = distance(centroid, annotation.groundPosition);
    console.log(`If we used centroid of all tracks: (${centroid.x.toFixed(2)}, ${centroid.y.toFixed(2)})`);
    console.log(`  Centroid error: ${centroidError.toFixed(3)}m ${centroidError < 0.5 ? '✓ PASS' : '✗ FAIL'}`);

    // What if we picked the best track?
    let bestTrack = activeTracks[0];
    let bestError = distance(bestTrack.currentPosition, annotation.groundPosition);
    for (const track of activeTracks) {
      const error = distance(track.currentPosition, annotation.groundPosition);
      if (error < bestError) {
        bestError = error;
        bestTrack = track;
      }
    }
    console.log(`If we picked best track: (${bestTrack.currentPosition.x.toFixed(2)}, ${bestTrack.currentPosition.y.toFixed(2)})`);
    console.log(`  Best track error: ${bestError.toFixed(3)}m ${bestError < 0.5 ? '✓ PASS' : '✗ FAIL'}`);
  }
}

// Now test: how many failures are due to split tracks?
console.log(`\n\n=== Split Track Analysis ===`);

let splitTrackCases = 0;
let mergedTrackCases = 0;
let splitButBestPasses = 0;
let splitButCentroidPasses = 0;

for (const annotation of multiCameraAnnotations) {
  const trackManager = new TrackManager({
    clock: () => mockTime,
    idGenerator: (() => { let id = 0; return () => `test-${++id}`; })(),
  });
  const detectionProcessor = new DetectionProcessor(trackManager, cameraRegistry);

  mockTime = Math.floor(annotation.timestamp * 1000) + 1000;

  for (const det of annotation.linkedDetections) {
    const bbox = convertBbox(det);
    detectionProcessor.processInjection(det.cameraId, bbox, 0.95, det.trackId);
    mockTime += 10;
  }

  const activeTracks = trackManager.getAllActiveTracks();

  if (activeTracks.length > 1) {
    splitTrackCases++;

    // Check if best track or centroid would pass
    let bestError = Infinity;
    for (const track of activeTracks) {
      const error = distance(track.currentPosition, annotation.groundPosition);
      bestError = Math.min(bestError, error);
    }
    if (bestError < 0.5) splitButBestPasses++;

    const centroid = {
      x: activeTracks.reduce((s, t) => s + t.currentPosition.x, 0) / activeTracks.length,
      y: activeTracks.reduce((s, t) => s + t.currentPosition.y, 0) / activeTracks.length,
    };
    const centroidError = distance(centroid, annotation.groundPosition);
    if (centroidError < 0.5) splitButCentroidPasses++;
  } else {
    mergedTrackCases++;
  }
}

console.log(`Multi-camera annotations: ${multiCameraAnnotations.length}`);
console.log(`  Merged into single track: ${mergedTrackCases}`);
console.log(`  Split into multiple tracks: ${splitTrackCases}`);
console.log(`\nOf split track cases:`);
console.log(`  Would pass if using best track: ${splitButBestPasses}/${splitTrackCases}`);
console.log(`  Would pass if using centroid: ${splitButCentroidPasses}/${splitTrackCases}`);
