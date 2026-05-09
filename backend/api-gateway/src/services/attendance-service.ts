/**
 * attendance-service.ts
 * Person 3 scope: Attendance & Schedule Service
 *
 * Owns:
 *  - Listing a student's own attendance history
 *  - Admin/faculty listing attendance for a session
 *  - Marking attendance (QR + geofence validation, V1)
 *  - Faculty manual mark
 */

import {
  PrismaClient,
  AttendanceStatus,
  AttendanceMethod,
  ClassSessionTemplate,
  Prisma,
  UserRole,
} from '@prisma/client';
import { AppError } from '@nexus/core';
import { getPrismaClient } from '../lib/prisma';

// ── Config constants ───────────────────────────────────────────────────────────
/** Minutes after session start that a QR scan is still accepted as PRESENT */
const PRESENT_WINDOW_MIN = 10;
/** Minutes after PRESENT_WINDOW that a scan is accepted as LATE */
const LATE_WINDOW_MIN = 30;
/** Hard limit: QR tokens expire after this many seconds */
const QR_TOKEN_TTL_SECONDS = 45;

// ── Types ──────────────────────────────────────────────────────────────────────

export type MarkAttendanceInput = {
  studentAccountId: string;
  qrToken: string;
  /** The ClassSessionTemplate.id the QR was issued for */
  classSessionTemplateId: string;
  /** ISO date string for the scheduled class date (YYYY-MM-DD) */
  scheduledDate: string;
  geofenceValidated: boolean;
  /** Epoch ms of QR issuance (for expiry check) */
  qrIssuedAt: number;
};

export type FacultyMarkInput = {
  facultyAccountId: string;
  studentAccountId: string;
  classSessionTemplateId: string;
  scheduledDate: string;
  status: AttendanceStatus;
};

export type AttendanceFilters = {
  accountId?: string;
  classSessionTemplateId?: string;
  from?: Date;
  to?: Date;
  status?: AttendanceStatus;
  page?: number;
  pageSize?: number;
  /** When set, limits results to sessions belonging to this faculty's assigned sections */
  facultyAccountId?: string;
};

export type AttendanceRecordView = {
  id: string;
  accountId: string;
  studentName: string;
  rollNumber: string;
  classSessionTemplateId: string;
  room: string;
  courseCode: string;
  courseTitle: string;
  scheduledDate: Date;
  timestamp: Date;
  status: AttendanceStatus;
  method: AttendanceMethod;
  geofenceValidated: boolean;
};

export type AttendanceListResult = {
  data: AttendanceRecordView[];
  total: number;
  page: number;
  pageSize: number;
};

// ── Helper ─────────────────────────────────────────────────────────────────────

/** Compute whether a scan timestamp is PRESENT, LATE, or outside window */
function deriveStatus(
  scheduledDate: Date,
  startTime: string, // "09:00"
  scanAt: Date,
): AttendanceStatus | null {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const sessionStart = new Date(scheduledDate);
  sessionStart.setHours(startHour, startMin, 0, 0);

  const diffMinutes = (scanAt.getTime() - sessionStart.getTime()) / 60_000;

  if (diffMinutes < -5) return null; // too early – reject
  if (diffMinutes <= PRESENT_WINDOW_MIN) return AttendanceStatus.PRESENT;
  if (diffMinutes <= LATE_WINDOW_MIN) return AttendanceStatus.LATE;
  return null; // too late – reject
}

function buildScheduledSessionDate(dateString: string, startTime: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  const [hour, minute] = startTime.split(':').map(Number);
  return new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0));
}

// ── Service ────────────────────────────────────────────────────────────────────

