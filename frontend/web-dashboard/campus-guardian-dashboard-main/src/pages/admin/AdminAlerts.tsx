import { PageHeader } from "@/components/shared/PageComponents";
import { StatusBadge, getStatusVariant } from "@/components/shared/StatusBadge";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { mockAlerts } from "@/mocks/data";
import type { Alert } from "@/types";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const columns: DataTableColumn<Alert>[] = [
  { key: "title", header: "Alert", render: (r) => <p className="font-medium text-sm max-w-xs truncate">{r.title}</p> },
  { key: "type", header: "Type", render: (r) => <StatusBadge variant={getStatusVariant(r.type)}>{r.type}</StatusBadge> },
  { key: "status", header: "Status", render: (r) => <StatusBadge variant={getStatusVariant(r.status)}>{r.status}</StatusBadge> },
  { key: "source", header: "Source", className: "hidden md:table-cell", render: (r) => r.source || "—" },
  { key: "createdAt", header: "Time", render: (r) => new Date(r.createdAt).toLocaleString() },
  { key: "actions", header: "", render: (r) => r.status === "unread" ? <Button variant="ghost" size="sm" className="text-xs">Mark Read</Button> : null },
];

export default function AdminAlerts() {
  return (
    <div className="space-y-6">
      <PageHeader title="Alerts" description="Centralized alert management and monitoring." />
      <DataTable columns={columns} data={mockAlerts} searchable searchKeys={["title", "message", "type", "source"]} />
    </div>
  );
}
