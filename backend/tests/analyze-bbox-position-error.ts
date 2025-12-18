/**
 * Analyze correlation between bbox position in image and projection error
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

const certainAnnotations = groundTruth.annotations.filter((a: Annotation) => a.confidence === "certain");

// Collect individual detection errors with bbox info
interface DetectionResult {
  cameraId: string;
  bboxCenterX: number;  // normalized 0-1
  bboxCenterY: number;  // normalized 0-1
  bboxBottom: number;   // normalized 0-1 (where feet are)
  bboxWidth: number;    // normalized
  bboxHeight: number;   // normalized
  groundY: number;      // world Y coordinate
  error: number;
}

const detectionResults: DetectionResult[] = [];
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
      const error = distance(track.currentPosition, annotation.groundPosition);

      detectionResults.push({
        cameraId: det.cameraId,
        bboxCenterX: (det.bbox.left + det.bbox.right) / 2,
        bboxCenterY: (det.bbox.top + det.bbox.bottom) / 2,
        bboxBottom: det.bbox.bottom,
        bboxWidth: det.bbox.right - det.bbox.left,
        bboxHeight: det.bbox.bottom - det.bbox.top,
        groundY: annotation.groundPosition.y,
        error,
      });
    }
  }
}

console.log(`Total detections: ${detectionResults.length}\n`);

// Analyze by camera
for (const camera of ["camera1", "camera2"]) {
  const camResults = detectionResults.filter(d => d.cameraId === camera);

  console.log(`=== ${camera} ===`);
  console.log(`Total: ${camResults.length}`);

  // By bbox X position (left/center/right of image)
  const leftRegion = camResults.filter(d => d.bboxCenterX < 0.33);
  const centerRegion = camResults.filter(d => d.bboxCenterX >= 0.33 && d.bboxCenterX <= 0.67);
  const rightRegion = camResults.filter(d => d.bboxCenterX > 0.67);

  const leftAvgError = leftRegion.reduce((s, d) => s + d.error, 0) / leftRegion.length;
  const centerAvgError = centerRegion.reduce((s, d) => s + d.error, 0) / centerRegion.length;
  const rightAvgError = rightRegion.reduce((s, d) => s + d.error, 0) / rightRegion.length;

  const leftPass = leftRegion.filter(d => d.error < 0.5).length / leftRegion.length * 100;
  const centerPass = centerRegion.filter(d => d.error < 0.5).length / centerRegion.length * 100;
  const rightPass = rightRegion.filter(d => d.error < 0.5).length / rightRegion.length * 100;

  console.log(`\nBy bbox X position:`);
  console.log(`  Left (X<0.33):   n=${leftRegion.length}, avg error=${leftAvgError.toFixed(3)}m, pass=${leftPass.toFixed(1)}%`);
  console.log(`  Center (0.33-0.67): n=${centerRegion.length}, avg error=${centerAvgError.toFixed(3)}m, pass=${centerPass.toFixed(1)}%`);
  console.log(`  Right (X>0.67):  n=${rightRegion.length}, avg error=${rightAvgError.toFixed(3)}m, pass=${rightPass.toFixed(1)}%`);

  // By bbox Y position (top/middle/bottom of image)
  const topRegion = camResults.filter(d => d.bboxBottom < 0.5);
  const middleRegion = camResults.filter(d => d.bboxBottom >= 0.5 && d.bboxBottom <= 0.75);
  const bottomRegion = camResults.filter(d => d.bboxBottom > 0.75);

  const topAvgError = topRegion.reduce((s, d) => s + d.error, 0) / topRegion.length;
  const middleAvgError = middleRegion.reduce((s, d) => s + d.error, 0) / middleRegion.length;
  const bottomAvgError = bottomRegion.reduce((s, d) => s + d.error, 0) / bottomRegion.length;

  const topPass = topRegion.filter(d => d.error < 0.5).length / topRegion.length * 100;
  const middlePass = middleRegion.filter(d => d.error < 0.5).length / middleRegion.length * 100;
  const bottomPass = bottomRegion.filter(d => d.error < 0.5).length / bottomRegion.length * 100;

  console.log(`\nBy bbox bottom Y position (feet location):`);
  console.log(`  Top (Y<0.5):     n=${topRegion.length}, avg error=${topAvgError.toFixed(3)}m, pass=${topPass.toFixed(1)}%`);
  console.log(`  Middle (0.5-0.75): n=${middleRegion.length}, avg error=${middleAvgError.toFixed(3)}m, pass=${middlePass.toFixed(1)}%`);
  console.log(`  Bottom (Y>0.75): n=${bottomRegion.length}, avg error=${bottomAvgError.toFixed(3)}m, pass=${bottomPass.toFixed(1)}%`);

  // By ground truth Y (world position)
  const nearWall = camResults.filter(d => d.groundY < 3);
  const midRoom = camResults.filter(d => d.groundY >= 3 && d.groundY <= 7);
  const farWall = camResults.filter(d => d.groundY > 7);

  console.log(`\nBy ground truth Y (world position):`);
  if (nearWall.length > 0) {
    const err = nearWall.reduce((s, d) => s + d.error, 0) / nearWall.length;
    const pass = nearWall.filter(d => d.error < 0.5).length / nearWall.length * 100;
    console.log(`  Near (Y<3m):     n=${nearWall.length}, avg error=${err.toFixed(3)}m, pass=${pass.toFixed(1)}%`);
  }
  if (midRoom.length > 0) {
    const err = midRoom.reduce((s, d) => s + d.error, 0) / midRoom.length;
    const pass = midRoom.filter(d => d.error < 0.5).length / midRoom.length * 100;
    console.log(`  Middle (3-7m):   n=${midRoom.length}, avg error=${err.toFixed(3)}m, pass=${pass.toFixed(1)}%`);
  }
  if (farWall.length > 0) {
    const err = farWall.reduce((s, d) => s + d.error, 0) / farWall.length;
    const pass = farWall.filter(d => d.error < 0.5).length / farWall.length * 100;
    console.log(`  Far (Y>7m):      n=${farWall.length}, avg error=${err.toFixed(3)}m, pass=${pass.toFixed(1)}%`);
  }

  console.log("");
}

// Find strongest correlations
console.log(`=== Strongest Error Correlations ===\n`);

// Camera2 specific - check right side
const cam2Right = detectionResults.filter(d => d.cameraId === "camera2" && d.bboxCenterX > 0.67);
const cam2RightNearWall = cam2Right.filter(d => d.groundY < 3);
const cam2RightMid = cam2Right.filter(d => d.groundY >= 3);

console.log(`Camera2 right side (X>0.67):`);
console.log(`  Near wall (Y<3m): n=${cam2RightNearWall.length}, avg error=${(cam2RightNearWall.reduce((s, d) => s + d.error, 0) / cam2RightNearWall.length).toFixed(3)}m`);
console.log(`  Mid/far (Y>=3m):  n=${cam2RightMid.length}, avg error=${(cam2RightMid.reduce((s, d) => s + d.error, 0) / cam2RightMid.length).toFixed(3)}m`);
