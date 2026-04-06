import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { StatCard } from "@/components/shared/StatCard";
import { SectionCard, PageHeader } from "@/components/shared/PageComponents";
import { ActivityFeed } from "@/components/shared/ActivityFeed";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ErrorState, LoadingState } from "@/components/shared/StateComponents";
import { CalendarCheck, DoorOpen, AlertTriangle, Smartphone, Clock, LifeBuoy, LogOut } from "lucide-react";
import { getDisplayName } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { accessApi, attendanceApi } from "@/services/dataApi";
import { getDeviceId } from "@/services/apiClient";
import { buildStudentAlerts } from "@/lib/studentAlerts";
import type { AccessEvent, ActivityEvent, AttendanceRecord, AttendanceSummary } from "@/types";

function getBrowserLabel(): string {
  const userAgent = navigator.userAgent;

  if (/iPhone|iPad|iPod/i.test(userAgent)) return "iPhone Safari";
  if (/Android/i.test(userAgent)) return "Android Browser";
  if (/Chrome/i.test(userAgent) && !/Edg/i.test(userAgent)) return "Chrome";
  if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) return "Safari";
  if (/Firefox/i.test(userAgent)) return "Firefox";
  if (/Edg/i.test(userAgent)) return "Edge";

  return "Browser Session";
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function buildStudentActivity(userName: string, attendanceRecords: AttendanceRecord[], accessEvents: AccessEvent[]): ActivityEvent[] {
  const attendanceActivity = attendanceRecords.map((record) => ({
    id: `attendance-activity-${record.id}`,
    type: "attendance" as const,
    action: record.status,
    description: `${record.course || "Scheduled class"} attendance marked ${record.status} on ${record.date}`,
    userName,
    timestamp: `${record.date}T00:00:00.000Z`,
  }));

  const accessActivity = accessEvents.map((event) => ({
    id: `access-activity-${event.id}`,
    type: "access" as const,
    action: (event.action || event.status).toLowerCase(),
    description: `${event.status === "denied" ? "Access denied" : "Access recorded"} at ${event.checkpoint}`,
    userName,
    timestamp: event.timestamp,
  }));

  return [...accessActivity, ...attendanceActivity]
    .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime())
    .slice(0, 5);
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [recentAccess, setRecentAccess] = useState<AccessEvent[]>([]);
  const [widgetLoading, setWidgetLoading] = useState(true);
  const [widgetError, setWidgetError] = useState<string | null>(null);
  const studentName = getDisplayName(user);

  const recentAlerts = useMemo(() => buildStudentAlerts(attendanceRecords, recentAccess).slice(0, 3), [attendanceRecords, recentAccess]);
  const recentActivity = useMemo(() => buildStudentActivity(studentName, attendanceRecords, recentAccess), [attendanceRecords, recentAccess, studentName]);
  const accessStatus = user?.status ? capitalize(user.status) : "Unknown";
  const deviceLabel = getBrowserLabel();
  const deviceId = getDeviceId();

  useEffect(() => {
    let cancelled = false;

    async function loadDashboardData() {
      try {
        setWidgetLoading(true);
        setWidgetError(null);
        const [attendance, access] = await Promise.all([
          attendanceApi.getMine(),
          accessApi.getMine(),
        ]);

        if (cancelled) return;

        setAttendanceSummary(attendance.summary);
        setAttendanceRecords(attendance.records);
        setRecentAccess(access.events);
      } catch (error) {
        if (!cancelled) {
          setWidgetError(error instanceof Error ? error.message : "Failed to load dashboard activity.");
        }
      } finally {
        if (!cancelled) {
          setWidgetLoading(false);
        }
      }
    }

    void loadDashboardData();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title={`Welcome back, ${getDisplayName(user).split(" ")[0] || "Student"}`} description="Here's an overview of your campus activity and status." />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Attendance Rate" value={attendanceSummary ? `${attendanceSummary.percentage}%` : widgetLoading ? "..." : "0%"} subtitle={attendanceSummary ? `${attendanceSummary.present + attendanceSummary.late + attendanceSummary.excused} of ${attendanceSummary.totalDays} sessions on record` : "Live attendance history"} icon={CalendarCheck} />
        <StatCard title="Access Status" value={accessStatus} subtitle={recentAccess.some((event) => event.status === "denied") ? "Recent denied attempt detected" : "No recent denied access events"} icon={DoorOpen} />
        <StatCard title="Unread Alerts" value={widgetLoading ? "..." : recentAlerts.length} subtitle="Derived from live attendance and access" icon={AlertTriangle} />
        <StatCard title="Active Device" value={deviceLabel} subtitle={deviceId ? "Bound browser session" : "Device ID unavailable"} icon={Smartphone} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SectionCard title="Recent Alerts" className="lg:col-span-2" actions={<Button variant="ghost" size="sm" onClick={() => navigate("/alerts")}>View all</Button>}>
          {widgetError ? (
            <ErrorState message={widgetError} />
          ) : widgetLoading ? (
            <LoadingState className="min-h-[180px]" />
          ) : recentAlerts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No new alerts</p>
          ) : (
            <div className="space-y-3">
              {recentAlerts.map(alert => (
                <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <AlertTriangle className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{alert.title}</p>
                      <StatusBadge variant={alert.type}>{alert.type}</StatusBadge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{alert.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Recent Activity">
          {widgetError ? (
            <ErrorState message={widgetError} />
          ) : widgetLoading ? (
            <LoadingState className="min-h-[180px]" />
          ) : recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent activity</p>
          ) : (
            <ActivityFeed items={recentActivity} />
          )}
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SectionCard title="Last Access Events">
          {widgetError ? (
            <ErrorState message={widgetError} />
          ) : widgetLoading ? (
            <LoadingState className="min-h-[120px]" />
          ) : (
            <div className="space-y-2">
              {recentAccess.slice(0, 2).map(evt => (
                <div key={evt.id} className="flex items-center justify-between text-sm">
                  <span>{evt.checkpoint}</span>
                  <StatusBadge variant={evt.status}>{evt.status}</StatusBadge>
                </div>
              ))}
              {recentAccess.length === 0 && <p className="text-sm text-muted-foreground">No access events available.</p>}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Session Info">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between gap-3"><span className="text-muted-foreground">Device</span><span className="text-right">{deviceLabel}</span></div>
            <div className="flex justify-between gap-3"><span className="text-muted-foreground">Type</span><span className="text-right">Browser session</span></div>
            <div className="flex justify-between gap-3"><span className="text-muted-foreground">Device ID</span><span className="max-w-[180px] truncate text-right">{deviceId || "Not initialized"}</span></div>
          </div>
        </SectionCard>

        <SectionCard title="Quick Actions" className="md:col-span-2">
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="justify-start gap-2" onClick={() => navigate("/attendance")}><Clock className="h-3.5 w-3.5" />View Attendance</Button>
            <Button variant="outline" size="sm" className="justify-start gap-2" onClick={() => navigate("/support")}><LifeBuoy className="h-3.5 w-3.5" />Report Issue</Button>
            <Button variant="outline" size="sm" className="justify-start gap-2" onClick={() => navigate("/access")}><DoorOpen className="h-3.5 w-3.5" />Access Status</Button>
            <Button variant="outline" size="sm" className="justify-start gap-2" onClick={() => navigate("/account")}><Smartphone className="h-3.5 w-3.5" />My Account</Button>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
