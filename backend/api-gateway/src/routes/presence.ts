import { FastifyPluginAsync } from 'fastify';

const presence: FastifyPluginAsync = async (fastify) => {
  fastify.get<{ Params: { studentId: string } }>(
    '/presence/:studentId',
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
        isPresent: false,
        lastSeen: null,
      };
    }
  );

  fastify.get<{ Params: { studentId: string } }>(
    '/presence/:studentId/trail',
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
        trail: [],
      };
    }
  );
};

export default presence;