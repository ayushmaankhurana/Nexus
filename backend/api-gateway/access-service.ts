import { AccessCheckRequest, AccessCheckResult, AccessEvent, AppError } from '@nexus/core';
import { PrismaAccessStore } from '../stores/prisma-access-store';
import { PrismaAuthStore } from '../stores/prisma-auth-store';
import { PrismaParkingStore } from '../stores/prisma-parking-store';

export class AccessService {
  constructor(private store: PrismaAccessStore, private authStore: PrismaAuthStore, private parkingStore: PrismaParkingStore) {}

  async checkAccess(
    studentId: string,
    deviceId: string,
    request: AccessCheckRequest,
    userRole?: string
  ): Promise<AccessCheckResult> {
    // 1. Validate student and device are active
    const activeSession = await this.authStore.getActiveDeviceSession(studentId);
    if (!activeSession || activeSession.deviceId !== deviceId) {
      throw new AppError('DEVICE_NOT_ACTIVE', 403, 'No active session for this device');
    }

    // 2. Record access_attempted event
    await this.recordAccessEvent({
      studentId,
      checkpoint: request.checkpoint,
      timestamp: request.timestamp || new Date().toISOString(),
      method: request.method,
      eventType: request.eventType,
      zoneId: request.zoneId,
      parkingAreaId: request.parkingAreaId,
      status: 'pending',
      reason: 'Access attempt initiated',
    });

    // 3. Check access based on eventType
    let allowed = false;
    let reason = '';

    if (userRole === 'admin' || request.adminOverride) {
      // Admin override
      allowed = true;
      reason = 'Admin override';
    } else {
      if (request.eventType === 'gate') {
        allowed = await this.validateGateEntry(studentId, request.checkpoint, request.zoneId);
        reason = allowed ? 'Gate validation passed' : 'Gate validation failed';
      } else if (request.eventType === 'parking') {
        allowed = await this.validateParkingEntry(studentId, request.parkingAreaId!);
        reason = allowed ? 'Parking validation passed' : 'Parking validation failed';
      } else {
        allowed = false;
        reason = 'Unsupported event type';
      }
    }

    // 4. Record final event
    const finalStatus = allowed ? 'allowed' : 'denied';
    const finalEvent = await this.recordAccessEvent({
      studentId,
      checkpoint: request.checkpoint,
      timestamp: request.timestamp || new Date().toISOString(),
      method: request.method,
      eventType: request.eventType,
      zoneId: request.zoneId,
      parkingAreaId: request.parkingAreaId,
      status: finalStatus,
      reason,
    });

    return {
      studentId,
      allowed,
      status: finalStatus,
      reason,
      event: finalEvent,
    };
  }

  async validateGateEntry(
    studentId: string,
    checkpoint: string,
    zoneId?: string
  ): Promise<boolean> {
    // Validate gate entry rules
    // Check student active device, zone rules
    // For now, stub: always allow if student is active (checked in checkAccess)
    // TODO: Integrate with campus service for zone rules
    return true;
  }
  async validateParkingEntry(
    studentId: string,
    parkingAreaId: string
  ): Promise<boolean> {
    // Validate parking entitlement
    // Check if student has valid parking access
    return await this.parkingStore.hasValidParkingEntitlement(studentId, parkingAreaId);
  }

  async recordAccessEvent(event: Omit<AccessEvent, 'id'>): Promise<AccessEvent> {
    // Record event to store
    return await this.store.createAccessEvent(event);
  }

  async getAccessHistoryByStudentId(studentId: string): Promise<AccessEvent[]> {
    // Retrieve access history for a student
    return await this.store.getAccessHistoryByStudentId(studentId);
  }
}