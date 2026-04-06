import { apiGet, apiPost, apiPatch } from "./apiClient";
import { normalizeUserRole, type User, type AttendanceRecord, type AttendanceSummary, type AccessEvent, type Incident, type Alert, type PresenceRecord, type TracePoint, type SupportIssue, type ActivityEvent, type PaginatedResponse, type AccessRequest } from "@/types";
import * as mock from "@/mocks/data";

const USE_MOCK = true;
const USE_MOCK_STUDENT_LOOKUP = false;
const USE_MOCK_ACCESS = false;
const USE_MOCK_ATTENDANCE = false;
const USE_MOCK_PRESENCE = false;
const delay = (ms = 500) => new Promise((r) => setTimeout(r, ms));

type BackendStudent = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: User["status"];
  studentId: string;
  department?: string;
  createdAt: string;
  lastLogin?: string;
  rfidTag?: string | null;
};

type BackendStudentProfile = {
  id: string;
  rollNumber: string;
  email: string;
  role: string;
  status: string;
  firstName: string;
  lastName: string;
  rfidTag: string | null;
};

type BackendAttendanceRecord = {
  id: string;
  accountId: string;
  studentName: string;
  rollNumber: string;
  courseCode: string;
  courseTitle: string;
  room: string;
  classSessionTemplateId: string;
  scheduledDate: string;
  timestamp: string;
  status: string;
  method: string;
  geofenceValidated: boolean;
};

type BackendAttendanceListResponse = {
  data: BackendAttendanceRecord[];
  total: number;
  page: number;
  pageSize: number;
};

type AttendanceManualMarkInput = {
  studentAccountId: string;
  classSessionTemplateId: string;
  scheduledDate: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
};

type BackendAccessHistory = {
  studentId: string;
  accessHistory: Array<{
    id: string;
    studentId: string;
    studentName: string;
    geofenceName: string;
    timestamp: string;
    action: string;
    reason: string | null;
  }>;
  total: number;
};

type BackendAccessEvent = {
  id: string;
  accountId: string;
  studentId: string;
  rollNumber: string;
  studentName: string;
  geofenceId: string;
  geofenceName: string;
  geofenceType: string;
  timestamp: string;
  action: "ENTRY" | "EXIT" | "DENIED";
  reason: string | null;
};

type BackendAccessCheckResult = {
  decision: "ALLOW" | "DENY";
  event: BackendAccessEvent;
  shouldEscalate: boolean;
  deniedCountWindow: number;
};

type AccessCheckInput = {
  accountId: string;
  geofenceId: string;
  action: "ENTRY" | "EXIT";
  credentialType?: "RFID" | "MANUAL" | "QR";
  credentialValue?: string;
};

type BackendPresenceOverview = {
  records: Array<{
    id: string;
    studentId: string;
    rollNumber: string;
    studentName: string;
    email: string;
    accountStatus: string;
    status: "active" | "inactive" | "missing";
    checkpoint: string;
    timestamp: string | null;
    lat: number | null;
    lng: number | null;
  }>;
  geofences: Array<{
    id: string;
    name: string;
    type: string;
    lat: number;
    lng: number;
    radius: number | null;
  }>;
};

type BackendPresenceSummary = {
  studentId: string;
  isPresent: boolean;
  lastSeen: string | null;
};

type BackendPresenceTrail = {
  studentId: string;
  trail: Array<{
    checkpoint: string;
    timestamp: string;
    duration?: number;
    lat?: number;
    lng?: number;
  }>;
};

export type PresenceOverview = {
  records: PresenceRecord[];
  geofences: Array<{
    id: string;
    name: string;
    type: string;
    lat: number;
    lng: number;
    radius: number | null;
  }>;
};

function mapBackendStudent(student: BackendStudent): User {
  return {
    id: student.id,
    name: student.name,
    email: student.email,
    role: normalizeUserRole(student.role),
    status: student.status,
    department: student.department,
    studentId: student.studentId,
    createdAt: student.createdAt,
    lastLogin: student.lastLogin,
  };
}

