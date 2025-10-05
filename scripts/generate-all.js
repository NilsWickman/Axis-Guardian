#!/usr/bin/env node

/**
 * Multi-Language API Code Generation Script
 *
 * Generates types and API clients from OpenAPI and AsyncAPI schemas for:
 * - TypeScript (frontend + TS services)
 * - Python (device layer, analytics layer, collection layer)
 * - WebSocket clients from AsyncAPI specs
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Paths - OpenAPI
const SCHEMAS_DIR = path.join(__dirname, '../shared/schemas');
const ASYNCAPI_DIR = path.join(__dirname, '../shared/schemas/asyncapi');
const TS_TYPES_DIR = path.join(__dirname, '../shared/types/generated');
const TS_CLIENTS_DIR = path.join(__dirname, '../shared/clients/typescript');
const TS_WS_CLIENTS_DIR = path.join(__dirname, '../shared/clients/typescript/websocket');
const PY_TYPES_DIR = path.join(__dirname, '../shared/types/python');
const PY_CLIENTS_DIR = path.join(__dirname, '../shared/clients/python');
const PY_WS_CLIENTS_DIR = path.join(__dirname, '../shared/clients/python/websocket');
const FRONTEND_TYPES_DIR = path.join(__dirname, '../frontend/src/types/generated');
const FRONTEND_CLIENTS_DIR = path.join(__dirname, '../frontend/src/api/generated');
const FRONTEND_WS_CLIENTS_DIR = path.join(__dirname, '../frontend/src/api/websocket');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function execCommand(command, description) {
  try {
    log(`  ${description}...`, 'dim');
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    log(`  ✗ Failed: ${description}`, 'red');
    return false;
  }
}

// Ensure all output directories exist
function ensureDirectories() {
  log('\n📁 Ensuring output directories...', 'blue');

  const dirs = [
    TS_TYPES_DIR,
    TS_CLIENTS_DIR,
    TS_WS_CLIENTS_DIR,
    PY_TYPES_DIR,
    PY_CLIENTS_DIR,
    PY_WS_CLIENTS_DIR,
    FRONTEND_TYPES_DIR,
    FRONTEND_CLIENTS_DIR,
    FRONTEND_WS_CLIENTS_DIR,
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      log(`  ✓ Created ${path.relative(process.cwd(), dir)}`, 'green');
    }
  });
}

// Find all OpenAPI schema files
function findSchemaFiles() {
  log('\n🔍 Finding OpenAPI schemas...', 'blue');

  if (!fs.existsSync(SCHEMAS_DIR)) {
    log(`  ✗ Schemas directory not found: ${SCHEMAS_DIR}`, 'red');
    return [];
  }

  const files = fs.readdirSync(SCHEMAS_DIR)
    .filter(file => file.endsWith('.yaml') || file.endsWith('.yml') || file.endsWith('.json'))
    .filter(file => !file.includes('asyncapi')) // Exclude AsyncAPI files
    .map(file => path.join(SCHEMAS_DIR, file));

  if (files.length === 0) {
    log('  ⚠ No schema files found', 'yellow');
    return [];
  }

  log(`  ✓ Found ${files.length} schema file(s)`, 'green');
  files.forEach(file => log(`    - ${path.basename(file)}`, 'dim'));

  return files;
}

// Find all AsyncAPI schema files
function findAsyncAPIFiles() {
  log('\n🔍 Finding AsyncAPI schemas...', 'blue');

  if (!fs.existsSync(ASYNCAPI_DIR)) {
    log(`  ⚠ AsyncAPI directory not found: ${ASYNCAPI_DIR}`, 'yellow');
    log('  ℹ Skipping WebSocket client generation', 'dim');
    return [];
  }

  const files = fs.readdirSync(ASYNCAPI_DIR)
    .filter(file => file.endsWith('.yaml') || file.endsWith('.yml') || file.endsWith('.json'))
    .map(file => path.join(ASYNCAPI_DIR, file));

  if (files.length === 0) {
    log('  ⚠ No AsyncAPI files found', 'yellow');
    return [];
  }

  log(`  ✓ Found ${files.length} AsyncAPI file(s)`, 'green');
  files.forEach(file => log(`    - ${path.basename(file)}`, 'dim'));

  return files;
}

// Generate TypeScript types
function generateTypeScriptTypes(schemaPath) {
  const schemaName = path.basename(schemaPath, path.extname(schemaPath));
  const outputFile = path.join(TS_TYPES_DIR, `${schemaName}.types.ts`);

  log(`\n📝 Generating TypeScript types for ${schemaName}...`, 'cyan');

  const command = `npx openapi-typescript "${schemaPath}" -o "${outputFile}"`;

  if (execCommand(command, `Generate ${schemaName}.types.ts`)) {
    log(`  ✓ Generated ${path.relative(process.cwd(), outputFile)}`, 'green');
    return true;
  }

  return false;
}

// Generate TypeScript API client
function generateTypeScriptClient(schemaPath) {
  const schemaName = path.basename(schemaPath, path.extname(schemaPath));
  const serviceName = schemaName.replace('.openapi', '').replace(/-service$/, '');
  const outputDir = path.join(TS_CLIENTS_DIR, serviceName);

  log(`\n🔧 Generating TypeScript client for ${schemaName}...`, 'cyan');

  // Using @hey-api/openapi-ts with fetch client (no dependencies)
  const command = `npx @hey-api/openapi-ts@latest -i "${schemaPath}" -o "${outputDir}" -c @hey-api/client-fetch`;

  if (execCommand(command, `Generate TS client for ${serviceName}`)) {
    log(`  ✓ Generated ${path.relative(process.cwd(), outputDir)}`, 'green');
    return true;
  }

  return false;
}

// Generate Python types (Pydantic models)
function generatePythonTypes(schemaPath) {
  const schemaName = path.basename(schemaPath, path.extname(schemaPath));
  const serviceName = schemaName.replace('.openapi', '').replace(/-service$/, '');
  const outputFile = path.join(PY_TYPES_DIR, `${serviceName}_models.py`);

  log(`\n🐍 Generating Python types for ${schemaName}...`, 'magenta');

  // Check if datamodel-code-generator is installed
  try {
    execSync('which datamodel-codegen', { stdio: 'pipe' });
  } catch {
    log('  ⚠ datamodel-codegen not found. Install with: pip install datamodel-code-generator', 'yellow');
    log('  ℹ Skipping Python type generation', 'dim');
    return false;
  }

  // Using datamodel-code-generator for Pydantic models
  const command = `datamodel-codegen --input "${schemaPath}" --input-file-type openapi --output "${outputFile}" --output-model-type pydantic_v2.BaseModel --use-schema-description --use-title-as-name --use-default --use-standard-collections`;

  if (execCommand(command, `Generate ${serviceName}_models.py`)) {
    log(`  ✓ Generated ${path.relative(process.cwd(), outputFile)}`, 'green');
    return true;
  }

  return false;
}

// Generate Python API client
function generatePythonClient(schemaPath) {
  const schemaName = path.basename(schemaPath, path.extname(schemaPath));
  const serviceName = schemaName.replace('.openapi', '').replace(/-service$/, '');
  const outputDir = path.join(PY_CLIENTS_DIR, serviceName);

  log(`\n🐍 Generating Python client for ${schemaName}...`, 'magenta');

  // Check if openapi-python-client is installed
  try {
    execSync('which openapi-python-client', { stdio: 'pipe' });
  } catch {
    log('  ⚠ openapi-python-client not found. Install with: pip install openapi-python-client', 'yellow');
    log('  ℹ Skipping Python client generation', 'dim');
    return false;
  }

  // Using openapi-python-client
  const command = `openapi-python-client generate --path "${schemaPath}" --output-path "${outputDir}" --overwrite --meta none`;

  if (execCommand(command, `Generate Python client for ${serviceName}`)) {
    log(`  ✓ Generated ${path.relative(process.cwd(), outputDir)}`, 'green');
    return true;
  }

  return false;
}

// Generate TypeScript WebSocket client from AsyncAPI
function generateTypeScriptWebSocketClient(asyncapiPath) {
  const schemaName = path.basename(asyncapiPath, path.extname(asyncapiPath));
  const serviceName = schemaName.replace('.asyncapi', '').replace(/-websocket$/, '');
  const outputFile = path.join(TS_WS_CLIENTS_DIR, `${serviceName}.ts`);

  log(`\n🔌 Generating TypeScript WebSocket client for ${schemaName}...`, 'cyan');

  // Read AsyncAPI spec
  let spec;
  try {
    const specContent = fs.readFileSync(asyncapiPath, 'utf8');
    const yaml = require('js-yaml');
    spec = yaml.load(specContent);
  } catch (error) {
    log(`  ✗ Failed to read AsyncAPI spec: ${error.message}`, 'red');
    return false;
  }

  // Extract info
  const serviceTitleWords = spec.info.title.split(' ').filter(w => w !== 'WebSocket' && w !== 'Service');
  const className = serviceTitleWords.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('') + 'WebSocketClient';
  const defaultServer = spec.servers?.development || spec.servers?.[Object.keys(spec.servers)[0]];
  const defaultHost = defaultServer?.host || 'localhost:3001';
  const protocol = defaultServer?.protocol || 'ws';

  // Extract channel info
  const channelInfo = Object.entries(spec.channels || {})[0];
  const channelAddress = channelInfo ? channelInfo[1].address : '/ws';

  // Extract message types
  const messages = spec.components?.messages || {};
  const messageTypes = Object.keys(messages).map(key => {
    const msg = messages[key];
    return {
      name: msg.name || key,
      title: msg.title || key,
      summary: msg.summary || ''
    };
  });

  // Generate TypeScript client
  const clientCode = `/**
 * ${spec.info.title}
 *
 * Auto-generated WebSocket client from AsyncAPI specification.
 * DO NOT EDIT MANUALLY - run 'npm run generate:all' to regenerate.
 *
 * ${spec.info.description ? spec.info.description.split('\n').map(l => ' * ' + l).join('\n') : ''}
 */

