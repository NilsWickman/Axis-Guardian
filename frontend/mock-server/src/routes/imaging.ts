import express, { Request, Response } from 'express'

const router = express.Router()

// Mock imaging configuration storage (per camera)
const imagingConfig: Record<string, any> = {
  '1': {
    brightness: 50,
    contrast: 50,
    saturation: 50,
    sharpness: 50,
    whiteBalance: 'auto',
    exposureMode: 'auto',
    exposureValue: 50,
    wdr: true,
    irCutFilter: 'auto',
    defog: false,
    noiseReduction: 50
  }
}

// Helper to get or initialize camera config
function getCameraConfig(camera: string) {
  if (!imagingConfig[camera]) {
    imagingConfig[camera] = {
      brightness: 50,
      contrast: 50,
      saturation: 50,
      sharpness: 50,
      whiteBalance: 'auto',
      exposureMode: 'auto',
      exposureValue: 50,
      wdr: true,
      irCutFilter: 'auto',
      defog: false,
      noiseReduction: 50
    }
  }
  return imagingConfig[camera]
}

// POST /axis-cgi/imaging.cgi - Imaging API (JSON-RPC style)
router.post('/imaging.cgi', (req: Request, res: Response) => {
  try {
    const { method, params, context, apiVersion = '1.0' } = req.body
    const camera = params?.camera || '1'

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

      case 'getCapabilities': {
        res.json({
          apiVersion,
          context: context || '',
          data: {
            capabilities: {
              brightness: { min: 0, max: 100, step: 1 },
              contrast: { min: 0, max: 100, step: 1 },
              saturation: { min: 0, max: 100, step: 1 },
              sharpness: { min: 0, max: 100, step: 1 },
              whiteBalance: ['auto', 'daylight', 'cloudy', 'tungsten', 'fluorescent'],
              exposureMode: ['auto', 'manual', 'aperture', 'shutter'],
              exposureValue: { min: 0, max: 100, step: 1 },
              wdr: true,
              irCutFilter: ['auto', 'on', 'off'],
              defog: true,
              noiseReduction: { min: 0, max: 100, step: 1 }
            }
          }
        })
        break
      }

      case 'getSettings': {
        const config = getCameraConfig(camera)
        res.json({
          apiVersion,
          context: context || '',
          data: {
            settings: config
          }
        })
        break
      }

      case 'setSettings': {
        const config = getCameraConfig(camera)
        const settings = params?.settings || {}

        // Update settings
        Object.assign(config, settings)

        res.json({
          apiVersion,
          context: context || '',
          data: {
            success: true
          }
        })
        break
      }

      case 'resetSettings': {
        const config = getCameraConfig(camera)

        // Reset to defaults
        config.brightness = 50
        config.contrast = 50
        config.saturation = 50
        config.sharpness = 50
        config.whiteBalance = 'auto'
        config.exposureMode = 'auto'
        config.exposureValue = 50
        config.wdr = true
        config.irCutFilter = 'auto'
        config.defog = false
        config.noiseReduction = 50

        res.json({
          apiVersion,
          context: context || '',
          data: {
            success: true
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
    console.error('Imaging API error:', error)
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
