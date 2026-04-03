import { FastifyPluginAsync } from 'fastify';

const attendance: FastifyPluginAsync = async (fastify) => {
  fastify.get<{ Params: { studentId: string } }>(
    '/students/:studentId/attendance',
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
        attendance: [],
      };
    }
  );

  fastify.post<{ Params: { studentId: string } }>(
    '/students/:studentId/attendance',
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

      return { message: 'Attendance marked successfully' };
    }
  );
};

export default attendance;