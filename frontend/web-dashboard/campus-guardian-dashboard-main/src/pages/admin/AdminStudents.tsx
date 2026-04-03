import { useState } from "react";
import { PageHeader, SectionCard } from "@/components/shared/PageComponents";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { StatusBadge, getStatusVariant } from "@/components/shared/StatusBadge";
import { mockStudents } from "@/mocks/data";
import type { User } from "@/types";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockAttendanceRecords, mockAccessEvents, mockIncidents, mockSession } from "@/mocks/data";

const columns: DataTableColumn<User>[] = [
  { key: "name", header: "Name", render: (r) => (
    <div className="flex items-center gap-2.5">
      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">{r.name.split(" ").map(n => n[0]).join("")}</div>
      <div><p className="font-medium text-sm">{r.name}</p><p className="text-xs text-muted-foreground">{r.email}</p></div>
    </div>
  )},
  { key: "studentId", header: "Student ID" },
  { key: "department", header: "Department", className: "hidden md:table-cell" },
  { key: "status", header: "Status", render: (r) => <StatusBadge variant={getStatusVariant(r.status)}>{r.status}</StatusBadge> },
];

export default function AdminStudents() {
  const [selected, setSelected] = useState<User | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader title="Students" description={`${mockStudents.length} registered students`} />
      <SectionCard>
        <DataTable columns={columns} data={mockStudents} searchable searchKeys={["name", "email", "studentId", "department"]} onRowClick={setSelected} emptyTitle="No students found" />
      </SectionCard>

      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium">{selected.name.split(" ").map(n => n[0]).join("")}</div>
                  <div>
                    <p>{selected.name}</p>
                    <p className="text-sm text-muted-foreground font-normal">{selected.studentId} • {selected.department}</p>
                  </div>
                </SheetTitle>
              </SheetHeader>
              <Tabs defaultValue="overview" className="mt-6">
                <TabsList className="w-full">
                  <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
                  <TabsTrigger value="attendance" className="flex-1">Attendance</TabsTrigger>
                  <TabsTrigger value="access" className="flex-1">Access</TabsTrigger>
                  <TabsTrigger value="incidents" className="flex-1">Incidents</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground text-xs block">Email</span>{selected.email}</div>
                    <div><span className="text-muted-foreground text-xs block">Status</span><StatusBadge variant={getStatusVariant(selected.status)}>{selected.status}</StatusBadge></div>
                    <div><span className="text-muted-foreground text-xs block">Last Login</span>{selected.lastLogin ? new Date(selected.lastLogin).toLocaleDateString() : "—"}</div>
                    <div><span className="text-muted-foreground text-xs block">Device</span>{mockSession.deviceName}</div>
                  </div>
                </TabsContent>
                <TabsContent value="attendance" className="mt-4">
                  <div className="space-y-2">
                    {mockAttendanceRecords.filter(r => r.studentId === selected.id).slice(0, 5).map(rec => (
                      <div key={rec.id} className="flex items-center justify-between text-sm py-2 border-b">
                        <div><p>{rec.course}</p><p className="text-xs text-muted-foreground">{rec.date}</p></div>
                        <StatusBadge variant={getStatusVariant(rec.status)}>{rec.status}</StatusBadge>
                      </div>
                    ))}
                    {mockAttendanceRecords.filter(r => r.studentId === selected.id).length === 0 && <p className="text-sm text-muted-foreground">No attendance records</p>}
                  </div>
                </TabsContent>
                <TabsContent value="access" className="mt-4">
                  <div className="space-y-2">
                    {mockAccessEvents.filter(e => e.studentId === selected.id).slice(0, 5).map(evt => (
                      <div key={evt.id} className="flex items-center justify-between text-sm py-2 border-b">
                        <div><p>{evt.checkpoint}</p><p className="text-xs text-muted-foreground">{evt.method}</p></div>
                        <StatusBadge variant={getStatusVariant(evt.status)}>{evt.status}</StatusBadge>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="incidents" className="mt-4">
                  <div className="space-y-2">
                    {mockIncidents.filter(i => i.studentId === selected.id).map(inc => (
                      <div key={inc.id} className="p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium">{inc.title}</p>
                          <StatusBadge variant={getStatusVariant(inc.severity)}>{inc.severity}</StatusBadge>
                        </div>
                        <p className="text-xs text-muted-foreground">{inc.description}</p>
                      </div>
                    ))}
                    {mockIncidents.filter(i => i.studentId === selected.id).length === 0 && <p className="text-sm text-muted-foreground">No incidents</p>}
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
