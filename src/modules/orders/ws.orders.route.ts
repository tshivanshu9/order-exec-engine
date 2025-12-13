import { FastifyInstance } from 'fastify';
import { wsManager } from './websocket/ws.manager';

export default async function wsOrderRoutes(fastify: FastifyInstance) {
  fastify.get('/ws/orders', { websocket: true }, (socket, request) => {
    const { orderId } = request.query as { orderId?: string };

    if (!orderId) {
      socket.close();
      return;
    }

    wsManager.subscribe(orderId, socket);

    socket.on('close', () => {
      wsManager.unsubscribe(orderId, socket);
    });
  });
}
