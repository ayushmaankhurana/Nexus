/// <reference path="../types/fastify.d.ts" />
import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import { AppError } from '@nexus/core';
import { getPrismaClient } from '../lib/prisma';

const dashboardRoute: FastifyPluginAsync = async (fastify) => {
  const prisma = getPrismaClient();

  fastify.get(
    '/dashboard/stats',
    { onRequest: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user as { sub: string; role?: string };
      const role = user.role?.toUpperCase();

      if (role !== 'ADMIN' && role !== 'SECURITY') {
        throw new AppError('FORBIDDEN', 403, 'Admin or security access required');
      }

      const now = new Date();
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);

      const [
        totalStudents,
        presentToday,
        accessEventsToday,
        activeIncidents,
      ] = await Promise.all([
        // Active students only
        prisma.account.count({
          where: { role: 'STUDENT', status: 'ACTIVE' },
        }),
        // Attendance records today with PRESENT or LATE status
        prisma.attendanceRecord.count({
          where: {
            scheduledDate: { gte: startOfDay, lte: now },
            status: { in: ['PRESENT', 'LATE'] },
          },
        }),
        // Access events today
        prisma.accessEvent.count({
          where: {
            timestamp: { gte: startOfDay, lte: now },
          },
        }),
        // Open incidents (status OPEN — incidents model uses string status)
        prisma.incident.count({
          where: { status: 'OPEN' },
        }),
      ]);

      return reply.code(200).send({
        totalStudents,
        presentToday,
        accessEventsToday,
        activeIncidents,
      });
    },
  );
};

export default dashboardRoute;
