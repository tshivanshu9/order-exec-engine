import { OrderStatus } from '../../../constants/enums';

export interface CreateOrderRequest {
  tokenIn: string;
  tokenOut: string;
  amount: number;
}

export interface Order {
  id: string;
  tokenIn: string;
  tokenOut: string;
  amount: number;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
  selectedDex?: string | null;
  executedPrice?: number | null;
  txHash?: string | null;
}

export interface OrderFailure {
  id: string;
  orderId: string;
  reason: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActiveOrder {
  id: string;
  status: OrderStatus;
  tokenIn: string;
  tokenOut: string;
  amount: number;

  selectedDex?: string;
  executedPrice?: number;
  txHash?: string;
  failureReason?: string;

  updatedAt: string;
}
