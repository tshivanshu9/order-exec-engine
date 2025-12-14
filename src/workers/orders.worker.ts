import { Job, Worker } from 'bullmq';
import { redisConnection } from '../queue/redis';
import { OrderStatus } from '../constants/enums';
import { orderService } from '../modules/orders/orders.service';
import { sleep } from '../utils/utility.service';
import { routeOrder } from '../modules/dex/dex.router';

export const orderWorker = new Worker(
  'order-execution',
  async (job: Job) => {
    const { orderId } = job.data;
    const start = Date.now();

    try {
      console.log(`[WORKER] START ${orderId}`);
      await sleep(5000);
      orderService.updateOrderStatus(orderId, OrderStatus.ROUTING);

      if (Math.random() < 0.2) {
        throw new Error('DEX quote timeout');
      }

      const order = await orderService.getOrder(orderId);
      if (!order) {
        throw new Error(`Order not found: ${orderId}`);
      }

      const route = await routeOrder(
        order.tokenIn,
        order.tokenOut,
        order.amount
      );

      await sleep(3000);
      orderService.updateOrderStatus(orderId, OrderStatus.BUILDING, {
        selectedDex: route.bestDex,
        amount: route.bestQuote.price,
      });

      await sleep(3000);

      orderService.updateOrderStatus(orderId, OrderStatus.CONFIRMED, {
        txHash: `mock_tx_${Date.now()}`,
        executedPrice: route.bestQuote.price,
      });

      console.log(`[WORKER] END ${orderId} duration=${Date.now() - start}ms`);
    } catch (err: any) {
      console.error(`[WORKER] ERROR ${orderId}`, err.message);
      throw err;
    }
  },
  {
    connection: redisConnection,
    concurrency: 10,
    limiter: {
      max: 100,
      duration: 60_000,
    },
  }
);

orderWorker.on('failed', (job, err) => {
  const orderId = job?.data?.orderId;
  if (!orderId) return;

  orderService.updateOrderStatus(orderId, OrderStatus.FAILED, {
    reason: err.message,
  });
});
