import { pgPool } from '../../db/postgres';
import { OrderFailure } from './types/orders.types';

class OrderFailuresStore {
  async create(orderId: string, reason: string): Promise<void> {
    await pgPool.query(
      'INSERT INTO order_failures(order_id, reason) VALUES ($1, $2)',
      [orderId, reason]
    );
  }

  async listAllFailures(
    page: number,
    limit: number
  ): Promise<{
    data: OrderFailure[];
    paginate: { totalCount: number; limit: number };
  }> {
    const offset = (page - 1) * limit;
    const [data, count] = await Promise.all([
      pgPool.query(
        `
        SELECT id, order_id as "orderId", created_at as "createdAt", updated_at as "updatedAt", reason
        FROM order_failures
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
        `,
        [limit, offset]
      ),
      pgPool.query(
        `
        SELECT COUNT(*)::int AS total
        FROM order_failures
        `
      ),
    ]);
    return {
      data: data.rows,
      paginate: { totalCount: count?.rows[0]?.total, limit },
    };
  }
}

export const orderFailuresStore = new OrderFailuresStore();
