import { useAuth } from "@/contexts/AuthContext";
import { StatCard } from "@/components/shared/StatCard";
import { SectionCard, PageHeader } from "@/components/shared/PageComponents";
import { ActivityFeed } from "@/components/shared/ActivityFeed";
import { StatusBadge, getStatusVariant } from "@/components/shared/StatusBadge";
import { Users, AlertTriangle, DoorOpen, CalendarCheck, ShieldAlert, Activity } from "lucide-react";
import { getDisplayName } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { mockStudents, mockAlerts, mockIncidents, mockAccessEvents, mockAttendanceRecords, mockActivityEvents } from "@/mocks/data";

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const activeStudents = mockStudents.filter(s => s.status === "active").length;
  const alertsToday = mockAlerts.filter(a => a.status === "unread").length;
  const deniedAccess = mockAccessEvents.filter(e => e.status === "denied").length;
  const anomalies = mockAttendanceRecords.filter(r => r.flagged).length;
  const openIncidents = mockIncidents.filter(i => i.status !== "resolved" && i.status !== "closed").length;

  return (
    <div className="space-y-6">
      <PageHeader title="Operations Dashboard" description={`Welcome, ${getDisplayName(user).split(" ")[0]}. Here's today's campus security overview.`} />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Active Students" value={activeStudents} icon={Users} trend={{ value: 3, label: "this week" }} />
        <StatCard title="Alerts Today" value={alertsToday} icon={AlertTriangle} />
        <StatCard title="Denied Access" value={deniedAccess} icon={DoorOpen} />
        <StatCard title="Anomalies" value={anomalies} icon={CalendarCheck} />
        <StatCard title="Open Incidents" value={openIncidents} icon={ShieldAlert} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SectionCard title="Recent Incidents" className="lg:col-span-2" actions={<Button variant="ghost" size="sm" onClick={() => navigate("/admin/incidents")}>View all</Button>}>
          <div className="space-y-3">
            {mockIncidents.slice(0, 4).map(inc => (
              <div key={inc.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors cursor-pointer" onClick={() => navigate("/admin/incidents")}>
                <ShieldAlert className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium">{inc.title}</p>
                    <StatusBadge variant={getStatusVariant(inc.severity)}>{inc.severity}</StatusBadge>
                    <StatusBadge variant={getStatusVariant(inc.status)}>{inc.status}</StatusBadge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{inc.location} • {new Date(inc.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Live Activity" actions={<Button variant="ghost" size="sm" onClick={() => navigate("/admin/activity")}>View all</Button>}>
          <ActivityFeed items={mockActivityEvents.slice(0, 6)} />
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionCard title="Recent Access Attempts">
          <div className="space-y-2">
            {mockAccessEvents.slice(0, 5).map(evt => (
              <div key={evt.id} className="flex items-center justify-between text-sm py-2 border-b last:border-0">
                <div>
                  <p className="font-medium">{evt.studentName}</p>
                  <p className="text-xs text-muted-foreground">{evt.checkpoint} • {evt.method}</p>
                </div>
                <StatusBadge variant={getStatusVariant(evt.status)}>{evt.status}</StatusBadge>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Attendance Anomalies">
          <div className="space-y-2">
            {mockAttendanceRecords.filter(r => r.flagged).map(rec => (
              <div key={rec.id} className="flex items-center justify-between text-sm py-2 border-b last:border-0">
                <div>
                  <p className="font-medium">{rec.studentName}</p>
                  <p className="text-xs text-muted-foreground">{rec.anomalyType} • {rec.date}</p>
                </div>
                <StatusBadge variant={getStatusVariant(rec.status)}>{rec.status}</StatusBadge>
              </div>
            ))}
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
