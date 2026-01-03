#!/usr/bin/env python3
"""
Camera Calibration Optimizer

Optimizes K/R/T projection parameters to minimize cross-camera convergence error.
Uses matches discovered by cross-camera-matcher.ts (via ReID embeddings).

Usage:
    python optimize-calibration.py \
        --matches matches.json \
        --sitemap sitemap.json \
        --output calibration-auto.json
"""

import argparse
import json
import sys
from datetime import datetime
from typing import Dict, List, Tuple, Optional
import numpy as np
from scipy.optimize import differential_evolution, minimize

# ============================================================================
# K/R/T Projection (matching ground-plane.ts projectWithKRT)
# ============================================================================

def build_intrinsic_matrix(focal_length: float, cx: float, cy: float) -> np.ndarray:
    """Build 3x3 intrinsic (K) matrix"""
    return np.array([
        [focal_length, 0, cx],
        [0, focal_length, cy],
        [0, 0, 1]
    ], dtype=np.float64)


def build_rotation_matrix(azimuth_deg: float, elevation_deg: float) -> np.ndarray:
    """
    Build 3x3 rotation matrix from azimuth and elevation.

    Convention (matching ground-plane.ts):
    - Azimuth: 0=North(+Y), 90=East(+X), clockwise when viewed from above
    - Elevation: positive = looking down from horizontal

    The rotation transforms world coordinates to camera coordinates.
    """
    az_rad = np.radians(-azimuth_deg)  # Negate for clockwise convention
    el_rad = np.radians(-elevation_deg)  # Negate for looking down

    cos_az, sin_az = np.cos(az_rad), np.sin(az_rad)
    cos_el, sin_el = np.cos(el_rad), np.sin(el_rad)

    # Rotation around Z axis (azimuth/yaw)
    Rz = np.array([
        [cos_az, -sin_az, 0],
        [sin_az, cos_az, 0],
        [0, 0, 1]
    ])

    # Rotation around X axis (elevation/pitch)
    Rx = np.array([
        [1, 0, 0],
        [0, cos_el, -sin_el],
        [0, sin_el, cos_el]
    ])

    # Combined rotation: first azimuth, then elevation
    return Rx @ Rz


def project_to_ground(
    image_x: float,
    image_y: float,
    K: np.ndarray,
    R: np.ndarray,
    T: np.ndarray,
    center: Tuple[float, float]
) -> Optional[Tuple[float, float]]:
    """
    Project image point to ground plane using K/R/T matrices.

    Matches the algorithm in ground-plane.ts projectWithKRT:
    1. Compute KR = K @ R
    2. Build modified A matrix
    3. Solve A @ p = KRT for ground point p

    Args:
        image_x: Image X coordinate (pixels)
        image_y: Image Y coordinate (pixels)
        K: 3x3 intrinsic matrix
        R: 3x3 rotation matrix
        T: 3x1 translation vector (camera position in world)
        center: Image center (cx, cy)

    Returns:
        (world_x, world_y) or None if projection fails
    """
    cx, cy = center

    # KR = K @ R
    KR = K @ R

    # Build modified A matrix: [KR(:,0:2), [cx-x, cy-y, -1]^T]
    A = np.array([
        [KR[0, 0], KR[0, 1], cx - image_x],
        [KR[1, 0], KR[1, 1], cy - image_y],
        [KR[2, 0], KR[2, 1], -1]
    ])

    # KRT = K @ R @ T
    KRT = KR @ T

    # Solve A @ p = KRT for p
    try:
        p = np.linalg.solve(A, KRT)
    except np.linalg.LinAlgError:
        return None

    # p[0] = world_x, p[1] = world_y (p[2] should be ~0 for ground plane)
    return (p[0], p[1])


# ============================================================================
# Match Loading
# ============================================================================

def load_matches(path: str) -> List[Dict]:
    """Load cross-camera matches from JSON file"""
    with open(path, 'r') as f:
        return json.load(f)


def load_sitemap(path: str) -> Dict:
    """Load sitemap configuration"""
    with open(path, 'r') as f:
        return json.load(f)


