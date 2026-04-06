import { FastifyPluginAsync } from 'fastify';
import { getPrismaClient } from '../lib/prisma';
import { IncidentService } from '../services/incident-service';

const prisma = getPrismaClient();
const incidentService = new IncidentService();

const access: FastifyPluginAsync = async (fastify) => {
  fastify.post(
    '/access/check',
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      const user = request.user as any;
      const body = request.body as {
        geofenceId: string;
        allowed?: boolean;
        reason?: string;
      };

      const allowed = body.allowed ?? true;

      const event = await prisma.accessEvent.create({
        data: {
          accountId: user.sub,
          geofenceId: body.geofenceId,
          action: allowed ? 'ENTRY' : 'DENIED',
          reason: allowed ? null : (body.reason || 'Access denied'),
        },
      });

      let incident = null;

      if (!allowed) {
        incident = await incidentService.createAccessDenialIncident({
          accountId: user.sub,
          geofenceId: body.geofenceId,
          reason: body.reason || 'Access denied',
        });
      }

      return reply.code(200).send({
        studentId: user.sub,
        allowed,
        message: allowed ? 'Access granted' : 'Access denied',
        accessEvent: event,
        incident,
      });
    }
  );

  fastify.get<{ Params: { studentId: string } }>(
    '/access/:studentId',
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      const { studentId } = request.params;
      const user = request.user as any;
      const callerRole = String(user.role).toUpperCase();

      if (user.sub !== studentId && callerRole !== 'ADMIN' && callerRole !== 'SECURITY') {
        return reply.code(403).send({
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to access this resource',
          },
        });
      }

      const accessHistory = await prisma.accessEvent.findMany({
        where: { accountId: studentId },
        orderBy: { timestamp: 'desc' },
      });

      return {
        studentId,
        accessHistory,
      };
    }
  );
};

export default access;