import { pgPool } from '../../../db/postgres';
import { orderFailuresStore } from '../order-failures.store';

jest.mock('../../../db/postgres', () => ({
  pgPool: {
    query: jest.fn(),
  },
}));

describe('OrderFailuresStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create an order failure in the database', async () => {
      const pgQuerySpy = jest
        .spyOn(pgPool, 'query')
        .mockResolvedValueOnce({} as never);
      await orderFailuresStore.create('ord_123', 'Insufficient balance');
      expect(pgQuerySpy).toHaveBeenCalledWith(
        'INSERT INTO order_failures(order_id, reason) VALUES ($1, $2)',
        ['ord_123', 'Insufficient balance']
      );
    });
  });

  describe('listAllFailures', () => {
    it('should return paginated order failures', async () => {
      const mockDbRows = [
        {
          id: '1',
          order_id: 'ord_123',
          created_at: new Date(),
          updated_at: new Date(),
          reason: 'Insufficient balance',
        },
      ];
      const pgQuerySpy = jest
        .spyOn(pgPool, 'query')
        .mockResolvedValueOnce({ rows: mockDbRows } as never)
        .mockResolvedValueOnce({ rows: [{ total: 1 }] } as never);

      const result = await orderFailuresStore.listAllFailures(1, 10);

      expect(pgQuerySpy).toHaveBeenNthCalledWith(
        1,
        expect.stringMatching(/SELECT[\s\S]*FROM\s+order_failures/i),
        [10, 0]
      );

      expect(pgQuerySpy).toHaveBeenNthCalledWith(
        2,
        expect.stringMatching(/COUNT\(\*\)[\s\S]*FROM\s+order_failures/i)
      );

      expect(result).toEqual({
        data: mockDbRows.map(row => ({
          id: row.id,
          order_id: row.order_id,
          created_at: row.created_at,
          updated_at: row.updated_at,
          reason: row.reason,
        })),
        paginate: { totalCount: 1, limit: 10 },
      });
    });
  });
});
