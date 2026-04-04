// /// <reference path="../types/fastify.d.ts" />
// import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
// import { ZodError } from 'zod';
// import { AuthService } from '../services/auth-service';
// // import { MockAuthStore } from '../stores/mock-auth-store';
// import {
//   ActivateRequestSchema,
//   LoginRequestSchema,
//   LogoutRequestSchema,
//   DeviceSwitchRequestSchema,
// } from '../schemas/auth';
// import { AppError } from '@nexus/core';
// import { PrismaAuthStore } from '../stores/prisma-auth-store';

// const authPlugin: FastifyPluginAsync = async (fastify) => {
//   const store = new PrismaAuthStore();
  
//   // Pass a wrapper function that uses fastify.jwt.sign
//   const authService = new AuthService(store as any, (payload, expiresIn) => {
//     return fastify.jwt.sign(payload, { expiresIn });
//   });

//   fastify.decorate('authService', authService);

//   // Register auth endpoints directly in the plugin
//   fastify.post('/auth/activate', async (request: FastifyRequest, reply: FastifyReply) => {
//     try {
//       const body = ActivateRequestSchema.parse(request.body);
//       const account = fastify.authService.activate(
//         body.activationToken,
//         body.password
//       );

//       return reply.code(200).send({
//         message: 'Account activated successfully',
//         account: {
//           studentId: account.studentId,
//           email: account.email,
//           status: account.status,
//         },
//       });
//     } catch (error) {
//       return handleError(reply, error);
//     }
//   });

//   fastify.post('/auth/login', async (request: FastifyRequest, reply: FastifyReply) => {
//     try {
//       const body = LoginRequestSchema.parse(request.body);
//       const authResponse = fastify.authService.login(
//         body.identifier,
//         body.password,
//         body.deviceId
//       );

//       return reply.code(200).send(authResponse);
//     } catch (error) {
//       return handleError(reply, error);
//     }
//   });

//   fastify.post('/auth/logout', async (request: FastifyRequest, reply: FastifyReply) => {
//     try {
//       const body = LogoutRequestSchema.parse(request.body);
//       fastify.authService.logout(body.studentId, body.deviceId);

//       return reply.code(200).send({
//         message: 'Logged out successfully',
//       });
//     } catch (error) {
//       return handleError(reply, error);
//     }
//   });

//   fastify.post(
//     '/auth/device/switch',
//     async (request: FastifyRequest, reply: FastifyReply) => {
//       try {
//         const body = DeviceSwitchRequestSchema.parse(request.body);
//         const authResponse = fastify.authService.deviceSwitch(
//           body.studentId,
//           body.oldDeviceId,
//           body.newDeviceId
//         );

//         return reply.code(200).send(authResponse);
//       } catch (error) {
//         return handleError(reply, error);
//       }
//     }
//   );
// };

// function handleError(reply: FastifyReply, error: unknown): FastifyReply {
//   // Handle Zod validation errors
//   if (error instanceof ZodError) {
//     return reply.code(400).send({
//       error: {
//         code: 'VALIDATION_ERROR',
//         message: error.issues.map((i) => i.message).join(', '),
//       },
//     });
//   }

//   // Handle app errors
//   if (error instanceof AppError) {
//     return reply.code(error.statusCode).send({
//       error: {
//         code: error.code,
//         message: error.message,
//       },
//     });
//   }

//   // Handle Error instances with code field (fallback for AppError)
//   if (error instanceof Error && 'code' in error && 'statusCode' in error) {
//     const appErr = error as any;
//     return reply.code(appErr.statusCode || 500).send({
//       error: {
//         code: appErr.code || 'INTERNAL_SERVER_ERROR',
//         message: appErr.message || 'An unexpected error occurred',
//       },
//     });
//   }

//   // Handle unexpected errors
//   return reply.code(500).send({
//     error: {
//       code: 'INTERNAL_SERVER_ERROR',
//       message: 'An unexpected error occurred',
//     },
//   });
// }

// export default authPlugin;

/// <reference path="../types/fastify.d.ts" />
import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { AuthService } from '../services/auth-service';
import {
  ActivateRequestSchema,
  LoginRequestSchema,
  LogoutRequestSchema,
  DeviceSwitchRequestSchema,
  RefreshRequestSchema, // <-- Added
  AuthResponseSchema,   // <-- Added
  type RefreshRequest   // <-- Added
} from '../schemas/auth';
import { AppError } from '@nexus/core';
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
      const body = LogoutRequestSchema.parse(request.body);
      await fastify.authService.logout(body.studentId, body.deviceId);

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
        const authResponse = await fastify.authService.deviceSwitch(
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

  // // --- NEW REFRESH ROUTE ---
  // fastify.post('/auth/refresh', {
  //   schema: {
  //     body: RefreshRequestSchema,
  //     response: {
  //       200: AuthResponseSchema,
  //     },
  //   },
  // }, async (request: FastifyRequest, reply: FastifyReply) => {
  //   try {
  //     const { refreshToken, deviceId } = request.body as RefreshRequest;
  //     const authResponse = await fastify.authService.refresh(refreshToken, deviceId);
      
  //     return reply.code(200).send(authResponse);
  //   } catch (error) {
  //      return handleError(reply, error);
  //   }
  // });
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