export interface ${className}Options {
  /** WebSocket server host (default: ${defaultHost}) */
  host?: string;
  /** Use secure WebSocket (wss://) instead of ws:// */
  secure?: boolean;
  /** JWT authentication token */
  token?: string;
  /** Auto-reconnect on disconnect */
  autoReconnect?: boolean;
  /** Reconnect interval in milliseconds */
  reconnectInterval?: number;
  /** Maximum reconnection attempts (0 = unlimited) */
  maxReconnectAttempts?: number;
}

export interface ${className}EventMap {
${messageTypes.map(msg => `  /** ${msg.summary || msg.title} */\n  '${msg.name}': any;`).join('\n')}
  'connected': void;
  'disconnected': void;
  'error': Error;
  'reconnecting': { attempt: number };
}

export type ${className}EventHandler<K extends keyof ${className}EventMap> = (
  data: ${className}EventMap[K]
) => void;

/**
 * ${spec.info.title}
 *
 * ${spec.info.description?.split('\n')[0] || 'WebSocket client'}
 *
 * @example
 * \`\`\`typescript
 * const client = new ${className}({ token: 'your-jwt-token' });
 *
 * client.on('${messageTypes[0]?.name || 'message'}', (data) => {
 *   console.log('Received:', data);
 * });
 *
 * await client.connect();
 * \`\`\`
 */
