export interface Location {
  lat: number;
  lng: number;
  timestamp: number;
  geofenceId?: string | null;
  geofenceName?: string | null;
}

export interface BLEDetection {
  deviceId: string;
  seenBy: string;
  timestamp: number;
}

export interface BatchLocation {
  userId?: string;
  locations: Location[];
}

export interface GeofenceCheckRequest {
  userId?: string;
  zoneName: string;
}

export interface GeofenceCheckResponse {
  inside: boolean;
  zone: string;
  geofenceId: string;
  lastSeen: string;
}

export interface PresenceSummary {
  studentId: string;
  isPresent: boolean;
  lastSeen: string | null;
}

export interface PresenceTrailEntry {
  checkpoint: string;
  timestamp: string;
  duration?: number;
}