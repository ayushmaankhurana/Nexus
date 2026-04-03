import { FastifyPluginAsync } from 'fastify';

const access: FastifyPluginAsync = async (fastify) => {
  fastify.post(
    '/access/check',
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      const user = request.user;

      return {
        studentId: user.sub,
        allowed: true,
        message: 'Access check placeholder',
      };
    }
  );

  fastify.get<{ Params: { studentId: string } }>(
    '/access/:studentId',
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      const { studentId } = request.params;
      const user = request.user;

      if (user.sub !== studentId && user.role !== 'admin') {
        return reply.code(403).send({
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to access this resource',
          },
        });
      }

      return {
        studentId,
        accessHistory: [],
      };
    }
  );
};

export default access;