// model.js - Data models and in-memory storage for Presence & Location Service

// Location data structure
class Location {
  constructor(lat, lng, timestamp) {
    this.lat = lat;
    this.lng = lng;
    this.timestamp = timestamp || Date.now();
  }
}

// BLE detection data structure
class BLEDetection {
  constructor(deviceId, seenBy, timestamp) {
    this.deviceId = deviceId;
    this.seenBy = seenBy;
    this.timestamp = timestamp || Date.now();
  }
}

// Batch upload structure
class BatchLocation {
  constructor(userId, locations) {
    this.userId = userId;
    this.locations = locations;
  }
}

// Geofence check request/response
class GeofenceCheckRequest {
  constructor(userId, zoneName) {
    this.userId = userId;
    this.zoneName = zoneName;
  }
}

class GeofenceCheckResponse {
  constructor(inside, zone) {
    this.inside = inside;
    this.zone = zone;
  }
}

// In-memory storage structure
class PresenceData {
  constructor() {
    this.locations = {}; // { userId: [Location] } - History of locations per user
    this.currentLocations = {}; // { userId: Location } - Latest location per user
    this.bleLogs = []; // [BLEDetection] - BLE detection logs
  }
}

// Storage operations
class PresenceStore {
  constructor() {
    this.data = new PresenceData();
  }

  /**
   * Update user's location and add to history
   */
  updateLocation(userId, location) {
    // Add to history
    if (!this.data.locations[userId]) {
      this.data.locations[userId] = [];
    }
    this.data.locations[userId].push(location);

    // Update current location
    this.data.currentLocations[userId] = location;
  }

  /**
   * Get current location for a user
   */
  getCurrentLocation(userId) {
    return this.data.currentLocations[userId] || null;
  }

  /**
   * Get location history for a user
   */
  getLocationHistory(userId) {
    return this.data.locations[userId] || [];
  }

  /**
   * Batch upload locations for multiple users
   */
  batchUploadLocations(batchData) {
    batchData.forEach(({ userId, locations }) => {
      locations.forEach(location => {
        this.updateLocation(userId, location);
      });
    });
  }

  /**
   * Store BLE detection data
   */
  storeBLEDetection(detection) {
    this.data.bleLogs.push(detection);
  }

  /**
   * Get all BLE logs (for debugging/admin purposes)
   */
  getBLELogs() {
    return [...this.data.bleLogs];
  }

  /**
   * Clear all data (for testing/reset purposes)
   */
  clearAll() {
    this.data = new PresenceData();
  }
}

// Export classes and singleton instance
module.exports = {
  Location,
  BLEDetection,
  BatchLocation,
  GeofenceCheckRequest,
  GeofenceCheckResponse,
  PresenceStore,
  presenceStore: new PresenceStore()
};