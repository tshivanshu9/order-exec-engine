import IORedis from 'ioredis';

export const redisConnection = new IORedis(
  process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  {
    maxRetriesPerRequest: null,
  }
);

redisConnection.on('connect', () => {
  console.log('[Redis] Connected successfully');
});

redisConnection.on('error', (err) => {
  console.error('[Redis] Connection error:', err);
});