// routes.ts - Route definitions for Presence & Location Service

import { FastifyPluginAsync } from 'fastify';
import { PresenceController } from './controller';

const presenceRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /presence/update-location
  // Accept: { userId, lat, lng, timestamp }
  // Store latest location + append to history
  fastify.post(
    '/presence/update-location',
    { onRequest: [fastify.authenticate] },
    PresenceController.updateLocation
  );

  // GET /presence/current/:userId
  // Return latest location
  fastify.get<{ Params: { userId: string } }>(
    '/presence/current/:userId',
    { onRequest: [fastify.authenticate] },
    PresenceController.getCurrentLocation
  );

  // GET /presence/history/:userId
  // Return full location history
  fastify.get<{ Params: { userId: string } }>(
    '/presence/history/:userId',
    { onRequest: [fastify.authenticate] },
    PresenceController.getLocationHistory
  );

  // POST /presence/batch-upload
  // Accept array of locations (offline sync)
  // Store all entries
  fastify.post(
    '/presence/batch-upload',
    { onRequest: [fastify.authenticate] },
    PresenceController.batchUploadLocations
  );

  // POST /presence/ble-detection
  // Accept: { deviceId, seenBy, timestamp }
  // Store proximity data
  fastify.post(
    '/presence/ble-detection',
    { onRequest: [fastify.authenticate] },
    PresenceController.storeBLEDetection
  );

  // POST /presence/check-geofence
  // Input: { userId, zoneName }
  // Output: { inside: true/false, zone: zoneName }
  fastify.post(
    '/presence/check-geofence',
    { onRequest: [fastify.authenticate] },
    PresenceController.checkGeofence
  );
};

export default presenceRoutes;