export class ${className} {
  private ws: WebSocket | null = null;
  private options: Required<${className}Options>;
  private listeners: Map<keyof ${className}EventMap, Set<Function>> = new Map();
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor(options: ${className}Options = {}) {
    this.options = {
      host: options.host || '${defaultHost}',
      secure: options.secure ?? ${protocol === 'wss'},
      token: options.token || '',
      autoReconnect: options.autoReconnect ?? true,
      reconnectInterval: options.reconnectInterval || 5000,
      maxReconnectAttempts: options.maxReconnectAttempts || 0,
    };
  }

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const proto = this.options.secure ? 'wss' : 'ws';
      const token = this.options.token ? \`?token=\${this.options.token}\` : '';
      const url = \`\${proto}://\${this.options.host}${channelAddress}\${token}\`;

      try {
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          this.reconnectAttempts = 0;
          this.emit('connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.event) {
              this.emit(data.event as any, data);
            }
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          this.emit('error', new Error('WebSocket error'));
          reject(error);
        };

        this.ws.onclose = () => {
          this.emit('disconnected');
          this.handleReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Subscribe to events
   */
  on<K extends keyof ${className}EventMap>(
    event: K,
    handler: ${className}EventHandler<K>
  ): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
  }

  /**
   * Unsubscribe from events
   */
  off<K extends keyof ${className}EventMap>(
    event: K,
    handler: ${className}EventHandler<K>
  ): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  private emit<K extends keyof ${className}EventMap>(
    event: K,
    data?: ${className}EventMap[K]
  ): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach((handler) => handler(data));
    }
  }

  private handleReconnect(): void {
    if (!this.options.autoReconnect) {
      return;
    }

    if (
      this.options.maxReconnectAttempts > 0 &&
      this.reconnectAttempts >= this.options.maxReconnectAttempts
    ) {
      console.warn('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    this.emit('reconnecting', { attempt: this.reconnectAttempts });

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch((error) => {
        console.error('Reconnection failed:', error);
      });
    }, this.options.reconnectInterval);
  }
}
`;

