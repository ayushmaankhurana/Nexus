// model.ts - Data models and in-memory storage for Presence & Location Service

// Location data structure
export interface Location {
  lat: number;
  lng: number;
  timestamp: number; // Unix timestamp
}

// BLE detection data structure
export interface BLEDetection {
  deviceId: string;
  seenBy: string; // Device that saw this one
  timestamp: number;
}

// Batch upload structure
export interface BatchLocation {
  userId: string;
  locations: Location[];
}

// Geofence check request/response
export interface GeofenceCheckRequest {
  userId: string;
  zoneName: string;
}

export interface GeofenceCheckResponse {
  inside: boolean;
  zone: string;
}

// In-memory storage structure
interface PresenceData {
  locations: { [userId: string]: Location[] }; // History of locations per user
  currentLocations: { [userId: string]: Location }; // Latest location per user
  bleLogs: BLEDetection[]; // BLE detection logs
}

// Initialize in-memory store
const presenceData: PresenceData = {
  locations: {},
  currentLocations: {},
  bleLogs: []
};

// Storage operations
export class PresenceStore {
  /**
   * Update user's location and add to history
   */
  updateLocation(userId: string, location: Location): void {
    // Add to history
    if (!presenceData.locations[userId]) {
      presenceData.locations[userId] = [];
    }
    presenceData.locations[userId].push(location);

    // Update current location
    presenceData.currentLocations[userId] = location;
  }

  /**
   * Get current location for a user
   */
  getCurrentLocation(userId: string): Location | null {
    return presenceData.currentLocations[userId] || null;
  }

  /**
   * Get location history for a user
   */
  getLocationHistory(userId: string): Location[] {
    return presenceData.locations[userId] || [];
  }

  /**
   * Batch upload locations for multiple users
   */
  batchUploadLocations(batchData: BatchLocation[]): void {
    batchData.forEach(({ userId, locations }) => {
      locations.forEach(location => {
        this.updateLocation(userId, location);
      });
    });
  }

  /**
   * Store BLE detection data
   */
  storeBLEDetection(detection: BLEDetection): void {
    presenceData.bleLogs.push(detection);
  }

  /**
   * Get all BLE logs (for debugging/admin purposes)
   */
  getBLELogs(): BLEDetection[] {
    return [...presenceData.bleLogs];
  }

  /**
   * Clear all data (for testing/reset purposes)
   */
  clearAll(): void {
    presenceData.locations = {};
    presenceData.currentLocations = {};
    presenceData.bleLogs = [];
  }
}

// Export singleton instance
export const presenceStore = new PresenceStore();