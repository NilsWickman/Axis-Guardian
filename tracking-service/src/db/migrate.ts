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

  // Indexes for faster lookups
  `CREATE INDEX IF NOT EXISTS idx_cameras_site ON cameras(site_config_id)`,
  `CREATE INDEX IF NOT EXISTS idx_walls_site ON walls(site_config_id)`,
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
