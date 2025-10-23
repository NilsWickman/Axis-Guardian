/**
 * Detection WebSocket Service
 *
 * Auto-generated WebSocket client from AsyncAPI specification.
 * DO NOT EDIT MANUALLY - run 'npm run generate:all' to regenerate.
 *
 *  * Real-time object detection and tracking service via WebSocket.
 * Streams detection events and track updates to subscribed clients.
 * Requires JWT authentication.
 * 
 */

export interface DetectionWebSocketClientOptions {
  /** WebSocket server host (default: localhost:3007) */
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

export interface DetectionWebSocketClientEventMap {
  /** Emitted when a new object is detected */
  'detection.new': any;
  /** Emitted when an object track is updated */
  'track.update': any;
  'connected': void;
  'disconnected': void;
  'error': Error;
  'reconnecting': { attempt: number };
}

export type DetectionWebSocketClientEventHandler<K extends keyof DetectionWebSocketClientEventMap> = (
  data: DetectionWebSocketClientEventMap[K]
) => void;

/**
 * Detection WebSocket Service
 *
 * Real-time object detection and tracking service via WebSocket.
 *
 * @example
 * ```typescript
 * const client = new DetectionWebSocketClient({ token: 'your-jwt-token' });
 *
 * client.on('detection.new', (data) => {
 *   console.log('Received:', data);
 * });
 *
 * await client.connect();
 * ```
 */
export class DetectionWebSocketClient {
  private ws: WebSocket | null = null;
  private options: Required<DetectionWebSocketClientOptions>;
  private listeners: Map<keyof DetectionWebSocketClientEventMap, Set<Function>> = new Map();
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor(options: DetectionWebSocketClientOptions = {}) {
    this.options = {
      host: options.host || 'localhost:3007',
      secure: options.secure ?? false,
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
      const token = this.options.token ? `?token=${this.options.token}` : '';
      const url = `${proto}://${this.options.host}/ws/detections${token}`;

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
  on<K extends keyof DetectionWebSocketClientEventMap>(
    event: K,
    handler: DetectionWebSocketClientEventHandler<K>
  ): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
  }

  /**
   * Unsubscribe from events
   */
  off<K extends keyof DetectionWebSocketClientEventMap>(
    event: K,
    handler: DetectionWebSocketClientEventHandler<K>
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

  private emit<K extends keyof DetectionWebSocketClientEventMap>(
    event: K,
    data?: DetectionWebSocketClientEventMap[K]
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
