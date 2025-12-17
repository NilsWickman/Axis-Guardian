/**
 * Detection data loader
 * Loads detection JSON files (supports .json and .json.gz)
 * Applies track stitching to reduce fragmentation from YOLOv8's tracker
 */

import fs from 'fs'
import zlib from 'zlib'
import type { DetectionData } from '../types.js'
import { stitchTracks, type StitchConfig } from './track-stitcher.js'

export interface LoadOptions {
  /** Enable track stitching to reduce fragmentation (default: true) */
  enableStitching?: boolean
  /** Track stitching configuration */
  stitchConfig?: Partial<StitchConfig>
}

export async function loadDetections(
  filePath: string,
  options: LoadOptions = {}
): Promise<DetectionData> {
  const { enableStitching = true, stitchConfig } = options

  console.log(`Loading detections from ${filePath}`)

  const isGzipped = filePath.endsWith('.gz')

  let fileBuffer: Buffer
  try {
    fileBuffer = fs.readFileSync(filePath)
  } catch (err: any) {
    if (err?.code === 'ENOENT') {
      throw new Error(
        [
          `Detections file not found: ${filePath}`,
          `If you're running on the VPS, make sure you've copied detections to your VIDEO_PATH (often /opt/axis-guardian/videos).`,
          `Expected filenames commonly include:`,
          `  - view-HC3-preprocessed.detections.json.gz`,
          `  - view-HC4-preprocessed.detections.json.gz`,
          `Optionally, you can set DETECTIONS_VARIANT=preprocessed|reid|auto (default: auto).`,
        ].join('\n')
      )
    }
    throw err
  }

  let jsonString: string
  if (isGzipped) {
    const decompressed = zlib.gunzipSync(fileBuffer)
    jsonString = decompressed.toString('utf-8')
  } else {
    jsonString = fileBuffer.toString('utf-8')
  }

  const data: DetectionData = JSON.parse(jsonString)

  console.log(`Loaded ${data.frames.length} detection frames`)
  console.log(`  Video info: ${data.video_info.width}x${data.video_info.height} @ ${data.video_info.fps} fps`)
  console.log(`  Total frames: ${data.video_info.total_frames}`)

  // Apply track stitching to reduce fragmentation
  if (enableStitching) {
    const result = stitchTracks(data, stitchConfig)
    console.log(`  Track stitching: ${result.originalTrackCount} -> ${result.stitchedTrackCount} tracks (${result.stitchesPerformed} stitches)`)
  }

  return data
}
