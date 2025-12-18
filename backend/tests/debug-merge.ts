/**
 * Debug mergeWorldPositions to verify smart camera selection works
 */
import { mergeWorldPositions, calculateDistance } from '../src/correlation/track-matcher.js'

// Test case: ann_1765238504031_myfcocxgq where cameras diverge
const detections = [
  { cameraId: "camera2", worldX: 17.66, worldY: 0.74, confidence: 0.95, trackId: 1, timestamp: 1000 },
  { cameraId: "camera1", worldX: 15.10, worldY: 1.14, confidence: 0.95, trackId: 1, timestamp: 1010 },
]

const result = mergeWorldPositions(detections as any)
console.log("Test case with divergent cameras (2.588m apart):")
console.log("  camera2: (17.66, 0.74)")
console.log("  camera1: (15.10, 1.14)")
console.log("  Expected: Pick camera1 (15.10, 1.14)")
console.log("  Result:", result.position)
console.log()

// Check distance
const dist = calculateDistance(
  { x: detections[0].worldX, y: detections[0].worldY },
  { x: detections[1].worldX, y: detections[1].worldY }
)
console.log("  Distance between cameras:", dist.toFixed(3), "m")
console.log("  Threshold: 0.6m")
console.log("  Should use camera1:", dist > 0.6 ? "YES" : "NO")

// Test a non-divergent case
console.log("\nTest case with convergent cameras (0.4m apart):")
const convergentDetections = [
  { cameraId: "camera2", worldX: 10.0, worldY: 5.0, confidence: 0.95, trackId: 1, timestamp: 1000 },
  { cameraId: "camera1", worldX: 10.3, worldY: 5.2, confidence: 0.95, trackId: 1, timestamp: 1010 },
]
const result2 = mergeWorldPositions(convergentDetections as any)
const dist2 = calculateDistance(
  { x: convergentDetections[0].worldX, y: convergentDetections[0].worldY },
  { x: convergentDetections[1].worldX, y: convergentDetections[1].worldY }
)
console.log("  camera2: (10.0, 5.0)")
console.log("  camera1: (10.3, 5.2)")
console.log("  Distance:", dist2.toFixed(3), "m")
console.log("  Expected: Average = (10.15, 5.1)")
console.log("  Result:", result2.position)
