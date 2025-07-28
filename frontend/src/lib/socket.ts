import { io, Socket } from 'socket.io-client';

interface SocketConfig {
  url: string;
  auth?: {
    token?: string;
    userId?: string;
    role?: string;
    name?: string;
  };
  options?: {
    transports?: string[];
    timeout?: number;
    forceNew?: boolean;
    reconnection?: boolean;
    reconnectionAttempts?: number;
    reconnectionDelay?: number;
  };
}

class SocketManager {
  private socket: Socket | null = null;
  private config: SocketConfig;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private eventListeners: Map<string, Function[]> = new Map();

  constructor(config: SocketConfig) {
    this.config = {
      url: config.url,
      auth: config.auth || {},
      options: {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        ...config.options
      }
    };
  }

  connect(): Promise<Socket> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve(this.socket);
        return;
      }

      if (this.isConnecting) {
        // Instead of rejecting, wait for the existing connection
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds timeout (50 * 100ms)
        
        const checkConnection = () => {
          attempts++;
          if (this.socket?.connected) {
            resolve(this.socket);
          } else if (!this.isConnecting) {
            // Connection attempt failed, try again
            this.connect().then(resolve).catch(reject);
          } else if (attempts >= maxAttempts) {
            // Timeout reached
            this.isConnecting = false;
            reject(new Error('Connection timeout - connection already in progress'));
          } else {
            // Still connecting, check again in 100ms
            setTimeout(checkConnection, 100);
          }
        };
        checkConnection();
        return;
      }

      this.isConnecting = true;

      try {
        this.socket = io(this.config.url, {
          transports: this.config.options?.transports,
          timeout: this.config.options?.timeout,
          forceNew: this.config.options?.forceNew,
          reconnection: this.config.options?.reconnection,
          reconnectionAttempts: this.config.options?.reconnectionAttempts,
          reconnectionDelay: this.config.options?.reconnectionDelay,
          auth: this.config.auth
        });

        this.socket.on('connect', () => {
          console.log('✅ WebSocket connected successfully');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          
          // Authenticate if user data is available
          if (this.config.auth?.userId) {
            this.socket?.emit('authenticate', {
              userId: this.config.auth.userId,
              role: this.config.auth.role,
              name: this.config.auth.name
            });
          }
          
          resolve(this.socket!);
        });

        this.socket.on('connect_error', (error) => {
          console.error('❌ WebSocket connection error:', error);
          this.isConnecting = false;
          reject(error);
        });

        this.socket.on('disconnect', (reason) => {
          console.log('🔌 WebSocket disconnected:', reason);
          if (reason === 'io server disconnect') {
            // Server disconnected us, try to reconnect
            this.reconnect();
          }
        });

        this.socket.on('reconnect', (attemptNumber) => {
          console.log(`🔄 WebSocket reconnected after ${attemptNumber} attempts`);
          this.reconnectAttempts = 0;
        });

        this.socket.on('reconnect_error', (error) => {
          console.error('❌ WebSocket reconnection error:', error);
          this.reconnectAttempts++;
          
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('❌ Max reconnection attempts reached');
          }
        });

        this.socket.on('reconnect_failed', () => {
          console.error('❌ WebSocket reconnection failed');
        });

        // Handle authentication responses
        this.socket.on('authenticated', (data) => {
          console.log('✅ WebSocket authenticated:', data);
        });

        this.socket.on('authentication_error', (error) => {
          console.error('❌ WebSocket authentication error:', error);
        });

        // Set up ping/pong for connection health
        setInterval(() => {
          if (this.socket?.connected) {
            this.socket.emit('ping');
          }
        }, 30000); // Ping every 30 seconds

      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('🔌 WebSocket disconnected manually');
    }
  }

  emit(event: string, data?: any): boolean {
    if (!this.socket?.connected) {
      console.warn(`⚠️ Cannot emit '${event}': socket not connected`);
      return false;
    }

    try {
      this.socket.emit(event, data);
      return true;
    } catch (error) {
      console.error(`❌ Error emitting '${event}':`, error);
      return false;
    }
  }

  on(event: string, callback: Function): void {
    if (!this.socket) {
      console.warn(`⚠️ Cannot listen to '${event}': socket not initialized`);
      return;
    }

    // Store callback for potential reconnection
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);

    this.socket.on(event, callback);
  }

  off(event: string, callback?: Function): void {
    if (!this.socket) return;

    if (callback) {
      this.socket.off(event, callback);
      // Remove from stored listeners
      const listeners = this.eventListeners.get(event);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    } else {
      this.socket.off(event);
      this.eventListeners.delete(event);
    }
  }

  private reconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      return;
    }

    setTimeout(() => {
      console.log(`🔄 Attempting to reconnect... (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
      this.connect().catch(error => {
        console.error('❌ Reconnection failed:', error);
      });
    }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts));
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  // Update authentication data
  updateAuth(auth: { token?: string; userId?: string; role?: string; name?: string }): void {
    this.config.auth = { ...this.config.auth, ...auth };
    
    if (this.socket?.connected && auth.userId) {
      this.socket.emit('authenticate', {
        userId: auth.userId,
        role: auth.role,
        name: auth.name
      });
    }
  }
}

// WebSocket URL ni .env dan olamiz, yo'q bo'lsa prod uchun default qiymat
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://everestrestaurantglobalcookmail.onrender.com';

// Create singleton instance
let socketManager: SocketManager | null = null;

export const createSocketManager = (config: SocketConfig): SocketManager => {
  if (!socketManager) {
    socketManager = new SocketManager({ url: SOCKET_URL, ...config });
  } else {
    // Update auth if socket already exists
    socketManager.updateAuth(config.auth || {});
  }
  return socketManager;
};

export const getSocketManager = (): SocketManager | null => {
  return socketManager;
};

export const disconnectSocketManager = (): void => {
  if (socketManager) {
    socketManager.disconnect();
    socketManager = null;
  }
};

// Global socket instance for reuse
export const getGlobalSocket = (): SocketManager | null => {
  return socketManager;
};

export default SocketManager; 