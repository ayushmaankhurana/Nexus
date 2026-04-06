// service.js - Business logic for Presence & Location Service

const { presenceStore, Location, BLEDetection } = require('./model');
const { isInsideGeofence, SAMPLE_GEOFENCES, validateLocation } = require('./utils');

class PresenceService {
  /**
   * Update user's location
   * @param {string} userId - User identifier
   * @param {Object} locationData - Location data {lat, lng, timestamp}
   */
  async updateLocation(userId, locationData) {
    try {
      if (!userId) {
        throw new Error('userId is required');
      }

      const location = new Location(
        locationData.lat,
        locationData.lng,
        locationData.timestamp
      );

      validateLocation(location);
      presenceStore.updateLocation(userId, location);

      return { success: true, message: 'Location updated successfully' };
    } catch (error) {
      throw new Error(`Failed to update location: ${error.message}`);
    }
  }

  /**
   * Get current location for a user
   * @param {string} userId - User identifier
   * @returns {Object|null} Current location or null if not found
   */
  async getCurrentLocation(userId) {
    try {
      if (!userId) {
        throw new Error('userId is required');
      }

      const location = presenceStore.getCurrentLocation(userId);
      return location;
    } catch (error) {
      throw new Error(`Failed to get current location: ${error.message}`);
    }
  }

  /**
   * Get location history for a user
   * @param {string} userId - User identifier
   * @returns {Array} Array of location history
   */
  async getLocationHistory(userId) {
    try {
      if (!userId) {
        throw new Error('userId is required');
      }

      const history = presenceStore.getLocationHistory(userId);
      return history;
    } catch (error) {
      throw new Error(`Failed to get location history: ${error.message}`);
    }
  }

  /**
   * Batch upload locations
   * @param {Array} batchData - Array of {userId, locations: []}
   */
  async batchUploadLocations(batchData) {
    try {
      if (!Array.isArray(batchData)) {
        throw new Error('batchData must be an array');
      }

      // Validate all data before processing
      batchData.forEach(({ userId, locations }) => {
        if (!userId) {
          throw new Error('userId is required for each batch entry');
        }
        if (!Array.isArray(locations)) {
          throw new Error('locations must be an array for each batch entry');
        }
        locations.forEach(validateLocation);
      });

      presenceStore.batchUploadLocations(batchData);

      return {
        success: true,
        message: `Processed ${batchData.length} batch(es) successfully`
      };
    } catch (error) {
      throw new Error(`Failed to batch upload locations: ${error.message}`);
    }
  }

  /**
   * Store BLE detection data
   * @param {Object} detectionData - BLE detection data {deviceId, seenBy, timestamp}
   */
  async storeBLEDetection(detectionData) {
    try {
      if (!detectionData.deviceId || !detectionData.seenBy) {
        throw new Error('deviceId and seenBy are required for BLE detection');
      }

      const detection = new BLEDetection(
        detectionData.deviceId,
        detectionData.seenBy,
        detectionData.timestamp
      );

      presenceStore.storeBLEDetection(detection);

      return { success: true, message: 'BLE detection stored successfully' };
    } catch (error) {
      throw new Error(`Failed to store BLE detection: ${error.message}`);
    }
  }

  /**
   * Check if user is inside a geofence
   * @param {Object} request - Geofence check request {userId, zoneName}
   * @returns {Object} {inside: boolean, zone: string}
   */
  async checkGeofence(request) {
    try {
      const { userId, zoneName } = request;

      if (!userId || !zoneName) {
        throw new Error('userId and zoneName are required');
      }

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
    } catch (error) {
      throw new Error(`Failed to check geofence: ${error.message}`);
    }
  }

  /**
   * Get all BLE logs (admin/debug function)
   * @returns {Array} Array of BLE detection logs
   */
  async getBLELogs() {
    try {
      return presenceStore.getBLELogs();
    } catch (error) {
      throw new Error(`Failed to get BLE logs: ${error.message}`);
    }
  }

  /**
   * Clear all data (for testing purposes)
   */
  async clearAllData() {
    try {
      presenceStore.clearAll();
      return { success: true, message: 'All data cleared successfully' };
    } catch (error) {
      throw new Error(`Failed to clear data: ${error.message}`);
    }
  }
}

module.exports = {
  PresenceService
};