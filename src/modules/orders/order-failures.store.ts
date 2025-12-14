import { pgPool } from '../../db/postgres';

class OrderFailuresStore {
  async create(orderId: string, reason: string): Promise<void> {
    await pgPool.query(
      'INSERT INTO order_failures(order_id, reason) VALUES ($1, $2)',
      [orderId, reason]
    );
  }
}

export const orderFailuresStore = new OrderFailuresStore();
