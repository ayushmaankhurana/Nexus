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
import fastify, { FastifyReply, FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt'; // <-- Add this import
import authPlugin from './plugins/auth';
import health from './routes/health';
import students from './routes/students';
import attendance from './routes/attendance';
import access from './routes/access';
import presence from './routes/presence';
import incidents from './routes/incidents';

export async function createApp() {
  const app = fastify({ logger: true });

  await app.register(cors, {
    origin: ['http://localhost:8080', 'http://localhost:5173'],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // 1. Register the JWT Plugin
  // Note: For production, move this secret to your .env file!
  await app.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || 'nexus_super_secret_dev_key_2026',
  });

  // 2. Create the Route Protection Middleware Hook
  app.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
    try {
      // Automatically looks for the 'Authorization: Bearer <token>' header,
      // verifies the cryptographic signature, checks expiration, and populates request.user
      await request.jwtVerify();
    } catch (err) {
      // Bounces the request with a 401 Unauthorized if anything fails
      reply.send(err);
    }
  });

  // 3. Register your plugins and routes
  await app.register(authPlugin);
  await app.register(health);
  await app.register(students);
  await app.register(attendance);
  await app.register(access);
  await app.register(presence);
  await app.register(incidents);

  return app;
}