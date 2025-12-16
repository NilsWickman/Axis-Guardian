import { existsSync } from 'fs'
import { resolve } from 'path'

function findRepoRootFromCwd(): string {
  // Heuristic: walk up until we find a directory that contains `frontend/public`.
  let current = process.cwd()
  for (let i = 0; i < 6; i++) {
    const candidate = resolve(current, 'frontend', 'public')
    if (existsSync(candidate)) return current
    const parent = resolve(current, '..')
    if (parent === current) break
    current = parent
  }
  // Fallback: assume we are in `tracking-service/`
  return resolve(process.cwd(), '..')
}

export function getDefaultReplayDirs(): {
  repoRoot: string
  recordingsDir: string
  frontendPublicDir: string
  frontendRecordingsPublicDir: string
} {
  const repoRoot = findRepoRootFromCwd()
  const recordingsDir =
    process.env.RECORDINGS_DIR
      ? resolve(process.env.RECORDINGS_DIR)
      : resolve(repoRoot, 'tracking-service', 'recordings')

  const frontendPublicDir =
    process.env.FRONTEND_PUBLIC_DIR
      ? resolve(process.env.FRONTEND_PUBLIC_DIR)
      : resolve(repoRoot, 'frontend', 'public')

  const frontendRecordingsPublicDir = resolve(frontendPublicDir, 'recordings')

  return { repoRoot, recordingsDir, frontendPublicDir, frontendRecordingsPublicDir }
}

export function recordingDir(recordingsDir: string, recordingId: string): string {
  return resolve(recordingsDir, recordingId)
}

export function recordingManifestPath(recordingDirPath: string): string {
  return resolve(recordingDirPath, 'manifest.json')
}

export function recordingEventsPath(recordingDirPath: string): string {
  return resolve(recordingDirPath, 'events.ndjson')
}

export function recordingSnapshotsPath(recordingDirPath: string): string {
  return resolve(recordingDirPath, 'snapshots.ndjson')
}

export function publicRecordingDir(frontendRecordingsPublicDir: string, recordingId: string): string {
  return resolve(frontendRecordingsPublicDir, recordingId)
}

export function toPublicRecordingUrl(recordingId: string, relativePathInRecording: string): string {
  // Served by frontend Vite static server (frontend/public/*).
  return `/recordings/${encodeURIComponent(recordingId)}/${relativePathInRecording.split('\\').join('/')}`
}

export function safeBasename(p: string): string {
  // Avoid importing `path.basename` just for this tiny use; keep robust across platforms.
  const normalized = p.split('\\').join('/')
  const idx = normalized.lastIndexOf('/')
  return idx >= 0 ? normalized.slice(idx + 1) : normalized
}


