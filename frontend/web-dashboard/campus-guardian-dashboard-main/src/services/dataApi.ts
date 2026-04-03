import { apiGet, apiPost, apiPatch } from "./apiClient";
import type { User, AttendanceRecord, AttendanceSummary, AccessEvent, Incident, Alert, PresenceRecord, TracePoint, SupportIssue, ActivityEvent, PaginatedResponse, AccessRequest } from "@/types";
import * as mock from "@/mocks/data";

const USE_MOCK = true;
const delay = (ms = 500) => new Promise((r) => setTimeout(r, ms));

export const studentsApi = {
  async getMe(): Promise<User> {
    if (USE_MOCK) { await delay(); return mock.mockStudentUser; }
    return apiGet("/students/me");
  },
  async getAll(params?: Record<string, string>): Promise<PaginatedResponse<User>> {
    if (USE_MOCK) { await delay(); return { data: mock.mockStudents, total: mock.mockStudents.length, page: 1, pageSize: 20, totalPages: 1 }; }
    return apiGet("/students", params);
  },
  async getById(id: string): Promise<User> {
    if (USE_MOCK) { await delay(); return mock.mockStudents.find(s => s.id === id) || mock.mockStudentUser; }
    return apiGet(`/students/${id}`);
  },
  async getActivity(id: string): Promise<ActivityEvent[]> {
    if (USE_MOCK) { await delay(); return mock.mockActivityEvents.filter(e => e.userId === id); }
    return apiGet(`/students/${id}/activity`);
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
