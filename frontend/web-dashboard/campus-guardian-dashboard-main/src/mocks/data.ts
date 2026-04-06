import type {
  User, Session, AttendanceRecord, AttendanceSummary, AccessEvent, AccessRequest,
  Incident, Alert, PresenceRecord, TracePoint, SupportIssue, ActivityEvent
} from "@/types";

const now = new Date();
const today = now.toISOString().split("T")[0];
const fmt = (d: Date) => d.toISOString();
const daysAgo = (n: number) => { const d = new Date(now); d.setDate(d.getDate() - n); return d; };

export const mockStudentUser: User = {
  id: "stu-001", name: "Amara Okonkwo", email: "amara.okonkwo@campus.edu",
  role: "STUDENT", status: "active", department: "Computer Science",
  studentId: "CS-2024-0847", createdAt: "2024-01-15T08:00:00Z", lastLogin: fmt(daysAgo(0)),
};

export const mockAdminUser: User = {
  id: "adm-001", name: "Director James Osei", email: "j.osei@campus.edu",
  role: "ADMIN", status: "active", department: "Campus Security",
  createdAt: "2022-06-01T08:00:00Z", lastLogin: fmt(daysAgo(0)),
};

export const mockSession: Session = {
  id: "sess-001", userId: "stu-001", deviceName: "iPhone 15 Pro",
  deviceType: "mobile", ipAddress: "192.168.1.45", isActive: true,
  lastActive: fmt(now), createdAt: fmt(daysAgo(3)),
};

export const mockStudents: User[] = [
  mockStudentUser,
  { id: "stu-002", name: "Kwame Mensah", email: "k.mensah@campus.edu", role: "STUDENT", status: "active", department: "Electrical Engineering", studentId: "EE-2024-0312", createdAt: "2024-01-15T08:00:00Z", lastLogin: fmt(daysAgo(1)) },
  { id: "stu-003", name: "Fatima Al-Rashid", email: "f.alrashid@campus.edu", role: "STUDENT", status: "active", department: "Business Administration", studentId: "BA-2024-0156", createdAt: "2024-02-01T08:00:00Z", lastLogin: fmt(daysAgo(0)) },
  { id: "stu-004", name: "David Kimani", email: "d.kimani@campus.edu", role: "STUDENT", status: "suspended", department: "Physics", studentId: "PH-2023-0934", createdAt: "2023-09-01T08:00:00Z", lastLogin: fmt(daysAgo(14)) },
  { id: "stu-005", name: "Priya Sharma", email: "p.sharma@campus.edu", role: "STUDENT", status: "active", department: "Computer Science", studentId: "CS-2024-0291", createdAt: "2024-01-15T08:00:00Z", lastLogin: fmt(daysAgo(2)) },
  { id: "stu-006", name: "Chen Wei Lin", email: "c.lin@campus.edu", role: "STUDENT", status: "active", department: "Mathematics", studentId: "MT-2023-0445", createdAt: "2023-09-01T08:00:00Z", lastLogin: fmt(daysAgo(0)) },
  { id: "stu-007", name: "Oluwaseun Adeyemi", email: "o.adeyemi@campus.edu", role: "STUDENT", status: "inactive", department: "Chemistry", studentId: "CH-2023-0678", createdAt: "2023-09-01T08:00:00Z", lastLogin: fmt(daysAgo(30)) },
  { id: "stu-008", name: "Maria Santos", email: "m.santos@campus.edu", role: "STUDENT", status: "active", department: "Electrical Engineering", studentId: "EE-2024-0198", createdAt: "2024-02-15T08:00:00Z", lastLogin: fmt(daysAgo(1)) },
];

export const mockAttendanceSummary: AttendanceSummary = {
  totalDays: 45, present: 38, absent: 3, late: 2, excused: 2, percentage: 88.9,
};

export const mockAttendanceRecords: AttendanceRecord[] = [
  { id: "att-001", studentId: "stu-001", studentName: "Amara Okonkwo", date: today, status: "present", checkIn: "08:02", checkOut: "16:15", course: "Data Structures", location: "Block A - Room 201" },
  { id: "att-002", studentId: "stu-001", studentName: "Amara Okonkwo", date: daysAgo(1).toISOString().split("T")[0], status: "present", checkIn: "07:55", checkOut: "15:45", course: "Algorithms", location: "Block B - Room 105" },
  { id: "att-003", studentId: "stu-001", studentName: "Amara Okonkwo", date: daysAgo(2).toISOString().split("T")[0], status: "late", checkIn: "09:20", checkOut: "16:00", course: "Operating Systems", location: "Block A - Room 301" },
  { id: "att-004", studentId: "stu-001", studentName: "Amara Okonkwo", date: daysAgo(3).toISOString().split("T")[0], status: "present", checkIn: "08:00", checkOut: "15:30", course: "Database Systems", location: "Block C - Lab 2" },
  { id: "att-005", studentId: "stu-001", studentName: "Amara Okonkwo", date: daysAgo(4).toISOString().split("T")[0], status: "absent", course: "Data Structures", location: "Block A - Room 201", flagged: true, anomalyType: "Unexcused absence" },
  { id: "att-006", studentId: "stu-002", studentName: "Kwame Mensah", date: today, status: "present", checkIn: "07:50", checkOut: "16:30", course: "Circuit Theory", location: "Block D - Lab 1" },
  { id: "att-007", studentId: "stu-003", studentName: "Fatima Al-Rashid", date: today, status: "late", checkIn: "09:45", course: "Marketing 101", location: "Block B - Room 210", flagged: true, anomalyType: "Repeated lateness" },
  { id: "att-008", studentId: "stu-004", studentName: "David Kimani", date: today, status: "absent", course: "Quantum Physics", location: "Block E - Room 101", flagged: true, anomalyType: "3+ consecutive absences" },
];

