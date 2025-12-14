import { Order } from '../types/orders.types';

export class OrderMapper {
  static toOrder(row: any): Order {
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

  static toOrderList(rows: any[]): Order[] {
    return rows.map(row => this.toOrder(row));
  }
}
