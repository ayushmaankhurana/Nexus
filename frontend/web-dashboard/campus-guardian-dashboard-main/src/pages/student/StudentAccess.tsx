import { PageHeader, SectionCard } from "@/components/shared/PageComponents";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { StatusBadge, getStatusVariant } from "@/components/shared/StatusBadge";
import { DoorOpen, CheckCircle } from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";
import { mockAccessEvents, mockAccessRequests } from "@/mocks/data";
import type { AccessEvent, AccessRequest } from "@/types";

const eventCols: DataTableColumn<AccessEvent>[] = [
  { key: "checkpoint", header: "Checkpoint" },
  { key: "timestamp", header: "Time", render: (r) => new Date(r.timestamp).toLocaleString() },
  { key: "status", header: "Status", render: (r) => <StatusBadge variant={getStatusVariant(r.status)}>{r.status}</StatusBadge> },
  { key: "method", header: "Method" },
  { key: "direction", header: "Direction", render: (r) => r.direction?.toUpperCase() || "—" },
];

const reqCols: DataTableColumn<AccessRequest>[] = [
  { key: "area", header: "Area" },
  { key: "reason", header: "Reason" },
  { key: "status", header: "Status", render: (r) => <StatusBadge variant={getStatusVariant(r.status)}>{r.status}</StatusBadge> },
  { key: "requestedAt", header: "Requested", render: (r) => new Date(r.requestedAt).toLocaleDateString() },
];

export default function StudentAccess() {
  const myEvents = mockAccessEvents.filter(e => e.studentId === "stu-001");
  const myReqs = mockAccessRequests.filter(r => r.studentId === "stu-001");
  const allowed = myEvents.filter(e => e.status === "allowed").length;

  return (
    <div className="space-y-6">
      <PageHeader title="Access Status" description="View your campus access permissions and history." />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Current Status" value="Active" subtitle="All standard areas accessible" icon={CheckCircle} />
        <StatCard title="Recent Events" value={myEvents.length} subtitle="Access log entries" icon={DoorOpen} />
        <StatCard title="Success Rate" value={`${allowed}/${myEvents.length}`} subtitle="Allowed attempts" icon={DoorOpen} />
      </div>
      <SectionCard title="Access History">
        <DataTable columns={eventCols} data={myEvents} emptyTitle="No access events" />
      </SectionCard>
      <SectionCard title="Access Requests">
        <DataTable columns={reqCols} data={myReqs} emptyTitle="No access requests" emptyDescription="You haven't submitted any access requests yet." />
      </SectionCard>
    </div>
  );
}