  fs.writeFileSync(outputFile, clientCode);
  log(`  ✓ Generated ${path.relative(process.cwd(), outputFile)}`, 'green');
  return true;
}

// Generate Python WebSocket client from AsyncAPI
function generatePythonWebSocketClient(asyncapiPath) {
  const schemaName = path.basename(asyncapiPath, path.extname(asyncapiPath));
  const serviceName = schemaName.replace('.asyncapi', '').replace(/-websocket$/, '');
  const outputFile = path.join(PY_WS_CLIENTS_DIR, `${serviceName}_client.py`);

  log(`\n🐍 Generating Python WebSocket client for ${schemaName}...`, 'magenta');

  // Read AsyncAPI spec
  let spec;
  try {
    const specContent = fs.readFileSync(asyncapiPath, 'utf8');
    const yaml = require('js-yaml');
    spec = yaml.load(specContent);
  } catch (error) {
    log(`  ✗ Failed to read AsyncAPI spec: ${error.message}`, 'red');
    return false;
  }

  // Extract info
  const className = spec.info.title.replace(/\s+/g, '').replace('WebSocketService', 'WebSocketClient');
  const defaultServer = spec.servers?.development || spec.servers?.[Object.keys(spec.servers)[0]];
  const defaultHost = defaultServer?.host || 'localhost:3001';
  const protocol = defaultServer?.protocol || 'ws';

  // Extract channel info
  const channelInfo = Object.entries(spec.channels || {})[0];
  const channelAddress = channelInfo ? channelInfo[1].address : '/ws';

  // Extract message types
  const messages = spec.components?.messages || {};
  const messageTypes = Object.keys(messages).map(key => {
    const msg = messages[key];
    return {
      name: msg.name || key,
      title: msg.title || key,
      summary: msg.summary || ''
    };
  });

  // Generate Python client
  const clientCode = `"""
${spec.info.title}

Auto-generated WebSocket client from AsyncAPI specification.
DO NOT EDIT MANUALLY - run 'make api-contract' to regenerate.

${spec.info.description || ''}
"""

import asyncio
import json
import logging
from typing import Any, Callable, Dict, Optional, Set
from urllib.parse import urlencode

try:
    import websockets
    from websockets.client import WebSocketClientProtocol
except ImportError:
    raise ImportError(
        "websockets package is required. Install with: pip install websockets"
    )

logger = logging.getLogger(__name__)


class ${className}:
    """
    ${spec.info.title}

    ${spec.info.description?.split('\n')[0] || 'WebSocket client'}

    Example:
        >>> client = ${className}(token="your-jwt-token")
        >>>
        >>> @client.on("${messageTypes[0]?.name || 'message'}")
        >>> async def handle_event(data):
        >>>     print(f"Received: {data}")
        >>>
        >>> await client.connect()
    """

    def __init__(
        self,
        host: str = "${defaultHost}",
        secure: bool = ${protocol === 'wss' ? 'True' : 'False'},
        token: Optional[str] = None,
        auto_reconnect: bool = True,
        reconnect_interval: int = 5,
        max_reconnect_attempts: int = 0,
    ):
        """
        Initialize WebSocket client.

        Args:
            host: WebSocket server host (default: ${defaultHost})
            secure: Use secure WebSocket (wss://) instead of ws://
            token: JWT authentication token
            auto_reconnect: Auto-reconnect on disconnect
            reconnect_interval: Reconnect interval in seconds
            max_reconnect_attempts: Maximum reconnection attempts (0 = unlimited)
        """
        self.host = host
        self.secure = secure
        self.token = token
        self.auto_reconnect = auto_reconnect
        self.reconnect_interval = reconnect_interval
        self.max_reconnect_attempts = max_reconnect_attempts

        self._ws: Optional[WebSocketClientProtocol] = None
        self._listeners: Dict[str, Set[Callable]] = {}
        self._reconnect_attempts = 0
        self._running = False

    async def connect(self) -> None:
        """Connect to WebSocket server."""
        proto = "wss" if self.secure else "ws"
        params = {"token": self.token} if self.token else {}
        query_string = f"?{urlencode(params)}" if params else ""
        url = f"{proto}://{self.host}${channelAddress}{query_string}"

        try:
            self._ws = await websockets.connect(url)
            self._running = True
            self._reconnect_attempts = 0
            self._emit("connected", None)

            # Start message handler
            await self._handle_messages()
        except Exception as e:
            logger.error(f"Connection failed: {e}")
            self._emit("error", e)
            await self._handle_reconnect()

    async def disconnect(self) -> None:
        """Disconnect from WebSocket server."""
        self._running = False
        if self._ws:
            await self._ws.close()
            self._ws = None
        self._emit("disconnected", None)

    def on(self, event: str) -> Callable:
        """
        Decorator to register event handlers.

        Args:
            event: Event name to listen for

        Returns:
            Decorator function
        """
        def decorator(func: Callable) -> Callable:
            if event not in self._listeners:
                self._listeners[event] = set()
            self._listeners[event].add(func)
            return func
        return decorator

    def add_listener(self, event: str, handler: Callable) -> None:
        """
        Add event listener.

        Args:
            event: Event name to listen for
            handler: Callback function
        """
        if event not in self._listeners:
            self._listeners[event] = set()
        self._listeners[event].add(handler)

    def remove_listener(self, event: str, handler: Callable) -> None:
        """
        Remove event listener.

        Args:
            event: Event name
            handler: Callback function to remove
        """
        if event in self._listeners:
            self._listeners[event].discard(handler)

    def is_connected(self) -> bool:
        """Check if WebSocket is connected."""
        return self._ws is not None and self._ws.open

    async def _handle_messages(self) -> None:
        """Handle incoming WebSocket messages."""
        if not self._ws:
            return

        try:
            async for message in self._ws:
                try:
                    data = json.loads(message)
                    if "event" in data:
                        self._emit(data["event"], data)
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to parse message: {e}")
        except websockets.exceptions.ConnectionClosed:
            logger.info("WebSocket connection closed")
            self._emit("disconnected", None)
            if self.auto_reconnect:
                await self._handle_reconnect()

    def _emit(self, event: str, data: Any) -> None:
        """Emit event to all registered handlers."""
        if event in self._listeners:
            for handler in self._listeners[event]:
                try:
                    if asyncio.iscoroutinefunction(handler):
                        asyncio.create_task(handler(data))
                    else:
                        handler(data)
                except Exception as e:
                    logger.error(f"Error in event handler for '{event}': {e}")

    async def _handle_reconnect(self) -> None:
        """Handle reconnection logic."""
        if not self.auto_reconnect or not self._running:
            return

        if (
            self.max_reconnect_attempts > 0
            and self._reconnect_attempts >= self.max_reconnect_attempts
        ):
            logger.warning("Max reconnection attempts reached")
            return

        self._reconnect_attempts += 1
        self._emit("reconnecting", {"attempt": self._reconnect_attempts})

        await asyncio.sleep(self.reconnect_interval)
        await self.connect()
`;

  fs.writeFileSync(outputFile, clientCode);
  log(`  ✓ Generated ${path.relative(process.cwd(), outputFile)}`, 'green');
  return true;
}

