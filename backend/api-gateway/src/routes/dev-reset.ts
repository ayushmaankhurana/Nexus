import { FastifyPluginAsync } from 'fastify';
import { seedDemoDatabase } from '../dev/demo-reset';
import { getPrismaClient } from '../lib/prisma';

const devReset: FastifyPluginAsync = async (fastify) => {
  fastify.post('/dev/demo/reset', async (_request, reply) => {
    await seedDemoDatabase(getPrismaClient());

    return reply.code(200).send({
      success: true,
      message: 'Demo data reset successfully. Sessions have been cleared.',
      resetAt: new Date().toISOString(),
    });
  });
};

export default devReset;