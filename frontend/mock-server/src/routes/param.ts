import express, { Request, Response } from 'express'

const router = express.Router()

// Mock parameter storage
const parameters: Record<string, any> = {
  // Properties (read-only)
  'Properties.API.HTTP.Version': '3',
  'Properties.API.RTSP.Version': '2.01',
  'Properties.API.RTSP.RTSPAuth': 'yes',
  'Properties.Image.Format': 'jpeg,mjpeg,h264,h265',
  'Properties.Image.Resolution': '1920x1080,1280x720,640x480,320x240',
  'Properties.Image.Rotation': '0,90,180,270',
  'Properties.Firmware.BuildDate': 'Jan 15 2025 10:00',
  'Properties.Firmware.Version': '11.0.0',
  'Properties.System.SerialNumber': 'MOCK12345678',

  // Network settings
  'Network.VolatileHostName.ObtainFromDHCP': 'yes',
  'Network.eth0.IPAddress': '192.168.1.100',
  'Network.eth0.MACAddress': '00:40:8c:12:34:56',

  // Image settings
  'Image.I0.Appearance.Compression': '30',
  'Image.I0.Appearance.Resolution': '1920x1080',
  'ImageSource.I0.Sensor.MaxFrameRate': '30',

  // System settings
  'System.MaxViewers': '20',
  'Brand.Brand': 'AXIS',
  'Brand.ProdFullName': 'AXIS Mock Camera',
  'Brand.ProdNbr': 'M1234',
  'Brand.ProdShortName': 'AXIS M1234',
  'Brand.ProdType': 'Network Camera',
  'Brand.WebURL': 'http://www.axis.com',
}

// Stream profiles storage
const streamProfiles: Record<string, any> = {
  'StreamProfile.S0.Name': 'High',
  'StreamProfile.S0.Description': 'High quality profile',
  'StreamProfile.S0.Parameters': 'videocodec=h264&resolution=1920x1080&compression=20',
  'StreamProfile.S1.Name': 'Medium',
  'StreamProfile.S1.Description': 'Medium quality profile',
  'StreamProfile.S1.Parameters': 'videocodec=h264&resolution=1280x720&compression=30',
  'StreamProfile.S2.Name': 'Low',
  'StreamProfile.S2.Description': 'Low bandwidth profile',
  'StreamProfile.S2.Parameters': 'videocodec=h264&resolution=640x480&compression=40',
}

// Merge stream profiles into parameters
Object.assign(parameters, streamProfiles)

// Helper to get parameters by group or wildcard
function getParametersByPattern(pattern: string): Record<string, any> {
  const result: Record<string, any> = {}

  if (pattern === 'root' || pattern === '*') {
    return { ...parameters }
  }

  // Handle wildcard patterns
  if (pattern.includes('*')) {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$')
    for (const [key, value] of Object.entries(parameters)) {
      if (regex.test(key)) {
        result[key] = value
      }
    }
  } else {
    // Handle group patterns
    for (const [key, value] of Object.entries(parameters)) {
      if (key === pattern || key.startsWith(pattern + '.')) {
        result[key] = value
      }
    }
  }

  return result
}

// GET /axis-cgi/param.cgi - Parameter management
router.get('/param.cgi', (req: Request, res: Response) => {
  const { action, group } = req.query

  try {
    switch (action) {
      case 'list': {
        const pattern = (group as string) || 'root'
        const params = getParametersByPattern(pattern)

        if (Object.keys(params).length === 0) {
          return res.status(200).send('# Error: Invalid group')
        }

        // Format response as key=value pairs
        const response = Object.entries(params)
          .map(([key, value]) => `root.${key}=${value}`)
          .join('\n')

        res.set('Content-Type', 'text/plain')
        res.send(response + '\n')
        break
      }

      case 'listdefinitions': {
        const pattern = (group as string) || 'root'
        const params = getParametersByPattern(pattern)

        if (Object.keys(params).length === 0) {
          return res.status(200).send('<?xml version="1.0"?><reply><error>Invalid group</error></reply>')
        }

        // Build XML response
        let xml = '<?xml version="1.0"?>\n<reply>\n'

        for (const [key, value] of Object.entries(params)) {
          xml += `  <parameter name="${key}" value="${value}" securityLevel="7704">\n`
          xml += `    <type>string</type>\n`
          xml += `  </parameter>\n`
        }

        xml += '</reply>'

        res.set('Content-Type', 'text/xml')
        res.send(xml)
        break
      }

      case 'update': {
        // Extract parameter updates from query string
        let updated = false
        for (const [key, value] of Object.entries(req.query)) {
          if (key !== 'action' && parameters.hasOwnProperty(key)) {
            parameters[key] = value
            updated = true
          }
        }

        if (updated) {
          res.set('Content-Type', 'text/plain')
          res.send('OK\n')
        } else {
          res.status(400).send('# Error: No valid parameters to update\n')
        }
        break
      }

      case 'add': {
        const template = req.query.template as string
        const groupName = req.query.group as string

        if (template === 'streamprofile' && groupName === 'StreamProfile') {
          // Find next available profile number
          let maxId = -1
          for (const key of Object.keys(parameters)) {
            const match = key.match(/^StreamProfile\.S(\d+)\./)
            if (match) {
              maxId = Math.max(maxId, parseInt(match[1]))
            }
          }

          const newId = maxId + 1
          const profileKey = `StreamProfile.S${newId}`

          // Set default values
          parameters[`${profileKey}.Name`] = req.query[`${groupName}.S.Name`] || `Profile${newId}`
          parameters[`${profileKey}.Description`] = req.query[`${groupName}.S.Description`] || ''
          parameters[`${profileKey}.Parameters`] = req.query[`${groupName}.S.Parameters`] || ''

          res.set('Content-Type', 'text/plain')
          res.send(`S${newId} OK\n`)
        } else {
          res.status(400).send('# Error: Invalid template or group\n')
        }
        break
      }

      case 'remove': {
        const groupToRemove = req.query.group as string

        if (groupToRemove && groupToRemove.startsWith('StreamProfile.S')) {
          let removed = false
          const keysToRemove = Object.keys(parameters).filter(key =>
            key === groupToRemove || key.startsWith(groupToRemove + '.')
          )

          keysToRemove.forEach(key => {
            delete parameters[key]
            removed = true
          })

          if (removed) {
            res.set('Content-Type', 'text/plain')
            res.send('OK\n')
          } else {
            res.status(400).send('# Error: Group not found\n')
          }
        } else {
          res.status(400).send('# Error: Cannot remove this parameter group\n')
        }
        break
      }

      default:
        res.status(400).send('# Error: Invalid action\n')
    }
  } catch (error) {
    console.error('Parameter management error:', error)
    res.status(500).send('# Error: Internal server error\n')
  }
})

export default router
