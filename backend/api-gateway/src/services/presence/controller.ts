import { AppError } from '@nexus/core';
import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { PresenceService } from './service';
import { Location, BLEDetection, BatchLocation, GeofenceCheckRequest } from './model';
import { getPrismaClient } from '../../lib/prisma';

const presenceService = new PresenceService();

const locationBodySchema = z.object({
  userId: z.string().uuid().optional(),
  lat: z.number(),
  lng: z.number(),
  timestamp: z.number().optional(),
});

const batchLocationSchema = z.array(
  z.object({
    userId: z.string().uuid().optional(),
    locations: z.array(
      z.object({
        lat: z.number(),
        lng: z.number(),
        timestamp: z.number(),
      })
    ).min(1),
  })
);

const bleDetectionBodySchema = z.object({
  deviceId: z.string().min(1),
  seenBy: z.string().min(1),
  timestamp: z.number().optional(),
});

const geofenceCheckBodySchema = z.object({
  userId: z.string().uuid().optional(),
  zoneName: z.string().min(1),
});

const studentParamsSchema = z.object({
  studentId: z.string().uuid(),
});

const userIdParamsSchema = z.object({
  userId: z.string().uuid(),
});

function hasAnyRole(role: string, allowed: string[]): boolean {
  return allowed.includes(role.toUpperCase());
}

function isPrivileged(request: FastifyRequest): boolean {
  return hasAnyRole(request.user.role, ['ADMIN', 'SECURITY']);
}

function isFaculty(request: FastifyRequest): boolean {
  return hasAnyRole(request.user.role, ['FACULTY']);
}

function resolveBodyUserId(request: FastifyRequest, requestedUserId?: string): string {
  if (isPrivileged(request)) {
    return requestedUserId ?? request.user.sub;
  }

  return request.user.sub;
}

function assertCanReadUser(request: FastifyRequest, requestedUserId: string): string {
  if (requestedUserId === request.user.sub || isPrivileged(request) || isFaculty(request)) {
    return requestedUserId;
  }

  throw new AppError('FORBIDDEN', 403, 'You do not have permission to access this resource');
}

export class PresenceController {
  static async getPresenceOverview(request: FastifyRequest, reply: FastifyReply) {
    const privileged = isPrivileged(request);
    const faculty = isFaculty(request);

    if (!privileged && !faculty) {
      throw new AppError('FORBIDDEN', 403, 'Admin, security, or faculty access required');
    }

    if (faculty && !privileged) {
      // Faculty: scope to students in their assigned sections
      const prisma = getPrismaClient();
      const assignments = await prisma.facultyAssignment.findMany({
        where: { facultyAccountId: request.user.sub },
        select: { sectionId: true },
      });

      const sectionIds = assignments
        .map((a: { sectionId: string | null }) => a.sectionId)
        .filter((id: string | null): id is string => id !== null);

      if (sectionIds.length === 0) {
        return reply.code(200).send({ records: [], geofences: [] });
      }

      const memberships = await prisma.studentGroupMembership.findMany({
        where: { group: { sectionId: { in: sectionIds } } },
        select: { accountId: true },
      });

      const studentIds = [...new Set(memberships.map((m: { accountId: string }) => m.accountId))];
      const overview = await presenceService.getPresenceOverviewForStudents(studentIds);
      return reply.code(200).send(overview);
    }

    const overview = await presenceService.getPresenceOverview();
    return reply.code(200).send(overview);
  }

  static async updateLocation(request: FastifyRequest, reply: FastifyReply) {
    const body = locationBodySchema.parse(request.body);
    const userId = resolveBodyUserId(request, body.userId);
    const location: Location = { lat: body.lat, lng: body.lng, timestamp: body.timestamp ?? Date.now() };

    await presenceService.updateLocation(userId, location);

    return reply.code(200).send({
      success: true,
      message: 'Location updated successfully',
    });
  }

  static async getCurrentLocation(request: FastifyRequest, reply: FastifyReply) {
    const { userId } = userIdParamsSchema.parse(request.params);
    const targetUserId = assertCanReadUser(request, userId);
    const location = await presenceService.getCurrentLocation(targetUserId);

    if (!location) {
      throw new AppError('LOCATION_NOT_FOUND', 404, 'No location data found for this user');
    }

    return reply.code(200).send({
      userId: targetUserId,
      location,
    });
  }

  static async getLocationHistory(request: FastifyRequest, reply: FastifyReply) {
    const { userId } = userIdParamsSchema.parse(request.params);
    const targetUserId = assertCanReadUser(request, userId);
    const history = await presenceService.getLocationHistory(targetUserId);

    return reply.code(200).send({
      userId: targetUserId,
      history,
    });
  }

  static async batchUploadLocations(request: FastifyRequest, reply: FastifyReply) {
    const body = batchLocationSchema.parse(request.body);
    const privileged = isPrivileged(request);
    const batchData: BatchLocation[] = body.map((entry) => ({
      userId: privileged ? entry.userId : request.user.sub,
      locations: entry.locations,
    }));

    await presenceService.batchUploadLocations(batchData);

    return reply.code(200).send({
      success: true,
      message: `Processed ${batchData.length} batch(es) successfully`,
    });
  }

  static async storeBLEDetection(request: FastifyRequest, reply: FastifyReply) {
    const body = bleDetectionBodySchema.parse(request.body);
    const detection: BLEDetection = {
      deviceId: body.deviceId,
      seenBy: body.seenBy,
      timestamp: body.timestamp ?? Date.now(),
    };

    await presenceService.storeBLEDetection(request.user.sub, detection);

    return reply.code(200).send({
      success: true,
      message: 'BLE detection stored successfully',
    });
  }

  static async checkGeofence(request: FastifyRequest, reply: FastifyReply) {
    const body = geofenceCheckBodySchema.parse(request.body) as GeofenceCheckRequest;
    const userId = resolveBodyUserId(request, body.userId);
    const result = await presenceService.checkGeofence({ userId, zoneName: body.zoneName });

    return reply.code(200).send(result);
  }

  static async getPresenceSummary(request: FastifyRequest, reply: FastifyReply) {
    const { studentId } = studentParamsSchema.parse(request.params);
    const targetUserId = assertCanReadUser(request, studentId);
    const summary = await presenceService.getPresenceSummary(targetUserId);
    return reply.code(200).send(summary);
  }

  static async getPresenceTrail(request: FastifyRequest, reply: FastifyReply) {
    const { studentId } = studentParamsSchema.parse(request.params);
    const targetUserId = assertCanReadUser(request, studentId);
    const trail = await presenceService.getPresenceTrail(targetUserId);

    return reply.code(200).send({
      studentId: targetUserId,
      trail,
    });
  }
}