// Create TypeScript barrel export for types
function createTypeScriptBarrelExport(schemaFiles) {
  log('\n📦 Creating TypeScript barrel exports...', 'blue');

  const exportStatements = schemaFiles.map(file => {
    const name = path.basename(file, path.extname(file));
    return `export * from './${name}.types';`;
  }).join('\n');

  const indexContent = `/**
 * Generated API Types - TypeScript
 *
 * Auto-generated from OpenAPI schemas.
 * DO NOT EDIT MANUALLY - run 'npm run generate:all' to regenerate.
 */

${exportStatements}
`;

  const indexPath = path.join(TS_TYPES_DIR, 'index.ts');
  fs.writeFileSync(indexPath, indexContent);
  log(`  ✓ Created ${path.relative(process.cwd(), indexPath)}`, 'green');
}

// Create TypeScript barrel export for clients
function createClientBarrelExport(schemaFiles) {
  const clientDirs = schemaFiles.map(file => {
    const name = path.basename(file, path.extname(file)).replace('.openapi', '').replace(/-service$/, '');
    return name;
  });

  const exportStatements = clientDirs.map(name => {
    return `export * as ${name}Client from './${name}';`;
  }).join('\n');

  const indexContent = `/**
 * Generated API Clients - TypeScript
 *
 * Auto-generated from OpenAPI schemas.
 * DO NOT EDIT MANUALLY - run 'npm run generate:all' to regenerate.
 */

${exportStatements}
`;

  const indexPath = path.join(TS_CLIENTS_DIR, 'index.ts');
  fs.writeFileSync(indexPath, indexContent);
  log(`  ✓ Created ${path.relative(process.cwd(), indexPath)}`, 'green');
}

