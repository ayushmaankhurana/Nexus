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
import adminStudentsRoute from './routes/admin-students';
import dashboardRoute from './routes/dashboard';
import devReset from './routes/dev-reset';



// Note: Hum config ko parameter ke through lenge, 
// isliye direct import ki dependency kam ho jayegi.
export async function createApp(config?: any) {
  const app = fastify({ logger: true });

  // 1. CORS Configuration
  await app.register(cors, {
    origin: ['http://localhost:8080', 'http://localhost:5173'],
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // --- FIX 1: STRICT JWT SECRET HANDLING ---
  // Step 1: Pehle check karo server.ts se aaya hua config
  // Step 2: Fir check karo seedha .env file (process.env)
  // Step 3: Agar dono nahi mile toh fallback
  const jwtSecret = config?.jwtSecret || process.env.JWT_SECRET;

  if (!jwtSecret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CRITICAL: JWT_SECRET missing in Production. Aborting.');
    }
    console.warn("⚠️ WARNING: Using hardcoded JWT secret for development.");
  }

  await app.register(fastifyJwt, {
    secret: jwtSecret || 'dev-backup-secret-123', 
  });
  

  // --- FIX 2: GLOBAL ERROR HANDLER ---
  app.setErrorHandler((error, request, reply) => {
    request.log.error(error);

    if (error.statusCode) {
      return reply.status(error.statusCode).send({
        error: {
          code: (error as any).code || 'ERROR',
          message: error.message,
        },
      });
    }

    if (error.validation) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.validation,
        },
      });
    }

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
  await app.register(adminStudentsRoute);
  await app.register(dashboardRoute);
  if (process.env.NODE_ENV !== 'production' || process.env.DEMO_RESET_ENABLED === 'true') {
    await app.register(devReset);
  }

  return app;
}