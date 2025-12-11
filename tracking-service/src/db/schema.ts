import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';

// Site configuration table
export const siteConfigs = sqliteTable('site_configs', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  width: real('width').notNull(),
  height: real('height').notNull(),
  unit: text('unit').notNull().default('meters'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Cameras table
export const cameras = sqliteTable('cameras', {
  id: text('id').primaryKey(),
  siteConfigId: text('site_config_id')
    .notNull()
    .references(() => siteConfigs.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  model: text('model'),
  rtspUrl: text('rtsp_url'),
  webrtcUrl: text('webrtc_url'),
  ipAddress: text('ip_address'),
  positionX: real('position_x').notNull(),
  positionY: real('position_y').notNull(),
  height: real('height').notNull(),
  azimuth: real('azimuth').notNull(),
  elevation: real('elevation').notNull().default(45),
  fieldOfView: real('field_of_view').notNull(),
  color: text('color'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Walls table
export const walls = sqliteTable('walls', {
  id: text('id').primaryKey(),
  siteConfigId: text('site_config_id')
    .notNull()
    .references(() => siteConfigs.id, { onDelete: 'cascade' }),
  startX: real('start_x').notNull(),
  startY: real('start_y').notNull(),
  endX: real('end_x').notNull(),
  endY: real('end_y').notNull(),
  type: text('type').notNull().default('external'),
});

// Zone types for restricted area monitoring
export const zoneTypeEnum = ['restricted', 'entry', 'exit', 'monitored'] as const;
export const zoneSeverityEnum = ['low', 'medium', 'high', 'critical'] as const;

// Zones table - restricted areas that trigger alarms
export const zones = sqliteTable('zones', {
  id: text('id').primaryKey(),
  siteConfigId: text('site_config_id')
    .notNull()
    .references(() => siteConfigs.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type', { enum: zoneTypeEnum }).notNull().default('restricted'),
  // Polygon vertices stored as JSON array: [{x: number, y: number}, ...]
  vertices: text('vertices', { mode: 'json' }).$type<{ x: number; y: number }[]>().notNull(),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
  severity: text('severity', { enum: zoneSeverityEnum }).notNull().default('high'),
  color: text('color').default('#ef4444'),
  // Cooldown period in ms before re-alarming for same track
  cooldownMs: integer('cooldown_ms').notNull().default(30000),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// ============================================================================
// Debug Logging Tables (for pipeline troubleshooting)
// ============================================================================

// Debug sessions - groups a series of logs for one troubleshooting session
export const debugSessions = sqliteTable('debug_sessions', {
  id: text('id').primaryKey(),
  name: text('name'),
  startedAt: integer('started_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  endedAt: integer('ended_at', { mode: 'timestamp' }),
  notes: text('notes'),
});

// Raw detections - from camera emulator before projection
export const debugRawDetections = sqliteTable('debug_raw_detections', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sessionId: text('session_id').references(() => debugSessions.id, { onDelete: 'cascade' }),
  timestamp: integer('timestamp').notNull(), // ms since epoch
  cameraId: text('camera_id').notNull(),
  frameNumber: integer('frame_number'),
  trackId: integer('track_id'),
  className: text('class_name'),
  confidence: real('confidence'),
  // Bounding box (normalized 0-1)
  bboxX: real('bbox_x'),
  bboxY: real('bbox_y'),
  bboxWidth: real('bbox_width'),
  bboxHeight: real('bbox_height'),
});

// Projected positions - after ground-plane projection
export const debugProjectedPositions = sqliteTable('debug_projected_positions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sessionId: text('session_id').references(() => debugSessions.id, { onDelete: 'cascade' }),
  rawDetectionId: integer('raw_detection_id').references(() => debugRawDetections.id),
  timestamp: integer('timestamp').notNull(),
  cameraId: text('camera_id').notNull(),
  trackId: integer('track_id'),
  // Projected world coordinates (meters)
  worldX: real('world_x'),
  worldY: real('world_y'),
  isValid: integer('is_valid', { mode: 'boolean' }),
  projectionReason: text('projection_reason'), // e.g., "no_ground_intersection", "too_close"
  // Projection method used
  projectionMethod: text('projection_method'), // "krt" or "legacy"
});

// Track associations - after Hungarian assignment
export const debugTrackAssociations = sqliteTable('debug_track_associations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sessionId: text('session_id').references(() => debugSessions.id, { onDelete: 'cascade' }),
  projectedPositionId: integer('projected_position_id').references(() => debugProjectedPositions.id),
  timestamp: integer('timestamp').notNull(),
  // Detection info
  cameraId: text('camera_id').notNull(),
  cameraTrackId: integer('camera_track_id'),
  worldX: real('world_x'),
  worldY: real('world_y'),
  // Assignment result
  globalTrackId: text('global_track_id'),
  assignmentType: text('assignment_type'), // "matched", "new_track", "reidentified", "rejected"
  assignmentCost: real('assignment_cost'), // Hungarian algorithm cost
});

// Track state snapshots - periodic track state for analysis
export const debugTrackStates = sqliteTable('debug_track_states', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sessionId: text('session_id').references(() => debugSessions.id, { onDelete: 'cascade' }),
  timestamp: integer('timestamp').notNull(),
  globalTrackId: text('global_track_id').notNull(),
  // Position
  positionX: real('position_x'),
  positionY: real('position_y'),
  // Kalman filter state
  velocityX: real('velocity_x'),
  velocityY: real('velocity_y'),
  positionUncertainty: real('position_uncertainty'),
  // Track status
  state: text('state'), // "unconfirmed", "confirmed", "occluded"
  isActive: integer('is_active', { mode: 'boolean' }),
  isConfirmed: integer('is_confirmed', { mode: 'boolean' }),
  detectionCount: integer('detection_count'),
  confidence: real('confidence'),
  missedFrames: integer('missed_frames'),
  // Associated cameras
  cameraIds: text('camera_ids'), // JSON array
});

// Type exports for TypeScript
export type SiteConfig = typeof siteConfigs.$inferSelect;
export type NewSiteConfig = typeof siteConfigs.$inferInsert;
export type Camera = typeof cameras.$inferSelect;
export type NewCamera = typeof cameras.$inferInsert;
export type Wall = typeof walls.$inferSelect;
export type NewWall = typeof walls.$inferInsert;

// Debug logging types
export type DebugSession = typeof debugSessions.$inferSelect;
export type NewDebugSession = typeof debugSessions.$inferInsert;
export type DebugRawDetection = typeof debugRawDetections.$inferSelect;
export type NewDebugRawDetection = typeof debugRawDetections.$inferInsert;
export type DebugProjectedPosition = typeof debugProjectedPositions.$inferSelect;
export type NewDebugProjectedPosition = typeof debugProjectedPositions.$inferInsert;
export type DebugTrackAssociation = typeof debugTrackAssociations.$inferSelect;
export type NewDebugTrackAssociation = typeof debugTrackAssociations.$inferInsert;
export type DebugTrackState = typeof debugTrackStates.$inferSelect;
export type NewDebugTrackState = typeof debugTrackStates.$inferInsert;

// Zone types
export type Zone = typeof zones.$inferSelect;
export type NewZone = typeof zones.$inferInsert;
export type ZoneType = typeof zoneTypeEnum[number];
export type ZoneSeverity = typeof zoneSeverityEnum[number];