// Create Python __init__.py files
function createPythonInitFiles(schemaFiles) {
  log('\n📦 Creating Python package files...', 'blue');

  // Types __init__.py
  const typeImports = schemaFiles.map(file => {
    const name = path.basename(file, path.extname(file)).replace('.openapi', '').replace(/-service$/, '');
    return `from .${name}_models import *`;
  }).join('\n');

  const typesInitContent = `"""
Generated API Types - Python

Auto-generated from OpenAPI schemas.
DO NOT EDIT MANUALLY - run 'make api-contract' to regenerate.
"""

${typeImports}
`;

  const typesInitPath = path.join(PY_TYPES_DIR, '__init__.py');
  fs.writeFileSync(typesInitPath, typesInitContent);
  log(`  ✓ Created ${path.relative(process.cwd(), typesInitPath)}`, 'green');

  // Clients __init__.py
  const clientImports = schemaFiles.map(file => {
    const name = path.basename(file, path.extname(file)).replace('.openapi', '').replace(/-service$/, '');
    return `# from .${name} import Client as ${name.charAt(0).toUpperCase() + name.slice(1)}Client`;
  }).join('\n');

  const clientsInitContent = `"""
Generated API Clients - Python

Auto-generated from OpenAPI schemas.
DO NOT EDIT MANUALLY - run 'make api-contract' to regenerate.
"""

${clientImports}
`;

  const clientsInitPath = path.join(PY_CLIENTS_DIR, '__init__.py');
  fs.writeFileSync(clientsInitPath, clientsInitContent);
  log(`  ✓ Created ${path.relative(process.cwd(), clientsInitPath)}`, 'green');
}

// Copy types and clients to frontend
function copyToFrontend() {
  log('\n📋 Copying generated code to frontend...', 'blue');

  // Copy types
  const typeFiles = fs.readdirSync(TS_TYPES_DIR);
  let typeCount = 0;

  typeFiles.forEach(file => {
    const srcPath = path.join(TS_TYPES_DIR, file);
    const destPath = path.join(FRONTEND_TYPES_DIR, file);

    if (fs.statSync(srcPath).isFile()) {
      fs.copyFileSync(srcPath, destPath);
      typeCount++;
    }
  });

  log(`  ✓ Copied ${typeCount} type file(s) to frontend/src/types/generated`, 'green');

  // Copy clients
  const clientDirs = fs.readdirSync(TS_CLIENTS_DIR);
  let clientCount = 0;

  clientDirs.forEach(dir => {
    const srcPath = path.join(TS_CLIENTS_DIR, dir);
    const destPath = path.join(FRONTEND_CLIENTS_DIR, dir);

    if (fs.statSync(srcPath).isDirectory()) {
      // Copy directory recursively
      fs.cpSync(srcPath, destPath, { recursive: true });
      clientCount++;
    } else if (dir === 'index.ts') {
      // Copy index file
      fs.copyFileSync(srcPath, path.join(FRONTEND_CLIENTS_DIR, dir));
    }
  });

  log(`  ✓ Copied ${clientCount} client(s) to frontend/src/api/generated`, 'green');
}

