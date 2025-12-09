/**
 * Calculate the theoretical accuracy ceiling if we could always pick the best projection
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

let mockTime = 1000;

// Calculate different accuracy metrics
let currentPasses = 0;  // What test currently gets
let bestTrackPasses = 0; // If we always picked the best track
let bestProjectionPasses = 0; // If we always picked the best individual projection
let centroidPasses = 0; // If we used centroid of all projections

for (const annotation of certainAnnotations) {
  // Get individual projections
  const projections: Array<{ position: { x: number; y: number }; error: number }> = [];

  for (const det of annotation.linkedDetections) {
    const trackManager = new TrackManager({
      clock: () => mockTime,
      idGenerator: (() => { let id = 0; return () => `temp-${++id}`; })(),
    });
    const processor = new DetectionProcessor(trackManager, cameraRegistry);

    const bbox = convertBbox(det);
    const track = processor.processInjection(det.cameraId, bbox, 0.95, det.trackId);

    if (track) {
      const error = distance(track.currentPosition, annotation.groundPosition);
      projections.push({ position: { ...track.currentPosition }, error });
    }
  }

  if (projections.length === 0) continue;

  // Current behavior (process through track manager)
  const mainTrackManager = new TrackManager({
    clock: () => mockTime,
    idGenerator: (() => { let id = 0; return () => `global-${++id}`; })(),
  });
  const mainProcessor = new DetectionProcessor(mainTrackManager, cameraRegistry);

  mockTime = Math.floor(annotation.timestamp * 1000) + 1000;

  for (const det of annotation.linkedDetections) {
    const bbox = convertBbox(det);
    mainProcessor.processInjection(det.cameraId, bbox, 0.95, det.trackId);
    mockTime += 10;
  }

  const activeTracks = mainTrackManager.getAllActiveTracks();
  if (activeTracks.length > 0) {
    const currentError = distance(activeTracks[0].currentPosition, annotation.groundPosition);
    if (currentError < 0.5) currentPasses++;

    // Best track (among all active)
    let bestError = Infinity;
    for (const track of activeTracks) {
      const error = distance(track.currentPosition, annotation.groundPosition);
      if (error < bestError) bestError = error;
    }
    if (bestError < 0.5) bestTrackPasses++;
  }

  // Best individual projection
  const bestProjError = Math.min(...projections.map(p => p.error));
  if (bestProjError < 0.5) bestProjectionPasses++;

  // Centroid of all projections
  if (projections.length > 0) {
    const centroid = {
      x: projections.reduce((s, p) => s + p.position.x, 0) / projections.length,
      y: projections.reduce((s, p) => s + p.position.y, 0) / projections.length,
    };
    const centroidError = distance(centroid, annotation.groundPosition);
    if (centroidError < 0.5) centroidPasses++;
  }
}

const total = certainAnnotations.length;

console.log(`=== Theoretical Accuracy Ceiling ===\n`);
console.log(`Total annotations: ${total}\n`);
console.log(`Current behavior (activeTracks[0]):      ${currentPasses}/${total} (${(currentPasses/total*100).toFixed(1)}%)`);
console.log(`If we picked best active track:          ${bestTrackPasses}/${total} (${(bestTrackPasses/total*100).toFixed(1)}%)`);
console.log(`If we picked best individual projection: ${bestProjectionPasses}/${total} (${(bestProjectionPasses/total*100).toFixed(1)}%)`);
console.log(`If we used centroid of all projections:  ${centroidPasses}/${total} (${(centroidPasses/total*100).toFixed(1)}%)`);

console.log(`\n=== Gap Analysis ===`);
console.log(`Target: 90% = ${Math.ceil(total * 0.9)}/${total}`);
console.log(`Gap from current: ${Math.ceil(total * 0.9) - currentPasses} more passes needed`);
console.log(`Gap from best projection ceiling: ${Math.ceil(total * 0.9) - bestProjectionPasses}`);

// Cases that fail even with best projection
const impossibleCases = total - bestProjectionPasses;
console.log(`\nCases that fail even with best projection: ${impossibleCases}`);
console.log(`These require better calibration or are GT errors.`);
