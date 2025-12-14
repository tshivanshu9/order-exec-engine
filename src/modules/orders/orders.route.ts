import { FastifyInstance } from 'fastify';
import { CreateOrderRequest } from './types/orders.types';
import { orderService } from './orders.service';

export default async function orderRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: CreateOrderRequest }>('/', async (request, reply) => {
    try {
      const order = await orderService.createOrder(request.body);
      return {
        success: true,
        data: {
          orderId: order.id,
        },
      };
    } catch (error) {
      console.error('Error creating order:', error);
      reply.status(500);
      return {
        success: false,
        message: 'Failed to create order',
      };
    }
  });

  fastify.get('/', async (request, reply) => {
    const { page = '1', limit = '20' } = request.query as any;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(20, parseInt(limit));

    try {
      const result = await orderService.listOrders(pageNum, limitNum);

      return { success: true, ...result };
    } catch (error) {
      console.error('Error fetching orders:', error);
      reply.status(500);
      return { success: false, message: 'Internal Server Error' };
    }
  });

  fastify.get('/failures', async (request, reply) => {
    const { page = '1', limit = '20' } = request.query as any;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(20, parseInt(limit));

    try {
      const result = await orderService.listOrderFailures(pageNum, limitNum);

      return { success: true, ...result };
    } catch (error) {
      console.error('Error fetching order failures:', error);
      reply.status(500);
      return { success: false, message: 'Internal Server Error' };
    }
  });
}
