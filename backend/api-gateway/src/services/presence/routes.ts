// routes.ts - Route definitions for Presence & Location Service

import { FastifyPluginAsync } from 'fastify';
import { PresenceController } from './controller';

const presenceRoutes: FastifyPluginAsync = async (fastify) => {
  // Legacy contract lives at GET /presence/:studentId and GET /presence/:studentId/trail.
  // The routes below are mutation/raw-location aliases kept for low-churn compatibility.
  fastify.post(
    '/presence/update-location',
    { onRequest: [fastify.authenticate] },
    PresenceController.updateLocation
  );

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

export default presenceRoutes;