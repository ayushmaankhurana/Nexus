import { FastifyPluginAsync } from 'fastify';

const access: FastifyPluginAsync = async (fastify) => {
  // Placeholder routes
  fastify.post('/access/check', async (request, reply) => {
    return { message: 'Access check placeholder' };
  });

  fastify.get('/access/:studentId', async (request, reply) => {
    return { message: 'Access history placeholder' };
  });
};

export default access;