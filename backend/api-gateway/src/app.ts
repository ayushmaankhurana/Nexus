// import fastify from 'fastify';
// import cors from '@fastify/cors';
// import authPlugin from './plugins/auth';
// import health from './routes/health';
// import students from './routes/students';
// import attendance from './routes/attendance';
// import access from './routes/access';
// import presence from './routes/presence';
// import incidents from './routes/incidents';

// export async function createApp() {
//   const app = fastify({
//     logger: true,
//   });

//   // Register CORS plugin for local development
//   await app.register(cors, {
//     origin: ['http://localhost:8080', 'http://localhost:5173'],
//     methods: ['GET', 'POST', 'OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Authorization'],
//     credentials: true,
//   });

//   // Register auth plugin first (includes auth routes and decorations)
//   await app.register(authPlugin);

//   // Register other routes
//   await app.register(health);
//   await app.register(students);
//   await app.register(attendance);
//   await app.register(access);
//   await app.register(presence);
//   await app.register(incidents);

//   return app;
// }
// import fastify, { FastifyReply, FastifyRequest } from 'fastify';
// import cors from '@fastify/cors';
// import fastifyJwt from '@fastify/jwt'; // <-- Add this import
// import authPlugin from './plugins/auth';
// import health from './routes/health';
// import students from './routes/students';
// import attendance from './routes/attendance';
// import access from './routes/access';
// import presence from './routes/presence';
// import incidents from './routes/incidents';

// export async function createApp() {
//   const app = fastify({ logger: true });

//   await app.register(cors, {
//     origin: ['http://localhost:8080', 'http://localhost:5173'],
//     methods: ['GET', 'POST', 'OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Authorization'],
//     credentials: true,
//   });


//   // 2. Create the Route Protection Middleware Hook
//   app.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
//     try {
//       // Automatically looks for the 'Authorization: Bearer <token>' header,
//       // verifies the cryptographic signature, checks expiration, and populates request.user
//       await request.jwtVerify();
//     } catch (err) {
//       // Bounces the request with a 401 Unauthorized if anything fails
//       reply.send(err);
//     }
//   });

//   // 3. Register your plugins and routes
//   await app.register(authPlugin);
//   await app.register(health);
//   await app.register(students);
//   await app.register(attendance);
//   await app.register(access);
//   await app.register(presence);
//   await app.register(incidents);

//   return app;
// }

import fastify, { FastifyReply, FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import authPlugin from './plugins/auth';
import health from './routes/health';
import students from './routes/students';
import attendance from './routes/attendance';
import access from './routes/access';
import presence from './routes/presence';
import incidents from './routes/incidents';
import { config } from '@nexus/core';

export async function createApp() {
  const app = fastify({ logger: true });

  // 1. CORS Configuration
  await app.register(cors, {
    origin: ['http://localhost:8080', 'http://localhost:5173'],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // --- FIX 1: STRICT JWT SECRET HANDLING ---
  const jwtSecret = process.env.JWT_SECRET;

  if (process.env.NODE_ENV === 'production' && !jwtSecret) {
    throw new Error('CRITICAL: JWT_SECRET environment variable is missing. Server aborting startup.');
  }

  await app.register(fastifyJwt, {
    secret: config.jwtSecret, 
  });

  // --- FIX 2: GLOBAL ERROR HANDLER ---
  app.setErrorHandler((error, request, reply) => {
    // Log the error for internal debugging
    request.log.error(error);

    // Handle Custom AppErrors (e.g., AUTH_NOT_FOUND)
    if (error.statusCode) {
      return reply.status(error.statusCode).send({
        error: {
          code: (error as any).code || 'ERROR',
          message: error.message,
        },
      });
    }

    // Handle Zod Validation Errors
    if (error.validation) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.validation,
        },
      });
    }

    // Fallback for unhandled internal crashes
    reply.status(500).send({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected systems error occurred',
      },
    });
  });

  // 3. Create the Route Protection Middleware Hook
  app.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or missing authentication token',
        }
      });
    }
  });

  // 4. Register your plugins and routes
  await app.register(authPlugin);
  await app.register(health);
  await app.register(students);
  await app.register(attendance);
  await app.register(access);
  await app.register(presence);
  await app.register(incidents);

  return app;
}