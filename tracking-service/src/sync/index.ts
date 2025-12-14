/**
 * Synchronization Module
 *
 * Provides multi-camera synchronization for the tracking pipeline.
 */

export { MultiCameraSyncBuffer } from './multi-camera-sync-buffer.js'
export type { SyncBufferConfig, SyncMetrics } from './multi-camera-sync-buffer.js'

export { SynchronizedDetectionProcessor } from './synchronized-detection-processor.js'
export type { SynchronizedProcessorConfig } from './synchronized-detection-processor.js'
