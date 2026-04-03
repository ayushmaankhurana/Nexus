import { useState } from "react";
import { PageHeader, SectionCard } from "@/components/shared/PageComponents";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { StatusBadge, getStatusVariant } from "@/components/shared/StatusBadge";
import { StatCard } from "@/components/shared/StatCard";
import { mockAccessEvents, mockAccessRequests } from "@/mocks/data";
import type { AccessEvent, AccessRequest } from "@/types";
import { DoorOpen, ShieldCheck, ShieldOff, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";

const eventCols: DataTableColumn<AccessEvent>[] = [
  { key: "studentName", header: "Student" },
  { key: "checkpoint", header: "Checkpoint" },
  { key: "timestamp", header: "Time", render: (r) => new Date(r.timestamp).toLocaleString() },
  { key: "status", header: "Status", render: (r) => <StatusBadge variant={getStatusVariant(r.status)}>{r.status}</StatusBadge> },
  { key: "method", header: "Method" },
];

export default function AdminAccess() {
  const { toast } = useToast();
  const [selectedReq, setSelectedReq] = useState<AccessRequest | null>(null);
  const allowed = mockAccessEvents.filter(e => e.status === "allowed").length;
  const denied = mockAccessEvents.filter(e => e.status === "denied").length;
  const pending = mockAccessRequests.filter(r => r.status === "pending").length;

  const handleAction = (action: "approve" | "deny") => {
    toast({ title: `Request ${action === "approve" ? "approved" : "denied"}`, description: `Access request has been ${action === "approve" ? "approved" : "denied"}.` });
    setSelectedReq(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Access Control" description="Monitor and manage campus access events and requests." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Events" value={mockAccessEvents.length} icon={DoorOpen} />
        <StatCard title="Allowed" value={allowed} icon={ShieldCheck} />
        <StatCard title="Denied" value={denied} icon={ShieldOff} />
        <StatCard title="Pending Requests" value={pending} icon={Clock} />
      </div>

      <SectionCard title="Pending Requests" description="Access requests awaiting approval">
        <div className="space-y-2">
          {mockAccessRequests.filter(r => r.status === "pending").map(req => (
            <div key={req.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => setSelectedReq(req)}>
              <div>
                <p className="text-sm font-medium">{req.studentName}</p>
                <p className="text-xs text-muted-foreground">{req.area} — {req.reason}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge variant="pending">Pending</StatusBadge>
                <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleAction("approve"); }}>Approve</Button>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={(e) => { e.stopPropagation(); handleAction("deny"); }}>Deny</Button>
              </div>
            </div>
          ))}
          {mockAccessRequests.filter(r => r.status === "pending").length === 0 && <p className="text-sm text-muted-foreground">No pending requests</p>}
        </div>
      </SectionCard>

      <SectionCard title="Access Events" noPadding>
        <div className="p-4">
          <DataTable columns={eventCols} data={mockAccessEvents} searchable searchKeys={["studentName", "checkpoint", "method", "status"]} />
        </div>
      </SectionCard>

      <Sheet open={!!selectedReq} onOpenChange={() => setSelectedReq(null)}>
        <SheetContent>
          {selectedReq && (
            <>
              <SheetHeader><SheetTitle>Access Request Details</SheetTitle></SheetHeader>
              <div className="space-y-4 mt-6 text-sm">
                <div><span className="text-muted-foreground text-xs block">Student</span>{selectedReq.studentName}</div>
                <div><span className="text-muted-foreground text-xs block">Area</span>{selectedReq.area}</div>
                <div><span className="text-muted-foreground text-xs block">Reason</span>{selectedReq.reason}</div>
                <div><span className="text-muted-foreground text-xs block">Status</span><StatusBadge variant={getStatusVariant(selectedReq.status)}>{selectedReq.status}</StatusBadge></div>
                <div><span className="text-muted-foreground text-xs block">Requested</span>{new Date(selectedReq.requestedAt).toLocaleString()}</div>
                <div className="flex gap-2 pt-4">
                  <Button className="flex-1" onClick={() => handleAction("approve")}>Approve</Button>
                  <Button variant="outline" className="flex-1 text-destructive" onClick={() => handleAction("deny")}>Deny</Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
