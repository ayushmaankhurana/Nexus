import { FastifyPluginAsync } from 'fastify';
import { getPrismaClient } from '../lib/prisma';
import { IncidentService } from '../services/incident-service';

const prisma = getPrismaClient();
const incidentService = new IncidentService();

const attendance: FastifyPluginAsync = async (fastify) => {
  fastify.get<{ Params: { studentId: string } }>(
    '/students/:studentId/attendance',
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

      const attendance = await prisma.attendanceRecord.findMany({
        where: { accountId: studentId },
        orderBy: { timestamp: 'desc' },
      });

      return {
        studentId,
        attendance,
      };
    }
  );

  fastify.post<{ Params: { studentId: string } }>(
    '/students/:studentId/attendance',
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

      const body = request.body as {
        classId: string;
        status: 'PRESENT' | 'LATE' | 'ABSENT' | 'FAILED' | 'present' | 'late' | 'absent' | 'failed';
        reason?: string;
      };

      const normalizedStatus = String(body.status).toUpperCase();

      const record = await prisma.attendanceRecord.create({
        data: {
          accountId: studentId,
          classId: body.classId,
          status: normalizedStatus as any,
        },
      });

      let incident = null;

      if (normalizedStatus === 'FAILED') {
        incident = await incidentService.createAttendanceFailureIncident({
          accountId: studentId,
          classId: body.classId,
          reason: body.reason || 'Attendance capture failed',
        });
      }

      return reply.code(201).send({
        message: 'Attendance marked successfully',
        attendance: record,
        incident,
      });
    }
  );
};

export default attendance;