# ============================================================================
# Optimization
# ============================================================================

class CalibrationOptimizer:
    """Optimizes camera calibration parameters to minimize cross-camera error"""

    def __init__(
        self,
        matches: List[Dict],
        sitemap: Dict,
        image_resolution: Tuple[int, int] = (1920, 1080)
    ):
        self.matches = matches
        self.sitemap = sitemap
        self.image_resolution = image_resolution

        # Build camera lookup from sitemap
        self.cameras = {
            cam['id']: cam
            for cam in sitemap.get('cameras', [])
        }

        # Get camera IDs from matches
        self.camera_ids = sorted(set(
            m['detection1']['cameraId'] for m in matches
        ) | set(
            m['detection2']['cameraId'] for m in matches
        ))

        print(f"[Optimizer] {len(matches)} matches across {len(self.camera_ids)} cameras")

    def get_camera_params(self, camera_id: str) -> Optional[Dict]:
        """Get camera parameters from sitemap"""
        return self.cameras.get(camera_id)

    def bbox_to_image_coords(self, bbox: Dict) -> Tuple[float, float]:
        """
        Convert normalized bbox to image coordinates.
        Uses bottom center (foot position) for ground plane projection.
        """
        w, h = self.image_resolution

        # bottomY is the foot position (bottom of bounding box)
        image_x = bbox['centerX'] * w
        image_y = bbox['bottomY'] * h

        return image_x, image_y

    def params_to_krt(
        self,
        camera_id: str,
        focal_length: float,
        azimuth_offset: float,
        elevation_offset: float
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray, Tuple[float, float]]:
        """
        Build K, R, T matrices from camera ID and calibration parameters.

        Args:
            camera_id: Camera ID from sitemap
            focal_length: Focal length in pixels
            azimuth_offset: Offset to add to sitemap azimuth (degrees)
            elevation_offset: Offset to add to sitemap elevation (degrees)

        Returns:
            (K, R, T, center) tuple
        """
        cam = self.cameras[camera_id]

        # Image center
        w, h = self.image_resolution
        cx, cy = w / 2, h / 2

        # Build K matrix
        K = build_intrinsic_matrix(focal_length, cx, cy)

        # Build R matrix with offsets applied
        azimuth = cam['azimuth'] + azimuth_offset
        elevation = cam.get('elevation', 35) + elevation_offset
        R = build_rotation_matrix(azimuth, elevation)

        # T is the camera position from sitemap
        T = np.array([
            cam['position']['x'],
            cam['position']['y'],
            cam['height']
        ])

        return K, R, T, (cx, cy)

    def compute_error(self, params: np.ndarray) -> float:
        """
        Compute total weighted error for given parameters.

        params layout (per camera):
            [focal_length, azimuth_offset, elevation_offset] * num_cameras
        """
        num_cameras = len(self.camera_ids)
        params_per_camera = 3

        if len(params) != num_cameras * params_per_camera:
            raise ValueError(f"Expected {num_cameras * params_per_camera} params, got {len(params)}")

        # Extract per-camera parameters
        camera_params = {}
        for i, cam_id in enumerate(self.camera_ids):
            idx = i * params_per_camera
            camera_params[cam_id] = {
                'focal_length': params[idx],
                'azimuth_offset': params[idx + 1],
                'elevation_offset': params[idx + 2],
            }

        total_error = 0.0
        valid_matches = 0

        for match in self.matches:
            det1 = match['detection1']
            det2 = match['detection2']

            cam1_id = det1['cameraId']
            cam2_id = det2['cameraId']

            if cam1_id not in camera_params or cam2_id not in camera_params:
                continue

            # Get K/R/T for both cameras
            p1 = camera_params[cam1_id]
            p2 = camera_params[cam2_id]

            K1, R1, T1, c1 = self.params_to_krt(cam1_id, p1['focal_length'], p1['azimuth_offset'], p1['elevation_offset'])
            K2, R2, T2, c2 = self.params_to_krt(cam2_id, p2['focal_length'], p2['azimuth_offset'], p2['elevation_offset'])

            # Project both detections to ground
            img1_x, img1_y = self.bbox_to_image_coords(det1['bbox'])
            img2_x, img2_y = self.bbox_to_image_coords(det2['bbox'])

            world1 = project_to_ground(img1_x, img1_y, K1, R1, T1, c1)
            world2 = project_to_ground(img2_x, img2_y, K2, R2, T2, c2)

            if world1 is None or world2 is None:
                # Penalize failed projections
                total_error += 100.0
                continue

            # Convergence error = distance between projections
            error = np.sqrt((world1[0] - world2[0])**2 + (world1[1] - world2[1])**2)

            # Cap extreme errors
            error = min(error, 50.0)

            # Weight by embedding similarity (higher = more trusted)
            weight = match['similarity'] ** 2

            # Boost weight for TrackTruths-validated matches
            if match.get('isValidated', False):
                weight *= 2.0

            total_error += weight * error ** 2
            valid_matches += 1

        if valid_matches == 0:
            return 1e10

        return total_error / valid_matches

    def fov_to_focal_length(self, fov_degrees: float) -> float:
        """
        Calculate focal length from field of view.

        fx = (width/2) / tan(fov/2)
        """
        w = self.image_resolution[0]
        fov_rad = np.radians(fov_degrees)
        return (w / 2) / np.tan(fov_rad / 2)

    def get_initial_params(self) -> np.ndarray:
        """Get initial parameter values based on sitemap FOV"""
        params = []
        for cam_id in self.camera_ids:
            cam = self.cameras.get(cam_id)
            if cam:
                # Calculate focal length from FOV
                fov = cam.get('fieldOfView', 65)
                focal_length = self.fov_to_focal_length(fov)
            else:
                focal_length = 1400.0  # Default for ~65° FOV on 1920px width

            params.extend([
                focal_length,  # focal_length derived from FOV
                0.0,           # azimuth_offset (start with no offset)
                0.0,           # elevation_offset (start with no offset)
            ])
        return np.array(params)

    def get_bounds(self) -> List[Tuple[float, float]]:
        """
        Get parameter bounds for optimization.

        Tighter bounds for more stable optimization:
        - Focal length: ±50% from FOV-derived value
        - Azimuth: ±20° (was ±45°)
        - Elevation: ±15° (was ±30°)
        """
        bounds = []
        for cam_id in self.camera_ids:
            cam = self.cameras.get(cam_id)
            if cam:
                fov = cam.get('fieldOfView', 65)
                base_focal = self.fov_to_focal_length(fov)
                focal_min = base_focal * 0.5
                focal_max = base_focal * 1.5
            else:
                focal_min = 800.0
                focal_max = 2500.0

            bounds.extend([
                (focal_min, focal_max),  # focal_length (derived from FOV ±50%)
                (-20.0, 20.0),           # azimuth_offset (degrees)
                (-15.0, 15.0),           # elevation_offset (degrees)
            ])
        return bounds

    def optimize(
        self,
        max_iterations: int = 500,
        polish: bool = True,
        verbose: bool = True
    ) -> Dict:
        """
        Run optimization to find best calibration parameters.

        Returns:
            Calibration result dict with optimized parameters and metrics
        """
        initial_params = self.get_initial_params()
        bounds = self.get_bounds()

        # Compute initial error
        initial_error = self.compute_error(initial_params)
        if verbose:
            print(f"[Optimizer] Initial mean error: {np.sqrt(initial_error):.3f}m")

        # Use differential evolution for global optimization
        if verbose:
            print(f"[Optimizer] Running differential evolution (max {max_iterations} iterations)...")

        result = differential_evolution(
            self.compute_error,
            bounds,
            maxiter=max_iterations,
            tol=0.001,
            workers=1,  # Use single worker for reproducibility
            updating='immediate',
            polish=polish,
            seed=42,
            disp=verbose,
        )

        final_error = self.compute_error(result.x)

        if verbose:
            print(f"[Optimizer] Final mean error: {np.sqrt(final_error):.3f}m")
            improvement = (1 - np.sqrt(final_error) / np.sqrt(initial_error)) * 100
            print(f"[Optimizer] Improvement: {improvement:.1f}%")

        # Build result
        return self.build_calibration_output(
            result.x,
            initial_error=np.sqrt(initial_error),
            final_error=np.sqrt(final_error),
            iterations=result.nit
        )

    def build_calibration_output(
        self,
        params: np.ndarray,
        initial_error: float,
        final_error: float,
        iterations: int
    ) -> Dict:
        """Build calibration output JSON structure"""
        cameras = []
        params_per_camera = 3

        for i, cam_id in enumerate(self.camera_ids):
            idx = i * params_per_camera
            focal_length = params[idx]
            azimuth_offset = params[idx + 1]
            elevation_offset = params[idx + 2]

            cam = self.cameras[cam_id]
            effective_azimuth = cam['azimuth'] + azimuth_offset
            effective_elevation = cam.get('elevation', 35) + elevation_offset

            # Build matrices
            w, h = self.image_resolution
            cx, cy = w / 2, h / 2

            K = build_intrinsic_matrix(focal_length, cx, cy)
            R = build_rotation_matrix(effective_azimuth, effective_elevation)
            T = np.array([cam['position']['x'], cam['position']['y'], cam['height']])

            cameras.append({
                "cameraId": cam_id,
                "K": K.tolist(),
                "R": R.tolist(),
                "T": T.tolist(),
                "center": [cx, cy],
                "scale": 1,
                "calibration_params": {
                    "focal_length": float(focal_length),
                    "azimuth_offset": float(azimuth_offset),
                    "elevation_offset": float(elevation_offset),
                    "effective_azimuth": float(effective_azimuth),
                    "effective_elevation": float(effective_elevation),
                }
            })

        return {
            "version": "3.0",
            "method": "Auto-calibration from cross-camera ReID matches",
            "generatedAt": datetime.utcnow().isoformat() + "Z",
            "metrics": {
                "matchesUsed": len(self.matches),
                "validatedMatches": sum(1 for m in self.matches if m.get('isValidated', False)),
                "initialMeanError": float(initial_error),
                "finalMeanError": float(final_error),
                "iterations": iterations,
            },
            "cameras": cameras
        }


