import { describe, it, expect } from "vitest";
import { normalizeUserRole, isAdminRole, isFacultyRole } from "@/types";

describe("normalizeUserRole", () => {
  it("passes through recognised uppercase roles unchanged", () => {
    expect(normalizeUserRole("STUDENT")).toBe("STUDENT");
    expect(normalizeUserRole("ADMIN")).toBe("ADMIN");
    expect(normalizeUserRole("SECURITY")).toBe("SECURITY");
    expect(normalizeUserRole("FACULTY")).toBe("FACULTY");
  });

  it("uppercases lowercase role strings", () => {
    expect(normalizeUserRole("student")).toBe("STUDENT");
    expect(normalizeUserRole("admin")).toBe("ADMIN");
    expect(normalizeUserRole("security")).toBe("SECURITY");
    expect(normalizeUserRole("faculty")).toBe("FACULTY");
  });

  it("defaults unknown values to STUDENT", () => {
    expect(normalizeUserRole("unknown")).toBe("STUDENT");
    expect(normalizeUserRole("")).toBe("STUDENT");
    expect(normalizeUserRole(null)).toBe("STUDENT");
    expect(normalizeUserRole(undefined)).toBe("STUDENT");
  });
});

describe("isAdminRole", () => {
  it("returns true for ADMIN and SECURITY", () => {
    expect(isAdminRole("ADMIN")).toBe(true);
    expect(isAdminRole("SECURITY")).toBe(true);
    expect(isAdminRole("admin")).toBe(true);
    expect(isAdminRole("security")).toBe(true);
  });

  it("returns false for STUDENT and FACULTY", () => {
    expect(isAdminRole("STUDENT")).toBe(false);
    expect(isAdminRole("FACULTY")).toBe(false);
  });

  it("returns false for unknown values", () => {
    expect(isAdminRole(null)).toBe(false);
    expect(isAdminRole(undefined)).toBe(false);
    expect(isAdminRole("")).toBe(false);
  });
});

describe("isFacultyRole", () => {
  it("returns true only for FACULTY", () => {
    expect(isFacultyRole("FACULTY")).toBe(true);
    expect(isFacultyRole("faculty")).toBe(true);
  });

  it("returns false for all other roles", () => {
    expect(isFacultyRole("ADMIN")).toBe(false);
    expect(isFacultyRole("SECURITY")).toBe(false);
    expect(isFacultyRole("STUDENT")).toBe(false);
    expect(isFacultyRole(null)).toBe(false);
    expect(isFacultyRole(undefined)).toBe(false);
  });
});

describe("DashboardRouter decision logic", () => {
  // Mirrors the logic in App.tsx DashboardRouter:
  //   isAdmin || isFaculty => AdminDashboard
  //   else => StudentDashboard
  function shouldShowAdminDashboard(role: string | null | undefined): boolean {
    return isAdminRole(role) || isFacultyRole(role);
  }

  it("routes ADMIN and SECURITY to admin dashboard", () => {
    expect(shouldShowAdminDashboard("ADMIN")).toBe(true);
    expect(shouldShowAdminDashboard("SECURITY")).toBe(true);
  });

  it("routes FACULTY to admin dashboard", () => {
    expect(shouldShowAdminDashboard("FACULTY")).toBe(true);
  });

  it("routes STUDENT to student dashboard", () => {
    expect(shouldShowAdminDashboard("STUDENT")).toBe(false);
  });

  it("routes unknown/null role to student dashboard", () => {
    expect(shouldShowAdminDashboard(null)).toBe(false);
    expect(shouldShowAdminDashboard(undefined)).toBe(false);
    expect(shouldShowAdminDashboard("")).toBe(false);
  });
});
