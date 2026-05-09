import { describe, it, expect } from "vitest";
import { buildStudentAlerts } from "@/lib/studentAlerts";
import type { AttendanceRecord, AccessEvent } from "@/types";

const makeAttendance = (overrides: Partial<AttendanceRecord>): AttendanceRecord => ({
  id: "rec-1",
  studentId: "stu-1",
  date: "2026-04-02",
  status: "present",
  flagged: false,
  ...overrides,
});

const makeAccess = (overrides: Partial<AccessEvent>): AccessEvent => ({
  id: "evt-1",
  studentId: "stu-1",
  checkpoint: "Main Campus Gate",
  timestamp: "2026-04-02T08:00:00.000Z",
  status: "allowed",
  method: "Entry",
  ...overrides,
});

describe("buildStudentAlerts", () => {
  it("returns empty array when there are no records or events", () => {
    expect(buildStudentAlerts([], [])).toEqual([]);
  });

  it("generates a warning alert for an absent attendance record", () => {
    const records = [makeAttendance({ id: "abs-1", status: "absent", flagged: true, course: "CS101" })];
    const alerts = buildStudentAlerts(records, []);
    expect(alerts.length).toBe(1);
    expect(alerts[0].type).toBe("warning");
    expect(alerts[0].id).toBe("attendance-abs-1");
    expect(alerts[0].message).toContain("absent");
  });

  it("generates a notice alert for a late attendance record", () => {
    const records = [makeAttendance({ id: "late-1", status: "late", flagged: true, course: "CS101" })];
    const alerts = buildStudentAlerts(records, []);
    expect(alerts.length).toBe(1);
    expect(alerts[0].type).toBe("notice");
    expect(alerts[0].id).toBe("attendance-late-1");
    expect(alerts[0].message).toContain("late");
  });

  it("generates a critical alert for a denied access event", () => {
    const events = [makeAccess({ id: "denied-1", status: "denied", action: "ENTRY", reason: "INVALID_RFID" })];
    const alerts = buildStudentAlerts([], events);
    expect(alerts.length).toBe(1);
    expect(alerts[0].type).toBe("critical");
    expect(alerts[0].id).toBe("access-denied-1");
  });

  it("prioritises denied access and absent/late attendance over informational alerts", () => {
    const records = [
      makeAttendance({ id: "present-1", status: "present", flagged: false }),
      makeAttendance({ id: "absent-1", status: "absent", flagged: true }),
    ];
    const events = [
      makeAccess({ id: "allowed-1", status: "allowed" }),
      makeAccess({ id: "denied-1", status: "denied" }),
    ];
    const alerts = buildStudentAlerts(records, events);
    // Only critical/warning/notice alerts should be returned since primary alerts exist
    expect(alerts.every((a) => a.type !== "info" && a.type !== "notice" || a.type === "notice")).toBe(true);
    // Denied access and absent attendance must both appear
    expect(alerts.some((a) => a.id === "access-denied-1")).toBe(true);
    expect(alerts.some((a) => a.id === "attendance-absent-1")).toBe(true);
  });

  it("returns informational alerts when there are no critical/warning/notice alerts", () => {
    const records = [makeAttendance({ id: "p-1", status: "present", flagged: false })];
    const events = [makeAccess({ id: "a-1", status: "allowed" })];
    const alerts = buildStudentAlerts(records, events);
    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts.every((a) => a.type === "info" || a.type === "notice")).toBe(true);
  });

  it("assigns status unread to all generated alerts", () => {
    const records = [makeAttendance({ id: "abs-1", status: "absent", flagged: true })];
    const alerts = buildStudentAlerts(records, []);
    expect(alerts.every((a) => a.status === "unread")).toBe(true);
  });

  it("sorts results newest-first by createdAt", () => {
    const records = [
      makeAttendance({ id: "old", status: "absent", flagged: true, date: "2026-03-01" }),
      makeAttendance({ id: "new", status: "absent", flagged: true, date: "2026-04-10" }),
    ];
    const alerts = buildStudentAlerts(records, []);
    const dates = alerts.map((a) => new Date(a.createdAt).getTime());
    expect(dates[0]).toBeGreaterThanOrEqual(dates[1]);
  });

  it("does not include excused records as flagged warnings", () => {
    // Excused records are flagged: false in the mapper, so no warning should appear
    const records = [makeAttendance({ id: "exc-1", status: "excused", flagged: false })];
    const alerts = buildStudentAlerts(records, []);
    // Should only produce informational alerts (no warning for excused)
    expect(alerts.every((a) => a.type !== "warning")).toBe(true);
  });
});