# ============================================================================
# CLI
# ============================================================================

def main():
    parser = argparse.ArgumentParser(
        description='Optimize camera calibration using cross-camera matches'
    )
    parser.add_argument(
        '--matches',
        required=True,
        help='Path to matches JSON file (from cross-camera-matcher.ts)'
    )
    parser.add_argument(
        '--sitemap',
        required=True,
        help='Path to sitemap JSON file'
    )
    parser.add_argument(
        '--output',
        default='calibration-auto.json',
        help='Output calibration JSON file'
    )
    parser.add_argument(
        '--max-iterations',
        type=int,
        default=500,
        help='Maximum optimization iterations (default: 500)'
    )
    parser.add_argument(
        '--no-polish',
        action='store_true',
        help='Disable final polishing step'
    )
    parser.add_argument(
        '--quiet',
        action='store_true',
        help='Suppress verbose output'
    )

    args = parser.parse_args()

    # Load data
    print(f"Loading matches from: {args.matches}")
    matches = load_matches(args.matches)

    print(f"Loading sitemap from: {args.sitemap}")
    sitemap = load_sitemap(args.sitemap)

    if len(matches) == 0:
        print("Error: No matches found in input file")
        sys.exit(1)

    # Create optimizer
    optimizer = CalibrationOptimizer(matches, sitemap)

    # Run optimization
    result = optimizer.optimize(
        max_iterations=args.max_iterations,
        polish=not args.no_polish,
        verbose=not args.quiet
    )

    # Save result
    with open(args.output, 'w') as f:
        json.dump(result, f, indent=2)

    print(f"\nCalibration saved to: {args.output}")
    print(f"  Mean error: {result['metrics']['finalMeanError']:.3f}m")
    print(f"  Cameras: {len(result['cameras'])}")


if __name__ == '__main__':
    main()
