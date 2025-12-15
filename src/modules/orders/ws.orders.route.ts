import { FastifyInstance } from 'fastify';
import { wsManager } from './websocket/ws.manager';
import { activeOrderStore } from './active-orders.store';
import { SocketEventType } from '../../constants/enums';

export default async function wsOrderRoutes(fastify: FastifyInstance) {
  fastify.get('/ws/orders', { websocket: true }, async (socket, request) => {
    const { orderId } = request.query as { orderId?: string };

    if (!orderId) {
      socket.close();
      return;
    }

    const activeOrder = await activeOrderStore.get(orderId);
    if (activeOrder) {
      socket.send(
        JSON.stringify({
          type: SocketEventType.SNAPSHOT,
          orderId,
          status: activeOrder.status,
          selectedDex: activeOrder.selectedDex,
          executedPrice: activeOrder.executedPrice,
          txHash: activeOrder.txHash,
        })
      );
    }

    wsManager.subscribe(orderId, socket);

    socket.on('close', () => {
      wsManager.unsubscribe(orderId, socket);
    });
  });
}
