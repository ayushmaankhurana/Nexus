// service.ts - Business logic for Presence & Location Service

import { presenceStore, Location, BLEDetection, BatchLocation, GeofenceCheckRequest, GeofenceCheckResponse } from './model';
import { isInsideGeofence, SAMPLE_GEOFENCES, validateLocation } from './utils';

export class PresenceService {
  /**
   * Update user's location
   */
  async updateLocation(userId: string, location: Location): Promise<void> {
    validateLocation(location);
    presenceStore.updateLocation(userId, location);
  }

  /**
   * Get current location for a user
   */
  async getCurrentLocation(userId: string): Promise<Location | null> {
    return presenceStore.getCurrentLocation(userId);
  }

  /**
   * Get location history for a user
   */
  async getLocationHistory(userId: string): Promise<Location[]> {
    return presenceStore.getLocationHistory(userId);
  }

  /**
   * Batch upload locations
   */
  async batchUploadLocations(batchData: BatchLocation[]): Promise<void> {
    // Validate all locations before storing
    batchData.forEach(({ locations }) => {
      locations.forEach(validateLocation);
    });

    presenceStore.batchUploadLocations(batchData);
  }

  /**
   * Store BLE detection data
   */
  async storeBLEDetection(detection: BLEDetection): Promise<void> {
    if (!detection.deviceId || !detection.seenBy) {
      throw new Error('Invalid BLE detection: deviceId and seenBy are required');
    }
    presenceStore.storeBLEDetection(detection);
  }

  /**
   * Check if user is inside a geofence
   */
  async checkGeofence(request: GeofenceCheckRequest): Promise<GeofenceCheckResponse> {
    const { userId, zoneName } = request;

    const zone = SAMPLE_GEOFENCES[zoneName];
    if (!zone) {
      throw new Error(`Geofence zone '${zoneName}' not found`);
    }

    const currentLocation = await this.getCurrentLocation(userId);
    if (!currentLocation) {
      throw new Error(`No location data found for user ${userId}`);
    }

    const inside = isInsideGeofence(currentLocation, zone);

    return {
      inside,
      zone: zoneName
    };
  }

  /**
   * Get all BLE logs (admin/debug function)
   */
  async getBLELogs(): Promise<BLEDetection[]> {
    return presenceStore.getBLELogs();
  }

  /**
   * Clear all data (for testing purposes)
   */
  async clearAllData(): Promise<void> {
    presenceStore.clearAll();
  }
}