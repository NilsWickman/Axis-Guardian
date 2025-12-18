/**
 * Debug script to test projection with quadratic transforms
 */
import { CameraRegistry } from '../src/detection/camera-registry.js'
import { projectWithKRT } from '../src/projection/ground-plane.js'

const registry = new CameraRegistry()

// Test camera1
const calib1 = registry.getCalibration('camera1')
if (calib1) {
  console.log('Camera1 calibration:')
  console.log('  Has worldTransform:', !!calib1.worldTransform)
  console.log('  Has quadratic:', !!calib1.worldTransform?.quadratic)
  if (calib1.worldTransform?.quadratic) {
    console.log('  coeffsX:', calib1.worldTransform.quadratic.coeffsX.slice(0, 3), '...')
  }

  // Test projection for a sample point
  const footX = 0.5 * 1920
  const footY = 0.8 * 1080
  const result = projectWithKRT(footX, footY, calib1)
  console.log('Sample projection (center-bottom):')
  console.log('  Image point:', { x: footX, y: footY })
  console.log('  World point:', result.worldPoint)
  console.log('  Valid:', result.isValid)
} else {
  console.log('No calibration for camera1!')
}

// Test camera2
const calib2 = registry.getCalibration('camera2')
if (calib2) {
  console.log('\nCamera2 calibration:')
  console.log('  Has worldTransform:', !!calib2.worldTransform)
  console.log('  Has quadratic:', !!calib2.worldTransform?.quadratic)
} else {
  console.log('No calibration for camera2!')
}
