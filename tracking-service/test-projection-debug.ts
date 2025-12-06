import { projectDetectionToGround, siteMapConfigToCamera } from './src/projection/ground-plane.js';

// Test with a simple config
const config = {
  id: 'test',
  position: { x: 9, y: 6 },  // Center of room
  azimuth: 0,  // Facing North (+Y)
  elevation: 30,
  height: 3,
  fieldOfView: 90
};

const camera = siteMapConfigToCamera(config);

console.log('Camera at center of room (9, 6), facing North (azimuth=0)');
console.log('Testing projections from different parts of the image:');

// Detection in center of image
const centerResult = projectDetectionToGround(
  { x: 960, y: 800, width: 0, height: 0 },
  camera, false, 1920, 1080
);
console.log('');
console.log('Center of image (960, 800) -> (' + centerResult.worldPoint.x.toFixed(2) + ', ' + centerResult.worldPoint.y.toFixed(2) + ')');

// Detection in right half of image (like our actual detections at x=0.6)
const rightResult = projectDetectionToGround(
  { x: 0.6 * 1920, y: 800, width: 0, height: 0 },  // x=1152, right side
  camera, false, 1920, 1080
);
console.log('Right side (x=0.6*1920=1152, y=800) -> (' + rightResult.worldPoint.x.toFixed(2) + ', ' + rightResult.worldPoint.y.toFixed(2) + ')');

// Detection in left half of image
const leftResult = projectDetectionToGround(
  { x: 0.4 * 1920, y: 800, width: 0, height: 0 },  // x=768, left side
  camera, false, 1920, 1080
);
console.log('Left side (x=0.4*1920=768, y=800) -> (' + leftResult.worldPoint.x.toFixed(2) + ', ' + leftResult.worldPoint.y.toFixed(2) + ')');

console.log('');
console.log('=== Analysis ===');
console.log('With camera facing North (azimuth=0):');
console.log('  - Right side of image (x>960) -> X=' + rightResult.worldPoint.x.toFixed(2));
console.log('  - Center of image (x=960)     -> X=' + centerResult.worldPoint.x.toFixed(2));
console.log('  - Left side of image (x<960)  -> X=' + leftResult.worldPoint.x.toFixed(2));
console.log('');
console.log('Detection x=0.6 (right side) should project to HIGHER X than camera');
console.log('But ground truth at x=1-1.5 is LOWER X than center of room');
