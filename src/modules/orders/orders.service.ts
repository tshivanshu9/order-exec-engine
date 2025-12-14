import { v4 as uuid } from 'uuid';
import { CreateOrderRequest, Order, OrderFailure } from './types/orders.types';
import { OrderStatus } from '../../constants/enums';
import { orderStore } from './orders.store';
import { wsManager } from './websocket/ws.manager';
import { orderQueue } from '../../queue/order.queue';
import { orderFailuresStore } from './order-failures.store';

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
    return orderStore.getById(orderId);
  }

  async listOrders(
    page: number,
    limit: number
  ): Promise<{
    data: Order[];
    paginate: { totalCount: number; limit: number };
  }> {
    return orderStore.listAll(page, limit);
  }

  async logOrderFailure(orderId: string, reason: string): Promise<void> {
    await orderFailuresStore.create(orderId, reason);
  }

  async listOrderFailures(
    page: number,
    limit: number
  ): Promise<{
    data: OrderFailure[];
    paginate: { totalCount: number; limit: number };
  }> {
    return orderFailuresStore.listAllFailures(page, limit);
  }
}

export const orderService = new OrderService();
