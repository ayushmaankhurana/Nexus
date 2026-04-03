import { FastifyPluginAsync } from 'fastify';

const attendance: FastifyPluginAsync = async (fastify) => {
  // Placeholder routes
  fastify.get('/students/:studentId/attendance', async (request, reply) => {
    return { message: 'Attendance history placeholder' };
  });

  fastify.post('/students/:studentId/attendance', async (request, reply) => {
    return { message: 'Mark attendance placeholder' };
  });
};

export default attendance;