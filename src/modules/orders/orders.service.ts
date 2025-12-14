import { v4 as uuid } from 'uuid';
import { CreateOrderRequest, Order } from './types/orders.types';
import { OrderStatus } from '../../constants/enums';
import { orderStore } from './orders.store';
import { wsManager } from './websocket/ws.manager';
import { orderQueue } from '../../queue/order.queue';

export class OrderService {
  async createOrder(payload: CreateOrderRequest): Promise<Order> {
    const now = new Date();

    const order: Order = {
      id: `ord_${uuid()}`,
      tokenIn: payload.tokenIn,
      tokenOut: payload.tokenOut,
      amount: payload.amount,
      status: OrderStatus.PENDING,
      createdAt: now,
      updatedAt: now,
    };

    await orderStore.create(order);
    await orderQueue.add('execute-order', {
      orderId: order.id,
    });
    return order;
  }

  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    extra?: Record<string, any>
  ) {
    const updated = await orderStore.update(orderId, { status, ...extra });

    if (!updated) return;

    console.log(`[ORDER ${orderId}] status=${status}`, extra ? extra : '');

    wsManager.emit(orderId, {
      orderId,
      status,
      ...extra,
    });
  }

  async getOrder(orderId: string): Promise<Order | null> {
    return orderStore.get(orderId);
  }
}

export const orderService = new OrderService();
