// import { FastifyInstance } from 'fastify';
// import { AuthService } from '../services/auth-service';

// declare module 'fastify' {
//   interface FastifyInstance {
//     authService: AuthService;
//   }
// }
import { AuthService } from '../services/auth-service';
import { FastifyRequest, FastifyReply } from 'fastify';
import '@fastify/jwt';

declare module 'fastify' {
  interface FastifyInstance {
    authService: AuthService;
    // The decorator we are adding to protect routes
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    // The shape of the data we will hide inside the token
    payload: { 
      sub: string;       // Subject (studentId)
      deviceId: string;  // Bound device
      role: string;      // User role (student, admin, security)
    };
    // The shape of request.user after the token is verified
    user: { 
      sub: string; 
      deviceId: string; 
      role: string; 
    }; 
  }
}