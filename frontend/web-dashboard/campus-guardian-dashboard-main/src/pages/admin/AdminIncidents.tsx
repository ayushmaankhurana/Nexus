import { useState } from "react";
import { PageHeader, SectionCard } from "@/components/shared/PageComponents";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { StatusBadge, getStatusVariant } from "@/components/shared/StatusBadge";
import { mockIncidents } from "@/mocks/data";
import type { Incident } from "@/types";
import { ShieldAlert, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const columns: DataTableColumn<Incident>[] = [
  { key: "title", header: "Incident", render: (r) => <p className="font-medium text-sm max-w-xs truncate">{r.title}</p> },
  { key: "severity", header: "Severity", render: (r) => <StatusBadge variant={getStatusVariant(r.severity)}>{r.severity}</StatusBadge> },
  { key: "status", header: "Status", render: (r) => <StatusBadge variant={getStatusVariant(r.status)}>{r.status}</StatusBadge> },
  { key: "location", header: "Location", className: "hidden md:table-cell" },
  { key: "createdAt", header: "Reported", render: (r) => new Date(r.createdAt).toLocaleDateString() },
];

export default function AdminIncidents() {
  const { toast } = useToast();
  const [selected, setSelected] = useState<Incident | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "Incident created", description: "The incident has been logged successfully." });
    setCreateOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Incidents" description="Track and manage campus security incidents." actions={
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild><Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" />New Incident</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Report New Incident</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-2">
              <div className="space-y-2"><Label>Title</Label><Input placeholder="Incident title" required /></div>
              <div className="space-y-2"><Label>Description</Label><Textarea placeholder="Describe the incident..." rows={3} required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Severity</Label><Select defaultValue="medium"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="critical">Critical</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label>Location</Label><Input placeholder="Location" /></div>
              </div>
              <Button type="submit" className="w-full">Create Incident</Button>
            </form>
          </DialogContent>
        </Dialog>
      } />

      <SectionCard noPadding>
        <div className="p-4">
          <DataTable columns={columns} data={mockIncidents} searchable searchKeys={["title", "location", "severity", "status"]} onRowClick={setSelected} />
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
                  <div><span className="text-muted-foreground text-xs block">Location</span>{selected.location || "—"}</div>
                  <div><span className="text-muted-foreground text-xs block">Reported</span>{new Date(selected.createdAt).toLocaleString()}</div>
                  {selected.studentName && <div><span className="text-muted-foreground text-xs block">Student</span>{selected.studentName}</div>}
                  <div><span className="text-muted-foreground text-xs block">Last Updated</span>{new Date(selected.updatedAt).toLocaleString()}</div>
                </div>

                {selected.comments && selected.comments.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Activity</h4>
                    <div className="space-y-3">
                      {selected.comments.map(c => (
                        <div key={c.id} className="p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">{c.authorName}</span>
                            <span className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleString()}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{c.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Select defaultValue={selected.status}>
                    <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="investigating">Investigating</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={() => { toast({ title: "Status updated" }); setSelected(null); }}>Update</Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
