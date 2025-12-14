import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import 'dotenv/config';
import './workers/orders.worker';
import { app } from './app';
import { initDatabase } from './db/postgres';

const server = Fastify({ logger: true });

server.register(websocket);
server.register(app);

const start = async () => {
  try {
    await initDatabase();
    await server.listen({ port: 3000 });
    console.log('Server running on http://localhost:3000');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
