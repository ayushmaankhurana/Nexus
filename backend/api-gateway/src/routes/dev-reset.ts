import { FastifyPluginAsync } from 'fastify';
import { seedDemoDatabase } from '../dev/demo-reset';
import { getPrismaClient } from '../lib/prisma';

const DEMO_SECRET = process.env.DEMO_SECRET || 'nexus-demo-2026';

const devReset: FastifyPluginAsync = async (fastify) => {
  fastify.post('/dev/demo/reset', async (request, reply) => {
    const providedSecret = request.headers['x-demo-secret'];
    if (providedSecret !== DEMO_SECRET) {
      return reply.code(403).send({
        error: {
          code: 'FORBIDDEN',
          message: 'Missing or invalid x-demo-secret header',
        },
      });
    }

    await seedDemoDatabase(getPrismaClient());

    return reply.code(200).send({
      success: true,
      message: 'Demo data reset successfully. Sessions have been cleared.',
      resetAt: new Date().toISOString(),
    });
  });
};

export default devReset;