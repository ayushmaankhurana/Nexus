import { useEffect, useMemo, useState } from "react";
import { PageHeader, SectionCard } from "@/components/shared/PageComponents";
import { StatusBadge, getStatusVariant } from "@/components/shared/StatusBadge";
import { AlertTriangle, Info, Bell, ShieldAlert } from "lucide-react";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/StateComponents";
import { Button } from "@/components/ui/button";
import { accessApi, attendanceApi } from "@/services/dataApi";
import { buildStudentAlerts } from "@/lib/studentAlerts";
import type { AccessEvent, AttendanceRecord } from "@/types";

const typeIcons = { info: Info, warning: AlertTriangle, critical: ShieldAlert, notice: Bell };

export default function StudentAlerts() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [accessEvents, setAccessEvents] = useState<AccessEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAlerts() {
      try {
        setLoading(true);
        setError(null);
        const [attendance, access] = await Promise.all([
          attendanceApi.getMine(),
          accessApi.getMine(),
        ]);

        if (cancelled) return;

        setAttendanceRecords(attendance.records);
        setAccessEvents(access.events);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load alerts.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadAlerts();

    return () => {
      cancelled = true;
    };
  }, []);

  const myAlerts = useMemo(() => buildStudentAlerts(attendanceRecords, accessEvents), [attendanceRecords, accessEvents]);

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-400">
        <span className="text-lg leading-none">⚙️</span>
        <div>
          <p className="text-sm font-medium">Planned Feature</p>
          <p className="text-sm opacity-80">Push alerts are planned for a future release. Alerts shown here are derived from your live attendance and access data.</p>
        </div>
      </div>
      <PageHeader title="My Alerts" description="View notifications, warnings, and system notices." />
      {error ? (
        <ErrorState message={error} />
      ) : loading ? (
        <LoadingState className="min-h-[220px]" />
      ) : myAlerts.length === 0 ? (
        <EmptyState icon={<Bell className="h-10 w-10" />} title="No alerts" description="You're all caught up. No active alerts or notifications." />
      ) : (
        <div className="space-y-3">
          {myAlerts.map(alert => {
            const Icon = typeIcons[alert.type] || Bell;
            return (
              <SectionCard key={alert.id}>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-medium">{alert.title}</h3>
                      <StatusBadge variant={getStatusVariant(alert.type)}>{alert.type}</StatusBadge>
                      <StatusBadge variant={getStatusVariant(alert.status)}>{alert.status}</StatusBadge>
                    </div>
                    <p className="text-sm text-muted-foreground">{alert.message}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-muted-foreground">{new Date(alert.createdAt).toLocaleString()}</span>
                      {alert.source && <span className="text-xs text-muted-foreground">via {alert.source}</span>}
                    </div>
                  </div>
                  {alert.status === "unread" && <Button variant="ghost" size="sm" className="flex-shrink-0" disabled>Mark read</Button>}
                </div>
              </SectionCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