export const mockAccessEvents: AccessEvent[] = [
  { id: "acc-001", studentId: "stu-001", studentName: "Amara Okonkwo", checkpoint: "Main Gate", timestamp: fmt(daysAgo(0)), status: "allowed", method: "NFC Card", direction: "in" },
  { id: "acc-002", studentId: "stu-001", studentName: "Amara Okonkwo", checkpoint: "Library Entrance", timestamp: fmt(daysAgo(0)), status: "allowed", method: "NFC Card", direction: "in" },
  { id: "acc-003", studentId: "stu-001", studentName: "Amara Okonkwo", checkpoint: "Computer Lab", timestamp: fmt(daysAgo(1)), status: "allowed", method: "Biometric", direction: "in" },
  { id: "acc-004", studentId: "stu-002", studentName: "Kwame Mensah", checkpoint: "Main Gate", timestamp: fmt(daysAgo(0)), status: "allowed", method: "NFC Card", direction: "in" },
  { id: "acc-005", studentId: "stu-004", studentName: "David Kimani", checkpoint: "Server Room", timestamp: fmt(daysAgo(0)), status: "denied", method: "NFC Card", direction: "in" },
  { id: "acc-006", studentId: "stu-003", studentName: "Fatima Al-Rashid", checkpoint: "Sports Complex", timestamp: fmt(daysAgo(0)), status: "pending", method: "QR Code" },
  { id: "acc-007", studentId: "stu-007", studentName: "Oluwaseun Adeyemi", checkpoint: "Main Gate", timestamp: fmt(daysAgo(1)), status: "denied", method: "NFC Card", direction: "in" },
];

export const mockAccessRequests: AccessRequest[] = [
  { id: "req-001", studentId: "stu-001", studentName: "Amara Okonkwo", area: "Research Lab B", reason: "Final year project work", status: "approved", requestedAt: fmt(daysAgo(5)), resolvedAt: fmt(daysAgo(4)), resolvedBy: "adm-001" },
  { id: "req-002", studentId: "stu-003", studentName: "Fatima Al-Rashid", area: "After-hours Library", reason: "Exam preparation", status: "pending", requestedAt: fmt(daysAgo(1)) },
  { id: "req-003", studentId: "stu-005", studentName: "Priya Sharma", area: "Server Room", reason: "Network lab assignment", status: "denied", requestedAt: fmt(daysAgo(3)), resolvedAt: fmt(daysAgo(2)), resolvedBy: "adm-001" },
];

export const mockIncidents: Incident[] = [
  { id: "inc-001", title: "Unauthorized access attempt — Server Room", description: "Student attempted to access server room using expired credentials. Security alerted.", severity: "high", status: "investigating", reportedBy: "system", studentId: "stu-004", studentName: "David Kimani", location: "Block E - Server Room", createdAt: fmt(daysAgo(0)), updatedAt: fmt(daysAgo(0)), comments: [{ id: "c1", author: "adm-001", authorName: "Director James Osei", content: "Reviewing CCTV footage from corridor camera.", createdAt: fmt(daysAgo(0)) }] },
  { id: "inc-002", title: "Tailgating detected at Main Gate", description: "Multiple students entered on single card scan. Camera flagged potential tailgating.", severity: "medium", status: "open", reportedBy: "system", location: "Main Gate", createdAt: fmt(daysAgo(1)), updatedAt: fmt(daysAgo(1)) },
  { id: "inc-003", title: "Fire alarm triggered — Block B", description: "Fire alarm activated on 2nd floor. Confirmed false alarm after inspection.", severity: "critical", status: "resolved", reportedBy: "adm-001", reportedByName: "Director James Osei", location: "Block B - 2nd Floor", createdAt: fmt(daysAgo(3)), updatedAt: fmt(daysAgo(3)) },
  { id: "inc-004", title: "Lost student ID card reported", description: "Student reported lost ID card. Card has been deactivated.", severity: "low", status: "resolved", reportedBy: "stu-005", reportedByName: "Priya Sharma", studentId: "stu-005", studentName: "Priya Sharma", createdAt: fmt(daysAgo(5)), updatedAt: fmt(daysAgo(4)) },
];

