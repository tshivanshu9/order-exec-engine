import { pgPool } from '../../db/postgres';
import { toSnake } from '../../utils/utility.service';
import { OrderMapper } from './mapper/orders.mapper';
import { Order } from './types/orders.types';

class OrderStore {
  async create(order: Order): Promise<void> {
    await pgPool.query(
      `
      INSERT INTO orders
      (id, token_in, token_out, amount, status)
      VALUES ($1,$2,$3,$4,$5)
      `,
      [order.id, order.tokenIn, order.tokenOut, order.amount, order.status]
    );
  }

  async getById(orderId: string): Promise<Order | null> {
    const res = await pgPool.query(`SELECT * FROM orders WHERE id = $1`, [
      orderId,
    ]);
    if (!res?.rows?.length) return null;
    return OrderMapper.toOrder(res.rows[0]);
  }

  async update(orderId: string, update: Partial<Order>) {
    const fields = [];
    const values = [];
    let i = 1;

    for (const [key, value] of Object.entries(update)) {
      fields.push(`${toSnake(key)} = $${i++}`);
      values.push(value);
    }

    values.push(orderId);

    const res = await pgPool.query(
      `
      UPDATE orders
      SET ${fields.join(', ')}
      WHERE id = $${i}
      RETURNING *
      `,
      values
    );

    return res.rows[0];
  }

  async listAll(
    page: number,
    limit: number
  ): Promise<{
    data: Order[];
    paginate: { totalCount: number; limit: number };
  }> {
    const offset = (page - 1) * limit;
    const [data, count] = await Promise.all([
      pgPool.query(
        `
        SELECT *
        FROM orders
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
        `,
        [limit, offset]
      ),
      pgPool.query(
        `
        SELECT COUNT(*)::int AS total
        FROM orders
        `
      ),
    ]);
    return {
      data: OrderMapper.toOrderList(data.rows),
      paginate: { totalCount: count?.rows[0]?.total, limit },
    };
  }
}

export const orderStore = new OrderStore();
