import { OrderStatus } from '../../../constants/enums';
import { redisConnection } from '../../../redis/redis';
import { activeOrderStore } from '../active-orders.store';
import { ActiveOrder } from '../types/orders.types';

jest.mock('../../../redis/redis', () => ({
  redisConnection: {
    setex: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
  },
}));

describe('ActiveOrderStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('key', () => {
    it('should generate the correct Redis key', () => {
      const orderId = 'ord_123';
      const key = activeOrderStore['key'](orderId);
      expect(key).toBe(`active:order:${orderId}`);
    });
  });

  describe('set', () => {
    it('should set an active order in Redis with TTL', async () => {
      const redisSetexSpy = jest
        .spyOn(redisConnection, 'setex')
        .mockResolvedValueOnce('OK');

      const activeOrder: ActiveOrder = {
        id: 'ord_123',
        tokenIn: 'SOL',
        tokenOut: 'USDC',
        amount: 100,
        status: OrderStatus.ROUTING,
        updatedAt: new Date().toString(),
      };

      await activeOrderStore.set(activeOrder);

      expect(redisSetexSpy).toHaveBeenCalledWith(
        `active:order:${activeOrder.id}`,
        3600,
        JSON.stringify(activeOrder)
      );
    });
  });

  describe('get', () => {
    it('should get an active order from Redis', async () => {
      const activeOrder: ActiveOrder = {
        id: 'ord_123',
        tokenIn: 'SOL',
        tokenOut: 'USDC',
        amount: 100,
        status: OrderStatus.ROUTING,
        updatedAt: new Date().toString(),
      };

      const redisGetSpy = jest
        .spyOn(redisConnection, 'get')
        .mockResolvedValueOnce(JSON.stringify(activeOrder));

      const result = await activeOrderStore.get(activeOrder.id);

      expect(redisGetSpy).toHaveBeenCalledWith(
        `active:order:${activeOrder.id}`
      );
      expect(result).toEqual(activeOrder);
    });

    it('should return null if active order not found in Redis', async () => {
      const redisGetSpy = jest
        .spyOn(redisConnection, 'get')
        .mockResolvedValueOnce(null);

      const result = await activeOrderStore.get('ord_nonexistent');

      expect(redisGetSpy).toHaveBeenCalledWith(`active:order:ord_nonexistent`);
      expect(result).toBeNull();
    });
  });

  describe('remove', () => {
    it('should remove an active order from Redis', async () => {
      const redisDelSpy = jest
        .spyOn(redisConnection, 'del')
        .mockResolvedValueOnce(1);

      const orderId = 'ord_123';
      await activeOrderStore.remove(orderId);

      expect(redisDelSpy).toHaveBeenCalledWith(`active:order:${orderId}`);
    });
  });
});
