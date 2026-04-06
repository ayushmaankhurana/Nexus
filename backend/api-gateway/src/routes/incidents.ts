import { FastifyPluginAsync } from 'fastify';

const incidents: FastifyPluginAsync = async (fastify) => {
  const isAdmin = (role?: string) => role?.toUpperCase() === 'ADMIN';

  fastify.get(
    '/incidents',
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      const user = request.user;

      let incidents: any[] = [];
      if (isAdmin(user.role)) {
        // Return all incidents
        incidents = [];
      } else {
        // Return incidents for the authenticated user
        incidents = [];
      }

      return { incidents };
    }
  );

  fastify.post(
    '/incidents',
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      const user = request.user;

      return {
        id: 'incident-123',
        studentId: user.sub,
        message: 'Incident created successfully',
      };
    }
  );
};

export default incidents;