function mapBackendStudentProfile(profile: BackendStudentProfile): User {
  return {
    id: profile.id,
    name: `${profile.firstName} ${profile.lastName}`.trim() || profile.rollNumber,
    email: profile.email,
    role: normalizeUserRole(profile.role),
    status: profile.status as User["status"],
    studentId: profile.rollNumber,
    createdAt: new Date().toISOString(),
  };
}

function mapBackendAttendanceRecord(record: BackendAttendanceRecord): AttendanceRecord {
  const scheduledDate = new Date(record.scheduledDate).toISOString().split("T")[0];
  const timestamp = new Date(record.timestamp);
  const normalizedStatus = record.status.toLowerCase() as AttendanceRecord["status"];
  const isFlagged = normalizedStatus === "late" || normalizedStatus === "absent";

  const anomalyType = normalizedStatus === "excused"
    ? undefined
    : !record.geofenceValidated
    ? "Geofence validation failed"
    : normalizedStatus === "late"
      ? "Late arrival"
      : normalizedStatus === "absent"
        ? "Absence requires review"
        : undefined;

  return {
    id: record.id,
    studentId: record.accountId,
    studentName: record.studentName,
    rollNumber: record.rollNumber,
    classSessionTemplateId: record.classSessionTemplateId,
    date: scheduledDate,
    status: normalizedStatus,
    checkIn: timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    course: `${record.courseCode} - ${record.courseTitle}`,
    location: record.room,
    method: record.method,
    geofenceValidated: record.geofenceValidated,
    flagged: isFlagged,
    anomalyType,
  };
}

function buildAttendanceSummary(records: AttendanceRecord[]): AttendanceSummary {
  const summary = records.reduce(
    (acc, record) => {
      acc.totalDays += 1;
      if (record.status === "present") acc.present += 1;
      if (record.status === "absent") acc.absent += 1;
      if (record.status === "late") acc.late += 1;
      if (record.status === "excused") acc.excused += 1;
      return acc;
    },
    { totalDays: 0, present: 0, absent: 0, late: 0, excused: 0, percentage: 0 }
  );

  const attended = summary.present + summary.late + summary.excused;
  summary.percentage = summary.totalDays === 0 ? 0 : Number(((attended / summary.totalDays) * 100).toFixed(1));
  return summary;
}

