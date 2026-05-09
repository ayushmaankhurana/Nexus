/// <reference path="../types/fastify.d.ts" />
import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { AuthService } from '../services/auth-service';
import {
  ActivateRequestSchema,
  LoginRequestSchema,
  LogoutRequestSchema,
  DeviceSwitchRequestSchema,
  RefreshRequestSchema,
  ForgotPasswordRequestSchema,
  ResetPasswordRequestSchema,
} from '../schemas/auth';
import { AppError } from '@nexus/core';
import crypto from 'crypto';
import { PrismaAuthStore } from '../stores/prisma-auth-store';

const authPlugin: FastifyPluginAsync = async (fastify) => {
  const store = new PrismaAuthStore();
  
  // Pass a wrapper function that uses fastify.jwt.sign
  const authService = new AuthService(store, (payload, expiresIn) => {
    return fastify.jwt.sign(payload, { expiresIn });
  });

  fastify.decorate('authService', authService);

  // Register auth endpoints directly in the plugin
  fastify.post('/auth/activate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = ActivateRequestSchema.parse(request.body);
      const account = await fastify.authService.activate(
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
      const authResponse = await fastify.authService.login(
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
      await request.jwtVerify();
      const user = request.user as { sub: string; role?: string };
      const body = LogoutRequestSchema.parse(request.body);
      // Use token sub as authoritative studentId; body.deviceId still required to identify session
      await fastify.authService.logout(user.sub, body.deviceId);

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
        await request.jwtVerify();
        const user = request.user as { sub: string; role?: string };
        const body = DeviceSwitchRequestSchema.parse(request.body);
        const authResponse = await fastify.authService.deviceSwitch(
          user.sub,
          body.oldDeviceId,
          body.newDeviceId
        );

        return reply.code(200).send(authResponse);
      } catch (error) {
        return handleError(reply, error);
      }
    }
  );
  // POST /auth/password/forgot
  fastify.post('/auth/password/forgot', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = ForgotPasswordRequestSchema.parse(request.body);
      const account = await store.getAccountByEmailOrRollNumber(body.identifier);

      if (!account) {
        return reply.code(200).send({
          message: 'If an account exists for this identifier, a reset token has been generated.',
        });
      }

      if (account.status !== 'active') {
        return reply.code(200).send({
          message: 'If an account exists for this identifier, a reset token has been generated.',
        });
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await store.setResetToken(account.studentId, resetToken, expiresAt);

      console.log(`\n PASSWORD RESET TOKEN for ${account.email}:`);
      console.log(` Token: ${resetToken}`);
      console.log(` Expires: ${expiresAt.toISOString()}\n`);

      return reply.code(200).send({
        message: 'If an account exists for this identifier, a reset token has been generated.',
      });
    } catch (error) {
      return handleError(reply, error);
    }
  });

  // POST /auth/password/reset
  fastify.post('/auth/password/reset', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = ResetPasswordRequestSchema.parse(request.body);

      const account = await store.getAccountByResetToken(body.resetToken);
      if (!account) {
        throw new AppError(
          'INVALID_RESET_TOKEN',
          400,
          'Reset token is invalid or has expired'
        );
      }

      await store.resetPassword(body.resetToken, body.newPassword);

      // Invalidate ALL sessions for this account (not just one device)
      await store.invalidateAllSessions(account.studentId);

      return reply.code(200).send({
        message: 'Password has been reset successfully. Please log in again.',
      });
    } catch (error) {
      return handleError(reply, error);
    }
  });
  

  // --- NEW REFRESH ROUTE ---
  fastify.post('/auth/refresh', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // 1. Manually parse using Zod (just like your other routes!)
      const body = RefreshRequestSchema.parse(request.body);
      
      // 2. Call the service
      const authResponse = await fastify.authService.refresh(body.refreshToken, body.deviceId);
      
      return reply.code(200).send(authResponse);
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

  // Handle errors that might come from Prisma or the DB adapter
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

export default authPlugin;