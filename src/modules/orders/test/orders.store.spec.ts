import { OrderStatus } from '../../../constants/enums';
import { pgPool } from '../../../db/postgres';
import { orderStore } from '../orders.store';
import { Order } from '../types/orders.types';

jest.mock('../../../db/postgres', () => ({
  pgPool: {
    query: jest.fn(),
  },
}));

describe('OrderStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create an order in the database', async () => {
      const pgQuerySpy = jest
        .spyOn(pgPool, 'query')
        .mockResolvedValueOnce({} as never);

      const order: Order = {
        id: 'ord_123',
        tokenIn: 'SOL',
        tokenOut: 'USDC',
        amount: 100,
        status: OrderStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await orderStore.create(order);

      expect(pgQuerySpy).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO orders'),
        [order.id, order.tokenIn, order.tokenOut, order.amount, order.status]
      );
    });
  });

  describe('getById', () => {
    it('should return an order by ID', async () => {
      const mockDbRow = {
        id: 'ord_123',
        token_in: 'SOL',
        token_out: 'USDC',
        amount: 100,
        status: OrderStatus.PENDING,
        created_at: new Date(),
        updated_at: new Date(),
      };
      const pgQuerySpy = jest.spyOn(pgPool, 'query').mockResolvedValueOnce({
        rows: [mockDbRow],
      } as never);

      const order = await orderStore.getById('ord_123');

      expect(pgQuerySpy).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM orders WHERE id = $1'),
        ['ord_123']
      );
      expect(order).toEqual({
        id: mockDbRow.id,
        tokenIn: mockDbRow.token_in,
        tokenOut: mockDbRow.token_out,
        amount: mockDbRow.amount,
        status: mockDbRow.status,
        createdAt: mockDbRow.created_at,
        updatedAt: mockDbRow.updated_at,
      });
    });

    it('should return null if order not found', async () => {
      const pgQuerySpy = jest.spyOn(pgPool, 'query').mockResolvedValueOnce({
        rows: [],
      } as never);

      const order = await orderStore.getById('ord_nonexistent');

      expect(pgQuerySpy).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM orders WHERE id = $1'),
        ['ord_nonexistent']
      );
      expect(order).toBeNull();
    });
  });

  describe('update', () => {
    it('should update an order and return the updated order', async () => {
      const mockUpdatedRow = {
        id: 'ord_123',
        token_in: 'SOL',
        token_out: 'USDC',
        amount: 100,
        status: OrderStatus.CONFIRMED,
        created_at: new Date(),
        updated_at: new Date(),
      };
      const pgQuerySpy = jest.spyOn(pgPool, 'query').mockResolvedValueOnce({
        rows: [mockUpdatedRow],
      } as never);

      const updatedOrder = await orderStore.update('ord_123', {
        status: OrderStatus.CONFIRMED,
      });

      expect(pgQuerySpy).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE orders'),
        expect.arrayContaining([OrderStatus.CONFIRMED, 'ord_123'])
      );
      expect(updatedOrder).toEqual({
        id: mockUpdatedRow.id,
        tokenIn: mockUpdatedRow.token_in,
        tokenOut: mockUpdatedRow.token_out,
        amount: mockUpdatedRow.amount,
        status: mockUpdatedRow.status,
        createdAt: mockUpdatedRow.created_at,
        updatedAt: mockUpdatedRow.updated_at,
      });
    });

    it('should return null if order to update not found', async () => {
      const pgQuerySpy = jest.spyOn(pgPool, 'query').mockResolvedValueOnce({
        rows: [],
      } as never);

      const updatedOrder = await orderStore.update('ord_nonexistent', {
        status: OrderStatus.CONFIRMED,
      });

      expect(pgQuerySpy).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE orders'),
        expect.arrayContaining([OrderStatus.CONFIRMED, 'ord_nonexistent'])
      );
      expect(updatedOrder).toBeNull();
    });
  });

  describe('listAll', () => {
    it('should return paginated orders', async () => {
      const mockDbRows = [
        {
          id: 'ord_1',
          token_in: 'SOL',
          token_out: 'USDC',
          amount: 100,
          status: OrderStatus.PENDING,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      const pgQuerySpy = jest
        .spyOn(pgPool, 'query')
        .mockResolvedValueOnce({ rows: mockDbRows } as never)
        .mockResolvedValueOnce({ rows: [{ total: 1 }] } as never);

      const result = await orderStore.listAll(1, 10);

      expect(pgQuerySpy).toHaveBeenNthCalledWith(
        1,
        expect.stringMatching(/FROM\s+orders/i),
        [10, 0]
      );

      expect(pgQuerySpy).toHaveBeenNthCalledWith(
        2,
        expect.stringMatching(/COUNT\(\*\)[\s\S]*FROM\s+orders/i)
      );

      expect(result).toEqual({
        data: [
          {
            id: 'ord_1',
            tokenIn: 'SOL',
            tokenOut: 'USDC',
            amount: 100,
            status: OrderStatus.PENDING,
            createdAt: mockDbRows[0].created_at,
            updatedAt: mockDbRows[0].updated_at,
          },
        ],
        paginate: {
          totalCount: 1,
          limit: 10,
        },
      });
    });
  });
});
