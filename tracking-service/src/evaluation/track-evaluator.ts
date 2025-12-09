/**
 * Track Evaluator - Evaluates tracking quality using ground truth data
 *
 * Measures:
 * - Fragmentation rate: How many global tracks are created per unique person
 * - ID switch rate: How often track IDs incorrectly change for same person
 * - Correct association rate: Percentage of correct cross-camera associations
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  Detection,
  GroundTruthAnnotation,
  GroundTruthDataset,
  EvaluationMetrics,
} from '../types';
import { TrackManager, TrackManagerConfig } from '../tracks/track-manager';
import {
  AssignmentConfig,
  DEFAULT_CONFIG,
  testThresholdSensitivity,
} from '../correlation/hungarian-assignment';

export interface EvaluationConfig {
  trackManagerConfig?: Partial<TrackManagerConfig>;
  assignmentConfig?: Partial<AssignmentConfig>;
}

export interface TrajectoryAnalysis {
  globalPersonId: number;
  expectedCameras: string[];
  actualCameras: string[];
  positionsConsistent: boolean;
  maxPositionJump: number;
  avgSpeed: number;
}

/**
 * Load ground truth dataset from JSON file
 */
export function loadGroundTruth(filePath: string): GroundTruthDataset {
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content) as GroundTruthDataset;
}

/**
 * Convert ground truth annotations to detections for processing
 */
export function annotationsToDetections(
  annotations: GroundTruthAnnotation[]
): Detection[] {
  return annotations.map(ann => ({
    cameraId: ann.cameraId,
    trackId: ann.trackId,
    timestamp: ann.timestamp,
    position: ann.position,
    boundingBox: ann.boundingBox,
    clothingColors: ann.clothingColors,
    confidence: 1.0,
  }));
}

/**
 * Group annotations by their local track ID and camera
 */
export function groupAnnotationsByTrack(
  annotations: GroundTruthAnnotation[]
): Map<string, GroundTruthAnnotation[]> {
  const groups = new Map<string, GroundTruthAnnotation[]>();

  for (const ann of annotations) {
    const key = `${ann.cameraId}:${ann.trackId}`;
    const existing = groups.get(key) || [];
    existing.push(ann);
    groups.set(key, existing);
  }

  // Sort each group by timestamp
  for (const [key, group] of groups) {
    group.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }

  return groups;
}

/**
 * Group annotations by global person ID
 */
export function groupAnnotationsByPerson(
  annotations: GroundTruthAnnotation[]
): Map<number, GroundTruthAnnotation[]> {
  const groups = new Map<number, GroundTruthAnnotation[]>();

  for (const ann of annotations) {
    const existing = groups.get(ann.globalPersonId) || [];
    existing.push(ann);
    groups.set(ann.globalPersonId, existing);
  }

  // Sort each group by timestamp
  for (const [key, group] of groups) {
    group.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }

  return groups;
}

/**
 * Analyze trajectory consistency for a person
 */
export function analyzeTrajectory(
  annotations: GroundTruthAnnotation[]
): TrajectoryAnalysis {
  if (annotations.length === 0) {
    return {
      globalPersonId: -1,
      expectedCameras: [],
      actualCameras: [],
      positionsConsistent: true,
      maxPositionJump: 0,
      avgSpeed: 0,
    };
  }

  const sorted = [...annotations].sort(
    (a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const cameras = [...new Set(sorted.map(a => a.cameraId))];
  let maxJump = 0;
  let totalDistance = 0;
  let totalTime = 0;

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];

    const dx = curr.position.x - prev.position.x;
    const dy = curr.position.y - prev.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const timeDiff =
      (new Date(curr.timestamp).getTime() -
        new Date(prev.timestamp).getTime()) /
      1000;

    if (distance > maxJump) {
      maxJump = distance;
    }

    totalDistance += distance;
    totalTime += timeDiff;
  }

  const avgSpeed = totalTime > 0 ? totalDistance / totalTime : 0;

  // Position is consistent if max jump is reasonable (< 10 units per frame)
  const positionsConsistent = maxJump < 10;

  return {
    globalPersonId: sorted[0].globalPersonId,
    expectedCameras: cameras,
    actualCameras: cameras,
    positionsConsistent,
    maxPositionJump: maxJump,
    avgSpeed,
  };
}

/**
 * Main evaluator class
 */
export class TrackEvaluator {
  private trackManager: TrackManager;
  private groundTruth: GroundTruthDataset | null = null;
  private config: EvaluationConfig;

  // Mapping from global track ID to ground truth person IDs seen
  private trackToPersonMapping: Map<string, Set<number>> = new Map();

