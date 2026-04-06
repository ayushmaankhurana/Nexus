import { FastifyPluginAsync } from 'fastify';
import { PresenceController } from '../services/presence/controller';

const presence: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/presence/overview',
    { onRequest: [fastify.authenticate] },
    PresenceController.getPresenceOverview
  );

  // Legacy contract kept as the primary API surface.
  fastify.get<{ Params: { studentId: string } }>(
    '/presence/:studentId',
    { onRequest: [fastify.authenticate] },
    PresenceController.getPresenceSummary
  );

  fastify.get<{ Params: { studentId: string } }>(
    '/presence/:studentId/trail',
    { onRequest: [fastify.authenticate] },
    PresenceController.getPresenceTrail
  );

  fastify.post(
    '/presence/update-location',
    { onRequest: [fastify.authenticate] },
    PresenceController.updateLocation
  );

  // Alias endpoints kept for callers already using the newer raw-location shape.
  fastify.get<{ Params: { userId: string } }>(
    '/presence/current/:userId',
    { onRequest: [fastify.authenticate] },
    PresenceController.getCurrentLocation
  );

  fastify.get<{ Params: { userId: string } }>(
    '/presence/history/:userId',
    { onRequest: [fastify.authenticate] },
    PresenceController.getLocationHistory
  );

  fastify.post(
    '/presence/batch-upload',
    { onRequest: [fastify.authenticate] },
    PresenceController.batchUploadLocations
  );

  fastify.post(
    '/presence/ble-detection',
    { onRequest: [fastify.authenticate] },
    PresenceController.storeBLEDetection
  );

  fastify.post(
    '/presence/check-geofence',
    { onRequest: [fastify.authenticate] },
    PresenceController.checkGeofence
  );
};

export default presence;