/// <reference path="../types/fastify.d.ts" />
import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import crypto from 'crypto';
import { AppError } from '@nexus/core';
import {
  CreateStudentRequestSchema,
} from '../schemas/auth';
import { PrismaAuthStore } from '../stores/prisma-auth-store';
import { z } from 'zod';

const listStudentsQuerySchema = z.object({
  q: z.string().trim().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});

const adminStudentsRoute: FastifyPluginAsync = async (fastify) => {
  const store = new PrismaAuthStore();

  fastify.get('/admin/students', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();

      const user = request.user as { sub: string; role?: string };

      if (!user?.role || user.role.toUpperCase() !== 'ADMIN') {
        throw new AppError('FORBIDDEN', 403, 'Admin access required');
      }

      const query = listStudentsQuerySchema.parse(request.query);
      const result = await store.listStudents({
        query: query.q,
        page: query.page,
        pageSize: query.pageSize,
      });

      return reply.code(200).send({
        data: result.data.map((student) => ({
          id: student.id,
          name: `${student.firstName} ${student.lastName}`.trim() || student.rollNumber,
          email: student.email,
          role: student.role,
          status: student.status,
          studentId: student.rollNumber,
          department: undefined,
          createdAt: student.createdAt,
          lastLogin: undefined,
          rfidTag: student.rfidTag,
        })),
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages,
      });
    } catch (error) {
      return handleError(reply, error);
    }
  });

  fastify.post('/admin/students', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();

      const user = request.user as { sub: string; role?: string };

      if (!user?.role || user.role.toUpperCase() !== 'ADMIN') {
        throw new AppError('FORBIDDEN', 403, 'Admin access required');
      }

      const body = CreateStudentRequestSchema.parse(request.body);

      const existingByRoll = await store.getAccountByRollNumber(body.rollNumber);
      if (existingByRoll) {
        throw new AppError('ROLLNUMBER_EXISTS', 409, 'A student with this roll number already exists');
      }

      const existingByEmail = await store.getAccountByEmail(body.email);
      if (existingByEmail) {
        throw new AppError('EMAIL_EXISTS', 409, 'A student with this email already exists');
      }

      const activationToken = crypto.randomBytes(32).toString('hex');

      const created = await store.createStudentAccount({
        rollNumber: body.rollNumber,
        email: body.email,
        firstName: body.firstName,
        lastName: body.lastName,
        rfidTag: body.rfidTag,
        activationToken,
      });

      // DEV ONLY: log token to console so admin can send it to the student
      if (process.env.NODE_ENV !== 'production') {
        console.log(`\n ACTIVATION TOKEN for ${created.email}: ${created.activationToken}\n`);
      }

      return reply.code(201).send({
        id: created.studentId,
        rollNumber: created.rollNumber,
        email: created.email,
        role: created.role,
        status: created.status,
        profile: created.profile,
      });
    } catch (error) {
      return handleError(reply, error);
    }
  });

  fastify.patch('/admin/students/:id/suspend', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();

      const user = request.user as { sub: string; role?: string };

      if (!user?.role || user.role.toUpperCase() !== 'ADMIN') {
        throw new AppError('FORBIDDEN', 403, 'Admin access required');
      }

      const { id } = request.params as { id: string };

      await store.suspendAccount(id);

      return reply.code(200).send({
        id,
        status: 'suspended',
        message: 'Account suspended',
      });
    } catch (error) {
      return handleError(reply, error);
    }
  });

  fastify.patch('/admin/students/:id/reactivate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();

      const user = request.user as { sub: string; role?: string };

      if (!user?.role || user.role.toUpperCase() !== 'ADMIN') {
        throw new AppError('FORBIDDEN', 403, 'Admin access required');
      }

      const { id } = request.params as { id: string };

      await store.reactivateAccount(id);

      return reply.code(200).send({
        id,
        status: 'active',
        message: 'Account reactivated',
      });
    } catch (error) {
      return handleError(reply, error);
    }
  });
};

function handleError(reply: FastifyReply, error: unknown): FastifyReply {
  if (error instanceof ZodError) {
    return reply.code(400).send({
      error: {
        code: 'VALIDATION_ERROR',
        message: error.issues.map((i) => i.message).join(', '),
      },
    });
  }

  if (error instanceof AppError) {
    return reply.code(error.statusCode).send({
      error: {
        code: error.code,
        message: error.message,
      },
    });
  }

  if (error instanceof Error) {
    const err = error as any;
    return reply.code(err.statusCode || 500).send({
      error: {
        code: err.code || 'INTERNAL_SERVER_ERROR',
        message: err.message || 'An unexpected error occurred',
      },
    });
  }

  return reply.code(500).send({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    },
  });
}

export default adminStudentsRoute;