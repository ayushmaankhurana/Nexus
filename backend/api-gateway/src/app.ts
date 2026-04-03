import fastify from 'fastify';
import cors from '@fastify/cors';
import authPlugin from './plugins/auth';
import health from './routes/health';
import students from './routes/students';
import attendance from './routes/attendance';
import access from './routes/access';
import presence from './routes/presence';
import incidents from './routes/incidents';

export async function createApp() {
  const app = fastify({
    logger: true,
  });

  // Register CORS plugin for local development
  await app.register(cors, {
    origin: ['http://localhost:8080', 'http://localhost:5173'],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Register auth plugin first (includes auth routes and decorations)
  await app.register(authPlugin);

  // Register other routes
  await app.register(health);
  await app.register(students);
  await app.register(attendance);
  await app.register(access);
  await app.register(presence);
  await app.register(incidents);

  return app;
}