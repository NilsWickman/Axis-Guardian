/**
 * Analyze whether seated extension helps or hurts accuracy
 */
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { CameraRegistry } from "../src/detection/camera-registry.js";
import { loadSiteMapConfig } from "../src/config/sitemap-loader.js";
import { getBBoxBottomCenter, projectWithKRT, estimateBBoxHeightExtension } from "../src/projection/ground-plane.js";
import { undistortPoint } from "../src/projection/lens-distortion.js";

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

interface Result {
  annotationId: string;
  frameNumber: number;
  cameraId: string;
  trackId: number;
  groundX: number;
  groundY: number;
  errorWithExtension: number;
  errorWithoutExtension: number;
  extensionFactor: number;
  bboxAspectRatio: number;
}

const results: Result[] = [];

for (const ann of groundTruth.annotations as Annotation[]) {
  if (ann.confidence !== "certain") continue;

  for (const det of ann.linkedDetections) {
    const calib = cameraRegistry.getCalibration(det.cameraId);
    if (!calib) continue;

    const bbox = {
      x: det.bbox.left,
      y: det.bbox.top,
      width: det.bbox.right - det.bbox.left,
      height: det.bbox.bottom - det.bbox.top,
    };

    // Calculate aspect ratio
    const bboxHeightPx = bbox.height * 1080;
    const bboxWidthPx = bbox.width * 1920;
    const aspectRatio = bboxHeightPx / bboxWidthPx;

    // Get extension factor
    const extensionFactor = estimateBBoxHeightExtension(bbox, null, [], true, 1920, 1080);

    // Project WITH extension
    const feetWithExt = getBBoxBottomCenter(bbox, null, [], true, 1920, 1080, true);
    let footXWith = feetWithExt.x;
    let footYWith = feetWithExt.y;

    if (calib.distortion) {
      const corrected = undistortPoint(footXWith, footYWith, calib.K[0][0], calib.K[1][1], calib.center[0], calib.center[1], calib.distortion);
      footXWith = corrected.x;
      footYWith = corrected.y;
    }

    const resultWith = projectWithKRT(footXWith, footYWith, calib);

    // Project WITHOUT extension
    const feetWithoutExt = getBBoxBottomCenter(bbox, null, [], true, 1920, 1080, false);
    let footXWithout = feetWithoutExt.x;
    let footYWithout = feetWithoutExt.y;

    if (calib.distortion) {
      const corrected = undistortPoint(footXWithout, footYWithout, calib.K[0][0], calib.K[1][1], calib.center[0], calib.center[1], calib.distortion);
      footXWithout = corrected.x;
      footYWithout = corrected.y;
    }

    const resultWithout = projectWithKRT(footXWithout, footYWithout, calib);

    if (!resultWith.isValid || !resultWithout.isValid) continue;

    const errorWith = Math.sqrt(
      Math.pow(resultWith.worldPoint.x - ann.groundPosition.x, 2) +
      Math.pow(resultWith.worldPoint.y - ann.groundPosition.y, 2)
    );

    const errorWithout = Math.sqrt(
      Math.pow(resultWithout.worldPoint.x - ann.groundPosition.x, 2) +
      Math.pow(resultWithout.worldPoint.y - ann.groundPosition.y, 2)
    );

    results.push({
      annotationId: ann.id,
      frameNumber: det.frameNumber,
      cameraId: det.cameraId,
      trackId: det.trackId,
      groundX: ann.groundPosition.x,
      groundY: ann.groundPosition.y,
      errorWithExtension: errorWith,
      errorWithoutExtension: errorWithout,
      extensionFactor,
      bboxAspectRatio: aspectRatio,
    });
  }
}

console.log(`Total results: ${results.length}`);

// Summary statistics
const passedWithExt = results.filter(r => r.errorWithExtension < 0.5).length;
const passedWithoutExt = results.filter(r => r.errorWithoutExtension < 0.5).length;

const avgErrorWith = results.reduce((s, r) => s + r.errorWithExtension, 0) / results.length;
const avgErrorWithout = results.reduce((s, r) => s + r.errorWithoutExtension, 0) / results.length;

console.log(`\n=== Overall Comparison ===`);
console.log(`WITH seated extension:    ${passedWithExt} passed (${(passedWithExt/results.length*100).toFixed(1)}%), avg error ${avgErrorWith.toFixed(3)}m`);
console.log(`WITHOUT seated extension: ${passedWithoutExt} passed (${(passedWithoutExt/results.length*100).toFixed(1)}%), avg error ${avgErrorWithout.toFixed(3)}m`);

