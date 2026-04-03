import { FastifyInstance } from 'fastify';
import { AuthService } from '../services/auth-service';

declare module 'fastify' {
  interface FastifyInstance {
    authService: AuthService;
  }
}
