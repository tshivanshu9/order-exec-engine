import { Worker } from 'bullmq';
import { redisConnection } from '../queue/redis';
import { OrderStatus } from '../constants/enums';
import { orderService } from '../modules/orders/orders.service';
import { sleep } from '../utils/utility.service';
import { routeOrder } from '../modules/dex/dex.router';

export const orderWorker = new Worker(
  'order-execution',
  async job => {
    const { orderId } = job.data;
    const start = Date.now();
    console.log(`[WORKER] START ${orderId}`);
    console.log(`[WORKER] Processing order ${orderId}`);

    const order = await orderService.getOrder(orderId);
    if (!order) {
      console.log(`[WORKER] Order ${orderId} not found`);
      return;
    }
    orderService.updateOrderStatus(orderId, OrderStatus.ROUTING);
    const route = await routeOrder(order.tokenIn, order.tokenOut, order.amount);
    await sleep(500);

    orderService.updateOrderStatus(orderId, OrderStatus.BUILDING, {
      selectedDex: route.bestDex,
      price: route.bestQuote.price,
    });
    await sleep(500);

    await sleep(1500);

    orderService.updateOrderStatus(orderId, OrderStatus.CONFIRMED, {
      txHash: `mock_tx_${Date.now()}`,
      executedPrice: route.bestQuote.price,
    });
    console.log(`[WORKER] END ${orderId} duration=${Date.now() - start}ms`);
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
