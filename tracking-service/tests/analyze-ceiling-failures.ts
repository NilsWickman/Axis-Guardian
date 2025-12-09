/**
 * Analyze the 33 cases that fail even with the best individual projection
 * These represent the absolute ceiling - we need better calibration for these
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

interface FailingCase {
  annotation: Annotation;
  bestError: number;
  projections: Array<{
    cameraId: string;
    projected: { x: number; y: number };
    error: number;
    bbox: { left: number; top: number; right: number; bottom: number };
    bboxCenter: { x: number; y: number };
    bboxSize: { width: number; height: number };
  }>;
}

const failingCases: FailingCase[] = [];
let mockTime = 1000;

for (const annotation of certainAnnotations) {
  const projections: FailingCase["projections"] = [];

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
      projections.push({
        cameraId: det.cameraId,
        projected: { ...track.currentPosition },
        error,
        bbox: det.bbox,
        bboxCenter: {
          x: (det.bbox.left + det.bbox.right) / 2,
          y: (det.bbox.top + det.bbox.bottom) / 2,
        },
        bboxSize: {
          width: det.bbox.right - det.bbox.left,
          height: det.bbox.bottom - det.bbox.top,
        },
      });
    }
  }

  if (projections.length === 0) continue;

  const bestError = Math.min(...projections.map(p => p.error));
  if (bestError >= 0.5) {
    failingCases.push({
      annotation,
      bestError,
      projections,
    });
  }
}

console.log(`=== Ceiling Failure Analysis ===`);
console.log(`Total ceiling failures: ${failingCases.length}`);

// Sort by error
failingCases.sort((a, b) => b.bestError - a.bestError);

// Analyze by ground truth location
const byRegion = {
  nearY: failingCases.filter(f => f.annotation.groundPosition.y < 2),
  midY: failingCases.filter(f => f.annotation.groundPosition.y >= 2 && f.annotation.groundPosition.y < 8),
  farY: failingCases.filter(f => f.annotation.groundPosition.y >= 8),
  leftX: failingCases.filter(f => f.annotation.groundPosition.x < 6),
  centerX: failingCases.filter(f => f.annotation.groundPosition.x >= 6 && f.annotation.groundPosition.x < 12),
  rightX: failingCases.filter(f => f.annotation.groundPosition.x >= 12),
};

console.log(`\nBy ground truth Y position:`);
console.log(`  Near wall (Y<2m): ${byRegion.nearY.length}`);
console.log(`  Middle (2-8m): ${byRegion.midY.length}`);
console.log(`  Far wall (Y>=8m): ${byRegion.farY.length}`);

console.log(`\nBy ground truth X position:`);
console.log(`  Left (X<6m): ${byRegion.leftX.length}`);
console.log(`  Center (6-12m): ${byRegion.centerX.length}`);
console.log(`  Right (X>=12m): ${byRegion.rightX.length}`);

// Analyze by camera availability
const singleCam = failingCases.filter(f => f.projections.length === 1);
const multiCam = failingCases.filter(f => f.projections.length > 1);
const cam1Only = singleCam.filter(f => f.projections[0].cameraId === "camera1");
const cam2Only = singleCam.filter(f => f.projections[0].cameraId === "camera2");

console.log(`\nBy camera coverage:`);
console.log(`  Single camera: ${singleCam.length}`);
console.log(`    Camera1 only: ${cam1Only.length}`);
console.log(`    Camera2 only: ${cam2Only.length}`);
console.log(`  Multi-camera (both fail): ${multiCam.length}`);

// Analyze bbox position for failing cases
console.log(`\n=== Bbox Position Analysis ===`);

const cam1Projs = failingCases.flatMap(f => f.projections.filter(p => p.cameraId === "camera1"));
const cam2Projs = failingCases.flatMap(f => f.projections.filter(p => p.cameraId === "camera2"));

if (cam1Projs.length > 0) {
  console.log(`\nCamera1 failing projections (${cam1Projs.length}):`);
  const leftCount = cam1Projs.filter(p => p.bboxCenter.x < 0.33).length;
  const centerCount = cam1Projs.filter(p => p.bboxCenter.x >= 0.33 && p.bboxCenter.x <= 0.67).length;
  const rightCount = cam1Projs.filter(p => p.bboxCenter.x > 0.67).length;
  console.log(`  Bbox X: left=${leftCount}, center=${centerCount}, right=${rightCount}`);

  const topCount = cam1Projs.filter(p => p.bboxCenter.y < 0.5).length;
  const bottomCount = cam1Projs.filter(p => p.bboxCenter.y >= 0.5).length;
  console.log(`  Bbox Y: top=${topCount}, bottom=${bottomCount}`);

  const avgError = cam1Projs.reduce((s, p) => s + p.error, 0) / cam1Projs.length;
  console.log(`  Avg error: ${avgError.toFixed(3)}m`);
}

if (cam2Projs.length > 0) {
  console.log(`\nCamera2 failing projections (${cam2Projs.length}):`);
  const leftCount = cam2Projs.filter(p => p.bboxCenter.x < 0.33).length;
  const centerCount = cam2Projs.filter(p => p.bboxCenter.x >= 0.33 && p.bboxCenter.x <= 0.67).length;
  const rightCount = cam2Projs.filter(p => p.bboxCenter.x > 0.67).length;
  console.log(`  Bbox X: left=${leftCount}, center=${centerCount}, right=${rightCount}`);

  const topCount = cam2Projs.filter(p => p.bboxCenter.y < 0.5).length;
  const bottomCount = cam2Projs.filter(p => p.bboxCenter.y >= 0.5).length;
  console.log(`  Bbox Y: top=${topCount}, bottom=${bottomCount}`);

  const avgError = cam2Projs.reduce((s, p) => s + p.error, 0) / cam2Projs.length;
  console.log(`  Avg error: ${avgError.toFixed(3)}m`);
}

// Show worst cases with details
console.log(`\n=== Worst Ceiling Failures (Top 15) ===\n`);

for (const fail of failingCases.slice(0, 15)) {
  const gt = fail.annotation.groundPosition;
  console.log(`${fail.annotation.id}:`);
  console.log(`  Ground truth: (${gt.x.toFixed(2)}, ${gt.y.toFixed(2)})`);
  console.log(`  Best error: ${fail.bestError.toFixed(3)}m`);

  for (const p of fail.projections) {
    const errorDir = {
      x: p.projected.x - gt.x,
      y: p.projected.y - gt.y,
    };
    console.log(`  ${p.cameraId}: proj=(${p.projected.x.toFixed(2)}, ${p.projected.y.toFixed(2)}) err=${p.error.toFixed(3)}m`);
    console.log(`    bbox center=(${p.bboxCenter.x.toFixed(3)}, ${p.bboxCenter.y.toFixed(3)})`);
    console.log(`    error direction: dx=${errorDir.x.toFixed(2)}m, dy=${errorDir.y.toFixed(2)}m`);
  }
  console.log("");
}

// Analyze error direction patterns
console.log(`=== Error Direction Patterns ===\n`);

const cam1Errors = cam1Projs.map(p => {
  const fail = failingCases.find(f => f.projections.includes(p))!;
  return {
    dx: p.projected.x - fail.annotation.groundPosition.x,
    dy: p.projected.y - fail.annotation.groundPosition.y,
  };
});

const cam2Errors = cam2Projs.map(p => {
  const fail = failingCases.find(f => f.projections.includes(p))!;
  return {
    dx: p.projected.x - fail.annotation.groundPosition.x,
    dy: p.projected.y - fail.annotation.groundPosition.y,
  };
});

if (cam1Errors.length > 0) {
  const avgDx = cam1Errors.reduce((s, e) => s + e.dx, 0) / cam1Errors.length;
  const avgDy = cam1Errors.reduce((s, e) => s + e.dy, 0) / cam1Errors.length;
  const stdDx = Math.sqrt(cam1Errors.reduce((s, e) => s + Math.pow(e.dx - avgDx, 2), 0) / cam1Errors.length);
  const stdDy = Math.sqrt(cam1Errors.reduce((s, e) => s + Math.pow(e.dy - avgDy, 2), 0) / cam1Errors.length);
  console.log(`Camera1 error direction (failing cases only):`);
  console.log(`  Average: dx=${avgDx.toFixed(3)}m, dy=${avgDy.toFixed(3)}m`);
  console.log(`  Std dev: dx=${stdDx.toFixed(3)}m, dy=${stdDy.toFixed(3)}m`);
}

if (cam2Errors.length > 0) {
  const avgDx = cam2Errors.reduce((s, e) => s + e.dx, 0) / cam2Errors.length;
  const avgDy = cam2Errors.reduce((s, e) => s + e.dy, 0) / cam2Errors.length;
  const stdDx = Math.sqrt(cam2Errors.reduce((s, e) => s + Math.pow(e.dx - avgDx, 2), 0) / cam2Errors.length);
  const stdDy = Math.sqrt(cam2Errors.reduce((s, e) => s + Math.pow(e.dy - avgDy, 2), 0) / cam2Errors.length);
  console.log(`Camera2 error direction (failing cases only):`);
  console.log(`  Average: dx=${avgDx.toFixed(3)}m, dy=${avgDy.toFixed(3)}m`);
  console.log(`  Std dev: dx=${stdDx.toFixed(3)}m, dy=${stdDy.toFixed(3)}m`);
}
