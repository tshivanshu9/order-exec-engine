import { WebSocket } from 'ws';
import { wsManager } from '../websocket/ws.manager';

describe('WebSocketManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    wsManager['orderSubscriptions'].clear();
  });

  describe('subscribe', () => {
    it('should add a WebSocket to the order subscriptions', () => {
      const socket = {
        readyState: WebSocket.OPEN,
        send: jest.fn(),
      } as unknown as WebSocket;
      wsManager.subscribe('order1', socket);
      expect(wsManager['orderSubscriptions'].get('order1')).toContain(socket);
    });
  });

  describe('unsubscribe', () => {
    it('should remove a WebSocket from the order subscriptions', () => {
      const socket = {
        readyState: WebSocket.OPEN,
        send: jest.fn(),
      } as unknown as WebSocket;
      wsManager.subscribe('order1', socket);
      wsManager.unsubscribe('order1', socket);
      expect(wsManager['orderSubscriptions'].get('order1')).toBeUndefined();
    });
  });

  describe('emit', () => {
    it('should send a message to all subscribed WebSockets for an order', () => {
      const socket1 = {
        readyState: WebSocket.OPEN,
        send: jest.fn(),
      } as unknown as WebSocket;
      const socket2 = {
        readyState: WebSocket.OPEN,
        send: jest.fn(),
      } as unknown as WebSocket;
      wsManager.subscribe('order1', socket1);
      wsManager.subscribe('order1', socket2);

      const payload = { status: 'updated' };
      wsManager.emit('order1', payload);

      const message = JSON.stringify(payload);
      expect(socket1.send).toHaveBeenCalledWith(message);
      expect(socket2.send).toHaveBeenCalledWith(message);
    });
  });
});
