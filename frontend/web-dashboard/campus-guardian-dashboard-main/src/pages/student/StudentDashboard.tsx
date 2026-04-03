import { useAuth } from "@/contexts/AuthContext";
import { StatCard } from "@/components/shared/StatCard";
import { SectionCard, PageHeader } from "@/components/shared/PageComponents";
import { ActivityFeed } from "@/components/shared/ActivityFeed";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { CalendarCheck, DoorOpen, AlertTriangle, Smartphone, Clock, LifeBuoy, LogOut } from "lucide-react";
import { getDisplayName } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { mockAttendanceSummary, mockAccessEvents, mockAlerts, mockSession, mockActivityEvents } from "@/mocks/data";

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const recentAlerts = mockAlerts.filter(a => a.status === "unread").slice(0, 3);
  const recentAccess = mockAccessEvents.filter(e => e.studentId === "stu-001").slice(0, 2);
  const recentActivity = mockActivityEvents.filter(e => e.userId === "stu-001").slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader title={`Welcome back, ${getDisplayName(user).split(" ")[0] || "Student"}`} description="Here's an overview of your campus activity and status." />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Attendance Rate" value={`${mockAttendanceSummary.percentage}%`} subtitle={`${mockAttendanceSummary.present} of ${mockAttendanceSummary.totalDays} days`} icon={CalendarCheck} trend={{ value: 2.3, label: "vs last month" }} />
        <StatCard title="Access Status" value="Active" subtitle="All gates accessible" icon={DoorOpen} />
        <StatCard title="Unread Alerts" value={recentAlerts.length} subtitle="Requires attention" icon={AlertTriangle} />
        <StatCard title="Active Device" value={mockSession.deviceName} subtitle={mockSession.deviceType} icon={Smartphone} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SectionCard title="Recent Alerts" className="lg:col-span-2" actions={<Button variant="ghost" size="sm" onClick={() => navigate("/alerts")}>View all</Button>}>
          {recentAlerts.length === 0 ? (
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
          <ActivityFeed items={recentActivity} />
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SectionCard title="Last Access Events">
          <div className="space-y-2">
            {recentAccess.map(evt => (
              <div key={evt.id} className="flex items-center justify-between text-sm">
                <span>{evt.checkpoint}</span>
                <StatusBadge variant={evt.status}>{evt.status}</StatusBadge>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Session Info">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Device</span><span>{mockSession.deviceName}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="capitalize">{mockSession.deviceType}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">IP</span><span>{mockSession.ipAddress}</span></div>
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
