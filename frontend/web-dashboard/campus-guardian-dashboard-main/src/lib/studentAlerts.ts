import type { AccessEvent, Alert, AttendanceRecord } from "@/types";

export function buildStudentAlerts(attendanceRecords: AttendanceRecord[], accessEvents: AccessEvent[]): Alert[] {
  const attendanceAlerts = attendanceRecords
    .filter((record) => record.flagged)
    .map((record) => ({
      id: `attendance-${record.id}`,
      title: record.status === "absent" ? "Attendance issue detected" : "Late attendance recorded",
      message: record.status === "absent"
        ? `${record.course || "Scheduled class"} was marked absent on ${record.date}.`
        : `${record.course || "Scheduled class"} was marked late on ${record.date}.`,
      type: record.status === "absent" ? "warning" : "notice",
      status: "unread" as const,
      createdAt: record.date,
      source: "Attendance Engine",
    }));

  const accessAlerts = accessEvents
    .filter((event) => event.status === "denied")
    .map((event) => ({
      id: `access-${event.id}`,
      title: "Access denied",
      message: `${event.checkpoint} denied your ${event.action || "ENTRY"} attempt.${event.reason ? ` Reason: ${event.reason}.` : ""}`,
      type: "critical" as const,
      status: "unread" as const,
      createdAt: event.timestamp,
      source: "Access Control",
    }));

  const informationalAttendanceAlerts = attendanceRecords
    .filter((record) => !record.flagged)
    .map((record) => ({
      id: `attendance-info-${record.id}`,
      title: "Attendance recorded",
      message: `${record.course || "Scheduled class"} was marked ${record.status} on ${record.date}.`,
      type: "info" as const,
      status: "unread" as const,
      createdAt: `${record.date}T00:00:00.000Z`,
      source: "Attendance Engine",
    }));

  const informationalAccessAlerts = accessEvents
    .filter((event) => event.status !== "denied")
    .map((event) => ({
      id: `access-info-${event.id}`,
      title: event.action === "EXIT" ? "Exit recorded" : "Access recorded",
      message: `${event.action || "ENTRY"} was recorded at ${event.checkpoint}.`,
      type: "notice" as const,
      status: "unread" as const,
      createdAt: event.timestamp,
      source: "Access Control",
    }));

  const primaryAlerts = [...accessAlerts, ...attendanceAlerts].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );

  if (primaryAlerts.length > 0) {
    return primaryAlerts;
  }

  return [...informationalAccessAlerts, ...informationalAttendanceAlerts].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}