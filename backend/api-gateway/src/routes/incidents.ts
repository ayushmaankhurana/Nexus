import { FastifyPluginAsync } from 'fastify';

const incidents: FastifyPluginAsync = async (fastify) => {
  // Placeholder routes
  fastify.get('/incidents', async (request, reply) => {
    return { message: 'Incidents list placeholder' };
  });

  fastify.post('/incidents', async (request, reply) => {
    return { message: 'Create incident placeholder' };
  });
};

export default incidents;