/**
 * Shared Track Types for Axis Guardian
 *
 * Canonical type definitions for global tracks, camera detections,
 * and track attributes. Used by both backend and frontend.
 */
import type { Position2D } from './geometry';
/**
 * Track lifecycle state for occlusion handling
 */
export type TrackState = 'unconfirmed' | 'confirmed' | 'occluded';
/**
 * Reason why a track stopped being detected
 * Used to determine timeout behavior and display mode
 */
export type ExitReason = 'fov_exit' | 'boundary_exit' | 'pillar_occlusion' | 'partial_occlusion' | 'timeout' | null;
/**
 * Position data from a single camera detection
 */
export interface CameraDetection {
    cameraId: string;
    trackId: number;
    worldX: number;
    worldY: number;
    confidence: number;
    timestamp: number;
    /** Frame number from source camera (for frame-based missed detection) */
    frameNumber?: number;
    /** Video time in milliseconds (position within video, for sync) */
    videoTimeMs?: number;
    /** RTP timestamp (90kHz clock) for frame-perfect sync */
    rtpTimestamp?: number;
    /** Person attributes from re-ID preprocessing (optional) */
    attributes?: DetectionAttributes;
    /** Camera position in world coordinates (for distance-based weighting) */
    cameraPosition?: Position2D;
}
/**
 * Camera-specific track association
 */
export interface CameraTrackAssociation {
    cameraId: string;
    trackIds: number[];
    lastSeen: number;
    /** Last frame number this track was seen in from this camera */
    lastFrameNumber?: number;
}
/**
 * Trail position for history visualization
 */
export interface TrailPosition {
    x: number;
    y: number;
    timestamp: number;
}
/**
 * Video timing information for track synchronization
 */
export interface VideoTimingInfo {
    /** Video time in milliseconds (position within video) */
    videoTimeMs: number;
    /** RTP timestamp (90kHz clock) for frame-perfect sync */
    rtpTimestamp?: number;
    /** Frame number from source camera */
    frameNumber: number;
    /** Camera ID that provided this timing */
    cameraId: string;
}
/**
 * Color with confidence score
 */
export interface ColorScore {
    name: string;
    score: number;
}
/**
 * Clothing type with confidence score
 */
export interface ClothingTypeScore {
    name: string;
    score: number;
}
/**
 * Aggregated clothing attributes for a track
 * Dominant colors/type determined by weighted voting across detections
 */
export interface AggregatedClothingAttributes {
    /** Top colors by vote count (max 3) */
    dominant_colors: ColorScore[];
    /** Most common clothing type */
    type?: ClothingTypeScore;
}
/**
 * Track-level aggregated attributes from multiple detections
 * Used for person re-identification and display
 */
export interface TrackAttributes {
    /** Upper body clothing aggregate */
    upper_clothing: AggregatedClothingAttributes;
    /** Lower body clothing aggregate */
    lower_clothing: AggregatedClothingAttributes;
    /** Averaged re-ID embedding (quality-weighted) */
    embedding?: number[];
    /** Confidence in the aggregated embedding (0-1) */
    embedding_quality: number;
    /** Number of detection samples used for aggregation */
    sample_count: number;
}
/**
 * Detection-level attributes from re-ID preprocessing
 */
export interface DetectionAttributes {
    /** Upper body clothing */
    upper_clothing?: {
        colors: ColorScore[];
        type?: ClothingTypeScore;
    };
    /** Lower body clothing */
    lower_clothing?: {
        colors: ColorScore[];
        type?: ClothingTypeScore;
    };
    /** Re-ID embedding (512-dimensional OSNet) */
    embedding?: number[];
    /** Embedding quality/confidence (0-1) */
    embedding_quality?: number;
}
/**
 * Global track JSON representation for API and WebSocket messages
 * This is the format sent between backend and frontend
 */
export interface GlobalTrackJSON {
    globalTrackId: string;
    cameraAssociations: Record<string, CameraTrackAssociation>;
    currentPosition: Position2D;
    trail: TrailPosition[];
    color: string;
    lastSeen: number;
    isActive: boolean;
    isConfirmed: boolean;
    detectionCount: number;
    confidence: number;
    state: TrackState;
    /** Reason why track stopped being detected */
    exitReason?: ExitReason;
    /** Predicted position during pillar occlusion (ghost track) */
    predictedPosition?: Position2D;
    /** Video timing from the most recent detection (for frontend sync) */
    videoTiming?: VideoTimingInfo;
    /** Aggregated person attributes for re-ID and display (optional) */
    attributes?: TrackAttributes;
}
/**
 * Frame info for timing diagnostics
 */
export interface CameraFrameInfo {
    cameraId: string;
    frameNumber: number;
    timestamp: number;
}
//# sourceMappingURL=track.d.ts.map