// Main execution
async function main() {
  log('\n' + '='.repeat(70), 'bright');
  log('  Multi-Language API Code Generation', 'bright');
  log('  OpenAPI & AsyncAPI → TypeScript + Python', 'bright');
  log('='.repeat(70), 'bright');

  try {
    // 1. Ensure directories exist
    ensureDirectories();

    // 2. Find schema files
    const schemaFiles = findSchemaFiles();
    if (schemaFiles.length === 0) {
      log('\n⚠ No schemas to process. Exiting.', 'yellow');
      process.exit(0);
    }

    let tsTypesSuccess = 0;
    let tsClientsSuccess = 0;
    let pyTypesSuccess = 0;
    let pyClientsSuccess = 0;

    // 3. Generate TypeScript types
    log('\n' + '─'.repeat(70), 'bright');
    log('  TypeScript Type Generation', 'bright');
    log('─'.repeat(70), 'bright');

    for (const schemaFile of schemaFiles) {
      if (generateTypeScriptTypes(schemaFile)) {
        tsTypesSuccess++;
      }
    }

    // 4. Generate TypeScript clients
    log('\n' + '─'.repeat(70), 'bright');
    log('  TypeScript Client Generation', 'bright');
    log('─'.repeat(70), 'bright');

    for (const schemaFile of schemaFiles) {
      if (generateTypeScriptClient(schemaFile)) {
        tsClientsSuccess++;
      }
    }

    // 5. Generate Python types
    log('\n' + '─'.repeat(70), 'bright');
    log('  Python Type Generation (Pydantic v2)', 'bright');
    log('─'.repeat(70), 'bright');

    for (const schemaFile of schemaFiles) {
      if (generatePythonTypes(schemaFile)) {
        pyTypesSuccess++;
      }
    }

    // 6. Generate Python clients
    log('\n' + '─'.repeat(70), 'bright');
    log('  Python Client Generation', 'bright');
    log('─'.repeat(70), 'bright');

    for (const schemaFile of schemaFiles) {
      if (generatePythonClient(schemaFile)) {
        pyClientsSuccess++;
      }
    }

    // 7. Find and process AsyncAPI schemas for WebSocket clients
    const asyncapiFiles = findAsyncAPIFiles();
    let tsWSClientsSuccess = 0;
    let pyWSClientsSuccess = 0;

    if (asyncapiFiles.length > 0) {
      // Generate TypeScript WebSocket clients
      log('\n' + '─'.repeat(70), 'bright');
      log('  TypeScript WebSocket Client Generation (AsyncAPI)', 'bright');
      log('─'.repeat(70), 'bright');

      for (const asyncapiFile of asyncapiFiles) {
        if (generateTypeScriptWebSocketClient(asyncapiFile)) {
          tsWSClientsSuccess++;
        }
      }

      // Generate Python WebSocket clients
      log('\n' + '─'.repeat(70), 'bright');
      log('  Python WebSocket Client Generation (AsyncAPI)', 'bright');
      log('─'.repeat(70), 'bright');

      for (const asyncapiFile of asyncapiFiles) {
        if (generatePythonWebSocketClient(asyncapiFile)) {
          pyWSClientsSuccess++;
        }
      }

      // Create WebSocket client index files
      if (tsWSClientsSuccess > 0) {
        const tsWSIndex = asyncapiFiles.map(file => {
          const name = path.basename(file, path.extname(file)).replace('.asyncapi', '').replace(/-websocket$/, '');
          return `export * from './${name}';`;
        }).join('\n');

        const tsWSIndexContent = `/**
 * Generated WebSocket Clients - TypeScript
 *
 * Auto-generated from AsyncAPI schemas.
 * DO NOT EDIT MANUALLY - run 'npm run generate:all' to regenerate.
 */

${tsWSIndex}
`;
        fs.writeFileSync(path.join(TS_WS_CLIENTS_DIR, 'index.ts'), tsWSIndexContent);

        // Copy to frontend
        if (fs.existsSync(TS_WS_CLIENTS_DIR)) {
          fs.cpSync(TS_WS_CLIENTS_DIR, FRONTEND_WS_CLIENTS_DIR, { recursive: true });
        }
      }

      if (pyWSClientsSuccess > 0) {
        const pyWSInit = asyncapiFiles.map(file => {
          const name = path.basename(file, path.extname(file)).replace('.asyncapi', '').replace(/-websocket$/, '');
          return `from .${name}_client import *`;
        }).join('\n');

        const pyWSInitContent = `"""
Generated WebSocket Clients - Python

Auto-generated from AsyncAPI schemas.
DO NOT EDIT MANUALLY - run 'make api-contract' to regenerate.
"""

${pyWSInit}
`;
        fs.writeFileSync(path.join(PY_WS_CLIENTS_DIR, '__init__.py'), pyWSInitContent);
      }
    }

    // 8. Create barrel exports
    createTypeScriptBarrelExport(schemaFiles);
    createClientBarrelExport(schemaFiles);
    createPythonInitFiles(schemaFiles);

    // 8. Copy to frontend
    copyToFrontend();

    // Success summary
    log('\n' + '='.repeat(70), 'bright');
    log('✅ Code generation complete!', 'green');
    log('='.repeat(70), 'bright');

    log('\n📊 Generation Summary:', 'cyan');
    log(`  TypeScript Types:           ${tsTypesSuccess}/${schemaFiles.length}`, tsTypesSuccess === schemaFiles.length ? 'green' : 'yellow');
    log(`  TypeScript Clients:         ${tsClientsSuccess}/${schemaFiles.length}`, tsClientsSuccess === schemaFiles.length ? 'green' : 'yellow');
    log(`  Python Types:               ${pyTypesSuccess}/${schemaFiles.length}`, pyTypesSuccess === schemaFiles.length ? 'green' : 'yellow');
    log(`  Python Clients:             ${pyClientsSuccess}/${schemaFiles.length}`, pyClientsSuccess === schemaFiles.length ? 'green' : 'yellow');
    if (asyncapiFiles.length > 0) {
      log(`  TypeScript WebSocket Clients: ${tsWSClientsSuccess}/${asyncapiFiles.length}`, tsWSClientsSuccess === asyncapiFiles.length ? 'green' : 'yellow');
      log(`  Python WebSocket Clients:     ${pyWSClientsSuccess}/${asyncapiFiles.length}`, pyWSClientsSuccess === asyncapiFiles.length ? 'green' : 'yellow');
    }

    log('\n📁 Generated Files:', 'cyan');
    log(`  TypeScript Types:     shared/types/generated/*.types.ts`, 'dim');
    log(`  TypeScript Clients:   shared/clients/typescript/*/`, 'dim');
    log(`  Python Types:         shared/types/python/*_models.py`, 'dim');
    log(`  Python Clients:       shared/clients/python/*/`, 'dim');
    if (asyncapiFiles.length > 0) {
      log(`  TypeScript WebSocket: shared/clients/typescript/websocket/*.ts`, 'dim');
      log(`  Python WebSocket:     shared/clients/python/websocket/*_client.py`, 'dim');
    }
    log(`  Frontend Types:       frontend/src/types/generated/*.types.ts`, 'dim');
    log(`  Frontend Clients:     frontend/src/api/generated/*/`, 'dim');
    if (asyncapiFiles.length > 0) {
      log(`  Frontend WebSocket:   frontend/src/api/websocket/*.ts`, 'dim');
    }

    log('\n📖 Usage Examples:', 'cyan');
    log('\n  TypeScript (Frontend):', 'bright');
    log('    import { authClient } from "@/api/generated";', 'dim');
    log('    const response = await authClient.login({ username, password });', 'dim');

    log('\n  TypeScript (Backend):', 'bright');
    log('    import type { paths } from "@shared/types/generated";', 'dim');
    log('    type LoginRequest = paths["/auth/login"]["post"]["requestBody"];', 'dim');

    log('\n  Python:', 'bright');
    log('    from shared.types.python import User, LoginRequest', 'dim');
    log('    from shared.clients.python.auth import Client as AuthClient', 'dim');
    log('    client = AuthClient(base_url="http://localhost:3004")', 'dim');

    if (asyncapiFiles.length > 0) {
      log('\n  TypeScript WebSocket:', 'bright');
      log('    import { AlarmWebSocketClient } from "@/api/websocket";', 'dim');
      log('    const wsClient = new AlarmWebSocketClient({ token });', 'dim');
      log('    wsClient.on("alarm.new", (data) => console.log(data));', 'dim');
      log('    await wsClient.connect();', 'dim');

      log('\n  Python WebSocket:', 'bright');
      log('    from shared.clients.python.websocket import AlarmWebSocketClient', 'dim');
      log('    client = AlarmWebSocketClient(token="your-jwt")', 'dim');
      log('    @client.on("alarm.new")', 'dim');
      log('    async def handle_alarm(data): print(data)', 'dim');
      log('    await client.connect()', 'dim');
    }

    log('\n' + '='.repeat(70) + '\n', 'bright');

    const totalSuccess = tsTypesSuccess + tsClientsSuccess + pyTypesSuccess + pyClientsSuccess;
    const totalExpected = schemaFiles.length * 4;

    process.exit(totalSuccess === totalExpected ? 0 : 1);

  } catch (error) {
    log('\n' + '='.repeat(70), 'bright');
    log(`❌ Code generation failed: ${error.message}`, 'red');
    log('='.repeat(70) + '\n', 'bright');
    process.exit(1);
  }
}

// Run
main();
