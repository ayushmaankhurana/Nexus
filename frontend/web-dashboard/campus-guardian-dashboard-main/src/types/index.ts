export type UserRole = "student" | "admin" | "security";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: "active" | "suspended" | "inactive" | "pending";
  department?: string;
  studentId?: string;
  avatarUrl?: string;
  phone?: string;
  createdAt: string;
  lastLogin?: string;
}

export interface Session {
  id: string;
  userId: string;
  deviceName: string;
  deviceType: "mobile" | "desktop" | "tablet";
  ipAddress: string;
  isActive: boolean;
  lastActive: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  session: Session;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName?: string;
  date: string;
  status: "present" | "absent" | "late" | "excused";
  checkIn?: string;
  checkOut?: string;
  course?: string;
  location?: string;
  flagged?: boolean;
  anomalyType?: string;
}

export interface AttendanceSummary {
  totalDays: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  percentage: number;
}

export interface AccessEvent {
  id: string;
  studentId: string;
  studentName?: string;
  checkpoint: string;
  timestamp: string;
  status: "allowed" | "denied" | "pending" | "expired";
  method: string;
  direction?: "in" | "out";
}

export interface AccessRequest {
  id: string;
  studentId: string;
  studentName?: string;
  area: string;
  reason: string;
  status: "pending" | "approved" | "denied";
  requestedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "investigating" | "resolved" | "closed";
  reportedBy: string;
  reportedByName?: string;
  assignedTo?: string;
  studentId?: string;
  studentName?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
  comments?: IncidentComment[];
}

export interface IncidentComment {
  id: string;
  author: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface Alert {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "critical" | "notice";
  status: "unread" | "read" | "dismissed" | "investigating";
  targetUserId?: string;
  createdAt: string;
  readAt?: string;
  source?: string;
}

export interface PresenceRecord {
  id: string;
  studentId: string;
  studentName?: string;
  checkpoint: string;
  timestamp: string;
  signalStrength?: number;
  status: "active" | "inactive" | "missing";
}

export interface TracePoint {
  checkpoint: string;
  timestamp: string;
  duration?: number;
}

export interface SupportIssue {
  id: string;
  category: "attendance_mismatch" | "denied_access" | "account_lock" | "lost_device" | "emergency" | "other";
  subject: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "resolved" | "closed";
  reportedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityEvent {
  id: string;
  type: "auth" | "access" | "attendance" | "incident" | "alert" | "system";
  action: string;
  description: string;
  userId?: string;
  userName?: string;
  timestamp: string;
  metadata?: Record<string, string>;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: Record<string, string>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
