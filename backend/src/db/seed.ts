/**
 * Database seeding script
 * Seeds the database from the sitemap JSON configuration file
 *
 * Usage: pnpm db:seed [--config <path>]
 */

import { db, siteConfigs, cameras, walls } from './client.js';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { eq } from 'drizzle-orm';

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface SiteMapConfig {
  dimensions: {
    width: number;
    height: number;
    unit: string;
  };
  walls: Array<{
    id: string;
    start: { x: number; y: number };
    end: { x: number; y: number };
    type: string;
  }>;
  cameras: Array<{
    id: string;
    name: string;
    model?: string;
    rtspUrl?: string;
    webrtcUrl?: string;
    ipAddress?: string;
    position: { x: number; y: number };
    height: number;
    azimuth: number;
    elevation?: number;
    fieldOfView: number;
    color?: string;
  }>;
}

const DEFAULT_CONFIG_PATH = resolve(__dirname, '../../..', 'shared/config/sitemap-rectangular-room.json');

export async function seed(configPath?: string): Promise<void> {
  const filePath = configPath || process.env.SITEMAP_CONFIG_PATH || DEFAULT_CONFIG_PATH;

  if (!existsSync(filePath)) {
    throw new Error(`Config file not found: ${filePath}`);
  }

  console.log(`📂 Loading config from: ${filePath}`);
  const configJson = readFileSync(filePath, 'utf-8');
  const config: SiteMapConfig = JSON.parse(configJson);

  const siteId = 'default';

  console.log('🗑️  Clearing existing data...');
  // Delete in order due to foreign key constraints
  db.delete(cameras).where(eq(cameras.siteConfigId, siteId)).run();
  db.delete(walls).where(eq(walls.siteConfigId, siteId)).run();
  db.delete(siteConfigs).where(eq(siteConfigs.id, siteId)).run();

  console.log('📍 Creating site configuration...');
  db.insert(siteConfigs).values({
    id: siteId,
    name: 'Default Site',
    width: config.dimensions.width,
    height: config.dimensions.height,
    unit: config.dimensions.unit,
  }).run();

  console.log(`📷 Seeding ${config.cameras.length} camera(s)...`);
  for (const cam of config.cameras) {
    db.insert(cameras).values({
      id: cam.id,
      siteConfigId: siteId,
      name: cam.name,
      model: cam.model,
      rtspUrl: cam.rtspUrl,
      webrtcUrl: cam.webrtcUrl,
      ipAddress: cam.ipAddress,
      positionX: cam.position.x,
      positionY: cam.position.y,
      height: cam.height,
      azimuth: cam.azimuth,
      elevation: cam.elevation ?? 45,
      fieldOfView: cam.fieldOfView,
      color: cam.color,
    }).run();
    console.log(`   ✓ ${cam.name} (${cam.id})`);
  }

  console.log(`🧱 Seeding ${config.walls.length} wall(s)...`);
  for (const wall of config.walls) {
    db.insert(walls).values({
      id: wall.id,
      siteConfigId: siteId,
      startX: wall.start.x,
      startY: wall.start.y,
      endX: wall.end.x,
      endY: wall.end.y,
      type: wall.type,
    }).run();
  }

  console.log('✅ Database seeded successfully!');

  // Print summary
  const cameraCount = db.select().from(cameras).all().length;
  const wallCount = db.select().from(walls).all().length;
  console.log(`\n📊 Summary:`);
  console.log(`   Site: ${config.dimensions.width}m × ${config.dimensions.height}m`);
  console.log(`   Cameras: ${cameraCount}`);
  console.log(`   Walls: ${wallCount}`);
}

// Run if executed directly (ESM)
const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  const args = process.argv.slice(2);
  const configIndex = args.indexOf('--config');
  const configPath = configIndex !== -1 ? args[configIndex + 1] : undefined;

  seed(configPath)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Seed failed:', err.message);
      process.exit(1);
    });
}
