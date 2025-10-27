"""Structure from Motion reconstruction pipeline."""

import cv2
import numpy as np
from pathlib import Path
from typing import List, Dict, Tuple, Optional
from tqdm import tqdm

from ..vision import FeatureExtractor, FeatureMatcher, PoseEstimator, FeatureType
from ..fusion import PointCloud, merge_point_clouds, GroundPlaneProjector, create_occupancy_grid, WallExtractor
from ..fusion.point_cloud import estimate_scale_from_distances
from ..utils.config import SiteMapConfig


class SfMReconstructor:
    """Structure from Motion site map reconstruction."""

    def __init__(self, config: SiteMapConfig):
        """
        Initialize SfM reconstructor.

        Args:
            config: Site map configuration
        """
        self.config = config
        self.gen_config = config.generation

        # Initialize components
        feature_type = FeatureType(self.gen_config.feature_type)

        self.feature_extractor = FeatureExtractor(
            feature_type=feature_type,
            max_features=self.gen_config.max_features
        )

        self.feature_matcher = FeatureMatcher(
            feature_type=feature_type,
            ratio_threshold=self.gen_config.match_ratio_threshold,
            min_matches=self.gen_config.min_matches
        )

        self.pose_estimator = PoseEstimator(
            ransac_threshold=self.gen_config.ransac_threshold,
            min_triangulation_angle=self.gen_config.min_triangulation_angle
        )

        self.ground_projector = GroundPlaneProjector(
            ground_tolerance=self.gen_config.ground_plane_tolerance
        )

        self.wall_extractor = WallExtractor(
            min_wall_length=self.gen_config.min_wall_length_m,
            merge_threshold=self.gen_config.wall_merge_threshold,
            min_points=10
        )

        # Storage
        self.images: List[np.ndarray] = []
        self.features_list = []
        self.point_clouds: List[PointCloud] = []
        self.camera_positions = []

    def load_images(self) -> List[np.ndarray]:
        """
        Load all camera images.

        Returns:
            List of images
        """
        print("\n[Step 1/7] Loading camera images...")
        images_dir = Path(self.config.images_dir)

        for camera in tqdm(self.config.cameras, desc="Loading images"):
            image_path = images_dir / camera.image
            image = cv2.imread(str(image_path))

            if image is None:
                raise FileNotFoundError(f"Could not load image: {image_path}")

            self.images.append(image)

        print(f"  Loaded {len(self.images)} images")
        return self.images

    def extract_features(self):
        """Extract features from all images."""
        print("\n[Step 2/7] Extracting features...")

        for idx, image in enumerate(tqdm(self.images, desc="Extracting features")):
            features = self.feature_extractor.extract(image)
            self.features_list.append(features)

            print(f"  Camera {idx + 1}: {len(features.keypoints)} features")

    def match_features(self):
        """Match features across all image pairs."""
        print("\n[Step 3/7] Matching features across images...")

        self.match_results = self.feature_matcher.match_all_pairs(self.features_list)

        print(f"  Found {len(self.match_results)} valid image pairs")
        for match in self.match_results:
            print(f"    Cameras {match.image1_idx}-{match.image2_idx}: {match.num_matches} matches")

        if len(self.match_results) == 0:
            raise ValueError("No feature matches found! Ensure cameras have overlapping views.")

    def estimate_camera_poses(self):
        """Estimate relative camera poses."""
        print("\n[Step 4/7] Estimating camera poses...")

        self.camera_poses = []

        for match in tqdm(self.match_results, desc="Estimating poses"):
            img1_shape = self.images[match.image1_idx].shape[:2]
            img2_shape = self.images[match.image2_idx].shape[:2]

            pose = self.pose_estimator.estimate_pose(match, img1_shape, img2_shape)

            if pose is not None:
                self.camera_poses.append(pose)
                print(f"  Cameras {pose.camera1_idx}-{pose.camera2_idx}: {pose.inliers} inliers")

        if len(self.camera_poses) == 0:
            raise ValueError("Failed to estimate any camera poses!")

    def triangulate_points(self):
        """Triangulate 3D points from matches."""
        print("\n[Step 5/7] Triangulating 3D points...")

        self.point_clouds = []

        for pose, match in zip(tqdm(self.camera_poses, desc="Triangulating"), self.match_results):
            img1_shape = self.images[match.image1_idx].shape[:2]
            img2_shape = self.images[match.image2_idx].shape[:2]

            # Triangulate
            points_3d = self.pose_estimator.triangulate_points(
                pose, match, img1_shape, img2_shape
            )

            # Filter points
            filtered_points, mask = self.pose_estimator.filter_triangulated_points(
                points_3d, pose, match
            )

            if len(filtered_points) > 0:
                point_cloud = PointCloud(points=filtered_points)
                self.point_clouds.append(point_cloud)

                print(f"  Pair {pose.camera1_idx}-{pose.camera2_idx}: {len(filtered_points)} points")

        # Merge all point clouds
        self.merged_cloud = merge_point_clouds(self.point_clouds)
        print(f"\n  Total 3D points: {len(self.merged_cloud.points)}")

    def calibrate_scale(self):
        """Calibrate metric scale from known camera positions/distances."""
        print("\n[Scale Calibration] Computing metric scale...")

        # Compute known distances from local positions
        known_distances = {}
        camera_positions_3d = {}

        # Extract camera positions from local_position metadata
        for idx, camera in enumerate(self.config.cameras):
            if camera.local_position is not None and len(camera.local_position) >= 3:
                # Store known position
                camera_positions_3d[camera.id] = np.array(camera.local_position)

        # Compute all pairwise distances
        camera_ids = list(camera_positions_3d.keys())
        for i in range(len(camera_ids)):
            for j in range(i + 1, len(camera_ids)):
                cam1_id = camera_ids[i]
                cam2_id = camera_ids[j]
                pos1 = camera_positions_3d[cam1_id]
                pos2 = camera_positions_3d[cam2_id]

                # Compute Euclidean distance
                distance = np.linalg.norm(pos2 - pos1)
                known_distances[(cam1_id, cam2_id)] = distance

        if len(known_distances) == 0:
            print("  ⚠️  No known distances available - using default scale")
            return 1.0

        print(f"  Found {len(known_distances)} known distance pairs")

        # Estimate camera positions in SfM coordinate system
        # For now, use simplified approach: cameras at centroids of their triangulated points
        sfm_camera_positions = {}

        for idx, camera in enumerate(self.config.cameras):
            if idx < len(self.point_clouds) and len(self.point_clouds[idx].points) > 0:
                # Camera position approximated as centroid of its points
                sfm_camera_positions[camera.id] = self.point_clouds[idx].points.mean(axis=0)

        if len(sfm_camera_positions) < 2:
            print("  ⚠️  Insufficient SfM camera positions - using default scale")
            return 1.0

        # Estimate scale from known distances
        try:
            scale = estimate_scale_from_distances(sfm_camera_positions, known_distances)
            print(f"  ✅ Estimated scale: {scale:.4f} meters per SfM unit")

            # Apply scale to point cloud
            self.merged_cloud.points *= scale

            # Also scale individual clouds
            for pc in self.point_clouds:
                pc.points *= scale

            return scale

        except Exception as e:
            print(f"  ⚠️  Scale estimation failed: {e}")
            print("  Using default scale")
            return 1.0

    def project_to_2d(self):
        """Project 3D point cloud to 2D ground plane."""
        print("\n[Step 6/7] Projecting to 2D ground plane...")

        # Project to 2D
        self.points_2d, self.aligned_cloud = self.ground_projector.full_pipeline(self.merged_cloud)

        print(f"  Ground points: {len(self.points_2d)}")

        # Create occupancy grid
        self.occupancy_grid = create_occupancy_grid(
            self.points_2d,
            resolution=self.gen_config.grid_resolution_m,
            margin=1.0
        )

        print(f"  Grid shape: {self.occupancy_grid.get_shape()}")
        print(f"  Grid dimensions: {self.occupancy_grid.width_m:.2f}m × {self.occupancy_grid.height_m:.2f}m")

    def extract_walls(self):
        """Extract wall boundaries from occupancy grid."""
        print("\n[Step 7/7] Extracting walls...")

        self.walls = self.wall_extractor.extract_walls(
            self.occupancy_grid,
            detection_threshold=self.gen_config.wall_detection_threshold
        )

        print(f"  Extracted {len(self.walls)} wall segments")

        total_length = sum(np.linalg.norm(wall.end - wall.start) for wall in self.walls)
        print(f"  Total wall length: {total_length:.2f}m")

        if len(self.walls) > 0:
            avg_confidence = np.mean([wall.confidence for wall in self.walls])
            print(f"  Average confidence: {avg_confidence:.2f}")

    def estimate_camera_positions_2d(self):
        """Estimate camera positions in 2D (simplified - assumes cameras at origin of views)."""
        # This is a simplification - true camera positions would require full bundle adjustment
        # For now, we place cameras at approximate locations based on triangulation

        self.camera_positions = []

        for idx, camera in enumerate(self.config.cameras):
            # Use a simple heuristic: cameras near the centroid of their triangulated points
            # In practice, full SfM would give us exact camera positions
            if idx < len(self.point_clouds) and len(self.point_clouds[idx].points) > 0:
                # Get 2D projection of camera's points
                cam_points_3d = self.point_clouds[idx].points

                # Transform to aligned frame
                if self.ground_projector.transform_R is not None:
                    cam_points_centered = cam_points_3d - self.ground_projector.transform_t
                    cam_points_aligned = (self.ground_projector.transform_R @ cam_points_centered.T).T

                    # Project to 2D
                    cam_points_2d = cam_points_aligned[:, :2]

                    # Estimate camera position (centroid of view)
                    cam_pos = cam_points_2d.mean(axis=0)
                else:
                    cam_pos = cam_points_3d[:, :2].mean(axis=0)

                self.camera_positions.append((cam_pos[0], cam_pos[1], camera.id))

    def reconstruct(self):
        """
        Run complete SfM reconstruction pipeline.
        """
        print("=" * 60)
        print("Structure from Motion Site Map Generator")
        print("=" * 60)

        self.load_images()
        self.extract_features()
        self.match_features()
        self.estimate_camera_poses()
        self.triangulate_points()

        # Apply scale calibration if enabled
        if self.gen_config.use_known_distances:
            self.scale_factor = self.calibrate_scale()
        else:
            self.scale_factor = 1.0

        self.project_to_2d()
        self.extract_walls()
        self.estimate_camera_positions_2d()

        print("\n" + "=" * 60)
        print("Reconstruction Complete!")
        print("=" * 60)

        return {
            "occupancy_grid": self.occupancy_grid,
            "walls": self.walls,
            "camera_positions": self.camera_positions,
            "point_cloud": self.merged_cloud,
            "aligned_cloud": self.aligned_cloud
        }
