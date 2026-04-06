import { useEffect, useMemo, useState } from "react";
import { PageHeader, SectionCard } from "@/components/shared/PageComponents";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { StatusBadge, getStatusVariant } from "@/components/shared/StatusBadge";
import { DoorOpen, CheckCircle } from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/StateComponents";
import { accessApi } from "@/services/dataApi";
import { useAuth } from "@/contexts/AuthContext";
import type { AccessEvent } from "@/types";

const eventCols: DataTableColumn<AccessEvent>[] = [
  { key: "checkpoint", header: "Checkpoint" },
  { key: "timestamp", header: "Time", render: (r) => new Date(r.timestamp).toLocaleString() },
  { key: "status", header: "Status", render: (r) => <StatusBadge variant={getStatusVariant(r.status)}>{r.status}</StatusBadge> },
  {
    key: "method",
    header: "Details",
    render: (row) => (
      <div>
        <p className="font-medium text-sm">{row.action || "ENTRY"}</p>
        <p className="text-xs text-muted-foreground">{row.method}</p>
      </div>
    ),
  },
  { key: "direction", header: "Direction", render: (r) => r.direction?.toUpperCase() || (r.action === "DENIED" ? "BLOCKED" : "—") },
];

export default function StudentAccess() {
  const { user } = useAuth();
  const [events, setEvents] = useState<AccessEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAccessHistory() {
      try {
        setLoading(true);
        setError(null);
        const response = await accessApi.getMine();
        if (!cancelled) {
          setEvents(response.events);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load access history.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadAccessHistory();

    return () => {
      cancelled = true;
    };
  }, []);

  const allowed = events.filter((event) => event.status === "allowed").length;
  const successRate = useMemo(() => {
    if (events.length === 0) {
      return "0/0";
    }

    return `${allowed}/${events.length}`;
  }, [allowed, events.length]);

  const currentStatus = user?.status ? `${user.status.charAt(0).toUpperCase()}${user.status.slice(1)}` : "Unknown";
  const currentStatusSubtitle = user?.status === "active"
    ? "Your account is eligible for standard access checks"
    : "Account status may restrict access decisions";

  return (
    <div className="space-y-6">
      <PageHeader title="Access Status" description="View your campus access permissions and history." />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Current Status" value={currentStatus} subtitle={currentStatusSubtitle} icon={CheckCircle} />
        <StatCard title="Recent Events" value={loading ? "..." : events.length} subtitle="Access log entries" icon={DoorOpen} />
        <StatCard title="Success Rate" value={loading ? "..." : successRate} subtitle="Allowed attempts" icon={DoorOpen} />
      </div>
      <SectionCard title="Access History">
        {error ? (
          <ErrorState message={error} />
        ) : loading ? (
          <LoadingState className="min-h-[220px]" />
        ) : (
          <DataTable columns={eventCols} data={events} searchable searchKeys={["checkpoint", "method", "status", "action"]} emptyTitle="No access events" emptyDescription="Your access history will appear here once backend events are recorded." />
        )}
      </SectionCard>
      <SectionCard title="Request Workflows">
        <EmptyState title="Request approvals are not enabled yet" description="This demo currently exposes real access history and live access decisions only. Access-request submission and approvals are still deferred until the backend exists." />
      </SectionCard>
    </div>
  );
}