  constructor(config: EvaluationConfig = {}) {
    this.config = config;
    this.trackManager = new TrackManager(config.trackManagerConfig);
  }

  /**
   * Load ground truth data
   */
  loadGroundTruthData(groundTruth: GroundTruthDataset): void {
    this.groundTruth = groundTruth;
  }

  /**
   * Process all annotations through the track manager
   * Returns mapping of global track IDs to person IDs
   */
  processAnnotations(): Map<string, Set<number>> {
    if (!this.groundTruth) {
      throw new Error('Ground truth not loaded');
    }

    this.trackManager.reset();
    this.trackToPersonMapping.clear();

    // Group annotations by frame/timestamp for batch processing
    const byTimestamp = new Map<string, GroundTruthAnnotation[]>();
    for (const ann of this.groundTruth.annotations) {
      const existing = byTimestamp.get(ann.timestamp) || [];
      existing.push(ann);
      byTimestamp.set(ann.timestamp, existing);
    }

    // Process each timestamp in order
    const timestamps = [...byTimestamp.keys()].sort();

    for (const timestamp of timestamps) {
      const annotations = byTimestamp.get(timestamp)!;
      const detections = annotationsToDetections(annotations);

      this.trackManager.processDetections(detections);

      // Record which person each global track sees
      for (const ann of annotations) {
        const globalId = this.trackManager.getGlobalId(
          ann.cameraId,
          ann.trackId
        );
        if (globalId) {
          const persons = this.trackToPersonMapping.get(globalId) || new Set();
          persons.add(ann.globalPersonId);
          this.trackToPersonMapping.set(globalId, persons);
        }
      }
    }

    return this.trackToPersonMapping;
  }

  /**
   * Calculate fragmentation rate
   * Ideal: 1 global track per person
   * Higher values indicate fragmentation
   */
  calculateFragmentationRate(): number {
    if (!this.groundTruth) return 0;

    const personToTracks = new Map<number, Set<string>>();

    for (const [trackId, persons] of this.trackToPersonMapping) {
      for (const personId of persons) {
        const tracks = personToTracks.get(personId) || new Set();
        tracks.add(trackId);
        personToTracks.set(personId, tracks);
      }
    }

    if (personToTracks.size === 0) return 0;

    let totalTracks = 0;
    for (const tracks of personToTracks.values()) {
      totalTracks += tracks.size;
    }

    return totalTracks / personToTracks.size;
  }

  /**
   * Calculate ID switch rate
   * ID switch: when a single global track is associated with multiple persons
   */
  calculateIdSwitchRate(): number {
    let switches = 0;
    let totalTracks = 0;

    for (const persons of this.trackToPersonMapping.values()) {
      totalTracks++;
      if (persons.size > 1) {
        switches += persons.size - 1;
      }
    }

    if (totalTracks === 0) return 0;
    return switches / totalTracks;
  }

  /**
   * Calculate correct association rate
   * For cross-camera scenarios, check if same person's tracks are merged correctly
   */
  calculateCorrectAssociationRate(): number {
    if (!this.groundTruth) return 0;

    // Group ground truth by person
    const personAnnotations = groupAnnotationsByPerson(
      this.groundTruth.annotations
    );

    let correctAssociations = 0;
    let totalCrossCamera = 0;

    for (const [personId, annotations] of personAnnotations) {
      const cameras = [...new Set(annotations.map(a => a.cameraId))];

      // Only evaluate cross-camera associations
      if (cameras.length <= 1) continue;

      totalCrossCamera++;

      // Get all global track IDs associated with this person's local tracks
      const globalTrackIds = new Set<string>();
      for (const ann of annotations) {
        const globalId = this.trackManager.getGlobalId(
          ann.cameraId,
          ann.trackId
        );
        if (globalId) {
          globalTrackIds.add(globalId);
        }
      }

      // Correct if all local tracks map to same global track
      if (globalTrackIds.size === 1) {
        correctAssociations++;
      }
    }

    if (totalCrossCamera === 0) return 1.0; // No cross-camera to evaluate
    return correctAssociations / totalCrossCamera;
  }

  /**
   * Run full evaluation and return metrics
   */
  evaluate(): EvaluationMetrics {
    this.processAnnotations();

    const stats = this.trackManager.getStats();
    const fragmentationRate = this.calculateFragmentationRate();
    const idSwitchRate = this.calculateIdSwitchRate();
    const correctAssociationRate = this.calculateCorrectAssociationRate();

    return {
      fragmentationRate,
      idSwitchRate,
      correctAssociationRate,
      totalDetections: stats.totalDetectionsProcessed,
      totalGlobalTracks: stats.totalTracksCreated,
      totalIdSwitches: stats.idSwitches,
      uniquePersonsTracked: this.groundTruth?.uniquePersons || 0,
      tracksPerPerson: fragmentationRate,
    };
  }

