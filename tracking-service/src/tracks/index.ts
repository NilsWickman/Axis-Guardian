/**
 * Tracks Module - Track lifecycle management components
 *
 * This module provides focused components for track management:
 * - TrackManager: Core track lifecycle orchestration
 * - TrailManager: Trail position history
 * - FrameTracker: Per-camera frame tracking
 * - ExclusionZoneValidator: Duplicate prevention
 * - LocalTrackStitcher: Local ID re-stitching
 * - OcclusionHandler: Occlusion state machine
 * - TrackMerger: Duplicate track merging
 * - AttributeAggregator: Re-ID attribute aggregation
 */

export { TrackManager, trackToJSON, type TrackManagerOptions } from './track-manager.js'
export { TrailManager, type TrailManagerConfig } from './trail-manager.js'
export { FrameTracker, type FrameTrackerConfig, type CameraFrameState } from './frame-tracker.js'
export {
  ExclusionZoneValidator,
  type ExclusionZoneConfig,
  type ExclusionCheckResult,
  type ExclusionMetricsRecorder,
} from './exclusion-zone-validator.js'
export {
  LocalTrackStitcher,
  type LocalTrackStitcherConfig,
  type EndedLocalTrack,
  type StitchResult,
} from './local-track-stitcher.js'
export {
  OcclusionHandler,
  type OcclusionHandlerConfig,
  type SiteMapGeometry,
  type OcclusionCheckResult,
  type CoastResult,
  type OcclusionMetricsRecorder,
} from './occlusion-handler.js'
export { TrackMerger } from './track-merger.js'
export { AttributeAggregator, cosineSimilarity } from './attribute-aggregator.js'
