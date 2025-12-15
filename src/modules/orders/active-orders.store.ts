import { redisConnection } from '../../redis/redis';
import { ActiveOrder } from './types/orders.types';

const ACTIVE_ORDER_TTL_SECONDS = 60 * 60;

class ActiveOrderStore {
  private key(orderId: string): string {
    return `active:order:${orderId}`;
  }

  async set(order: ActiveOrder): Promise<void> {
    await redisConnection.setex(
      this.key(order.id),
      ACTIVE_ORDER_TTL_SECONDS,
      JSON.stringify(order)
    );
  }

  async get(orderId: string): Promise<ActiveOrder | null> {
    const data = await redisConnection.get(this.key(orderId));
    if (!data) return null;
    return JSON.parse(data);
  }

  async remove(orderId: string): Promise<void> {
    await redisConnection.del(this.key(orderId));
  }
}

export const activeOrderStore = new ActiveOrderStore();
