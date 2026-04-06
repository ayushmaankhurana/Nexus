import { AccessAction } from '@prisma/client';
import { AppError } from '@nexus/core';
import { FastifyPluginAsync, FastifyReply } from 'fastify';
import { z } from 'zod';
import { AccessService } from '../services/access-service';

const accessEventsQuerySchema = z.object({
  accountId: z.string().uuid().optional(),
  geofenceId: z.string().uuid().optional(),
  action: z.nativeEnum(AccessAction).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});

const accessCheckRequestSchema = z.object({
  accountId: z.string().uuid(),
  geofenceId: z.string().uuid(),
  // The caller declares the attempted direction; the service decides whether it becomes DENIED.
  action: z.union([z.literal(AccessAction.ENTRY), z.literal(AccessAction.EXIT)]),
  credentialType: z.enum(['RFID', 'MANUAL', 'QR']).optional(),
  credentialValue: z.string().min(1).optional(),
});

const studentParamsSchema = z.object({
  studentId: z.string().uuid(),
});

function hasAnyRole(role: string, allowed: string[]): boolean {
  return allowed.includes(role.toUpperCase());
}

function sendValidationError(reply: FastifyReply, error: z.ZodError): FastifyReply {
  return reply.code(400).send({
    error: {
      code: 'VALIDATION_ERROR',
      message: error.issues.map((issue) => issue.message).join(', '),
    },
  });
}

const access: FastifyPluginAsync = async (fastify) => {
  const accessService = new AccessService();

  fastify.post(
    '/access/check',
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      // The route owns authz and payload validation; the service owns the access decision rules.
      if (!hasAnyRole(request.user.role, ['ADMIN', 'SECURITY'])) {
        throw new AppError('FORBIDDEN', 403, 'Admin or security access required');
      }

      const parsedBody = accessCheckRequestSchema.safeParse(request.body);
      if (!parsedBody.success) {
        return sendValidationError(reply, parsedBody.error);
      }

      const result = await accessService.checkAccess({
        ...parsedBody.data,
        credentialType: parsedBody.data.credentialType,
      });

      return {
        decision: result.decision,
        event: result.event,
        shouldEscalate: result.shouldEscalate,
        deniedCountWindow: result.deniedCountWindow,
      };
    }
  );

  fastify.get(
    '/access/me/events',
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      // This endpoint always scopes to the authenticated account even if a caller tries to pass accountId.
      const parsedQuery = accessEventsQuerySchema.omit({ accountId: true }).safeParse(request.query);
      if (!parsedQuery.success) {
        return sendValidationError(reply, parsedQuery.error);
      }

      const result = await accessService.listOwnEvents(request.user.sub, {
        ...parsedQuery.data,
        from: parsedQuery.data.from ? new Date(parsedQuery.data.from) : undefined,
        to: parsedQuery.data.to ? new Date(parsedQuery.data.to) : undefined,
      });

      return result;
    }
  );

  fastify.get(
    '/access/events',
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      // Admin and security users can search across all access events with optional filters.
      if (!hasAnyRole(request.user.role, ['ADMIN', 'SECURITY'])) {
        throw new AppError('FORBIDDEN', 403, 'Admin or security access required');
      }

      const parsedQuery = accessEventsQuerySchema.safeParse(request.query);
      if (!parsedQuery.success) {
        return sendValidationError(reply, parsedQuery.error);
      }

      const result = await accessService.listEvents({
        ...parsedQuery.data,
        from: parsedQuery.data.from ? new Date(parsedQuery.data.from) : undefined,
        to: parsedQuery.data.to ? new Date(parsedQuery.data.to) : undefined,
      });

      return result;
    }
  );

  fastify.get<{ Params: { studentId: string } }>(
    '/access/:studentId',
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      // This legacy route is kept for low-churn compatibility while the frontend transitions.
      const parsedParams = studentParamsSchema.safeParse(request.params);
      if (!parsedParams.success) {
        return sendValidationError(reply, parsedParams.error);
      }

      const parsedQuery = accessEventsQuerySchema.omit({ accountId: true }).safeParse(request.query);
      if (!parsedQuery.success) {
        return sendValidationError(reply, parsedQuery.error);
      }

      const { studentId } = parsedParams.data;
      const user = request.user;
      const canViewOtherStudent = hasAnyRole(user.role, ['ADMIN', 'SECURITY']);

      if (user.sub !== studentId && !canViewOtherStudent) {
        throw new AppError('FORBIDDEN', 403, 'You do not have permission to access this resource');
      }

      const result = await accessService.listOwnEvents(studentId, {
        ...parsedQuery.data,
        from: parsedQuery.data.from ? new Date(parsedQuery.data.from) : undefined,
        to: parsedQuery.data.to ? new Date(parsedQuery.data.to) : undefined,
      });

      return {
        studentId,
        accessHistory: result.data,
        total: result.total,
      };
    }
  );
};

export default access;