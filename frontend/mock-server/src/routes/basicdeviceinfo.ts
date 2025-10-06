import express, { Request, Response } from 'express'
import { basicAuth } from '../middleware/digestAuth.js'

const router = express.Router()

// Mock users for conditional auth
const mockUsers = {
  'root': 'pass',
  'admin': 'admin',
  'operator': 'operator',
  'viewer': 'viewer'
}

// Mock device properties
const deviceProperties = {
  Architecture: 'arm',
  Brand: 'AXIS',
  BuildDate: 'Jan 15 2025 10:00',
  HardwareID: '123.4',
  ProdFullName: 'AXIS Mock Network Camera',
  ProdNbr: 'M1234',
  ProdShortName: 'AXIS M1234',
  ProdType: 'Network Camera',
  ProdVariant: '',
  SerialNumber: 'MOCK12345678',
  Soc: 'Mock SoC',
  SocSerialNumber: '00000000-00000000-12345678-ABCDEF00',
  Version: '11.0.0',
  WebURL: 'http://www.axis.com',
}

// Unrestricted properties (available without auth)
const unrestrictedProperties = {
  Brand: deviceProperties.Brand,
  ProdNbr: deviceProperties.ProdNbr,
  ProdType: deviceProperties.ProdType,
  SerialNumber: deviceProperties.SerialNumber,
}

// POST /axis-cgi/basicdeviceinfo.cgi - Basic Device Information API
router.post('/basicdeviceinfo.cgi', (req: Request, res: Response, next) => {
  // Only getAllUnrestrictedProperties is allowed without auth
  if (req.body?.method === 'getAllUnrestrictedProperties') {
    return handleRequest(req, res)
  }

  // All other methods require auth
  return basicAuth(mockUsers)(req, res, () => handleRequest(req, res))
})

function handleRequest(req: Request, res: Response) {
  try {
    const { method, params, context } = req.body
    const apiVersion = req.body.apiVersion || '1.0'

    switch (method) {
      case 'getAllProperties': {
        res.json({
          apiVersion,
          context: context || '',
          data: {
            propertyList: deviceProperties,
          },
        })
        break
      }

      case 'getProperties': {
        const requestedProps = params?.propertyList || []
        const result: Record<string, any> = {}

        for (const prop of requestedProps) {
          if (deviceProperties.hasOwnProperty(prop)) {
            result[prop] = deviceProperties[prop as keyof typeof deviceProperties]
          }
        }

        res.json({
          apiVersion,
          context: context || '',
          data: {
            propertyList: result,
          },
        })
        break
      }

      case 'getAllUnrestrictedProperties': {
        res.json({
          apiVersion,
          context: context || '',
          data: {
            propertyList: unrestrictedProperties,
          },
        })
        break
      }

      case 'getSupportedVersions': {
        res.json({
          apiVersion,
          context: context || '',
          data: {
            apiVersions: ['1.0', '1.1'],
          },
        })
        break
      }

      default:
        res.status(400).json({
          apiVersion,
          context: context || '',
          error: {
            code: 1000,
            message: `Unknown method: ${method}`,
          },
        })
    }
  } catch (error) {
    console.error('Basic device info error:', error)
    res.status(500).json({
      apiVersion: '1.0',
      context: '',
      error: {
        code: 2000,
        message: 'Internal server error',
      },
    })
  }
}

export default router
