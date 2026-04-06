import { Prisma } from '@prisma/client';
import { Location } from './model';

type CoordinateObject = {
  lat: number;
  lng: number;
};

export type GeofenceCircle = {
  id: string;
  name: string;
  type: string;
  radius: number;
  lat: number;
  lng: number;
};

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

function isCoordinateObject(value: Prisma.JsonValue): value is CoordinateObject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return typeof candidate.lat === 'number' && typeof candidate.lng === 'number';
}

export function extractGeofenceCircle(geofence: {
  id: string;
  name: string;
  type: string;
  radius: number | null;
  coordinates: Prisma.JsonValue;
}): GeofenceCircle | null {
  if (!geofence.radius || !isCoordinateObject(geofence.coordinates)) {
    return null;
  }

  return {
    id: geofence.id,
    name: geofence.name,
    type: geofence.type,
    radius: geofence.radius,
    lat: geofence.coordinates.lat,
    lng: geofence.coordinates.lng,
  };
}

export function findContainingGeofence(location: Location, geofences: GeofenceCircle[]): GeofenceCircle | null {
  let bestMatch: GeofenceCircle | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const geofence of geofences) {
    const distance = haversineDistance(location.lat, location.lng, geofence.lat, geofence.lng);
    if (distance <= geofence.radius && distance < bestDistance) {
      bestDistance = distance;
      bestMatch = geofence;
    }
  }

  return bestMatch;
}

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
  if (typeof location.timestamp !== 'number' || Number.isNaN(location.timestamp)) {
    throw new Error('Invalid timestamp: must be a unix timestamp in milliseconds');
  }
  return true;
}