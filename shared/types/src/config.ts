/**
 * Shared Configuration Types for Axis Guardian
 *
 * Defines the base configuration interface shared between tracking-service
 * and frontend. The tracking-service extends this with additional parameters
 * while the frontend uses these core values for display and local fallback.
 *
 * IMPORTANT: The tracking-service is the source of truth for all tracking
 * configuration. These types define the contract for what the frontend can
 * expect to receive via API when querying server configuration.
 */

/**
 * Base tracking configuration shared between frontend and tracking-service.
 *
 * These are the core parameters that both services understand and can display.
 * The tracking-service TrackingConfig extends this with many additional
 * algorithm-specific parameters.
 *
 * When adding new fields:
 * 1. Add to this interface if both frontend and backend need it
 * 2. Update tracking-service TrackingConfig to include the field
 * 3. Update ALGORITHM_CONSTANTS as the source of truth for default values
 */
export interface TrackingConfigBase {
  /** Maximum distance (meters) to associate detection with existing track */
  correlationDistanceM: number
  /** Time window (ms) for merging multi-camera detections */
  mergeWindowMs: number
  /** Time (ms) before track expires without detections */
  trackExpiryMs: number
  /** Maximum trail positions to keep for visualization */
  maxTrailLength: number
  /** Minimum detections before track is considered confirmed */
  minDetectionsToConfirm: number
  /** Maximum human velocity (m/s) - used for teleport rejection */
  maxVelocityMs: number
}

/**
 * Default values for TrackingConfigBase.
 *
 * IMPORTANT: These values MUST match ALGORITHM_CONSTANTS.trackLifecycle in
 * tracking-service/src/config/algorithm-constants.ts
 *
 * These defaults are provided for:
 * 1. Frontend display when server is unavailable
 * 2. Local tracking mode fallback (deprecated)
 * 3. Documentation and consistency checks
 *
 * Source of truth: ALGORITHM_CONSTANTS.trackLifecycle in tracking-service
 */
export const DEFAULT_TRACKING_CONFIG_BASE: TrackingConfigBase = {
  correlationDistanceM: 1.0,  // ALGORITHM_CONSTANTS.trackLifecycle.correlationDistanceM
  mergeWindowMs: 200,         // ALGORITHM_CONSTANTS.trackLifecycle.mergeWindowMs
  trackExpiryMs: 5000,        // ALGORITHM_CONSTANTS.trackLifecycle.trackExpiryMs
  maxTrailLength: 20,         // ALGORITHM_CONSTANTS.trackLifecycle.maxTrailLength
  minDetectionsToConfirm: 3,  // ALGORITHM_CONSTANTS.trackLifecycle.minDetectionsToConfirm
  maxVelocityMs: 8,           // ALGORITHM_CONSTANTS.trackLifecycle.maxVelocityMs
}
