/**
 * Database repository functions for accessing site config, cameras, and walls
 */

import { db, cameras, walls, siteConfigs } from './client.js';
import { eq } from 'drizzle-orm';
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
