import { getSocketManager } from './socket';

export interface SocketDebugInfo {
  connected: boolean;
  socketId?: string;
  userId?: string;
  userRole?: string;
  reconnectAttempts: number;
  lastPing?: Date;
  connectionTime?: Date;
}

class SocketDebugger {
  private debugMode = false;
  private pingInterval: NodeJS.Timeout | null = null;
  private lastPing: Date | null = null;

  enableDebugMode() {
    this.debugMode = true;
    console.log('🔍 WebSocket debug mode enabled');
    this.startPingMonitoring();
  }

  disableDebugMode() {
    this.debugMode = false;
    console.log('🔍 WebSocket debug mode disabled');
    this.stopPingMonitoring();
  }

  getDebugInfo(): SocketDebugInfo {
    const socketManager = getSocketManager();
    const socket = socketManager?.getSocket();
    
    return {
      connected: socketManager?.isConnected() || false,
      socketId: socket?.id,
      userId: socket?.auth?.userId,
      userRole: socket?.auth?.role,
      reconnectAttempts: 0, // This would need to be exposed from SocketManager
      lastPing: this.lastPing || undefined,
      connectionTime: socket?.connectedAt
    };
  }

  private startPingMonitoring() {
    if (this.pingInterval) return;

    this.pingInterval = setInterval(() => {
      const socketManager = getSocketManager();
      if (socketManager?.isConnected()) {
        this.lastPing = new Date();
        socketManager.emit('ping');
        
        if (this.debugMode) {
          console.log('🏓 Ping sent at:', this.lastPing.toISOString());
        }
      }
    }, 30000); // Ping every 30 seconds
  }

  private stopPingMonitoring() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  logConnectionEvent(event: string, data?: any) {
    if (this.debugMode) {
      console.log(`🔌 WebSocket ${event}:`, data);
    }
  }

  logEmitEvent(event: string, data?: any) {
    if (this.debugMode) {
      console.log(`📡 Emitting '${event}':`, data);
    }
  }

  logReceiveEvent(event: string, data?: any) {
    if (this.debugMode) {
      console.log(`📨 Received '${event}':`, data);
    }
  }

  // Test connection health
  async testConnection(): Promise<{ success: boolean; latency?: number; error?: string }> {
    const socketManager = getSocketManager();
    
    if (!socketManager?.isConnected()) {
      return { success: false, error: 'Socket not connected' };
    }

    try {
      const startTime = Date.now();
      const pingPromise = new Promise<number>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Ping timeout')), 5000);
        
        const onPong = (data: any) => {
          clearTimeout(timeout);
          const latency = Date.now() - startTime;
          resolve(latency);
        };
        
        socketManager.on('pong', onPong);
        socketManager.emit('ping');
        
        // Clean up listener after 5 seconds
        setTimeout(() => {
          socketManager.off('pong', onPong);
        }, 5000);
      });

      const latency = await pingPromise;
      return { success: true, latency };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Get connection statistics
  getConnectionStats() {
    const socketManager = getSocketManager();
    const socket = socketManager?.getSocket();
    
    return {
      connected: socketManager?.isConnected() || false,
      socketId: socket?.id,
      transport: socket?.io?.engine?.transport?.name,
      readyState: socket?.io?.readyState,
      lastPing: this.lastPing,
      debugMode: this.debugMode
    };
  }
}

// Create singleton instance
const socketDebugger = new SocketDebugger();

// Enable debug mode in development
if (import.meta.env.DEV) {
  socketDebugger.enableDebugMode();
}

export default socketDebugger; 