// Count where extension helps vs hurts
const extensionHelps = results.filter(r => r.errorWithExtension < r.errorWithoutExtension).length;
const extensionHurts = results.filter(r => r.errorWithExtension > r.errorWithoutExtension).length;
const extensionSame = results.filter(r => Math.abs(r.errorWithExtension - r.errorWithoutExtension) < 0.001).length;

console.log(`\n=== Extension Impact ===`);
console.log(`Extension helps: ${extensionHelps} (${(extensionHelps/results.length*100).toFixed(1)}%)`);
console.log(`Extension hurts: ${extensionHurts} (${(extensionHurts/results.length*100).toFixed(1)}%)`);
console.log(`No difference: ${extensionSame} (${(extensionSame/results.length*100).toFixed(1)}%)`);

// By extension factor
console.log(`\n=== By Extension Factor ===`);
const byFactor = new Map<string, { helps: number; hurts: number; total: number }>();
for (const r of results) {
  let bucket: string;
  if (r.extensionFactor <= 1.0) bucket = "1.0 (none)";
  else if (r.extensionFactor <= 1.2) bucket = "1.0-1.2";
  else if (r.extensionFactor <= 1.4) bucket = "1.2-1.4";
  else if (r.extensionFactor <= 1.6) bucket = "1.4-1.6";
  else bucket = "1.6+";

  const existing = byFactor.get(bucket) || { helps: 0, hurts: 0, total: 0 };
  existing.total++;
  if (r.errorWithExtension < r.errorWithoutExtension) existing.helps++;
  else if (r.errorWithExtension > r.errorWithoutExtension) existing.hurts++;
  byFactor.set(bucket, existing);
}

for (const [bucket, data] of [...byFactor.entries()].sort()) {
  const helpsRate = (data.helps / data.total * 100).toFixed(1);
  const hurtsRate = (data.hurts / data.total * 100).toFixed(1);
  console.log(`  ${bucket}: ${data.total} total, helps ${helpsRate}%, hurts ${hurtsRate}%`);
}

// By camera
console.log(`\n=== By Camera ===`);
for (const cam of ["camera1", "camera2"]) {
  const camResults = results.filter(r => r.cameraId === cam);
  const camPassedWith = camResults.filter(r => r.errorWithExtension < 0.5).length;
  const camPassedWithout = camResults.filter(r => r.errorWithoutExtension < 0.5).length;
  console.log(`${cam}:`);
  console.log(`  WITH ext:    ${camPassedWith}/${camResults.length} (${(camPassedWith/camResults.length*100).toFixed(1)}%)`);
  console.log(`  WITHOUT ext: ${camPassedWithout}/${camResults.length} (${(camPassedWithout/camResults.length*100).toFixed(1)}%)`);
}

// Show cases where extension significantly hurts
console.log(`\n=== Cases Where Extension Hurts Most ===`);
const hurtCases = results.filter(r => r.errorWithExtension - r.errorWithoutExtension > 0.1);
hurtCases.sort((a, b) => (b.errorWithExtension - b.errorWithoutExtension) - (a.errorWithExtension - a.errorWithoutExtension));

for (const r of hurtCases.slice(0, 10)) {
  const diff = r.errorWithExtension - r.errorWithoutExtension;
  console.log(`  Frame ${r.frameNumber}, ${r.cameraId}, Track ${r.trackId}:`);
  console.log(`    Error with: ${r.errorWithExtension.toFixed(3)}m, without: ${r.errorWithoutExtension.toFixed(3)}m (diff: +${diff.toFixed(3)}m)`);
  console.log(`    Extension factor: ${r.extensionFactor.toFixed(2)}, Aspect ratio: ${r.bboxAspectRatio.toFixed(2)}`);
}

// Show cases where extension significantly helps
console.log(`\n=== Cases Where Extension Helps Most ===`);
const helpsCases = results.filter(r => r.errorWithoutExtension - r.errorWithExtension > 0.1);
helpsCases.sort((a, b) => (b.errorWithoutExtension - b.errorWithExtension) - (a.errorWithoutExtension - a.errorWithExtension));

for (const r of helpsCases.slice(0, 10)) {
  const diff = r.errorWithoutExtension - r.errorWithExtension;
  console.log(`  Frame ${r.frameNumber}, ${r.cameraId}, Track ${r.trackId}:`);
  console.log(`    Error with: ${r.errorWithExtension.toFixed(3)}m, without: ${r.errorWithoutExtension.toFixed(3)}m (diff: -${diff.toFixed(3)}m)`);
  console.log(`    Extension factor: ${r.extensionFactor.toFixed(2)}, Aspect ratio: ${r.bboxAspectRatio.toFixed(2)}`);
}
