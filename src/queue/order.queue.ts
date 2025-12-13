import { Queue } from 'bullmq';
import { redisConnection } from './redis';

export const orderQueue = new Queue('order-execution', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
});
