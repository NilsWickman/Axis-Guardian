/**
 * Detection data loader
 * Loads detection JSON files (supports .json and .json.gz)
 */

import fs from 'fs'
import zlib from 'zlib'
import type { DetectionData } from '../types.js'

export async function loadDetections(filePath: string): Promise<DetectionData> {
  console.log(`Loading detections from ${filePath}`)

  const isGzipped = filePath.endsWith('.gz')
  const fileBuffer = fs.readFileSync(filePath)

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

  return data
}
