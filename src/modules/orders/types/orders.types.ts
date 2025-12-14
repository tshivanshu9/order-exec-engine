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
  failureReason?: string | null;
}
