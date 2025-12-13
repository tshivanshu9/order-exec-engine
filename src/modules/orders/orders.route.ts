import { FastifyInstance } from 'fastify';
import { CreateOrderRequest } from './types/orders.types';
import { orderService } from './orders.service';

export default async function orderRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: CreateOrderRequest }>(
    '/execute',
    async (request, reply) => {
      const order = await orderService.createOrder(request.body);

      return {
        orderId: order.id,
      };
    }
  );
}
