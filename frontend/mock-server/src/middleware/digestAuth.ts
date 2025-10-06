import { Request, Response, NextFunction } from 'express'
import crypto from 'crypto'

interface DigestAuthOptions {
  realm?: string
  users: Record<string, string> // username: password
  algorithm?: 'MD5' | 'MD5-sess'
}

// Parse digest auth header
function parseDigestHeader(header: string): Record<string, string> {
  const parts: Record<string, string> = {}

  // Match key="value" or key=value patterns, properly handling commas inside quotes
  const regex = /(\w+)=(?:"([^"]*)"|([^,\s]*))/g
  let match

  while ((match = regex.exec(header)) !== null) {
    const key = match[1]
    const value = match[2] || match[3]  // Quoted value or unquoted value
    parts[key] = value
  }

  return parts
}

// Generate MD5 hash
function md5(data: string): string {
  return crypto.createHash('md5').update(data).digest('hex')
}

// Create digest auth middleware
export function digestAuth(options: DigestAuthOptions) {
  const realm = options.realm || 'AXIS Mock Server'
  const algorithm = options.algorithm || 'MD5'
  const users = options.users
  const nonces: Record<string, number> = {} // Track nonces to prevent replay attacks

  return (req: Request, res: Response, next: NextFunction) => {
    // Skip auth for unrestricted endpoints
    if (req.path === '/basicdeviceinfo.cgi' && req.body?.method === 'getAllUnrestrictedProperties') {
      return next()
    }

    const authHeader = req.headers.authorization

    // Check if authorization header exists
    if (!authHeader || !authHeader.startsWith('Digest ')) {
      // Generate new nonce
      const nonce = crypto.randomBytes(16).toString('hex')
      nonces[nonce] = Date.now()

      // Send 401 with digest challenge
      res.status(401)
      res.set('WWW-Authenticate',
        `Digest realm="${realm}", ` +
        `qop="auth", ` +
        `algorithm="${algorithm}", ` +
        `nonce="${nonce}", ` +
        `opaque="${md5(realm)}"`
      )
      return res.send('Unauthorized')
    }

    try {
      // Parse digest auth header
      const digestHeader = authHeader.substring(7) // Remove "Digest "
      const params = parseDigestHeader(digestHeader)

      const {
        username,
        realm: clientRealm,
        nonce,
        uri,
        qop,
        nc,
        cnonce,
        response: clientResponse,
        opaque
      } = params

      // Verify user exists
      if (!username || !users[username]) {
        return res.status(401).send('Invalid credentials')
      }

      const password = users[username]

      // Verify realm
      if (clientRealm !== realm) {
        return res.status(401).send('Invalid realm')
      }

      // Verify nonce exists and is not too old (5 minutes)
      if (!nonce || !nonces[nonce]) {
        return res.status(401).send('Invalid or expired nonce')
      }

      const nonceAge = Date.now() - nonces[nonce]
      if (nonceAge > 5 * 60 * 1000) {
        delete nonces[nonce]
        return res.status(401).send('Nonce expired')
      }

      // Calculate expected response
      const ha1 = md5(`${username}:${realm}:${password}`)
      const ha2 = md5(`${req.method}:${uri}`)

      let expectedResponse: string
      if (qop === 'auth') {
        expectedResponse = md5(`${ha1}:${nonce}:${nc}:${cnonce}:${qop}:${ha2}`)
      } else {
        expectedResponse = md5(`${ha1}:${nonce}:${ha2}`)
      }

      // Verify response
      if (clientResponse !== expectedResponse) {
        return res.status(401).send('Invalid credentials')
      }

      // Authentication successful - attach user to request
      (req as any).user = { username }

      // Clean old nonces periodically
      const now = Date.now()
      Object.keys(nonces).forEach(n => {
        if (now - nonces[n] > 5 * 60 * 1000) {
          delete nonces[n]
        }
      })

      next()
    } catch (error) {
      console.error('Digest auth error:', error)
      res.status(401).send('Authentication failed')
    }
  }
}

// Optional: Basic auth fallback for simpler testing
export function basicAuth(users: Record<string, string>) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip auth for unrestricted endpoints
    if (req.path === '/basicdeviceinfo.cgi' && req.body?.method === 'getAllUnrestrictedProperties') {
      return next()
    }

    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      res.status(401)
      res.set('WWW-Authenticate', 'Basic realm="AXIS Mock Server"')
      return res.send('Unauthorized')
    }

    try {
      const credentials = Buffer.from(authHeader.substring(6), 'base64').toString()
      const [username, password] = credentials.split(':')

      if (users[username] && users[username] === password) {
        (req as any).user = { username }
        return next()
      }

      res.status(401).send('Invalid credentials')
    } catch (error) {
      res.status(401).send('Authentication failed')
    }
  }
}
