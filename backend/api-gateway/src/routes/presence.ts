import { FastifyPluginAsync } from 'fastify';

const presence: FastifyPluginAsync = async (fastify) => {
  // Placeholder routes
  fastify.get('/presence/:studentId', async (request, reply) => {
    return { message: 'Presence data placeholder' };
  });

  fastify.get('/presence/:studentId/trail', async (request, reply) => {
    return { message: 'Movement trail placeholder' };
  });
};

export default presence;