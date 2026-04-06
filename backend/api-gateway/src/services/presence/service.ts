import { AppError } from '@nexus/core';
import {
  BLEDetection,
  BatchLocation,
  GeofenceCheckRequest,
  GeofenceCheckResponse,
  Location,
  PresenceSummary,
  PresenceTrailEntry,
} from './model';
import { extractGeofenceCircle, findContainingGeofence, isInsideGeofence, validateLocation } from './utils';
import { PrismaPresenceStore } from '../../stores/prisma-presence-store';

const PRESENCE_FRESHNESS_MS = 15 * 60 * 1000;

export class PresenceService {
  constructor(private store: PrismaPresenceStore = new PrismaPresenceStore()) {}

  /**
   * Update user's location
   */
  async updateLocation(userId: string, location: Location): Promise<void> {
    validateLocation(location);
    await this.store.createLocation(userId, location);
  }

  /**
   * Get current location for a user
   */
  async getCurrentLocation(userId: string): Promise<Location | null> {
    const location = await this.store.getCurrentLocation(userId);
    if (!location) {
      return null;
    }

    const geofences = await this.getActiveGeofenceCircles();
    const matchedGeofence = findContainingGeofence(location, geofences);

    return {
      ...location,
      geofenceId: matchedGeofence?.id ?? null,
      geofenceName: matchedGeofence?.name ?? null,
    };
  }

  /**
   * Get location history for a user
   */
  async getLocationHistory(userId: string): Promise<Location[]> {
    const [locations, geofences] = await Promise.all([
      this.store.getLocationHistory(userId),
      this.getActiveGeofenceCircles(),
    ]);

    return locations.map((location) => {
      const matchedGeofence = findContainingGeofence(location, geofences);
      return {
        ...location,
        geofenceId: matchedGeofence?.id ?? null,
        geofenceName: matchedGeofence?.name ?? null,
      };
    });
  }

  /**
   * Batch upload locations
   */
  async batchUploadLocations(batchData: BatchLocation[]): Promise<void> {
    const entries: Array<{ accountId: string; location: Location }> = [];

    batchData.forEach(({ userId, locations }) => {
      if (!userId) {
        throw new AppError('VALIDATION_ERROR', 400, 'userId is required for each batch entry');
      }

      locations.forEach((location) => {
        validateLocation(location);
        entries.push({ accountId: userId, location });
      });
    });

    await this.store.createLocations(entries);
  }

  /**
   * Store BLE detection data
   */
  async storeBLEDetection(accountId: string, detection: BLEDetection): Promise<void> {
    if (!detection.deviceId || !detection.seenBy) {
      throw new AppError('VALIDATION_ERROR', 400, 'deviceId and seenBy are required');
    }

    await this.store.createBleDetection(accountId, detection);
  }

  /**
   * Check if user is inside a geofence
   */
  async checkGeofence(request: GeofenceCheckRequest): Promise<GeofenceCheckResponse> {
    const { userId, zoneName } = request;

    if (!userId) {
      throw new AppError('VALIDATION_ERROR', 400, 'userId is required');
    }

    const zoneRecord = await this.store.findGeofenceByName(zoneName);
    if (!zoneRecord || !zoneRecord.isActive) {
      throw new AppError('GEOFENCE_NOT_FOUND', 404, `Geofence zone '${zoneName}' not found`);
    }

    const zone = extractGeofenceCircle(zoneRecord);
    if (!zone) {
      throw new AppError('INVALID_GEOFENCE', 400, `Geofence '${zoneName}' is not circle-based`);
    }

    const currentLocation = await this.getCurrentLocation(userId);
    if (!currentLocation) {
      throw new AppError('LOCATION_NOT_FOUND', 404, `No location data found for user ${userId}`);
    }

    const inside = isInsideGeofence(currentLocation, zone);

    return {
      inside,
      zone: zoneName,
      geofenceId: zone.id,
      lastSeen: new Date(currentLocation.timestamp).toISOString(),
    };
  }

  async getPresenceSummary(userId: string): Promise<PresenceSummary> {
    const currentLocation = await this.getCurrentLocation(userId);

    return {
      studentId: userId,
      isPresent:
        currentLocation !== null && Date.now() - currentLocation.timestamp <= PRESENCE_FRESHNESS_MS,
      lastSeen: currentLocation ? new Date(currentLocation.timestamp).toISOString() : null,
    };
  }

  async getPresenceTrail(userId: string): Promise<PresenceTrailEntry[]> {
    const history = await this.getLocationHistory(userId);

    return history.map((location) => ({
      checkpoint:
        location.geofenceName ?? `Lat ${location.lat.toFixed(4)}, Lng ${location.lng.toFixed(4)}`,
      timestamp: new Date(location.timestamp).toISOString(),
    }));
  }

  /**
   * Get all BLE logs (admin/debug function)
   */
  async getBLELogs(): Promise<BLEDetection[]> {
    return this.store.getBleLogs();
  }

  private async getActiveGeofenceCircles() {
    const geofences = await this.store.listActiveGeofences();
    return geofences
      .map((geofence) => extractGeofenceCircle(geofence))
      .filter((geofence): geofence is NonNullable<typeof geofence> => geofence !== null);
  }
}