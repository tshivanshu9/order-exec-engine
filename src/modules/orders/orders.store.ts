import { pgPool } from '../../db/postgres';
import { toSnake } from '../../utils/utility.service';
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

  async get(orderId: string): Promise<Order | null> {
    const res = await pgPool.query(`SELECT * FROM orders WHERE id = $1`, [
      orderId,
    ]);
    if (!res?.rows?.length) return null;
    const row = res.rows[0];
    return {
      id: row.id,
      tokenIn: row.token_in,
      tokenOut: row.token_out,
      amount: row.amount,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      selectedDex: row.selected_dex,
      txHash: row.tx_hash,
      executedPrice: row.executed_price,
    };
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
}

export const orderStore = new OrderStore();
