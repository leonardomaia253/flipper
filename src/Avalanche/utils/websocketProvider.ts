import { ethers } from "ethers";

interface ReconnectingWebSocketProviderOptions {
  urls: string[];
  timeout?: number;
  maxRetries?: number;
  reconnectDelay?: number;
  maxReconnectDelay?: number;
  heartbeatInterval?: number;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onReconnect?: () => void;
  onError?: (error: Error) => void;
}

export class ReconnectingWebSocketProvider {
  private provider: ethers.WebSocketProvider | null = null;
  private options: Required<ReconnectingWebSocketProviderOptions>;
  private currentUrlIndex = 0;
  private reconnectAttempts = 0;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isConnecting = false;
  private isConnected = false;
  private listeners: Record<string, ethers.Listener[]> = {};

  constructor(options: ReconnectingWebSocketProviderOptions) {
    this.options = {
      timeout: 10000,
      maxRetries: 10,
      reconnectDelay: 1000,
      maxReconnectDelay: 60000,
      heartbeatInterval: 30000,
      onConnect: () => {},
      onDisconnect: () => {},
      onReconnect: () => {},
      onError: () => {},
      ...options,
    };
    this.connect();
  }

  public get instance(): ethers.WebSocketProvider {
    if (!this.provider) {
      throw new Error("Provider not initialized");
    }
    return this.provider;
  }

  public get connected(): boolean {
    return this.isConnected;
  }

  private connect(): void {
    if (this.isConnecting) return;
    this.isConnecting = true;

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    const url = this.options.urls[this.currentUrlIndex];
    console.log(`🔌 Connecting to WebSocket provider: ${url}`);

    try {
      this.provider = new ethers.WebSocketProvider(url);

      // Note: ethers.WebSocketProvider does NOT emit 'open', so we listen on _websocket directly
      const ws = (this.provider as any)._websocket;
      if (!ws) throw new Error("Internal websocket not found");

      // Setup connection timeout
      const connectionTimeout = setTimeout(() => {
        if (!this.isConnected) {
          console.error("WebSocket connection timeout");
          this.handleDisconnect(new Error("Connection timeout"));
          ws.close();
        }
      }, this.options.timeout);

      ws.onopen = () => {
        clearTimeout(connectionTimeout);
        this.isConnected = true;
        this.isConnecting = false;
        this.reconnectAttempts = 0;

        console.log(`✅ Connected to WebSocket provider: ${url}`);

        this.restoreEventListeners();
        this.startHeartbeat();

        this.options.onConnect();
      };

      ws.onclose = () => {
        this.handleDisconnect(new Error("WebSocket closed"));
      };

      ws.onerror = (event: Event | ErrorEvent) => {
        const error = event instanceof ErrorEvent ? event.error : new Error("WebSocket error");
        this.options.onError(error);
        this.handleDisconnect(error);
      };

    } catch (error: any) {
      this.handleDisconnect(error);
    }
  }

  private handleDisconnect(error: Error): void {
    if (!this.isConnecting && !this.isConnected) return;

    console.error(`❌ WebSocket disconnected: ${error.message}`);

    this.isConnected = false;
    this.isConnecting = false;

    this.options.onDisconnect();

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    if (this.provider) {
      this.provider.removeAllListeners();
      const ws = (this.provider as any)._websocket;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    }

    this.currentUrlIndex = (this.currentUrlIndex + 1) % this.options.urls.length;
    this.reconnectAttempts++;

    if (this.reconnectAttempts <= this.options.maxRetries) {
      const delay = Math.min(
        this.options.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1),
        this.options.maxReconnectDelay
      );

      console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.options.maxRetries})`);

      if (this.reconnectTimer) clearTimeout(this.reconnectTimer);

      this.reconnectTimer = setTimeout(() => {
        this.options.onReconnect();
        this.connect();
      }, delay);
    } else {
      console.error(`❌ Max reconnection attempts reached (${this.options.maxRetries}). Giving up.`);
    }
  }

  private startHeartbeat(): void {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);

    this.heartbeatTimer = setInterval(async () => {
      if (!this.provider) return;

      try {
        await this.provider.getBlockNumber();
      } catch (error) {
        console.error("❌ Heartbeat check failed:", error);
        this.handleDisconnect(new Error("Heartbeat failed"));
      }
    }, this.options.heartbeatInterval);
  }

  public on(eventName: string, listener: ethers.Listener): void {
    if (!this.provider) throw new Error("Provider not initialized");

    if (!this.listeners[eventName]) this.listeners[eventName] = [];
    this.listeners[eventName].push(listener);

    this.provider.on(eventName, listener);
  }

  public off(eventName: string, listener: ethers.Listener): void {
    if (!this.provider) throw new Error("Provider not initialized");

    if (this.listeners[eventName]) {
      this.listeners[eventName] = this.listeners[eventName].filter(l => l !== listener);
    }

    this.provider.off(eventName, listener);
  }

  private restoreEventListeners(): void {
    if (!this.provider) return;

    for (const eventName in this.listeners) {
      for (const listener of this.listeners[eventName]) {
        this.provider.on(eventName, listener);
      }
    }
  }

  public destroy(): void {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);

    if (this.provider) {
      this.provider.removeAllListeners();
      const ws = (this.provider as any)._websocket;
      if (ws && ws.readyState === WebSocket.OPEN) ws.close();
    }

    this.listeners = {};
    this.isConnected = false;
    this.isConnecting = false;
  }
}

export function createReconnectingProvider(
  urls: string | string[],
  options: Omit<ReconnectingWebSocketProviderOptions, 'urls'> = {}
): ReconnectingWebSocketProvider {
  const urlArray = Array.isArray(urls) ? urls : [urls];

  return new ReconnectingWebSocketProvider({
    urls: urlArray,
    ...options,
  });
}
