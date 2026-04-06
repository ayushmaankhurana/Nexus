import { apiGet, apiPost, apiPatch } from "./apiClient";
import { normalizeUserRole, type User, type AttendanceRecord, type AttendanceSummary, type AccessEvent, type Incident, type Alert, type PresenceRecord, type TracePoint, type SupportIssue, type ActivityEvent, type PaginatedResponse, type AccessRequest } from "@/types";
import * as mock from "@/mocks/data";

const USE_MOCK = true;
const USE_MOCK_STUDENT_LOOKUP = false;
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
  scheduledDate: string;
  timestamp: string;
  status: string;
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

  return {
    id: record.id,
    studentId: record.accountId,
    studentName: record.studentName,
    date: scheduledDate,
    status: record.status.toLowerCase() as AttendanceRecord["status"],
    checkIn: timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    course: `${record.courseCode} - ${record.courseTitle}`,
    location: record.room,
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
    if (USE_MOCK) { await delay(); return { data: mock.mockAttendanceRecords, total: mock.mockAttendanceRecords.length, page: 1, pageSize: 20, totalPages: 1 }; }
    return apiGet("/attendance", params);
  },
  async getMine(): Promise<{ summary: AttendanceSummary; records: AttendanceRecord[] }> {
    if (USE_MOCK) { await delay(); return { summary: mock.mockAttendanceSummary, records: mock.mockAttendanceRecords.filter(r => r.studentId === "stu-001") }; }
    return apiGet("/attendance/me");
  },
  async getAnomalies(): Promise<AttendanceRecord[]> {
    if (USE_MOCK) { await delay(); return mock.mockAttendanceRecords.filter(r => r.flagged); }
    return apiGet("/attendance/anomalies");
  },
};

export const accessApi = {
  async getAll(params?: Record<string, string>): Promise<PaginatedResponse<AccessEvent>> {
    if (USE_MOCK) { await delay(); return { data: mock.mockAccessEvents, total: mock.mockAccessEvents.length, page: 1, pageSize: 20, totalPages: 1 }; }
    return apiGet("/access", params);
  },
  async getMine(): Promise<{ events: AccessEvent[]; requests: AccessRequest[] }> {
    if (USE_MOCK) { await delay(); return { events: mock.mockAccessEvents.filter(e => e.studentId === "stu-001"), requests: mock.mockAccessRequests.filter(r => r.studentId === "stu-001") }; }
    return apiGet("/access/me");
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
  async getAll(): Promise<PresenceRecord[]> {
    if (USE_MOCK) { await delay(); return mock.mockPresenceRecords; }
    return apiGet("/presence");
  },
  async getByStudent(studentId: string): Promise<PresenceRecord[]> {
    if (USE_MOCK) { await delay(); return mock.mockPresenceRecords.filter(p => p.studentId === studentId); }
    return apiGet(`/presence/${studentId}`);
  },
  async getTrace(studentId: string): Promise<TracePoint[]> {
    if (USE_MOCK) { await delay(); return mock.mockTracePoints; }
    return apiGet(`/presence/${studentId}/trace`);
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
