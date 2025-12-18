/**
 * Database migration script
 * Creates tables if they don't exist
 *
 * Usage: pnpm db:migrate
 */

import { sqlite } from './client.js';

const migrations = [
  // Site configs table
  `CREATE TABLE IF NOT EXISTS site_configs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    width REAL NOT NULL,
    height REAL NOT NULL,
    unit TEXT NOT NULL DEFAULT 'meters',
    created_at INTEGER,
    updated_at INTEGER
  )`,

  // Cameras table
  `CREATE TABLE IF NOT EXISTS cameras (
    id TEXT PRIMARY KEY,
    site_config_id TEXT NOT NULL REFERENCES site_configs(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    model TEXT,
    rtsp_url TEXT,
    webrtc_url TEXT,
    ip_address TEXT,
    position_x REAL NOT NULL,
    position_y REAL NOT NULL,
    height REAL NOT NULL,
    azimuth REAL NOT NULL,
    elevation REAL NOT NULL DEFAULT 45,
    field_of_view REAL NOT NULL,
    color TEXT,
    created_at INTEGER,
    updated_at INTEGER
  )`,

  // Walls table
  `CREATE TABLE IF NOT EXISTS walls (
    id TEXT PRIMARY KEY,
    site_config_id TEXT NOT NULL REFERENCES site_configs(id) ON DELETE CASCADE,
    start_x REAL NOT NULL,
    start_y REAL NOT NULL,
    end_x REAL NOT NULL,
    end_y REAL NOT NULL,
    type TEXT NOT NULL DEFAULT 'external'
  )`,

  // Zones table - for restricted area monitoring
  `CREATE TABLE IF NOT EXISTS zones (
    id TEXT PRIMARY KEY,
    site_config_id TEXT NOT NULL REFERENCES site_configs(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'restricted',
    vertices TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1,
    severity TEXT NOT NULL DEFAULT 'high',
    color TEXT DEFAULT '#ef4444',
    cooldown_ms INTEGER NOT NULL DEFAULT 30000,
    created_at INTEGER,
    updated_at INTEGER
  )`,

  // Indexes for faster lookups
  `CREATE INDEX IF NOT EXISTS idx_cameras_site ON cameras(site_config_id)`,
  `CREATE INDEX IF NOT EXISTS idx_walls_site ON walls(site_config_id)`,
  `CREATE INDEX IF NOT EXISTS idx_zones_site ON zones(site_config_id)`,

  // ============================================================================
  // Debug Logging Tables (for pipeline troubleshooting)
  // ============================================================================

  // Debug sessions table
  `CREATE TABLE IF NOT EXISTS debug_sessions (
    id TEXT PRIMARY KEY,
    name TEXT,
    started_at INTEGER,
    ended_at INTEGER,
    notes TEXT
  )`,

  // Raw detections - from camera emulator before projection
  `CREATE TABLE IF NOT EXISTS debug_raw_detections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT REFERENCES debug_sessions(id) ON DELETE CASCADE,
    timestamp INTEGER NOT NULL,
    camera_id TEXT NOT NULL,
    frame_number INTEGER,
    track_id INTEGER,
    class_name TEXT,
    confidence REAL,
    bbox_x REAL,
    bbox_y REAL,
    bbox_width REAL,
    bbox_height REAL
  )`,

  // Projected positions - after ground-plane projection
  `CREATE TABLE IF NOT EXISTS debug_projected_positions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT REFERENCES debug_sessions(id) ON DELETE CASCADE,
    raw_detection_id INTEGER REFERENCES debug_raw_detections(id),
    timestamp INTEGER NOT NULL,
    camera_id TEXT NOT NULL,
    track_id INTEGER,
    world_x REAL,
    world_y REAL,
    is_valid INTEGER,
    projection_reason TEXT,
    projection_method TEXT
  )`,

  // Track associations - after Hungarian assignment
  `CREATE TABLE IF NOT EXISTS debug_track_associations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT REFERENCES debug_sessions(id) ON DELETE CASCADE,
    projected_position_id INTEGER REFERENCES debug_projected_positions(id),
    timestamp INTEGER NOT NULL,
    camera_id TEXT NOT NULL,
    camera_track_id INTEGER,
    world_x REAL,
    world_y REAL,
    global_track_id TEXT,
    assignment_type TEXT,
    assignment_cost REAL
  )`,

  // Track state snapshots - periodic track state for analysis
  `CREATE TABLE IF NOT EXISTS debug_track_states (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT REFERENCES debug_sessions(id) ON DELETE CASCADE,
    timestamp INTEGER NOT NULL,
    global_track_id TEXT NOT NULL,
    position_x REAL,
    position_y REAL,
    velocity_x REAL,
    velocity_y REAL,
    position_uncertainty REAL,
    state TEXT,
    is_active INTEGER,
    is_confirmed INTEGER,
    detection_count INTEGER,
    confidence REAL,
    missed_frames INTEGER,
    camera_ids TEXT
  )`,

  // Indexes for debug tables
  `CREATE INDEX IF NOT EXISTS idx_debug_raw_session ON debug_raw_detections(session_id)`,
  `CREATE INDEX IF NOT EXISTS idx_debug_raw_timestamp ON debug_raw_detections(timestamp)`,
  `CREATE INDEX IF NOT EXISTS idx_debug_projected_session ON debug_projected_positions(session_id)`,
  `CREATE INDEX IF NOT EXISTS idx_debug_assoc_session ON debug_track_associations(session_id)`,
  `CREATE INDEX IF NOT EXISTS idx_debug_states_session ON debug_track_states(session_id)`,
  `CREATE INDEX IF NOT EXISTS idx_debug_states_track ON debug_track_states(global_track_id)`,
];

export function migrate(): void {
  console.log('🔄 Running migrations...');

  sqlite.pragma('foreign_keys = ON');

  for (const sql of migrations) {
    try {
      sqlite.exec(sql);
    } catch (err) {
      console.error('Migration failed:', sql.slice(0, 50) + '...');
      throw err;
    }
  }

  console.log('✅ Migrations complete!');
}

// Run if executed directly (ESM)
const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  try {
    migrate();
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}
