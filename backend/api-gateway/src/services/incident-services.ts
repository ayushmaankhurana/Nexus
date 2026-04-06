import { PrismaClient, IncidentStatus, IncidentSeverity, IncidentSource } from '@prisma/client';
import { getPrismaClient } from '../lib/prisma';

type CreateIncidentInput = {
  accountId: string;
  title: string;
  type: string;
  description: string;
  source?: IncidentSource;
  severity?: IncidentSeverity;
  assignedTo?: string | null;
};

type ListIncidentFilters = {
  status?: string;
  assignedTo?: string;
  accountId?: string;
};

export class IncidentService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = getPrismaClient();
  }

  private mapIncident(incident: any) {
    const firstName = incident.account?.profile?.firstName ?? '';
    const lastName = incident.account?.profile?.lastName ?? '';
    const studentName = `${firstName} ${lastName}`.trim();

    return {
      id: incident.id,
      title: incident.title,
      type: incident.type,
      description: incident.description,
      severity: incident.severity.toLowerCase(),
      status: incident.status.toLowerCase(),
      reportedBy: incident.accountId,
      reportedByName: studentName || incident.account?.email || incident.account?.rollNumber,
      assignedTo: incident.assignedTo,
      studentId: incident.accountId,
      studentName: studentName || undefined,
      location: null,
      createdAt: incident.createdAt,
      updatedAt: incident.updatedAt,
      resolvedAt: incident.resolvedAt,
      comments: [],
      source: incident.source.toLowerCase(),
    };
  }

  async createIncident(input: CreateIncidentInput) {
    const created = await this.prisma.incident.create({
      data: {
        accountId: input.accountId,
        title: input.title,
        type: input.type,
        description: input.description,
        source: input.source ?? IncidentSource.MANUAL,
        severity: input.severity ?? IncidentSeverity.MEDIUM,
        assignedTo: input.assignedTo ?? null,
        status: IncidentStatus.OPEN,
      },
      include: {
        account: {
          include: {
            profile: true,
          },
        },
      },
    });

    return this.mapIncident(created);
  }

  async listIncidents(filters: ListIncidentFilters = {}) {
    const where: any = {};

    if (filters.status) {
      where.status = filters.status.toUpperCase();
    }

    if (filters.assignedTo) {
      where.assignedTo = filters.assignedTo;
    }

    if (filters.accountId) {
      where.accountId = filters.accountId;
    }

    const incidents = await this.prisma.incident.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        account: {
          include: {
            profile: true,
          },
        },
      },
    });

    return incidents.map((incident) => this.mapIncident(incident));
  }

  async getIncidentById(id: string) {
    const incident = await this.prisma.incident.findUnique({
      where: { id },
      include: {
        account: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (!incident) return null;
    return this.mapIncident(incident);
  }

  async assignIncident(id: string, assignedTo: string) {
    const updated = await this.prisma.incident.update({
      where: { id },
      data: {
        assignedTo,
        status: IncidentStatus.ASSIGNED,
      },
      include: {
        account: {
          include: {
            profile: true,
          },
        },
      },
    });

    return this.mapIncident(updated);
  }

  async resolveIncident(id: string) {
    const updated = await this.prisma.incident.update({
      where: { id },
      data: {
        status: IncidentStatus.RESOLVED,
        resolvedAt: new Date(),
      },
      include: {
        account: {
          include: {
            profile: true,
          },
        },
      },
    });

    return this.mapIncident(updated);
  }

  async updateIncident(
    id: string,
    data: {
      status?: string;
      assignedTo?: string | null;
      severity?: string;
      title?: string;
      description?: string;
    }
  ) {
    const updateData: any = {};

    if (data.status) updateData.status = data.status.toUpperCase();
    if (typeof data.assignedTo !== 'undefined') updateData.assignedTo = data.assignedTo;
    if (data.severity) updateData.severity = data.severity.toUpperCase();
    if (data.title) updateData.title = data.title;
    if (data.description) updateData.description = data.description;

    if (data.status && data.status.toUpperCase() === 'RESOLVED') {
      updateData.resolvedAt = new Date();
    }

    const updated = await this.prisma.incident.update({
      where: { id },
      data: updateData,
      include: {
        account: {
          include: {
            profile: true,
          },
        },
      },
    });

    return this.mapIncident(updated);
  }

  async createAccessDenialIncident(params: {
    accountId: string;
    geofenceId: string;
    reason?: string | null;
  }) {
    return this.createIncident({
      accountId: params.accountId,
      title: 'Access denied',
      type: 'ACCESS_DENIAL',
      description: `Access denied at geofence ${params.geofenceId}${params.reason ? `: ${params.reason}` : ''}`,
      source: IncidentSource.ACCESS_DENIAL,
      severity: IncidentSeverity.HIGH,
    });
  }

  async createAttendanceFailureIncident(params: {
    accountId: string;
    classId: string;
    reason?: string | null;
  }) {
    return this.createIncident({
      accountId: params.accountId,
      title: 'Attendance failure',
      type: 'ATTENDANCE_FAILURE',
      description: `Attendance failed for class ${params.classId}${params.reason ? `: ${params.reason}` : ''}`,
      source: IncidentSource.ATTENDANCE_FAILURE,
      severity: IncidentSeverity.MEDIUM,
    });
  }
}