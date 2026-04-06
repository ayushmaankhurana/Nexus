import { FastifyPluginAsync } from 'fastify';
import { PresenceController } from '../services/presence/controller';

const presence: FastifyPluginAsync = async (fastify) => {
  // Existing endpoints (keeping for compatibility)
  fastify.get<{ Params: { studentId: string } }>(
    '/presence/:studentId',
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      const { studentId } = request.params;
      const user = request.user;

      if (user.sub !== studentId && user.role !== 'admin') {
        return reply.code(403).send({
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to access this resource',
          },
        });
      }

      return {
        studentId,
        isPresent: false,
        lastSeen: null,
      };
    }
  );

  fastify.get<{ Params: { studentId: string } }>(
    '/presence/:studentId/trail',
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      const { studentId } = request.params;
      const user = request.user;

      if (user.sub !== studentId && user.role !== 'admin') {
        return reply.code(403).send({
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to access this resource',
          },
        });
      }

      return {
        studentId,
        trail: [],
      };
    }
  );

  // New Presence & Location Service endpoints

  // POST /presence/update-location
  fastify.post(
    '/presence/update-location',
    { onRequest: [fastify.authenticate] },
    PresenceController.updateLocation
  );

  // GET /presence/current/:userId
  fastify.get<{ Params: { userId: string } }>(
    '/presence/current/:userId',
    { onRequest: [fastify.authenticate] },
    PresenceController.getCurrentLocation
  );

  // GET /presence/history/:userId
  fastify.get<{ Params: { userId: string } }>(
    '/presence/history/:userId',
    { onRequest: [fastify.authenticate] },
    PresenceController.getLocationHistory
  );

  // POST /presence/batch-upload
  fastify.post(
    '/presence/batch-upload',
    { onRequest: [fastify.authenticate] },
    PresenceController.batchUploadLocations
  );

  // POST /presence/ble-detection
  fastify.post(
    '/presence/ble-detection',
    { onRequest: [fastify.authenticate] },
    PresenceController.storeBLEDetection
  );

  // POST /presence/check-geofence
  fastify.post(
    '/presence/check-geofence',
    { onRequest: [fastify.authenticate] },
    PresenceController.checkGeofence
  );
};

export default presence;