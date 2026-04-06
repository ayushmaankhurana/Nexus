import {
  AccessAction,
  AccessEvent,
  AccessReason,
  AccountStatus,
  Prisma,
  PrismaClient,
} from '@prisma/client';
import { AppError } from '@nexus/core';
import { getPrismaClient } from '../lib/prisma';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const DENIAL_WINDOW_MS = 60 * 60 * 1000;
const DENIAL_ESCALATION_THRESHOLD = 3;

type AccessEventFilters = {
  accountId?: string;
  geofenceId?: string;
  action?: AccessAction;
  from?: Date;
  to?: Date;
  page?: number;
  pageSize?: number;
};

type CheckAccessInput = {
  accountId: string;
  geofenceId: string;
  action: Exclude<AccessAction, 'DENIED'>;
  credentialType?: 'RFID' | 'MANUAL' | 'QR';
  credentialValue?: string;
};

type AccessEventView = {
  id: string;
  accountId: string;
  studentId: string;
  rollNumber: string;
  studentName: string;
  geofenceId: string;
  geofenceName: string;
  geofenceType: string;
  timestamp: Date;
  action: AccessAction;
  reason: AccessReason | null;
};

type AccessEventListResult = {
  data: AccessEventView[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

type CheckAccessResult = {
  decision: 'ALLOW' | 'DENY';
  event: AccessEventView;
  shouldEscalate: boolean;
  deniedCountWindow: number;
};

type AccessEventRecord = Prisma.AccessEventGetPayload<{
  include: {
    account: {
      include: {
        profile: true;
      };
    };
    geofence: true;
  };
}>;

export class AccessService {
  constructor(private prisma: PrismaClient = getPrismaClient()) {}

  // This powers the self-service history endpoint while forcing the caller's account scope.
  async listOwnEvents(accountId: string, filters: Omit<AccessEventFilters, 'accountId'>): Promise<AccessEventListResult> {
    return this.listEvents({ ...filters, accountId });
  }

  // This powers admin or security search across access history with basic filtering and pagination.
  async listEvents(filters: AccessEventFilters): Promise<AccessEventListResult> {
    const page = filters.page && filters.page > 0 ? filters.page : DEFAULT_PAGE;
    const pageSize = Math.min(filters.pageSize && filters.pageSize > 0 ? filters.pageSize : DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    const where = this.buildWhereClause(filters);

    const [events, total] = await this.prisma.$transaction([
      this.prisma.accessEvent.findMany({
        where,
        include: {
          account: {
            include: {
              profile: true,
            },
          },
          geofence: true,
        },
        orderBy: {
          timestamp: 'desc',
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.accessEvent.count({ where }),
    ]);

    return {
      data: events.map((event) => this.mapAccessEvent(event)),
      total,
      page,
      pageSize,
      totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
    };
  }

  // This evaluates a v0 access decision, records the final event, and returns a simple escalation hint.
  async checkAccess(input: CheckAccessInput): Promise<CheckAccessResult> {
    const account = await this.prisma.account.findUnique({
      where: { id: input.accountId },
      include: {
        profile: true,
      },
    });

    if (!account) {
      throw new AppError('ACCOUNT_NOT_FOUND', 404, 'Account not found');
    }

    const geofence = await this.prisma.geofence.findUnique({
      where: { id: input.geofenceId },
    });

    if (!geofence) {
      throw new AppError('UNKNOWN_GEOFENCE', 404, 'Geofence not found');
    }

    let finalAction: AccessAction = input.action;
    let finalReason: AccessReason | null = null;

    // Inactive accounts are denied first so we still record the attempt against a known geofence.
    if (account.status !== AccountStatus.ACTIVE) {
      finalAction = AccessAction.DENIED;
      finalReason = AccessReason.INACTIVE_ACCOUNT;
    }

    // Disabled areas are treated as unauthorized until a richer policy model exists.
    if (!finalReason && !geofence.isActive) {
      finalAction = AccessAction.DENIED;
      finalReason = AccessReason.UNAUTHORIZED_AREA;
    }

    // This is the minimal v0 area rule: students cannot use parking geofences as controlled zones.
    if (!finalReason && geofence.type === 'PARKING' && account.role === 'STUDENT') {
      finalAction = AccessAction.DENIED;
      finalReason = AccessReason.UNAUTHORIZED_AREA;
    }

    // RFID validation is only enforced when the caller explicitly submits an RFID attempt.
    if (!finalReason && input.credentialType === 'RFID') {
      if (!account.profile?.rfidTag || account.profile.rfidTag !== input.credentialValue) {
        finalAction = AccessAction.DENIED;
        finalReason = AccessReason.INVALID_RFID;
      }
    }

    const event = await this.prisma.accessEvent.create({
      data: {
        accountId: account.id,
        geofenceId: geofence.id,
        action: finalAction,
        reason: finalReason,
      },
      include: {
        account: {
          include: {
            profile: true,
          },
        },
        geofence: true,
      },
    });

    const deniedCountWindow = await this.getRecentDeniedCount(account.id);

    return {
      decision: finalAction === AccessAction.DENIED ? 'DENY' : 'ALLOW',
      event: this.mapAccessEvent(event),
      shouldEscalate: deniedCountWindow >= DENIAL_ESCALATION_THRESHOLD,
      deniedCountWindow,
    };
  }

  private buildWhereClause(filters: AccessEventFilters): Prisma.AccessEventWhereInput {
    const where: Prisma.AccessEventWhereInput = {};

    if (filters.accountId) {
      where.accountId = filters.accountId;
    }

    if (filters.geofenceId) {
      where.geofenceId = filters.geofenceId;
    }

    if (filters.action) {
      where.action = filters.action;
    }

    if (filters.from || filters.to) {
      where.timestamp = {};

      if (filters.from) {
        where.timestamp.gte = filters.from;
      }

      if (filters.to) {
        where.timestamp.lte = filters.to;
      }
    }

    return where;
  }

  private async getRecentDeniedCount(accountId: string): Promise<number> {
    return this.prisma.accessEvent.count({
      where: {
        accountId,
        action: AccessAction.DENIED,
        timestamp: {
          gte: new Date(Date.now() - DENIAL_WINDOW_MS),
        },
      },
    });
  }

  private mapAccessEvent(event: AccessEventRecord): AccessEventView {
    const firstName = event.account.profile?.firstName ?? '';
    const lastName = event.account.profile?.lastName ?? '';
    const studentName = `${firstName} ${lastName}`.trim() || event.account.rollNumber;

    return {
      id: event.id,
      accountId: event.accountId,
      studentId: event.accountId,
      rollNumber: event.account.rollNumber,
      studentName,
      geofenceId: event.geofenceId,
      geofenceName: event.geofence.name,
      geofenceType: event.geofence.type,
      timestamp: event.timestamp,
      action: event.action,
      reason: event.reason,
    };
  }
}

export type { AccessEventFilters, AccessEventListResult, AccessEventView, CheckAccessInput, CheckAccessResult };