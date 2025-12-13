import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import { app } from './app';

const server = Fastify({ logger: true });

server.register(websocket);
server.register(app);

const start = async () => {
  try {
    await server.listen({ port: 3000 });
    console.log('Server running on http://localhost:3000');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};
import './workers/orders.worker';

start();
