export {};

process.env.NODE_ENV = 'test';
process.env.PG_HOST = 'localhost';
process.env.PG_USER = 'test';
process.env.PG_PASSWORD = 'test';
process.env.PG_DATABASE = 'test';

jest.mock('../redis/redis', () => ({
  redisConnection: {
    sadd: jest.fn(),
    srem: jest.fn(),
    scard: jest.fn(),
    del: jest.fn(),
    publish: jest.fn(),
    duplicate: jest.fn(() => ({
      psubscribe: jest.fn(),
      on: jest.fn(),
    })),
  },
}));

jest.mock('../queue/order.queue', () => ({
  orderQueue: {
    add: jest.fn(),
  },
}));

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidOrder(): R;
    }
  }
}