export class AttendanceService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = getPrismaClient();
  }

  // ── 1. Mark attendance via QR (V1 primary path) ──────────────────────────────

  async markAttendance(input: MarkAttendanceInput): Promise<AttendanceRecordView> {
    const now = new Date();

    // 1a. QR token expiry check
    const qrAgeSeconds = (now.getTime() - input.qrIssuedAt) / 1000;
    if (qrAgeSeconds > QR_TOKEN_TTL_SECONDS) {
      throw new AppError('QR_EXPIRED', 400, 'QR code has expired. Ask your faculty to refresh it.');
    }

    // 1b. Load the session template
    const template = await this.prisma.classSessionTemplate.findUnique({
      where: { id: input.classSessionTemplateId },
      include: {
        section: { include: { course: true } },
      },
    });

    if (!template) {
      throw new AppError('SESSION_NOT_FOUND', 404, 'Class session template not found.');
    }

    // 1c. Geofence validation is mandatory for V1 QR path
    if (!input.geofenceValidated) {
      throw new AppError(
        'GEOFENCE_FAILED',
        400,
        'You must be within the classroom geofence to mark attendance.',
      );
    }

    // 1d. Derive time-based status
    const scheduledDate = buildScheduledSessionDate(input.scheduledDate, template.startTime);
    const status = deriveStatus(scheduledDate, template.startTime, now);

    if (!status) {
      throw new AppError(
        'OUTSIDE_ATTENDANCE_WINDOW',
        400,
        `Attendance window has closed for this session (${LATE_WINDOW_MIN} min after start).`,
      );
    }

    // 1e. Check for duplicate
    const existing = await this.prisma.attendanceRecord.findUnique({
      where: {
        accountId_classSessionTemplateId_scheduledDate: {
          accountId: input.studentAccountId,
          classSessionTemplateId: input.classSessionTemplateId,
          scheduledDate,
        },
      },
    });

    if (existing) {
      throw new AppError('ALREADY_MARKED', 409, 'Attendance already recorded for this session.');
    }

    // 1f. Verify student is enrolled in this section/group
    const enrolled = await this.prisma.studentGroupMembership.findFirst({
      where: {
        accountId: input.studentAccountId,
        group: { sectionId: template.sectionId },
      },
    });

    if (!enrolled) {
      throw new AppError(
        'NOT_ENROLLED',
        403,
        'You are not enrolled in the section for this session.',
      );
    }

    // 1g. Create attendance record
    const record = await this.prisma.attendanceRecord.create({
      data: {
        accountId: input.studentAccountId,
        classSessionTemplateId: input.classSessionTemplateId,
        scheduledDate,
        status,
        method: AttendanceMethod.QR,
        qrToken: input.qrToken,
        geofenceValidated: true,
      },
      include: {
        account: { include: { profile: true } },
        classSessionTemplate: { include: { section: { include: { course: true } } } },
      },
    });

    return this.mapRecord(record);
  }

  // ── 2. Faculty manual mark ────────────────────────────────────────────────────

  async facultyMarkAttendance(input: FacultyMarkInput): Promise<AttendanceRecordView> {
    const actingAccount = await this.prisma.account.findUnique({
      where: { id: input.facultyAccountId },
      select: { role: true },
    });

    if (!actingAccount) {
      throw new AppError('ACCOUNT_NOT_FOUND', 404, 'Acting account not found.');
    }

    // Faculty must own the section; admins are allowed to bypass assignment checks for demo operations.
    if (actingAccount.role !== UserRole.ADMIN) {
      const assignment = await this.prisma.facultyAssignment.findFirst({
        where: {
          facultyAccountId: input.facultyAccountId,
          section: {
            templates: { some: { id: input.classSessionTemplateId } },
          },
        },
      });

      if (!assignment) {
        throw new AppError(
          'NOT_AUTHORIZED',
          403,
          'You are not assigned to the section for this session.',
        );
      }
    }

    const template = await this.prisma.classSessionTemplate.findUnique({
      where: { id: input.classSessionTemplateId },
      select: { startTime: true },
    });

    if (!template) {
      throw new AppError('SESSION_NOT_FOUND', 404, 'Class session template not found.');
    }

    const scheduledDate = buildScheduledSessionDate(input.scheduledDate, template.startTime);

    // Upsert: allow faculty to correct an existing mark
    const record = await this.prisma.attendanceRecord.upsert({
      where: {
        accountId_classSessionTemplateId_scheduledDate: {
          accountId: input.studentAccountId,
          classSessionTemplateId: input.classSessionTemplateId,
          scheduledDate,
        },
      },
      create: {
        accountId: input.studentAccountId,
        classSessionTemplateId: input.classSessionTemplateId,
        scheduledDate,
        status: input.status,
        method: AttendanceMethod.MANUAL,
        geofenceValidated: false,
        markedByFacultyId: input.facultyAccountId,
      },
      update: {
        status: input.status,
        method: AttendanceMethod.MANUAL,
        markedByFacultyId: input.facultyAccountId,
        timestamp: new Date(),
      },
      include: {
        account: { include: { profile: true } },
        classSessionTemplate: { include: { section: { include: { course: true } } } },
      },
    });

    return this.mapRecord(record);
  }

  // ── 3. Student: own attendance history ───────────────────────────────────────

  async listOwnAttendance(
    studentAccountId: string,
    filters: Omit<AttendanceFilters, 'accountId'>,
  ): Promise<AttendanceListResult> {
    return this.listAttendance({ ...filters, accountId: studentAccountId });
  }

  // ── 4. Admin/faculty: filtered attendance list ───────────────────────────────

  async listAttendance(filters: AttendanceFilters): Promise<AttendanceListResult> {
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));
    const skip = (page - 1) * pageSize;

    // If facultyAccountId is set, scope to their assigned sections only
    let allowedTemplateIds: string[] | undefined;
    if (filters.facultyAccountId) {
      const assignments = await this.prisma.facultyAssignment.findMany({
        where: { facultyAccountId: filters.facultyAccountId },
        select: { sectionId: true },
      });

      const sectionIds = assignments
        .map((a) => a.sectionId)
        .filter((id): id is string => id !== null);

      if (sectionIds.length === 0) {
        // Faculty has no assigned sections — return empty result
        return { data: [], total: 0, page, pageSize };
      }

      const templates = await this.prisma.classSessionTemplate.findMany({
        where: { sectionId: { in: sectionIds } },
        select: { id: true },
      });

      allowedTemplateIds = templates.map((t) => t.id);

      if (allowedTemplateIds.length === 0) {
        return { data: [], total: 0, page, pageSize };
      }
    }

    const where: Prisma.AttendanceRecordWhereInput = {
      ...(filters.accountId && { accountId: filters.accountId }),
      ...(filters.classSessionTemplateId && {
        classSessionTemplateId: filters.classSessionTemplateId,
      }),
      ...(allowedTemplateIds && {
        classSessionTemplateId: { in: allowedTemplateIds },
      }),
      ...(filters.status && { status: filters.status }),
      ...((filters.from || filters.to) && {
        scheduledDate: {
          ...(filters.from && { gte: filters.from }),
          ...(filters.to && { lte: filters.to }),
        },
      }),
    };

    const [total, rows] = await Promise.all([
      this.prisma.attendanceRecord.count({ where }),
      this.prisma.attendanceRecord.findMany({
        where,
        orderBy: { scheduledDate: 'desc' },
        skip,
        take: pageSize,
        include: {
          account: { include: { profile: true } },
          classSessionTemplate: { include: { section: { include: { course: true } } } },
        },
      }),
    ]);

    return {
      data: rows.map(this.mapRecord),
      total,
      page,
      pageSize,
    };
  }

  // ── 5. Session summary (for a specific date + template) ──────────────────────

  async getSessionSummary(
    classSessionTemplateId: string,
    scheduledDate: string,
    requestingFacultyId: string,
  ): Promise<{
    templateId: string;
    scheduledDate: Date;
    present: number;
    late: number;
    absent: number;
    excused: number;
    total: number;
    records: AttendanceRecordView[];
  }> {
    // Ownership check
    const assignment = await this.prisma.facultyAssignment.findFirst({
      where: {
        facultyAccountId: requestingFacultyId,
        section: {
          templates: { some: { id: classSessionTemplateId } },
        },
      },
    });

    if (!assignment) {
      throw new AppError('FORBIDDEN', 403, 'You are not assigned to this session.');
    }

    const date = new Date(scheduledDate);

    const records = await this.prisma.attendanceRecord.findMany({
      where: { classSessionTemplateId, scheduledDate: date },
      include: {
        account: { include: { profile: true } },
        classSessionTemplate: { include: { section: { include: { course: true } } } },
      },
    });

    const counts = { present: 0, late: 0, absent: 0, excused: 0 };
    for (const r of records) {
      if (r.status === AttendanceStatus.PRESENT) counts.present++;
      else if (r.status === AttendanceStatus.LATE) counts.late++;
      else if (r.status === AttendanceStatus.ABSENT) counts.absent++;
      else if (r.status === AttendanceStatus.EXCUSED) counts.excused++;
    }

    return {
      templateId: classSessionTemplateId,
      scheduledDate: date,
      ...counts,
      total: records.length,
      records: records.map(this.mapRecord),
    };
  }

  // ── Private mapper ────────────────────────────────────────────────────────────

  private mapRecord(record: any): AttendanceRecordView {
    return {
      id: record.id,
      accountId: record.accountId,
      studentName: record.account?.profile
        ? `${record.account.profile.firstName} ${record.account.profile.lastName}`
        : 'Unknown',
      rollNumber: record.account?.rollNumber ?? '',
      classSessionTemplateId: record.classSessionTemplateId,
      room: record.classSessionTemplate?.room ?? '',
      courseCode: record.classSessionTemplate?.section?.course?.code ?? '',
      courseTitle: record.classSessionTemplate?.section?.course?.title ?? '',
      scheduledDate: record.scheduledDate,
      timestamp: record.timestamp,
      status: record.status,
      method: record.method,
      geofenceValidated: record.geofenceValidated,
    };
  }
}