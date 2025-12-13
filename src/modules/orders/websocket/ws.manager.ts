class WebSocketManager {
  private orderSubscriptions = new Map<string, Set<WebSocket>>();

  subscribe(orderId: string, socket: WebSocket) {
    if (!this.orderSubscriptions.has(orderId)) {
      this.orderSubscriptions.set(orderId, new Set());
    }
    this.orderSubscriptions.get(orderId)!.add(socket);
  }

  unsubscribe(orderId: string, socket: WebSocket) {
    const sockets = this.orderSubscriptions.get(orderId);
    if (!sockets) return;

    sockets.delete(socket);
    if (sockets.size === 0) {
      this.orderSubscriptions.delete(orderId);
    }
  }

  emit(orderId: string, payload: any) {
    const sockets = this.orderSubscriptions.get(orderId);
    if (!sockets) return;

    const message = JSON.stringify(payload);
    for (const socket of sockets) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(message);
      }
    }
  }
}

export const wsManager = new WebSocketManager();
