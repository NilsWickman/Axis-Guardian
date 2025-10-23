import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Clear existing data
  await prisma.alarm.deleteMany()
  await prisma.detection.deleteMany()
  await prisma.track.deleteMany()
  await prisma.stream.deleteMany()
  await prisma.camera.deleteMany()
  await prisma.zone.deleteMany()
  await prisma.user.deleteMany()

  // Create users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@axis.local',
        passwordHash: 'mock-hash-admin',
        role: 'ADMIN',
        permissions: JSON.stringify(['read', 'write', 'delete', 'manage_users', 'manage_cameras'])
      }
    }),
    prisma.user.create({
      data: {
        username: 'operator',
        email: 'operator@axis.local',
        passwordHash: 'mock-hash-operator',
        role: 'OPERATOR',
        permissions: JSON.stringify(['read', 'write', 'acknowledge_alarms'])
      }
    }),
    prisma.user.create({
      data: {
        username: 'viewer',
        email: 'viewer@axis.local',
        passwordHash: 'mock-hash-viewer',
        role: 'VIEWER',
        permissions: JSON.stringify(['read'])
      }
    })
  ])

  console.log(`✅ Created ${users.length} users`)

  // Create cameras
  const cameras = await Promise.all([
    prisma.camera.create({
      data: {
        id: 'camera1',
        name: 'People Detection - Main Entrance',
        rtspUrl: 'rtsp://localhost:8554/camera1',
        status: 'ONLINE',
        position: JSON.stringify({ x: 100, y: 200, z: 0 }),
        capabilities: JSON.stringify({
          ptz: true,
          audio: true,
          analytics: true,
          resolution: '1920x1080',
          fps: 30
        })
      }
    }),
    prisma.camera.create({
      data: {
        id: 'camera2',
        name: 'Car Detection - Parking Lot',
        rtspUrl: 'rtsp://localhost:8554/camera2',
        status: 'ONLINE',
        position: JSON.stringify({ x: 300, y: 150, z: 0 }),
        capabilities: JSON.stringify({
          ptz: false,
          audio: false,
          analytics: true,
          resolution: '1920x1080',
          fps: 25
        })
      }
    }),
    prisma.camera.create({
      data: {
        id: 'camera3',
        name: 'Mixed Detection - Exit Gate',
        rtspUrl: 'rtsp://localhost:8554/camera3',
        status: 'ONLINE',
        position: JSON.stringify({ x: 500, y: 100, z: 0 }),
        capabilities: JSON.stringify({
          ptz: true,
          audio: false,
          analytics: true,
          resolution: '1920x1080',
          fps: 30
        })
      }
    })
  ])

  console.log(`✅ Created ${cameras.length} cameras`)

  // Create zones
  const zones = await Promise.all([
    prisma.zone.create({
      data: {
        id: 'zone-entrance',
        name: 'Entrance Zone',
        type: 'ENTRY',
        polygon: JSON.stringify([
          { x: 50, y: 150 },
          { x: 150, y: 150 },
          { x: 150, y: 250 },
          { x: 50, y: 250 }
        ]),
        rules: JSON.stringify([
          {
            id: 'rule-1',
            type: 'no_entry',
            enabled: true,
            parameters: { timeRange: '22:00-06:00' }
          }
        ])
      }
    }),
    prisma.zone.create({
      data: {
        id: 'zone-parking',
        name: 'Parking Area',
        type: 'MONITORED',
        polygon: JSON.stringify([
          { x: 200, y: 100 },
          { x: 400, y: 100 },
          { x: 400, y: 200 },
          { x: 200, y: 200 }
        ]),
        rules: JSON.stringify([
          {
            id: 'rule-2',
            type: 'loitering',
            enabled: true,
            parameters: { maxDuration: 300 }
          }
        ])
      }
    })
  ])

  console.log(`✅ Created ${zones.length} zones`)

  // Create tracks
  const tracks = await Promise.all([
    prisma.track.create({
      data: {
        trackId: uuidv4(),
        predictedPosition: JSON.stringify({ x: 125, y: 200 }),
        velocity: JSON.stringify({ dx: 1.2, dy: 0.5, speed: 1.3 }),
        active: true
      }
    }),
    prisma.track.create({
      data: {
        trackId: uuidv4(),
        predictedPosition: JSON.stringify({ x: 350, y: 175 }),
        velocity: JSON.stringify({ dx: -0.8, dy: 0.2, speed: 0.8 }),
        active: false
      }
    })
  ])

  console.log(`✅ Created ${tracks.length} tracks`)

  // Create sample detections
  const detectionTypes = ['PERSON', 'VEHICLE', 'ANIMAL']
  const cameraIds = cameras.map(c => c.id)

  for (let i = 0; i < 50; i++) {
    const cameraId = cameraIds[Math.floor(Math.random() * cameraIds.length)]
    const type = detectionTypes[Math.floor(Math.random() * detectionTypes.length)]
    const confidence = 0.6 + Math.random() * 0.4

    await prisma.detection.create({
      data: {
        cameraId,
        type,
        confidence,
        bbox: JSON.stringify({
          x: Math.random() * 800,
          y: Math.random() * 600,
          width: 50 + Math.random() * 200,
          height: 50 + Math.random() * 200
        }),
        attributes: JSON.stringify({
          color: ['red', 'blue', 'green', 'black', 'white'][Math.floor(Math.random() * 5)],
          size: ['small', 'medium', 'large'][Math.floor(Math.random() * 3)]
        }),
        trackId: Math.random() > 0.5 ? tracks[0].trackId : tracks[1].trackId,
        timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000) // Last 24 hours
      }
    })
  }

  console.log(`✅ Created 50 sample detections`)

  // Create sample alarms
  const alarmTypes = ['INTRUSION', 'LOITERING', 'LINE_CROSSING', 'ZONE_VIOLATION']
  const severities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

  for (let i = 0; i < 10; i++) {
    const cameraId = cameraIds[Math.floor(Math.random() * cameraIds.length)]
    const type = alarmTypes[Math.floor(Math.random() * alarmTypes.length)]
    const severity = severities[Math.floor(Math.random() * severities.length)]
    const acknowledged = Math.random() > 0.6 // 40% acknowledged

    await prisma.alarm.create({
      data: {
        type,
        severity,
        source: JSON.stringify({
          cameraId,
          zoneId: 'zone-entrance',
          trackId: tracks[Math.floor(Math.random() * tracks.length)].trackId,
          snapshot: `http://localhost:8000/snapshots/${uuidv4()}.jpg`
        }),
        cameraId,
        acknowledged,
        acknowledgedBy: acknowledged ? users[Math.floor(Math.random() * users.length)].username : null,
        acknowledgedAt: acknowledged ? new Date(Date.now() - Math.random() * 12 * 60 * 60 * 1000) : null,
        timestamp: new Date(Date.now() - Math.random() * 48 * 60 * 60 * 1000) // Last 48 hours
      }
    })
  }

  console.log(`✅ Created 10 sample alarms`)

  console.log('🎉 Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })