import { PageHeader, SectionCard } from "@/components/shared/PageComponents";
import { StatusBadge, getStatusVariant } from "@/components/shared/StatusBadge";
import { mockAlerts } from "@/mocks/data";
import { AlertTriangle, Info, Bell, ShieldAlert } from "lucide-react";
import { EmptyState } from "@/components/shared/StateComponents";
import { Button } from "@/components/ui/button";

const typeIcons = { info: Info, warning: AlertTriangle, critical: ShieldAlert, notice: Bell };

export default function StudentAlerts() {
  const myAlerts = mockAlerts.filter(a => a.targetUserId === "stu-001" || !a.targetUserId);

  return (
    <div className="space-y-6">
      <PageHeader title="My Alerts" description="View notifications, warnings, and system notices." />
      {myAlerts.length === 0 ? (
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
                  {alert.status === "unread" && (
                    <Button variant="ghost" size="sm" className="flex-shrink-0">Mark read</Button>
                  )}
                </div>
              </SectionCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
