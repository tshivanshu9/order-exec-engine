import { FastifyInstance } from 'fastify';
import { wsManager } from './websocket/ws.manager';
import { orderService } from './orders.service';

export default async function wsOrderRoutes(fastify: FastifyInstance) {
  fastify.get('/ws/orders', { websocket: true }, async (socket, request) => {
    const { orderId } = request.query as { orderId?: string };

    if (!orderId) {
      socket.close();
      return;
    }

    wsManager.subscribe(orderId, socket);
    socket.send(JSON.stringify({ msg: 'connected' }));

    const order = await orderService.getOrder(orderId);
    if (order) {
      socket.send(
        JSON.stringify({
          orderId: order.id,
          status: order.status,
          selectedDex: order.selectedDex,
          executedPrice: order.executedPrice,
          txHash: order.txHash,
          failureReason: order.failureReason,
        })
      );
    }

    socket.on('close', () => {
      wsManager.unsubscribe(orderId, socket);
    });
  });
}