  /**
   * Test assignment threshold sensitivity
   */
  evaluateThresholdSensitivity(
    thresholds: number[] = [1.0, 2.0, 3.0, 5.0, 7.0, 10.0]
  ): Map<number, EvaluationMetrics> {
    if (!this.groundTruth) {
      throw new Error('Ground truth not loaded');
    }

    const results = new Map<number, EvaluationMetrics>();

    for (const threshold of thresholds) {
      // Create new evaluator with different threshold
      const evaluator = new TrackEvaluator({
        ...this.config,
        trackManagerConfig: {
          ...this.config.trackManagerConfig,
          assignmentConfig: {
            ...DEFAULT_CONFIG,
            maxDistance: threshold,
          },
        },
      });

      evaluator.loadGroundTruthData(this.groundTruth);
      const metrics = evaluator.evaluate();
      results.set(threshold, metrics);
    }

    return results;
  }

  /**
   * Analyze trajectory consistency for all persons
   */
  analyzeAllTrajectories(): TrajectoryAnalysis[] {
    if (!this.groundTruth) return [];

    const personAnnotations = groupAnnotationsByPerson(
      this.groundTruth.annotations
    );
    const analyses: TrajectoryAnalysis[] = [];

    for (const [personId, annotations] of personAnnotations) {
      analyses.push(analyzeTrajectory(annotations));
    }

    return analyses;
  }

  /**
   * Get track manager for inspection
   */
  getTrackManager(): TrackManager {
    return this.trackManager;
  }
}

/**
 * Format metrics for display
 */
export function formatMetrics(metrics: EvaluationMetrics): string {
  const lines = [
    '╔════════════════════════════════════════════════════════════╗',
    '║            TRACKING EVALUATION METRICS                      ║',
    '╠════════════════════════════════════════════════════════════╣',
    `║ Fragmentation Rate:       ${metrics.fragmentationRate.toFixed(3).padStart(8)} (ideal: 1.0)      ║`,
    `║ ID Switch Rate:           ${metrics.idSwitchRate.toFixed(3).padStart(8)} (ideal: 0.0)      ║`,
    `║ Correct Association Rate: ${(metrics.correctAssociationRate * 100).toFixed(1).padStart(7)}% (ideal: 100%)   ║`,
    '╠════════════════════════════════════════════════════════════╣',
    `║ Total Detections:         ${String(metrics.totalDetections).padStart(8)}                    ║`,
    `║ Total Global Tracks:      ${String(metrics.totalGlobalTracks).padStart(8)}                    ║`,
    `║ Total ID Switches:        ${String(metrics.totalIdSwitches).padStart(8)}                    ║`,
    `║ Unique Persons:           ${String(metrics.uniquePersonsTracked).padStart(8)}                    ║`,
    `║ Tracks Per Person:        ${metrics.tracksPerPerson.toFixed(3).padStart(8)}                    ║`,
    '╚════════════════════════════════════════════════════════════╝',
  ];

  return lines.join('\n');
}

/**
 * Format threshold sensitivity results
 */
export function formatThresholdResults(
  results: Map<number, EvaluationMetrics>
): string {
  const lines = [
    '╔═══════════════════════════════════════════════════════════════════════════════╗',
    '║                    THRESHOLD SENSITIVITY ANALYSIS                              ║',
    '╠═══════════════════════════════════════════════════════════════════════════════╣',
    '║ Threshold │ Fragmentation │ ID Switch │ Correct Assoc │ Global Tracks │       ║',
    '╠═══════════════════════════════════════════════════════════════════════════════╣',
  ];

  const sortedThresholds = [...results.keys()].sort((a, b) => a - b);

  for (const threshold of sortedThresholds) {
    const metrics = results.get(threshold)!;
    lines.push(
      `║ ${threshold.toFixed(1).padStart(9)} │ ${metrics.fragmentationRate.toFixed(3).padStart(13)} │ ${metrics.idSwitchRate.toFixed(3).padStart(9)} │ ${(metrics.correctAssociationRate * 100).toFixed(1).padStart(12)}% │ ${String(metrics.totalGlobalTracks).padStart(13)} │       ║`
    );
  }

  lines.push(
    '╚═══════════════════════════════════════════════════════════════════════════════╝'
  );

  return lines.join('\n');
}
