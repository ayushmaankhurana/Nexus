/// <reference path="../types/fastify.d.ts" />
import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import {
  ActivateRequestSchema,
  LoginRequestSchema,
  LogoutRequestSchema,
  DeviceSwitchRequestSchema,
} from '../schemas/auth';
import { AppError } from '@nexus/core';

const auth: FastifyPluginAsync = async (fastify) => {
  console.log('AuthRoute: Plugin registered. fastify.authService:', typeof fastify.authService);
  fastify.post('/auth/activate', async (request: FastifyRequest, reply: FastifyReply) => {
    console.log('AuthRoute: Activate handler called. fastify:', typeof fastify);
    console.log('AuthRoute: fastify.authService:', typeof fastify.authService);
    try {
      const body = ActivateRequestSchema.parse(request.body);
      const account = fastify.authService.activate(
        body.activationToken,
        body.password
      );

      return reply.code(200).send({
        message: 'Account activated successfully',
        account: {
          studentId: account.studentId,
          email: account.email,
          status: account.status,
        },
      });
    } catch (error) {
      return handleError(reply, error);
    }
  });

  fastify.post('/auth/login', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = LoginRequestSchema.parse(request.body);
      const authResponse = fastify.authService.login(
        body.identifier,
        body.password,
        body.deviceId
      );

      return reply.code(200).send(authResponse);
    } catch (error) {
      return handleError(reply, error);
    }
  });

  fastify.post('/auth/logout', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = LogoutRequestSchema.parse(request.body);
      fastify.authService.logout(body.studentId, body.deviceId);

      return reply.code(200).send({
        message: 'Logged out successfully',
      });
    } catch (error) {
      return handleError(reply, error);
    }
  });

  fastify.post(
    '/auth/device/switch',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = DeviceSwitchRequestSchema.parse(request.body);
        const authResponse = fastify.authService.deviceSwitch(
          body.studentId,
          body.oldDeviceId,
          body.newDeviceId
        );

        return reply.code(200).send(authResponse);
      } catch (error) {
        return handleError(reply, error);
      }
    }
  );
};

function handleError(reply: FastifyReply, error: unknown): FastifyReply {
  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return reply.code(400).send({
      error: {
        code: 'VALIDATION_ERROR',
        message: error.issues.map((i) => i.message).join(', '),
      },
    });
  }

  // Handle app errors
  if (error instanceof AppError) {
    return reply.code(error.statusCode).send({
      error: {
        code: error.code,
        message: error.message,
      },
    });
  }

  // Handle Error instances with code field (fallback for AppError)
  if (error instanceof Error && 'code' in error && 'statusCode' in error) {
    const appErr = error as any;
    return reply.code(appErr.statusCode || 500).send({
      error: {
        code: appErr.code || 'INTERNAL_SERVER_ERROR',
        message: appErr.message || 'An unexpected error occurred',
      },
    });
  }

  // Handle unexpected errors
  console.error('Unhandled error:', error);
  return reply.code(500).send({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    },
  });
}

export default auth;
