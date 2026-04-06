// utils.ts - Utility functions for Presence & Location Service

/**
 * Calculate distance between two points using Haversine formula
 * @param lat1 Latitude of first point
 * @param lng1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lng2 Longitude of second point
 * @returns Distance in meters
 */
export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Check if a user location is inside a geofence zone
 * @param userLocation User's current location {lat, lng}
 * @param zone Zone definition {lat, lng, radius}
 * @returns true if inside, false otherwise
 */
export function isInsideGeofence(userLocation: {lat: number, lng: number}, zone: {lat: number, lng: number, radius: number}): boolean {
  const distance = haversineDistance(userLocation.lat, userLocation.lng, zone.lat, zone.lng);
  return distance <= zone.radius;
}

// Sample geofences for the campus
export const SAMPLE_GEOFENCES: { [key: string]: { lat: number; lng: number; radius: number } } = {
  'Classroom A': { lat: 28.6139, lng: 77.2090, radius: 50 }, // Connaught Place, Delhi (example)
  'Gate 1': { lat: 28.6140, lng: 77.2091, radius: 30 },
  'Parking Zone': { lat: 28.6141, lng: 77.2092, radius: 100 }
};

/**
 * Validate location data
 * @param location Location object to validate
 * @returns true if valid, throws error if invalid
 */
export function validateLocation(location: any): boolean {
  if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
    throw new Error('Invalid location: lat and lng must be numbers');
  }
  if (location.lat < -90 || location.lat > 90) {
    throw new Error('Invalid latitude: must be between -90 and 90');
  }
  if (location.lng < -180 || location.lng > 180) {
    throw new Error('Invalid longitude: must be between -180 and 180');
  }
  return true;
}