function humanizeAccessReason(reason: string): string {
  return reason
    .toLowerCase()
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function mapBackendAccessEvent(event: BackendAccessEvent): AccessEvent {
  return {
    id: event.id,
    studentId: event.accountId,
    studentName: event.studentName,
    rollNumber: event.rollNumber,
    checkpoint: event.geofenceName,
    checkpointId: event.geofenceId,
    timestamp: event.timestamp,
    status: event.action === "DENIED" ? "denied" : "allowed",
    method: event.reason ? humanizeAccessReason(event.reason) : event.action === "EXIT" ? "Exit" : "Entry",
    direction: event.action === "EXIT" ? "out" : event.action === "ENTRY" ? "in" : undefined,
    action: event.action,
    reason: event.reason,
  };
}

function mapBackendAccessHistory(response: BackendAccessHistory): AccessEvent[] {
  return response.accessHistory.map((event) => ({
    id: event.id,
    studentId: event.studentId,
    studentName: event.studentName,
    checkpoint: event.geofenceName,
    timestamp: event.timestamp,
    status: event.action === "DENIED" ? "denied" : "allowed",
    method: event.reason ?? "System Rule",
    direction: event.action === "EXIT" ? "out" : "in",
  }));
}

function mapBackendPresenceRecord(record: BackendPresenceOverview["records"][number]): PresenceRecord {
  return {
    id: record.id,
    studentId: record.studentId,
    studentName: record.studentName,
    rollNumber: record.rollNumber,
    checkpoint: record.checkpoint,
    timestamp: record.timestamp ?? new Date(0).toISOString(),
    status: record.status,
    lat: record.lat,
    lng: record.lng,
  };
}

export const studentsApi = {
  async getMe(): Promise<User> {
    if (USE_MOCK) { await delay(); return mock.mockStudentUser; }
    return apiGet("/students/me");
  },
  async getAll(params?: Record<string, string>): Promise<PaginatedResponse<User>> {
    if (USE_MOCK_STUDENT_LOOKUP) { await delay(); return { data: mock.mockStudents, total: mock.mockStudents.length, page: 1, pageSize: 20, totalPages: 1 }; }
    const response = await apiGet<PaginatedResponse<BackendStudent>>("/admin/students", params);
    return {
      ...response,
      data: response.data.map(mapBackendStudent),
    };
  },
  async getById(id: string): Promise<User> {
    if (USE_MOCK_STUDENT_LOOKUP) { await delay(); return mock.mockStudents.find(s => s.id === id) || mock.mockStudentUser; }
    const response = await apiGet<BackendStudentProfile>(`/students/${id}/profile`);
    return mapBackendStudentProfile(response);
  },
  async getActivity(id: string): Promise<ActivityEvent[]> {
    if (USE_MOCK) { await delay(); return mock.mockActivityEvents.filter(e => e.userId === id); }
    return apiGet(`/students/${id}/activity`);
  },
  async getAttendance(id: string): Promise<AttendanceRecord[]> {
    const response = await apiGet<PaginatedResponse<BackendAttendanceRecord>>("/attendance/records", {
      accountId: id,
      page: "1",
      pageSize: "5",
    });
    return response.data.map(mapBackendAttendanceRecord);
  },
  async getAccess(id: string): Promise<AccessEvent[]> {
    const response = await apiGet<BackendAccessHistory>(`/access/${id}`, {
      page: "1",
      pageSize: "5",
    });
    return mapBackendAccessHistory(response);
  },
};

export const attendanceApi = {
  async getAll(params?: Record<string, string>): Promise<PaginatedResponse<AttendanceRecord>> {
    if (USE_MOCK_ATTENDANCE) { await delay(); return { data: mock.mockAttendanceRecords, total: mock.mockAttendanceRecords.length, page: 1, pageSize: 20, totalPages: 1 }; }
    const response = await apiGet<BackendAttendanceListResponse>("/attendance/records", params);
    return {
      data: response.data.map(mapBackendAttendanceRecord),
      total: response.total,
      page: response.page,
      pageSize: response.pageSize,
      totalPages: response.total === 0 ? 0 : Math.ceil(response.total / response.pageSize),
    };
  },
  async getMine(): Promise<{ summary: AttendanceSummary; records: AttendanceRecord[] }> {
    if (USE_MOCK_ATTENDANCE) { await delay(); return { summary: mock.mockAttendanceSummary, records: mock.mockAttendanceRecords.filter(r => r.studentId === "stu-001") }; }
    const response = await apiGet<BackendAttendanceListResponse>("/attendance/me", { page: "1", pageSize: "100" });
    const records = response.data.map(mapBackendAttendanceRecord);
    return {
      summary: buildAttendanceSummary(records),
      records,
    };
  },
  async getAnomalies(): Promise<AttendanceRecord[]> {
    if (USE_MOCK_ATTENDANCE) { await delay(); return mock.mockAttendanceRecords.filter(r => r.flagged); }
    const response = await apiGet<BackendAttendanceListResponse>("/attendance/records", { page: "1", pageSize: "100" });
    return response.data.map(mapBackendAttendanceRecord).filter((record) => record.flagged);
  },
  async markManual(body: AttendanceManualMarkInput): Promise<AttendanceRecord> {
    if (USE_MOCK_ATTENDANCE) {
      await delay();
      return {
        ...mock.mockAttendanceRecords[0],
        studentId: body.studentAccountId,
        classSessionTemplateId: body.classSessionTemplateId,
        date: body.scheduledDate,
        status: body.status.toLowerCase() as AttendanceRecord["status"],
      };
    }

    const response = await apiPost<{ attendance: BackendAttendanceRecord }>("/attendance/faculty/mark", body);
    return mapBackendAttendanceRecord(response.attendance);
  },
};

export const accessApi = {
  async getAll(params?: Record<string, string>): Promise<PaginatedResponse<AccessEvent>> {
    if (USE_MOCK_ACCESS) { await delay(); return { data: mock.mockAccessEvents, total: mock.mockAccessEvents.length, page: 1, pageSize: 20, totalPages: 1 }; }
    const response = await apiGet<PaginatedResponse<BackendAccessEvent>>("/access/events", params);
    return {
      ...response,
      data: response.data.map(mapBackendAccessEvent),
    };
  },
  async getMine(): Promise<{ events: AccessEvent[]; requests: AccessRequest[] }> {
    if (USE_MOCK_ACCESS) { await delay(); return { events: mock.mockAccessEvents.filter(e => e.studentId === "stu-001"), requests: mock.mockAccessRequests.filter(r => r.studentId === "stu-001") }; }
    const response = await apiGet<PaginatedResponse<BackendAccessEvent>>("/access/me/events");
    return {
      events: response.data.map(mapBackendAccessEvent),
      requests: [],
    };
  },
  async check(body: AccessCheckInput): Promise<{ decision: "ALLOW" | "DENY"; event: AccessEvent; shouldEscalate: boolean; deniedCountWindow: number }> {
    if (USE_MOCK_ACCESS) {
      await delay();
      const fallbackEvent = mock.mockAccessEvents[0];
      return {
        decision: fallbackEvent.status === "denied" ? "DENY" : "ALLOW",
        event: fallbackEvent,
        shouldEscalate: false,
        deniedCountWindow: 0,
      };
    }

    const response = await apiPost<BackendAccessCheckResult>("/access/check", body);
    return {
      ...response,
      event: mapBackendAccessEvent(response.event),
    };
  },
  async approve(id: string): Promise<void> {
    if (USE_MOCK) { await delay(); return; }
    return apiPost(`/access/${id}/approve`);
  },
  async deny(id: string): Promise<void> {
    if (USE_MOCK) { await delay(); return; }
    return apiPost(`/access/${id}/deny`);
  },
  async createRequest(body: { area: string; reason: string }): Promise<AccessRequest> {
    if (USE_MOCK) { await delay(); return { ...mock.mockAccessRequests[0], id: `req-${Date.now()}`, ...body, status: "pending", requestedAt: new Date().toISOString() }; }
    return apiPost("/access/request", body);
  },
};

export const incidentsApi = {
  async getAll(params?: Record<string, string>): Promise<PaginatedResponse<Incident>> {
    if (USE_MOCK) { await delay(); return { data: mock.mockIncidents, total: mock.mockIncidents.length, page: 1, pageSize: 20, totalPages: 1 }; }
    return apiGet("/incidents", params);
  },
  async getById(id: string): Promise<Incident> {
    if (USE_MOCK) { await delay(); return mock.mockIncidents.find(i => i.id === id) || mock.mockIncidents[0]; }
    return apiGet(`/incidents/${id}`);
  },
  async create(body: Partial<Incident>): Promise<Incident> {
    if (USE_MOCK) { await delay(); return { ...mock.mockIncidents[0], id: `inc-${Date.now()}`, ...body } as Incident; }
    return apiPost("/incidents", body);
  },
  async update(id: string, body: Partial<Incident>): Promise<Incident> {
    if (USE_MOCK) { await delay(); const inc = mock.mockIncidents.find(i => i.id === id) || mock.mockIncidents[0]; return { ...inc, ...body }; }
    return apiPatch(`/incidents/${id}`, body);
  },
};

export const alertsApi = {
  async getAll(params?: Record<string, string>): Promise<PaginatedResponse<Alert>> {
    if (USE_MOCK) { await delay(); return { data: mock.mockAlerts, total: mock.mockAlerts.length, page: 1, pageSize: 20, totalPages: 1 }; }
    return apiGet("/alerts", params);
  },
  async getMine(): Promise<Alert[]> {
    if (USE_MOCK) { await delay(); return mock.mockAlerts.filter(a => a.targetUserId === "stu-001" || !a.targetUserId); }
    return apiGet("/alerts/me");
  },
  async markRead(id: string): Promise<void> {
    if (USE_MOCK) { await delay(); return; }
    return apiPatch(`/alerts/${id}/read`);
  },
  async updateStatus(id: string, status: string): Promise<void> {
    if (USE_MOCK) { await delay(); return; }
    return apiPatch(`/alerts/${id}/status`, { status });
  },
};

export const presenceApi = {
  async getOverview(): Promise<PresenceOverview> {
    if (USE_MOCK_PRESENCE) {
      await delay();
      return {
        records: mock.mockPresenceRecords,
        geofences: [],
      };
    }

    const response = await apiGet<BackendPresenceOverview>("/presence/overview");
    return {
      records: response.records.map(mapBackendPresenceRecord),
      geofences: response.geofences,
    };
  },
  async getByStudent(studentId: string): Promise<PresenceRecord> {
    if (USE_MOCK_PRESENCE) {
      await delay();
      return mock.mockPresenceRecords.find((record) => record.studentId === studentId) || mock.mockPresenceRecords[0];
    }

    const [summary, overview] = await Promise.all([
      apiGet<BackendPresenceSummary>(`/presence/${studentId}`),
      apiGet<BackendPresenceOverview>("/presence/overview"),
    ]);

    const current = overview.records.find((record) => record.studentId === studentId);
    return current
      ? mapBackendPresenceRecord(current)
      : {
          id: studentId,
          studentId,
          checkpoint: "No recent signal",
          timestamp: summary.lastSeen ?? new Date(0).toISOString(),
          status: summary.isPresent ? "active" : "missing",
        };
  },
  async getTrace(studentId: string): Promise<TracePoint[]> {
    if (USE_MOCK_PRESENCE) { await delay(); return mock.mockTracePoints; }
    const response = await apiGet<BackendPresenceTrail>(`/presence/${studentId}/trail`);
    return response.trail;
  },
  async updateLocation(studentId: string, body: { lat: number; lng: number; timestamp?: number }): Promise<void> {
    if (USE_MOCK_PRESENCE) {
      await delay();
      return;
    }

    await apiPost("/presence/update-location", {
      userId: studentId,
      lat: body.lat,
      lng: body.lng,
      timestamp: body.timestamp ?? Date.now(),
    });
  },
};

export const supportApi = {
  async create(body: Partial<SupportIssue>): Promise<SupportIssue> {
    if (USE_MOCK) { await delay(); return { ...mock.mockSupportIssues[0], id: `sup-${Date.now()}`, ...body, status: "open", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as SupportIssue; }
    return apiPost("/support/issues", body);
  },
  async getMine(): Promise<SupportIssue[]> {
    if (USE_MOCK) { await delay(); return mock.mockSupportIssues; }
    return apiGet("/support/issues/me");
  },
  async getAll(): Promise<SupportIssue[]> {
    if (USE_MOCK) { await delay(); return mock.mockSupportIssues; }
    return apiGet("/support/issues");
  },
};

export const activityApi = {
  async getAll(params?: Record<string, string>): Promise<PaginatedResponse<ActivityEvent>> {
    if (USE_MOCK) { await delay(); return { data: mock.mockActivityEvents, total: mock.mockActivityEvents.length, page: 1, pageSize: 50, totalPages: 1 }; }
    return apiGet("/activity", params);
  },
};
