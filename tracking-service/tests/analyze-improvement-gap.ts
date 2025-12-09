/**
 * Analyze the gap between current accuracy and theoretical ceiling
 *
 * Current: 105/148 (70.9%)
 * Ceiling: 115/148 (77.7%)
 * Gap: 10 cases
 *
 * Where are these 10 cases?
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

// Categorize each annotation
interface AnnotationResult {
  annotation: Annotation;
  currentError: number;
  currentPasses: boolean;
  bestIndividualError: number;
  bestIndividualPasses: boolean;
  individualProjections: Array<{ camera: string; pos: { x: number; y: number }; error: number }>;
  numTracks: number;
  category: string;  // "pass-both" | "fail-both" | "could-improve" | "unexplained"
}

const results: AnnotationResult[] = [];

for (const annotation of certainAnnotations) {
  // Get individual projections
  const individualProjections: AnnotationResult["individualProjections"] = [];

  for (const det of annotation.linkedDetections) {
    const tempTrackManager = new TrackManager({
      clock: () => mockTime,
      idGenerator: (() => { let id = 0; return () => `temp-${++id}`; })(),
    });
    const tempProcessor = new DetectionProcessor(tempTrackManager, cameraRegistry);

    const bbox = convertBbox(det);
    const track = tempProcessor.processInjection(det.cameraId, bbox, 0.95, det.trackId);

    if (track) {
      const error = distance(track.currentPosition, annotation.groundPosition);
      individualProjections.push({
        camera: det.cameraId,
        pos: { ...track.currentPosition },
        error,
      });
    }
  }

  // Get current behavior
  const trackManager = new TrackManager({
    clock: () => mockTime,
    idGenerator: (() => { let id = 0; return () => `global-${++id}`; })(),
  });
  const processor = new DetectionProcessor(trackManager, cameraRegistry);

  mockTime = Math.floor(annotation.timestamp * 1000) + 1000;

  for (const det of annotation.linkedDetections) {
    const bbox = convertBbox(det);
    processor.processInjection(det.cameraId, bbox, 0.95, det.trackId);
    mockTime += 10;
  }

  const activeTracks = trackManager.getAllActiveTracks();
  const currentError = activeTracks.length > 0
    ? distance(activeTracks[0].currentPosition, annotation.groundPosition)
    : Infinity;

  const bestIndividualError = individualProjections.length > 0
    ? Math.min(...individualProjections.map(p => p.error))
    : Infinity;

  const currentPasses = currentError < 0.5;
  const bestIndividualPasses = bestIndividualError < 0.5;

  let category: string;
  if (currentPasses && bestIndividualPasses) {
    category = "pass-both";
  } else if (!currentPasses && !bestIndividualPasses) {
    category = "fail-both";
  } else if (!currentPasses && bestIndividualPasses) {
    category = "could-improve";
  } else {
    category = "unexpected";  // current passes but best individual fails?
  }

  results.push({
    annotation,
    currentError,
    currentPasses,
    bestIndividualError,
    bestIndividualPasses,
    individualProjections,
    numTracks: activeTracks.length,
    category,
  });
}

// Analyze results
const byCategory = {
  passBoth: results.filter(r => r.category === "pass-both"),
  failBoth: results.filter(r => r.category === "fail-both"),
  couldImprove: results.filter(r => r.category === "could-improve"),
  unexpected: results.filter(r => r.category === "unexpected"),
};

console.log("=== Gap Analysis ===");
console.log(`Total: ${results.length}`);
console.log(`  Pass both: ${byCategory.passBoth.length}`);
console.log(`  Fail both (ceiling): ${byCategory.failBoth.length}`);
console.log(`  Could improve: ${byCategory.couldImprove.length}`);
console.log(`  Unexpected: ${byCategory.unexpected.length}`);

console.log(`\n=== Could Improve Cases (${byCategory.couldImprove.length}) ===`);
console.log("These fail with current behavior but have at least one good individual projection\n");

for (const r of byCategory.couldImprove) {
  const gt = r.annotation.groundPosition;
  console.log(`${r.annotation.id}:`);
  console.log(`  Ground truth: (${gt.x.toFixed(2)}, ${gt.y.toFixed(2)})`);
  console.log(`  Current error: ${r.currentError.toFixed(3)}m (${r.numTracks} tracks)`);
  console.log(`  Best individual: ${r.bestIndividualError.toFixed(3)}m`);

  // Show individual projections
  for (const proj of r.individualProjections) {
    const marker = proj.error < 0.5 ? "✓" : "✗";
    console.log(`    ${proj.camera}: (${proj.pos.x.toFixed(2)}, ${proj.pos.y.toFixed(2)}) err=${proj.error.toFixed(3)}m ${marker}`);
  }

  // Analyze why current fails
  if (r.numTracks === 1 && r.individualProjections.length > 1) {
    // Single track but multiple cameras - merge pulled it wrong
    const goodProj = r.individualProjections.find(p => p.error < 0.5);
    const badProj = r.individualProjections.find(p => p.error >= 0.5);
    if (goodProj && badProj) {
      console.log(`  -> Merged track pulled toward ${badProj.camera} (bad: ${badProj.error.toFixed(3)}m)`);
    }
  } else if (r.numTracks > 1) {
    // Split tracks - picked wrong one
    console.log(`  -> Split into ${r.numTracks} tracks, picked wrong one`);
  } else if (r.individualProjections.length === 1) {
    // Single camera
    console.log(`  -> Single camera, no alternatives`);
  }
  console.log("");
}

// Summarize root causes
console.log("=== Root Cause Summary ===");
const rootCauses = {
  mergePullsWrong: 0,
  splitPicksWrong: 0,
  singleCamera: 0,
  other: 0,
};

for (const r of byCategory.couldImprove) {
  if (r.numTracks === 1 && r.individualProjections.length > 1) {
    rootCauses.mergePullsWrong++;
  } else if (r.numTracks > 1) {
    rootCauses.splitPicksWrong++;
  } else if (r.individualProjections.length === 1) {
    rootCauses.singleCamera++;
  } else {
    rootCauses.other++;
  }
}

console.log(`  Merged track pulled wrong: ${rootCauses.mergePullsWrong}`);
console.log(`  Split tracks, picked wrong: ${rootCauses.splitPicksWrong}`);
console.log(`  Single camera (no alternative): ${rootCauses.singleCamera}`);
console.log(`  Other: ${rootCauses.other}`);
