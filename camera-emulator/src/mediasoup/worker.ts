/**
 * mediasoup Worker management
 */

import * as mediasoup from 'mediasoup'
import { mediasoupConfig } from '../config.js'

let worker: mediasoup.types.Worker | null = null

export async function createWorker(): Promise<mediasoup.types.Worker> {
  if (worker) return worker

  console.log('Creating mediasoup Worker...')

  worker = await mediasoup.createWorker(mediasoupConfig.worker)

  worker.on('died', (error) => {
    console.error('mediasoup Worker died:', error)
    process.exit(1)
  })

  console.log(`mediasoup Worker created (pid: ${worker.pid})`)
  return worker
}

export async function createRouter(worker: mediasoup.types.Worker): Promise<mediasoup.types.Router> {
  const router = await worker.createRouter({
    mediaCodecs: mediasoupConfig.router.mediaCodecs,
  })

  console.log(`mediasoup Router created (id: ${router.id})`)
  return router
}

export function getWorker(): mediasoup.types.Worker | null {
  return worker
}
