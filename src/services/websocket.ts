type MessageHandler = (data: any) => void;

class RealtimeService {
  private socket: WebSocket | null = null;
  private listeners: Set<MessageHandler> = new Set();
  private subscribedChannels: Set<string> = new Set();
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isConnecting = false;

  public connect() {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isConnecting = true;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/ws`;

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.isConnecting = false;
        // Resubscribe to existing channels
        this.subscribedChannels.forEach((channel) => {
          this.send({ type: 'subscribe', channel });
        });
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.listeners.forEach((listener) => {
            try {
              listener(data);
            } catch (err) {
              console.error('Error in WS message listener:', err);
            }
          });
        } catch (err) {
          // ignore non-json messages
        }
      };

      this.socket.onclose = () => {
        this.isConnecting = false;
        this.scheduleReconnect();
      };

      this.socket.onerror = () => {
        this.isConnecting = false;
      };
    } catch (e) {
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 3000);
  }

  public subscribe(channel: string) {
    this.subscribedChannels.add(channel);
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.send({ type: 'subscribe', channel });
    }
  }

  public unsubscribe(channel: string) {
    this.subscribedChannels.delete(channel);
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.send({ type: 'unsubscribe', channel });
    }
  }

  public onMessage(handler: MessageHandler) {
    this.listeners.add(handler);
    return () => {
      this.listeners.delete(handler);
    };
  }

  private send(data: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    }
  }
}

export const realtime = new RealtimeService();
