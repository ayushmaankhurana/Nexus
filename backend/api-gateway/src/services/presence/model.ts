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
  lat?: number;
  lng?: number;
}

export interface PresenceOverviewGeofence {
  id: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  radius: number | null;
}

export interface PresenceOverviewRecord {
  id: string;
  studentId: string;
  rollNumber: string;
  studentName: string;
  email: string;
  accountStatus: string;
  status: 'active' | 'inactive' | 'missing';
  checkpoint: string;
  timestamp: string | null;
  lat: number | null;
  lng: number | null;
}

export interface PresenceOverviewResponse {
  records: PresenceOverviewRecord[];
  geofences: PresenceOverviewGeofence[];
}