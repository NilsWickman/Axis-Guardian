import express, { Request, Response } from 'express'

const router = express.Router()

// Mock analytics metadata producer configuration
const producerConfig: Record<string, any> = {
  'Analytics Scene Description': {
    channel: 1,
    enabled: true,
    source: 'analytics',
    dataTypes: ['polygon', 'polyline', 'point'],
    configurable: true
  },
  'Object Analytics': {
    channel: 1,
    enabled: false,
    source: 'analytics',
    dataTypes: ['object', 'classification'],
    configurable: true
  },
  'Motion Detection': {
    channel: 1,
    enabled: true,
    source: 'vmd',
    dataTypes: ['motion'],
    configurable: true
  }
}

// POST /axis-cgi/analyticsmetadataconfig.cgi - Analytics Metadata Producer Configuration API
router.post('/analyticsmetadataconfig.cgi', (req: Request, res: Response) => {
  try {
    const { method, params, context, apiVersion = '1.0' } = req.body

    switch (method) {
      case 'getSupportedVersions': {
        res.json({
          apiVersion,
          context: context || '',
          data: {
            apiVersions: ['1.0', '1.1']
          }
        })
        break
      }

      case 'getProducers': {
        const channel = params?.channel || 1
        const producers = Object.entries(producerConfig)
          .filter(([_, config]: [string, any]) => config.channel === channel)
          .map(([name, config]: [string, any]) => ({
            producer: name,
            channel: config.channel,
            enabled: config.enabled,
            source: config.source,
            dataTypes: config.dataTypes
          }))

        res.json({
          apiVersion,
          context: context || '',
          data: {
            producers
          }
        })
        break
      }

      case 'getProducerConfiguration': {
        const producer = params?.producer
        const channel = params?.channel || 1

        if (!producer || !producerConfig[producer]) {
          return res.status(400).json({
            apiVersion,
            context: context || '',
            error: {
              code: 1001,
              message: 'Invalid producer name'
            }
          })
        }

        const config = producerConfig[producer]

        res.json({
          apiVersion,
          context: context || '',
          data: {
            producer,
            channel: config.channel,
            enabled: config.enabled,
            source: config.source,
            dataTypes: config.dataTypes,
            configuration: {
              // Producer-specific configuration
              ...(producer === 'Analytics Scene Description' && {
                includePolygon: true,
                includePolyline: true,
                includePoint: true
              }),
              ...(producer === 'Object Analytics' && {
                objectTypes: ['human', 'vehicle'],
                minConfidence: 0.7
              }),
              ...(producer === 'Motion Detection' && {
                sensitivity: 50,
                gridSize: 16
              })
            }
          }
        })
        break
      }

      case 'setProducerConfiguration': {
        const producer = params?.producer
        const channel = params?.channel || 1
        const enabled = params?.enabled

        if (!producer || !producerConfig[producer]) {
          return res.status(400).json({
            apiVersion,
            context: context || '',
            error: {
              code: 1001,
              message: 'Invalid producer name'
            }
          })
        }

        const config = producerConfig[producer]

        // Update configuration
        if (enabled !== undefined) {
          config.enabled = enabled
        }
        if (channel !== undefined) {
          config.channel = channel
        }

        res.json({
          apiVersion,
          context: context || '',
          data: {
            success: true
          }
        })
        break
      }

      case 'getSupportedDataTypes': {
        res.json({
          apiVersion,
          context: context || '',
          data: {
            dataTypes: [
              {
                type: 'polygon',
                description: 'Polygon metadata (areas, zones)'
              },
              {
                type: 'polyline',
                description: 'Polyline metadata (paths, trajectories)'
              },
              {
                type: 'point',
                description: 'Point metadata (object positions)'
              },
              {
                type: 'object',
                description: 'Object detection metadata'
              },
              {
                type: 'classification',
                description: 'Object classification metadata'
              },
              {
                type: 'motion',
                description: 'Motion detection metadata'
              }
            ]
          }
        })
        break
      }

      case 'getStreamConfiguration': {
        const channel = params?.channel || 1

        res.json({
          apiVersion,
          context: context || '',
          data: {
            channel,
            rtspPath: `/axis-media/media.amp?camera=${channel}&analytics=on`,
            format: 'onvif',
            compression: 'none',
            enabled: true
          }
        })
        break
      }

      default:
        res.status(400).json({
          apiVersion,
          context: context || '',
          error: {
            code: 1000,
            message: `Unknown method: ${method}`
          }
        })
    }
  } catch (error) {
    console.error('Analytics Metadata Config API error:', error)
    res.status(500).json({
      apiVersion: '1.0',
      context: '',
      error: {
        code: 2000,
        message: 'Internal server error'
      }
    })
  }
})

export default router
