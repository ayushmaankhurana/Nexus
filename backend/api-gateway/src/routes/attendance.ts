/**
 * attendance.ts  –  Fastify route plugin (Person 3)
 *
 * Endpoints:
 *   POST  /attendance/mark                    Student marks via QR
 *   POST  /attendance/faculty/mark            Faculty manual mark
 *   GET   /attendance/me                      Student's own history
 *   GET   /attendance/sessions/:id/summary    Faculty session summary
 *   GET   /attendance/records                 Admin full list (paginated, filtered)
 */

import { FastifyPluginAsync, FastifyReply } from 'fastify';
import { z } from 'zod';
import { AppError } from '@nexus/core';
import { AttendanceStatus, AttendanceMethod } from '@prisma/client';
import { AttendanceService } from '../services/attendance-service';

// ── Zod schemas ────────────────────────────────────────────────────────────────

const markAttendanceBody = z.object({
  classSessionTemplateId: z.string().uuid(),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'scheduledDate must be YYYY-MM-DD'),
  qrToken: z.string().min(1),
  /** Epoch ms when the QR was issued (sent by the app after scanning) */
  qrIssuedAt: z.number().int().positive(),
  geofenceValidated: z.boolean(),
});

const facultyMarkBody = z.object({
  studentAccountId: z.string().uuid(),
  classSessionTemplateId: z.string().uuid(),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'scheduledDate must be YYYY-MM-DD'),
  status: z.nativeEnum(AttendanceStatus),
});

const listQuery = z.object({
  accountId: z.string().uuid().optional(),
  classSessionTemplateId: z.string().uuid().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  status: z.nativeEnum(AttendanceStatus).optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});

const sessionSummaryParams = z.object({
  id: z.string().uuid(),
});

const sessionSummaryQuery = z.object({
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

// ── Helpers ────────────────────────────────────────────────────────────────────

function hasAnyRole(role: string, allowed: string[]): boolean {
  return allowed.includes(role.toUpperCase());
}

function validationError(reply: FastifyReply, error: z.ZodError) {
  return reply.code(400).send({
    error: {
      code: 'VALIDATION_ERROR',
      message: error.issues.map((i) => i.message).join(', '),
    },
  });
}

// ── Plugin ─────────────────────────────────────────────────────────────────────

const attendance: FastifyPluginAsync = async (fastify) => {
  const svc = new AttendanceService();

  // ── POST /attendance/mark ─────────────────────────────────────────────────────
  fastify.post(
    '/attendance/mark',
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      if (!hasAnyRole(request.user.role, ['STUDENT'])) {
        throw new AppError('FORBIDDEN', 403, 'Only students can mark their own attendance.');
      }

      const parsed = markAttendanceBody.safeParse(request.body);
      if (!parsed.success) return validationError(reply, parsed.error);

      const record = await svc.markAttendance({
        studentAccountId: request.user.sub,
        ...parsed.data,
      });

      return reply.code(201).send({ attendance: record });
    },
  );

  // ── POST /attendance/faculty/mark ─────────────────────────────────────────────
  fastify.post(
    '/attendance/faculty/mark',
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      if (!hasAnyRole(request.user.role, ['FACULTY', 'ADMIN'])) {
        throw new AppError('FORBIDDEN', 403, 'Only faculty or admin can manually mark attendance.');
      }

      const parsed = facultyMarkBody.safeParse(request.body);
      if (!parsed.success) return validationError(reply, parsed.error);

      const record = await svc.facultyMarkAttendance({
        facultyAccountId: request.user.sub,
        ...parsed.data,
      });

      return reply.code(201).send({ attendance: record });
    },
  );

  // ── GET /attendance/me ────────────────────────────────────────────────────────
  fastify.get(
    '/attendance/me',
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      const parsed = listQuery.omit({ accountId: true }).safeParse(request.query);
      if (!parsed.success) return validationError(reply, parsed.error);

      const result = await svc.listOwnAttendance(request.user.sub, {
        ...parsed.data,
        from: parsed.data.from ? new Date(parsed.data.from) : undefined,
        to: parsed.data.to ? new Date(parsed.data.to) : undefined,
      });

      return result;
    },
  );

  // ── GET /attendance/sessions/:id/summary ──────────────────────────────────────
  fastify.get<{ Params: { id: string } }>(
    '/attendance/sessions/:id/summary',
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      if (!hasAnyRole(request.user.role, ['FACULTY', 'ADMIN'])) {
        throw new AppError('FORBIDDEN', 403, 'Only faculty or admin can view session summaries.');
      }

      const parsedParams = sessionSummaryParams.safeParse(request.params);
      if (!parsedParams.success) return validationError(reply, parsedParams.error);

      const parsedQuery = sessionSummaryQuery.safeParse(request.query);
      if (!parsedQuery.success) return validationError(reply, parsedQuery.error);

      const summary = await svc.getSessionSummary(
        parsedParams.data.id,
        parsedQuery.data.scheduledDate,
        request.user.sub,
      );

      return summary;
    },
  );

  // ── GET /attendance/records ───────────────────────────────────────────────────
  fastify.get(
    '/attendance/records',
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      if (!hasAnyRole(request.user.role, ['ADMIN', 'FACULTY'])) {
        throw new AppError('FORBIDDEN', 403, 'Admin or faculty access required.');
      }

      const parsed = listQuery.safeParse(request.query);
      if (!parsed.success) return validationError(reply, parsed.error);

      // Faculty: auto-scope to their assigned sections
      const facultyAccountId =
        request.user.role.toUpperCase() === 'FACULTY' ? request.user.sub : undefined;

      const result = await svc.listAttendance({
        ...parsed.data,
        from: parsed.data.from ? new Date(parsed.data.from) : undefined,
        to: parsed.data.to ? new Date(parsed.data.to) : undefined,
        facultyAccountId,
      });

      return result;
    },
  );
};

export default attendance;