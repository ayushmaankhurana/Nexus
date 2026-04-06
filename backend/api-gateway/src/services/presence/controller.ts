// controller.ts - Request handlers for Presence & Location Service

import { FastifyRequest, FastifyReply } from 'fastify';
import { PresenceService } from './service';
import { Location, BLEDetection, BatchLocation, GeofenceCheckRequest } from './model';

// Initialize service
const presenceService = new PresenceService();

export class PresenceController {
  /**
   * Handle POST /presence/update-location
   */
  static async updateLocation(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { userId, lat, lng, timestamp } = request.body as {
        userId: string;
        lat: number;
        lng: number;
        timestamp: number;
      };

      if (!userId) {
        return reply.code(400).send({
          error: 'userId is required'
        });
      }

      const location: Location = { lat, lng, timestamp: timestamp || Date.now() };

      await presenceService.updateLocation(userId, location);

      return reply.code(200).send({
        success: true,
        message: 'Location updated successfully'
      });
    } catch (error: any) {
      return reply.code(400).send({
        error: error.message
      });
    }
  }

  /**
   * Handle GET /presence/current/:userId
   */
  static async getCurrentLocation(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { userId } = request.params as { userId: string };

      const location = await presenceService.getCurrentLocation(userId);

      if (!location) {
        return reply.code(404).send({
          error: 'No location data found for this user'
        });
      }

      return reply.code(200).send({
        userId,
        location
      });
    } catch (error: any) {
      return reply.code(500).send({
        error: error.message
      });
    }
  }

  /**
   * Handle GET /presence/history/:userId
   */
  static async getLocationHistory(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { userId } = request.params as { userId: string };

      const history = await presenceService.getLocationHistory(userId);

      return reply.code(200).send({
        userId,
        history
      });
    } catch (error: any) {
      return reply.code(500).send({
        error: error.message
      });
    }
  }

  /**
   * Handle POST /presence/batch-upload
   */
  static async batchUploadLocations(request: FastifyRequest, reply: FastifyReply) {
    try {
      const batchData = request.body as BatchLocation[];

      if (!Array.isArray(batchData)) {
        return reply.code(400).send({
          error: 'Request body must be an array of batch location data'
        });
      }

      await presenceService.batchUploadLocations(batchData);

      return reply.code(200).send({
        success: true,
        message: `Processed ${batchData.length} batch(es) successfully`
      });
    } catch (error: any) {
      return reply.code(400).send({
        error: error.message
      });
    }
  }

  /**
   * Handle POST /presence/ble-detection
   */
  static async storeBLEDetection(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { deviceId, seenBy, timestamp } = request.body as {
        deviceId: string;
        seenBy: string;
        timestamp: number;
      };

      const detection: BLEDetection = {
        deviceId,
        seenBy,
        timestamp: timestamp || Date.now()
      };

      await presenceService.storeBLEDetection(detection);

      return reply.code(200).send({
        success: true,
        message: 'BLE detection stored successfully'
      });
    } catch (error: any) {
      return reply.code(400).send({
        error: error.message
      });
    }
  }

  /**
   * Handle POST /presence/check-geofence
   */
  static async checkGeofence(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { userId, zoneName } = request.body as GeofenceCheckRequest;

      if (!userId || !zoneName) {
        return reply.code(400).send({
          error: 'userId and zoneName are required'
        });
      }

      const result = await presenceService.checkGeofence({ userId, zoneName });

      return reply.code(200).send(result);
    } catch (error: any) {
      return reply.code(400).send({
        error: error.message
      });
    }
  }
}