export const mockAlerts: Alert[] = [
  { id: "alt-001", title: "Attendance anomaly detected", message: "3+ consecutive absences recorded for David Kimani (PH-2023-0934).", type: "warning", status: "unread", targetUserId: "stu-004", createdAt: fmt(daysAgo(0)), source: "Attendance Engine" },
  { id: "alt-002", title: "Access denied — restricted area", message: "Your access to Server Room was denied. Contact campus security if this is an error.", type: "critical", status: "unread", targetUserId: "stu-004", createdAt: fmt(daysAgo(0)), source: "Access Control" },
  { id: "alt-003", title: "System maintenance scheduled", message: "The campus security system will undergo maintenance on Saturday 10 PM – 2 AM.", type: "info", status: "read", createdAt: fmt(daysAgo(2)), source: "System" },
  { id: "alt-004", title: "New security policy update", message: "All students must now use biometric verification for lab access starting next week.", type: "notice", status: "unread", createdAt: fmt(daysAgo(1)), source: "Administration" },
  { id: "alt-005", title: "Repeated lateness flagged", message: "Fatima Al-Rashid has been flagged for repeated late arrivals in Marketing 101.", type: "warning", status: "unread", targetUserId: "stu-003", createdAt: fmt(daysAgo(0)), source: "Attendance Engine" },
];

export const mockPresenceRecords: PresenceRecord[] = [
  { id: "pr-001", studentId: "stu-001", studentName: "Amara Okonkwo", checkpoint: "Library", timestamp: fmt(daysAgo(0)), signalStrength: 92, status: "active" },
  { id: "pr-002", studentId: "stu-002", studentName: "Kwame Mensah", checkpoint: "Block D - Lab 1", timestamp: fmt(daysAgo(0)), signalStrength: 87, status: "active" },
  { id: "pr-003", studentId: "stu-003", studentName: "Fatima Al-Rashid", checkpoint: "Block B - Room 210", timestamp: fmt(daysAgo(0)), signalStrength: 78, status: "active" },
  { id: "pr-004", studentId: "stu-004", studentName: "David Kimani", checkpoint: "Unknown", timestamp: fmt(daysAgo(1)), signalStrength: 0, status: "missing" },
  { id: "pr-005", studentId: "stu-005", studentName: "Priya Sharma", checkpoint: "Main Gate", timestamp: fmt(daysAgo(0)), signalStrength: 95, status: "active" },
];

export const mockTracePoints: TracePoint[] = [
  { checkpoint: "Main Gate", timestamp: fmt(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7, 55)), duration: 2 },
  { checkpoint: "Block A - Entrance", timestamp: fmt(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0)), duration: 5 },
  { checkpoint: "Block A - Room 201", timestamp: fmt(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 5)), duration: 120 },
  { checkpoint: "Cafeteria", timestamp: fmt(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 10)), duration: 35 },
  { checkpoint: "Library", timestamp: fmt(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 0)), duration: 90 },
  { checkpoint: "Block C - Lab 2", timestamp: fmt(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 13, 0)), duration: 120 },
];

export const mockSupportIssues: SupportIssue[] = [
  { id: "sup-001", category: "attendance_mismatch", subject: "Marked absent but was present", description: "I attended Data Structures on Monday but was marked absent. I have my access log as proof.", priority: "high", status: "in_progress", reportedBy: "stu-001", createdAt: fmt(daysAgo(2)), updatedAt: fmt(daysAgo(1)) },
  { id: "sup-002", category: "lost_device", subject: "Lost campus ID card", description: "I lost my NFC campus card near the cafeteria yesterday.", priority: "medium", status: "resolved", reportedBy: "stu-005", createdAt: fmt(daysAgo(5)), updatedAt: fmt(daysAgo(4)) },
];

export const mockActivityEvents: ActivityEvent[] = [
  { id: "act-001", type: "access", action: "access_denied", description: "Access denied to Server Room for David Kimani", userId: "stu-004", userName: "David Kimani", timestamp: fmt(daysAgo(0)) },
  { id: "act-002", type: "auth", action: "login", description: "Amara Okonkwo logged in from iPhone 15 Pro", userId: "stu-001", userName: "Amara Okonkwo", timestamp: fmt(daysAgo(0)) },
  { id: "act-003", type: "attendance", action: "anomaly_detected", description: "3+ consecutive absences detected for David Kimani", userId: "stu-004", userName: "David Kimani", timestamp: fmt(daysAgo(0)) },
  { id: "act-004", type: "incident", action: "incident_created", description: "New incident: Unauthorized access attempt — Server Room", timestamp: fmt(daysAgo(0)) },
  { id: "act-005", type: "access", action: "access_granted", description: "Amara Okonkwo accessed Main Gate via NFC Card", userId: "stu-001", userName: "Amara Okonkwo", timestamp: fmt(daysAgo(0)) },
  { id: "act-006", type: "system", action: "maintenance_scheduled", description: "System maintenance scheduled for Saturday 10 PM – 2 AM", timestamp: fmt(daysAgo(2)) },
  { id: "act-007", type: "auth", action: "logout", description: "Kwame Mensah logged out", userId: "stu-002", userName: "Kwame Mensah", timestamp: fmt(daysAgo(1)) },
  { id: "act-008", type: "incident", action: "incident_resolved", description: "Incident resolved: Fire alarm triggered — Block B", timestamp: fmt(daysAgo(3)) },
];
