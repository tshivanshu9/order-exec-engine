import { Order } from './types/orders.types';

class OrderStore {
  private orders = new Map<string, Order>();

  create(order: Order) {
    this.orders.set(order.id, order);
  }

  get(orderId: string) {
    return this.orders.get(orderId);
  }

  update(orderId: string, update: Partial<Order>) {
    const existing = this.orders.get(orderId);
    if (!existing) return;

    const updated = {
      ...existing,
      ...update,
      updatedAt: new Date(),
    };

    this.orders.set(orderId, updated);
    return updated;
  }
}

export const orderStore = new OrderStore();
