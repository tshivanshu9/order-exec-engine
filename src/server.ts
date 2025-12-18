import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import 'dotenv/config';
import './workers/orders.worker';
import { app } from './app';
import { initDatabase } from './db/postgres';
import { runMigrations } from './db/migrate';

const server = Fastify({ logger: true });

server.register(websocket);
server.register(app);

const start = async () => {
  try {
    await initDatabase();
    await runMigrations();
    const port = Number(process.env.PORT) || 3000;
    const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';
    await server.listen({ port, host });
    console.log(`Server running on http://${host}:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
