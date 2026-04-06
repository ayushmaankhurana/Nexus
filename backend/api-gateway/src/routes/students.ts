import { FastifyPluginAsync } from 'fastify';
import { PrismaAuthStore } from '../stores/prisma-auth-store';

const store = new PrismaAuthStore();

const students: FastifyPluginAsync = async (fastify) => {

  // GET /students/me
  // Returns full profile of the currently authenticated user
  fastify.get(
    '/students/me',
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      const user = request.user;

      const profile = await store.getProfileById(user.sub);

      if (!profile) {
        return reply.code(404).send({
          error: {
            code: 'NOT_FOUND',
            message: 'Profile not found for this account',
          },
        });
      }

      return reply.code(200).send(profile);
    }
  );

  // GET /students/:studentId/profile
  // Returns profile of a specific student.
  // Rules:
  //   - A student can only fetch their own profile.
  //   - ADMIN and SECURITY roles can fetch any student's profile.
  fastify.get<{ Params: { studentId: string } }>(
    '/students/:studentId/profile',
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      const { studentId } = request.params;
      const user = request.user;

      // Role check — DB stores role as uppercase (ADMIN, SECURITY, STUDENT)
      // JWT payload mirrors DB role exactly, so compare uppercase
      const callerRole = user.role.toUpperCase();
      const isSelf = user.sub === studentId;
      const isPrivileged = callerRole === 'ADMIN' || callerRole === 'SECURITY';

      if (!isSelf && !isPrivileged) {
        return reply.code(403).send({
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to access this profile',
          },
        });
      }

      const profile = await store.getProfileById(studentId);

      if (!profile) {
        return reply.code(404).send({
          error: {
            code: 'NOT_FOUND',
            message: 'No student found with this ID',
          },
        });
      }

      return reply.code(200).send(profile);
    }
  );
};

export default students;