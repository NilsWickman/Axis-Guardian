import { createReadStream } from 'fs'
import * as readline from 'readline'

export async function readNdjsonFile<T = unknown>(
  filePath: string,
  onItem: (item: T) => void | Promise<void>
): Promise<void> {
  const stream = createReadStream(filePath, { encoding: 'utf-8' })
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity })

  for await (const line of rl) {
    const trimmed = line.trim()
    if (!trimmed) continue
    let obj: T | null = null
    try {
      obj = JSON.parse(trimmed) as T
    } catch {
      // Ignore malformed lines (best-effort)
      obj = null
    }
    if (obj === null) continue
    // Let callback errors propagate (allows early termination).
    await onItem(obj)
  }
}


