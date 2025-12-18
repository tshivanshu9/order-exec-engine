import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import 'dotenv/config';
import { app } from './app';
import { initDatabase } from './db/postgres';
import { runMigrations } from './db/migrate';

const server = Fastify({ logger: true });

server.get('/', async () => {
  return { status: 'ok' };
});


server.register(websocket);
server.register(app);

const start = async () => {
  try {
    await initDatabase();
    await runMigrations();

    const port = Number(process.env.PORT) || 3000;

    await server.listen({
      port,
      host: '0.0.0.0',
    });

    console.log(`Server running on port ${port}`);

    await import('./workers/orders.worker');
    console.log('[Worker] Orders worker started');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
