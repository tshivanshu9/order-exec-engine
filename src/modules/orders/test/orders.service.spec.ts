import { OrderStatus } from '../../../constants/enums';
import { orderQueue } from '../../../queue/order.queue';
import { activeOrderStore } from '../active-orders.store';
import { OrderMapper } from '../mapper/orders.mapper';
import { orderFailuresStore } from '../order-failures.store';
import { OrderService } from '../orders.service';
import { orderStore } from '../orders.store';
import { wsManager } from '../websocket/ws.manager';

jest.mock('../orders.store');
jest.mock('../websocket/ws.manager');
jest.mock('../orders.store');
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-123'),
}));

describe('OrderService', () => {
  let service: OrderService;

  beforeEach(() => {
    service = new OrderService();
    jest.clearAllMocks();
  });

  describe('createOrder', () => {
    it('should create an order and add it to the queue', async () => {
      const payload = {
        tokenIn: 'SOL',
        tokenOut: 'USDC',
        amount: 100,
      };
      const orderStoreSpy = jest
        .spyOn(orderStore, 'create')
        .mockResolvedValueOnce(undefined);
      const orderQueueSpy = jest
        .spyOn(orderQueue, 'add')
        .mockResolvedValueOnce({} as any);

      const order = await service.createOrder(payload);
      expect(order).toStrictEqual(
        expect.objectContaining({
          tokenIn: payload.tokenIn,
          tokenOut: payload.tokenOut,
          amount: payload.amount,
          status: OrderStatus.PENDING,
          id: expect.any(String),
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        })
      );
      expect(orderStoreSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          tokenIn: payload.tokenIn,
          tokenOut: payload.tokenOut,
          amount: payload.amount,
        })
      );
      expect(orderQueueSpy).toHaveBeenCalledWith('execute-order', {
        orderId: order.id,
      });
    });
  });

  describe('updateOrderStatus', () => {
    it('order not found should do nothing', async () => {
      const orderStoreSpy = jest
        .spyOn(orderStore, 'update')
        .mockResolvedValueOnce(null);
      const wsEmitSpy = jest
        .spyOn(wsManager, 'emit')
        .mockImplementationOnce(() => {});

      await service.updateOrderStatus('ord_nonexistent', OrderStatus.CONFIRMED);

      expect(orderStoreSpy).toHaveBeenCalledWith('ord_nonexistent', {
        status: OrderStatus.CONFIRMED,
      });
      expect(wsEmitSpy).not.toHaveBeenCalled();
    });

    it('terminal state: should update order status and emit websocket event', async () => {
      const orderId = 'ord_mock-uuid-123';
      const status = OrderStatus.CONFIRMED;
      const extra = { txHash: 'mock_tx_123' };
      const orderStoreSpy = jest
        .spyOn(orderStore, 'update')
        .mockResolvedValueOnce({
          id: orderId,
          tokenIn: 'SOL',
          tokenOut: 'USDC',
          amount: 100,
          status: OrderStatus.BUILDING,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      const wsEmitSpy = jest
        .spyOn(wsManager, 'emit')
        .mockImplementationOnce(() => {});

      await service.updateOrderStatus(orderId, status, extra);

      expect(orderStoreSpy).toHaveBeenCalledWith(orderId, { status, ...extra });
      expect(wsEmitSpy).toHaveBeenCalledWith(orderId, {
        type: expect.any(String),
        orderId,
        status: OrderStatus.CONFIRMED,
        ...extra,
      });
    });

    it('non-terminal state: should update order status and emit websocket event', async () => {
      const orderId = 'ord_mock-uuid-123';
      const status = OrderStatus.ROUTING;
      const updatedOrder = {
        id: orderId,
        tokenIn: 'SOL',
        tokenOut: 'USDC',
        amount: 100,
        status: OrderStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const orderStoreSpy = jest
        .spyOn(orderStore, 'update')
        .mockResolvedValueOnce(updatedOrder);

      const wsEmitSpy = jest
        .spyOn(wsManager, 'emit')
        .mockImplementationOnce(() => {});
      const storeSpy = jest
        .spyOn(activeOrderStore, 'set')
        .mockResolvedValueOnce();
      await service.updateOrderStatus(orderId, status);

      expect(orderStoreSpy).toHaveBeenCalledWith(orderId, { status });
      expect(wsEmitSpy).toHaveBeenCalledWith(orderId, {
        type: expect.any(String),
        orderId,
        status: OrderStatus.ROUTING,
      });
      expect(storeSpy).toHaveBeenCalledWith(
        OrderMapper.toActiveOrder(updatedOrder)
      );
    });
  });

  describe('getOrder', () => {
    it('should return the order', async () => {
      const orderId = 'ord_mock-uuid-123';
      const mockOrder = {
        id: orderId,
        tokenIn: 'SOL',
        tokenOut: 'USDC',
        amount: 100,
        status: OrderStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const orderStoreSpy = jest
        .spyOn(orderStore, 'getById')
        .mockResolvedValueOnce(mockOrder);

      const order = await service.getOrder(orderId);

      expect(orderStoreSpy).toHaveBeenCalledWith(orderId);
      expect(order).toEqual(mockOrder);
    });
  });

  describe('listOrders', () => {
    it('should return paginated orders', async () => {
      const page = 1;
      const limit = 10;
      const mockResult = {
        data: [
          {
            id: 'ord_1',
            tokenIn: 'SOL',
            tokenOut: 'USDC',
            amount: 100,
            status: OrderStatus.PENDING,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        paginate: {
          totalCount: 1,
          limit,
        },
      };
      const orderStoreSpy = jest
        .spyOn(orderStore, 'listAll')
        .mockResolvedValueOnce(mockResult);

      const result = await service.listOrders(page, limit);

      expect(orderStoreSpy).toHaveBeenCalledWith(page, limit);
      expect(result).toEqual(mockResult);
    });
  });

  describe('listOrderFailures', () => {
    it('should return paginated order failures', async () => {
      const page = 1;
      const limit = 10;
      const mockResult = {
        data: [
          {
            id: `1`,
            orderId: 'ord_1',
            createdAt: new Date(),
            updatedAt: new Date(),
            reason: 'DEX quote timeout',
          },
        ],
        paginate: {
          totalCount: 1,
          limit,
        },
      };
      const orderStoreSpy = jest
        .spyOn(orderFailuresStore, 'listAllFailures')
        .mockResolvedValueOnce(mockResult);

      const result = await service.listOrderFailures(page, limit);

      expect(orderStoreSpy).toHaveBeenCalledWith(page, limit);
      expect(result).toEqual(mockResult);
    });
  });

  describe('logOrderFailure', () => {
    it('should log order failure', async () => {
      const orderId = 'ord_mock-uuid-123';
      const reason = 'DEX quote timeout';
      const orderFailuresStoreSpy = jest
        .spyOn(orderFailuresStore, 'create')
        .mockResolvedValueOnce();

      await service.logOrderFailure(orderId, reason);

      expect(orderFailuresStoreSpy).toHaveBeenCalledWith(orderId, reason);
    });
  });
});
