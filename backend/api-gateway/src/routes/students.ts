import { FastifyPluginAsync, FastifyRequest } from 'fastify';

const students: FastifyPluginAsync = async (fastify) => {
  fastify.get<{ Params: { studentId: string } }>(
    '/students/me',
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      const user = request.user;

      return {
        id: user.sub,
        deviceId: user.deviceId,
        role: user.role,
      };
    }
  );

  fastify.get<{ Params: { studentId: string } }>(
    '/students/:studentId/profile',
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
        id: studentId,
        rollNumber: studentId,
        name: 'Student Name',
        email: 'student@campus.edu',
        program: 'BTech',
        batch: '2026',
      };
    }
  );
};

export default students;