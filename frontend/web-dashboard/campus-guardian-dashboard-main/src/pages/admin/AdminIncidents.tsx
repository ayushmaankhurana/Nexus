import { useEffect, useState } from "react";
import { PageHeader, SectionCard } from "@/components/shared/PageComponents";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { StatusBadge, getStatusVariant } from "@/components/shared/StatusBadge";
import type { Incident } from "@/types";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { incidentsApi } from "@/services/dataApi";

const columns: DataTableColumn<Incident>[] = [
  { key: "title", header: "Incident", render: (r) => <p className="font-medium text-sm max-w-xs truncate">{r.title}</p> },
  { key: "severity", header: "Severity", render: (r) => <StatusBadge variant={getStatusVariant(r.severity)}>{r.severity}</StatusBadge> },
  { key: "status", header: "Status", render: (r) => <StatusBadge variant={getStatusVariant(r.status)}>{r.status}</StatusBadge> },
  { key: "studentName", header: "Student", className: "hidden md:table-cell" },
  { key: "createdAt", header: "Reported", render: (r) => new Date(r.createdAt).toLocaleDateString() },
];

export default function AdminIncidents() {
  const { toast } = useToast();

  const [selected, setSelected] = useState<Incident | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [assignedTo, setAssignedTo] = useState("");

  const [editStatus, setEditStatus] = useState<"open" | "assigned" | "resolved">("open");
  const [editAssignedTo, setEditAssignedTo] = useState("");

  const loadIncidents = async () => {
    try {
      setLoading(true);
      const response = await incidentsApi.getAll();
      setIncidents(response.data || []);
    } catch (error: any) {
      toast({
        title: "Failed to load incidents",
        description: error?.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncidents();
  }, []);

  useEffect(() => {
    if (selected) {
      setEditStatus((selected.status as "open" | "assigned" | "resolved") || "open");
      setEditAssignedTo(selected.assignedTo || "");
    }
  }, [selected]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await incidentsApi.create({
        title,
        description,
        severity,
        type: "MANUAL",
        assignedTo: assignedTo || undefined,
      });

      toast({
        title: "Incident created",
        description: "The incident has been logged successfully.",
      });

      setTitle("");
      setDescription("");
      setSeverity("medium");
      setAssignedTo("");
      setCreateOpen(false);

      await loadIncidents();
    } catch (error: any) {
      toast({
        title: "Failed to create incident",
        description: error?.message || "Something went wrong.",
        variant: "destructive",
      });
    }
  };

  const handleUpdate = async () => {
    if (!selected) return;

    try {
      await incidentsApi.update(selected.id, {
        status: editStatus,
        assignedTo: editAssignedTo || null,
      });

      toast({ title: "Incident updated" });
      setSelected(null);
      await loadIncidents();
    } catch (error: any) {
      toast({
        title: "Failed to update incident",
        description: error?.message || "Something went wrong.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Incidents"
        description="Track and manage campus security incidents."
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" />
                New Incident
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Report New Incident</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleCreate} className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Incident title" required />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the incident..."
                    rows={3}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Severity</Label>
                    <Select value={severity} onValueChange={(v) => setSeverity(v as any)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Assign To</Label>
                    <Input value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} placeholder="security-01" />
                  </div>
                </div>

                <Button type="submit" className="w-full">
                  Create Incident
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <SectionCard noPadding>
        <div className="p-4">
          <DataTable
            columns={columns}
            data={incidents}
            searchable
            searchKeys={["title", "description", "severity", "status", "studentName"]}
            onRowClick={setSelected}
          />
          {loading && <p className="text-sm text-muted-foreground mt-3">Loading incidents...</p>}
        </div>
      </SectionCard>

      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="text-left">{selected.title}</SheetTitle>
              </SheetHeader>

              <div className="space-y-4 mt-6">
                <div className="flex items-center gap-2">
                  <StatusBadge variant={getStatusVariant(selected.severity)}>{selected.severity}</StatusBadge>
                  <StatusBadge variant={getStatusVariant(selected.status)}>{selected.status}</StatusBadge>
                </div>

                <p className="text-sm text-muted-foreground">{selected.description}</p>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground text-xs block">Student</span>
                    {selected.studentName || "—"}
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs block">Reported</span>
                    {new Date(selected.createdAt).toLocaleString()}
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs block">Assigned To</span>
                    {selected.assignedTo || "—"}
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs block">Last Updated</span>
                    {new Date(selected.updatedAt).toLocaleString()}
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={editStatus} onValueChange={(v) => setEditStatus(v as any)}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="assigned">Assigned</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Assign To</Label>
                    <Input
                      value={editAssignedTo}
                      onChange={(e) => setEditAssignedTo(e.target.value)}
                      placeholder="security-01"
                    />
                  </div>

                  <Button onClick={handleUpdate}>Update</Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}