import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { StatCard } from "@/components/shared/StatCard";
import { SectionCard, PageHeader } from "@/components/shared/PageComponents";
import { ErrorState, LoadingState } from "@/components/shared/StateComponents";
import { Users, DoorOpen, CalendarCheck, ShieldAlert, Activity } from "lucide-react";
import { getDisplayName } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { apiGet } from "@/services/apiClient";
import { accessApi } from "@/services/dataApi";
import type { AccessEvent } from "@/types";

type DashboardStats = {
  totalStudents: number;
  presentToday: number;
  accessEventsToday: number;
  activeIncidents: number;
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [accessEvents, setAccessEvents] = useState<AccessEvent[]>([]);
  const [accessLoading, setAccessLoading] = useState(true);
  const [accessError, setAccessError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadStats() {
      try {
        setStatsLoading(true);
        setStatsError(null);
        const data = await apiGet<DashboardStats>("/dashboard/stats");
        if (!cancelled) setStats(data);
      } catch (err) {
        if (!cancelled) setStatsError(err instanceof Error ? err.message : "Failed to load stats.");
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    }

    async function loadAccessOverview() {
      try {
        setAccessLoading(true);
        setAccessError(null);
        const accessResponse = await accessApi.getAll({ page: "1", pageSize: "10" });
        if (!cancelled) setAccessEvents(accessResponse.data);
      } catch (loadError) {
        if (!cancelled) {
          setAccessError(loadError instanceof Error ? loadError.message : "Failed to load access events.");
        }
      } finally {
        if (!cancelled) setAccessLoading(false);
      }
    }

    void loadStats();
    void loadAccessOverview();

    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Operations Dashboard" description={`Welcome, ${getDisplayName(user).split(" ")[0]}. Here's today's campus security overview.`} />

      {statsError && <ErrorState message={statsError} />}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Students" value={statsLoading ? "..." : (stats?.totalStudents ?? 0)} subtitle="Live from backend" icon={Users} />
        <StatCard title="Present Today" value={statsLoading ? "..." : (stats?.presentToday ?? 0)} subtitle="Present + Late attendance records" icon={CalendarCheck} />
        <StatCard title="Access Events Today" value={statsLoading ? "..." : (stats?.accessEventsToday ?? 0)} subtitle="Entry/exit/denied events" icon={DoorOpen} />
        <StatCard title="Open Incidents" value={statsLoading ? "..." : (stats?.activeIncidents ?? 0)} subtitle="Incidents with status OPEN" icon={ShieldAlert} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="Recent Access Attempts" actions={<Button variant="ghost" size="sm" onClick={() => navigate("/admin/access")}>View all</Button>}>
          {accessError ? (
            <ErrorState message={accessError} />
          ) : accessLoading ? (
            <LoadingState className="min-h-[200px]" />
          ) : (
            <div className="space-y-2">
              {accessEvents.slice(0, 5).map(evt => (
                <div key={evt.id} className="flex items-center justify-between text-sm py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{evt.studentName || evt.rollNumber}</p>
                    <p className="text-xs text-muted-foreground">{evt.checkpoint} • {evt.method}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${evt.status === "denied" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                    {evt.status}
                  </span>
                </div>
              ))}
              {accessEvents.length === 0 && <p className="text-sm text-muted-foreground">No access events yet today.</p>}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Incidents & Alerts" actions={<Button variant="ghost" size="sm" onClick={() => navigate("/admin/incidents")}>View all</Button>}>
          <div className="flex flex-col items-center justify-center min-h-[160px] gap-2 text-center">
            <ShieldAlert className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground font-medium">Planned Feature</p>
            <p className="text-xs text-muted-foreground max-w-[200px]">Incident management backend is coming in Phase 2. See the Incidents page for illustrative data.</p>
            <Button variant="outline" size="sm" className="mt-1" onClick={() => navigate("/admin/incidents")}>View Incidents Page</Button>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Quick Actions">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Button variant="outline" className="justify-start gap-2" onClick={() => navigate("/admin/students")}><Users className="h-4 w-4" />View Students</Button>
          <Button variant="outline" className="justify-start gap-2" onClick={() => navigate("/admin/incidents")}><ShieldAlert className="h-4 w-4" />Manage Incidents</Button>
          <Button variant="outline" className="justify-start gap-2" onClick={() => navigate("/admin/access")}><DoorOpen className="h-4 w-4" />Access Control</Button>
          <Button variant="outline" className="justify-start gap-2" onClick={() => navigate("/admin/activity")}><Activity className="h-4 w-4" />Activity Log</Button>
        </div>
      </SectionCard>
    </div>
  );
}
