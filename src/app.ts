import { FastifyInstance } from 'fastify';
import healthRoutes from './routes/healh';
import wsTestRoutes from './routes/ws-test';
import orderRoutes from './modules/orders/orders.route';
import wsOrderRoutes from './modules/orders/ws.orders.route';

export async function app(fastify: FastifyInstance) {
  fastify.register(healthRoutes, { prefix: '/health-check' });
  fastify.register(wsTestRoutes);
  fastify.register(orderRoutes, { prefix: '/api/orders' });
  fastify.register(wsOrderRoutes);
}
