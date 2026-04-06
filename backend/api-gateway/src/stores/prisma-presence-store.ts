import { PrismaClient, Prisma, UserRole } from '@prisma/client';
import { getPrismaClient } from '../lib/prisma';
import { BLEDetection, Location } from '../services/presence/model';

type PersistedGeofence = {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  radius: number | null;
  coordinates: Prisma.JsonValue;
};

type PersistedStudentPresence = {
  id: string;
  rollNumber: string;
  email: string;
  status: string;
  firstName: string;
  lastName: string;
  latestLocation: {
    id: string;
    latitude: number;
    longitude: number;
    recordedAt: Date;
  } | null;
};

export class PrismaPresenceStore {
  constructor(private prisma: PrismaClient = getPrismaClient()) {}

  async createLocation(accountId: string, location: Location): Promise<void> {
    await this.prisma.presenceLocation.create({
      data: {
        accountId,
        latitude: location.lat,
        longitude: location.lng,
        recordedAt: new Date(location.timestamp),
      },
    });
  }

  async createLocations(entries: Array<{ accountId: string; location: Location }>): Promise<void> {
    if (entries.length === 0) {
      return;
    }

    await this.prisma.presenceLocation.createMany({
      data: entries.map(({ accountId, location }) => ({
        accountId,
        latitude: location.lat,
        longitude: location.lng,
        recordedAt: new Date(location.timestamp),
      })),
    });
  }

  async getCurrentLocation(accountId: string): Promise<Location | null> {
    const location = await this.prisma.presenceLocation.findFirst({
      where: { accountId },
      orderBy: { recordedAt: 'desc' },
    });

    return location
      ? {
          lat: location.latitude,
          lng: location.longitude,
          timestamp: location.recordedAt.getTime(),
        }
      : null;
  }

  async getLocationHistory(accountId: string): Promise<Location[]> {
    const locations = await this.prisma.presenceLocation.findMany({
      where: { accountId },
      orderBy: { recordedAt: 'asc' },
    });

    return locations.map((location) => ({
      lat: location.latitude,
      lng: location.longitude,
      timestamp: location.recordedAt.getTime(),
    }));
  }

  async createBleDetection(accountId: string, detection: BLEDetection): Promise<void> {
    await this.prisma.bleDetection.create({
      data: {
        accountId,
        deviceId: detection.deviceId,
        seenBy: detection.seenBy,
        recordedAt: new Date(detection.timestamp),
      },
    });
  }

  async getBleLogs(accountId?: string): Promise<BLEDetection[]> {
    const detections = await this.prisma.bleDetection.findMany({
      where: accountId ? { accountId } : undefined,
      orderBy: { recordedAt: 'desc' },
    });

    return detections.map((detection) => ({
      deviceId: detection.deviceId,
      seenBy: detection.seenBy,
      timestamp: detection.recordedAt.getTime(),
    }));
  }

  async findGeofenceByName(name: string): Promise<PersistedGeofence | null> {
    return this.prisma.geofence.findUnique({
      where: { name },
      select: {
        id: true,
        name: true,
        type: true,
        isActive: true,
        radius: true,
        coordinates: true,
      },
    });
  }

  async listActiveGeofences(): Promise<PersistedGeofence[]> {
    return this.prisma.geofence.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        type: true,
        isActive: true,
        radius: true,
        coordinates: true,
      },
    });
  }

  async listStudentPresenceOverview(): Promise<PersistedStudentPresence[]> {
    const accounts = await this.prisma.account.findMany({
      where: { role: UserRole.STUDENT },
      include: {
        profile: true,
        presenceLocations: {
          orderBy: { recordedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { rollNumber: 'asc' },
    });

    return accounts.map((account) => ({
      id: account.id,
      rollNumber: account.rollNumber,
      email: account.email,
      status: account.status,
      firstName: account.profile?.firstName ?? '',
      lastName: account.profile?.lastName ?? '',
      latestLocation: account.presenceLocations[0]
        ? {
            id: account.presenceLocations[0].id,
            latitude: account.presenceLocations[0].latitude,
            longitude: account.presenceLocations[0].longitude,
            recordedAt: account.presenceLocations[0].recordedAt,
          }
        : null,
    }));
  }
}

export type { PersistedGeofence, PersistedStudentPresence };