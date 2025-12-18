/**
 * Database repository functions for accessing site config, cameras, and walls
 */

import { db, cameras, walls, siteConfigs, zones } from './client.js';
import { eq } from 'drizzle-orm';
import type { ZoneConfig } from '../types.js';
import type { CameraParams } from '../types';

export interface CameraRecord {
  id: string;
  name: string;
  model: string | null;
  rtspUrl: string | null;
  webrtcUrl: string | null;
  ipAddress: string | null;
  positionX: number;
  positionY: number;
  height: number;
  azimuth: number;
  elevation: number;
  fieldOfView: number;
  color: string | null;
}

export interface SiteConfigRecord {
  id: string;
  name: string;
  width: number;
  height: number;
  unit: string;
}

export interface WallRecord {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  type: string;
}

/**
 * Get all cameras for a site, converted to CameraParams format
 */
export function getCamerasForSite(siteId: string = 'default'): Map<string, CameraParams> {
  const rows = db
    .select()
    .from(cameras)
    .where(eq(cameras.siteConfigId, siteId))
    .all();

  const result = new Map<string, CameraParams>();

  for (const row of rows) {
    result.set(row.id, {
      position: {
        x: row.positionX,
        y: row.positionY,
        z: row.height,
      },
      azimuth: row.azimuth,
      elevation: row.elevation,
      fov: row.fieldOfView,
    });
  }

  return result;
}

/**
 * Get a single camera by ID
 */
export function getCameraById(cameraId: string): CameraRecord | undefined {
  return db.select().from(cameras).where(eq(cameras.id, cameraId)).get();
}

/**
 * Get camera as CameraParams by ID
 */
export function getCameraParams(cameraId: string): CameraParams | undefined {
  const row = getCameraById(cameraId);
  if (!row) return undefined;

  return {
    position: {
      x: row.positionX,
      y: row.positionY,
      z: row.height,
    },
    azimuth: row.azimuth,
    elevation: row.elevation,
    fov: row.fieldOfView,
  };
}

/**
 * Get all cameras as raw records
 */
export function getAllCameras(siteId: string = 'default'): CameraRecord[] {
  return db
    .select()
    .from(cameras)
    .where(eq(cameras.siteConfigId, siteId))
    .all();
}

/**
 * Get site configuration
 */
export function getSiteConfig(siteId: string = 'default'): SiteConfigRecord | undefined {
  return db.select().from(siteConfigs).where(eq(siteConfigs.id, siteId)).get();
}

/**
 * Get all walls for a site
 */
export function getWalls(siteId: string = 'default'): WallRecord[] {
  return db
    .select()
    .from(walls)
    .where(eq(walls.siteConfigId, siteId))
    .all();
}

/**
 * Check if database is seeded
 */
export function isDatabaseSeeded(): boolean {
  const config = db.select().from(siteConfigs).get();
  return config !== undefined;
}

/**
 * Get full site map config in JSON format (matches frontend format)
 */
export function getSiteMapConfigJson(siteId: string = 'default') {
  const site = getSiteConfig(siteId);
  if (!site) return null;

  const cameraRows = getAllCameras(siteId);
  const wallRows = getWalls(siteId);

  return {
    dimensions: {
      width: site.width,
      height: site.height,
      unit: site.unit,
    },
    cameras: cameraRows.map((cam) => ({
      id: cam.id,
      name: cam.name,
      model: cam.model,
      rtspUrl: cam.rtspUrl,
      webrtcUrl: cam.webrtcUrl,
      ipAddress: cam.ipAddress,
      position: { x: cam.positionX, y: cam.positionY },
      height: cam.height,
      azimuth: cam.azimuth,
      elevation: cam.elevation,
      fieldOfView: cam.fieldOfView,
      color: cam.color,
    })),
    walls: wallRows.map((wall) => ({
      id: wall.id,
      start: { x: wall.startX, y: wall.startY },
      end: { x: wall.endX, y: wall.endY },
      type: wall.type,
    })),
  };
}

// ============================================================================
// Zone Repository Functions
// ============================================================================

/**
 * Get all zones for a site
 */
export function getZones(siteId: string = 'default'): ZoneConfig[] {
  const rows = db
    .select()
    .from(zones)
    .where(eq(zones.siteConfigId, siteId))
    .all();

  return rows.map((row) => ({
    id: row.id,
    siteConfigId: row.siteConfigId,
    name: row.name,
    type: row.type as ZoneConfig['type'],
    vertices: row.vertices as ZoneConfig['vertices'],
    enabled: row.enabled,
    severity: row.severity as ZoneConfig['severity'],
    color: row.color ?? '#ef4444',
    cooldownMs: row.cooldownMs,
    createdAt: row.createdAt ?? undefined,
    updatedAt: row.updatedAt ?? undefined,
  }));
}

/**
 * Get a single zone by ID
 */
export function getZoneById(zoneId: string): ZoneConfig | undefined {
  const row = db.select().from(zones).where(eq(zones.id, zoneId)).get();
  if (!row) return undefined;

  return {
    id: row.id,
    siteConfigId: row.siteConfigId,
    name: row.name,
    type: row.type as ZoneConfig['type'],
    vertices: row.vertices as ZoneConfig['vertices'],
    enabled: row.enabled,
    severity: row.severity as ZoneConfig['severity'],
    color: row.color ?? '#ef4444',
    cooldownMs: row.cooldownMs,
    createdAt: row.createdAt ?? undefined,
    updatedAt: row.updatedAt ?? undefined,
  };
}

/**
 * Create a new zone
 */
export function createZone(zone: Omit<ZoneConfig, 'createdAt' | 'updatedAt'>): ZoneConfig {
  const now = new Date();
  db.insert(zones).values({
    id: zone.id,
    siteConfigId: zone.siteConfigId,
    name: zone.name,
    type: zone.type,
    vertices: zone.vertices,
    enabled: zone.enabled,
    severity: zone.severity,
    color: zone.color,
    cooldownMs: zone.cooldownMs,
    createdAt: now,
    updatedAt: now,
  }).run();

  return {
    ...zone,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Update an existing zone
 */
export function updateZone(zoneId: string, updates: Partial<Omit<ZoneConfig, 'id' | 'siteConfigId' | 'createdAt'>>): ZoneConfig | undefined {
  const existing = getZoneById(zoneId);
  if (!existing) return undefined;

  const now = new Date();
  db.update(zones)
    .set({
      ...(updates.name !== undefined && { name: updates.name }),
      ...(updates.type !== undefined && { type: updates.type }),
      ...(updates.vertices !== undefined && { vertices: updates.vertices }),
      ...(updates.enabled !== undefined && { enabled: updates.enabled }),
      ...(updates.severity !== undefined && { severity: updates.severity }),
      ...(updates.color !== undefined && { color: updates.color }),
      ...(updates.cooldownMs !== undefined && { cooldownMs: updates.cooldownMs }),
      updatedAt: now,
    })
    .where(eq(zones.id, zoneId))
    .run();

  return getZoneById(zoneId);
}

/**
 * Delete a zone
 */
export function deleteZone(zoneId: string): boolean {
  const result = db.delete(zones).where(eq(zones.id, zoneId)).run();
  return result.changes > 0;
}
