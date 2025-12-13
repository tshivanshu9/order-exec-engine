import { FastifyInstance } from 'fastify';

export default async function wsTestRoutes(fastify: FastifyInstance) {
  fastify.get('/ws', { websocket: true }, socket => {
    socket.send(JSON.stringify({ msg: 'connected' }));

    socket.on('message', (message: Buffer) => {
      socket.send(JSON.stringify({ echo: message.toString() }));
    });
  });
}
