import { useEffect, useState } from "react";
import { PageHeader, SectionCard } from "@/components/shared/PageComponents";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { StatusBadge, getStatusVariant } from "@/components/shared/StatusBadge";
import type { AccessEvent, AttendanceRecord, User } from "@/types";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { studentsApi } from "@/services/dataApi";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/StateComponents";
import { AlertCircle } from "lucide-react";

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
  const [students, setStudents] = useState<User[]>([]);
  const [studentsTotal, setStudentsTotal] = useState(0);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [studentsError, setStudentsError] = useState<string | null>(null);
  const [selected, setSelected] = useState<User | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<User | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [accessEvents, setAccessEvents] = useState<AccessEvent[]>([]);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerError, setDrawerError] = useState<string | null>(null);

  async function loadStudents() {
    try {
      setStudentsLoading(true);
      setStudentsError(null);
      const response = await studentsApi.getAll({ page: "1", pageSize: "50" });
      setStudents(response.data);
      setStudentsTotal(response.total);
    } catch (error) {
      setStudentsError(error instanceof Error ? error.message : "Failed to load students.");
    } finally {
      setStudentsLoading(false);
    }
  }

  useEffect(() => {
    void loadStudents();
  }, []);

  useEffect(() => {
    if (!selected) {
      setSelectedProfile(null);
      setAttendance([]);
      setAccessEvents([]);
      setDrawerError(null);
      return;
    }

    let cancelled = false;

    async function loadStudentDetails() {
      try {
        setDrawerLoading(true);
        setDrawerError(null);

        const [profile, attendanceHistory, accessHistory] = await Promise.all([
          studentsApi.getById(selected.id),
          studentsApi.getAttendance(selected.id),
          studentsApi.getAccess(selected.id),
        ]);

        if (cancelled) return;

        setSelectedProfile(profile);
        setAttendance(attendanceHistory);
        setAccessEvents(accessHistory);
      } catch (error) {
        if (cancelled) return;
        setDrawerError(error instanceof Error ? error.message : "Failed to load student details.");
      } finally {
        if (!cancelled) {
          setDrawerLoading(false);
        }
      }
    }

    void loadStudentDetails();

    return () => {
      cancelled = true;
    };
  }, [selected]);

  return (
    <div className="space-y-6">
      <PageHeader title="Students" description={`${studentsTotal} registered students`} />
      <SectionCard>
        {studentsError ? (
          <ErrorState message={studentsError} onRetry={() => void loadStudents()} />
        ) : (
          <DataTable columns={columns} data={students} searchable searchKeys={["name", "email", "studentId", "department"]} onRowClick={setSelected} emptyTitle="No students found" isLoading={studentsLoading} />
        )}
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
                    <p className="text-sm text-muted-foreground font-normal">{selected.studentId}{selected.department ? ` • ${selected.department}` : ""}</p>
                  </div>
                </SheetTitle>
              </SheetHeader>
              {drawerLoading ? (
                <LoadingState className="min-h-[240px]" />
              ) : drawerError ? (
                <ErrorState message={drawerError} />
              ) : !selectedProfile ? (
                <EmptyState title="Student details unavailable" description="No profile was returned for this student." icon={<AlertCircle className="h-10 w-10" />} />
              ) : (
              <Tabs defaultValue="overview" className="mt-6">
                <TabsList className="w-full">
                  <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
                  <TabsTrigger value="attendance" className="flex-1">Attendance</TabsTrigger>
                  <TabsTrigger value="access" className="flex-1">Access</TabsTrigger>
                  <TabsTrigger value="incidents" className="flex-1">Incidents</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground text-xs block">Email</span>{selectedProfile.email}</div>
                    <div><span className="text-muted-foreground text-xs block">Status</span><StatusBadge variant={getStatusVariant(selectedProfile.status)}>{selectedProfile.status}</StatusBadge></div>
                    <div><span className="text-muted-foreground text-xs block">Roll Number</span>{selectedProfile.studentId}</div>
                    <div><span className="text-muted-foreground text-xs block">RFID Tag</span>{(selected as User & { rfidTag?: string | null }).rfidTag || "—"}</div>
                  </div>
                </TabsContent>
                <TabsContent value="attendance" className="mt-4">
                  <div className="space-y-2">
                    {attendance.map(rec => (
                      <div key={rec.id} className="flex items-center justify-between text-sm py-2 border-b">
                        <div><p>{rec.course}</p><p className="text-xs text-muted-foreground">{rec.date}</p></div>
                        <StatusBadge variant={getStatusVariant(rec.status)}>{rec.status}</StatusBadge>
                      </div>
                    ))}
                    {attendance.length === 0 && <p className="text-sm text-muted-foreground">No attendance records</p>}
                  </div>
                </TabsContent>
                <TabsContent value="access" className="mt-4">
                  <div className="space-y-2">
                    {accessEvents.map(evt => (
                      <div key={evt.id} className="flex items-center justify-between text-sm py-2 border-b">
                        <div><p>{evt.checkpoint}</p><p className="text-xs text-muted-foreground">{evt.method}</p></div>
                        <StatusBadge variant={getStatusVariant(evt.status)}>{evt.status}</StatusBadge>
                      </div>
                    ))}
                    {accessEvents.length === 0 && <p className="text-sm text-muted-foreground">No access events</p>}
                  </div>
                </TabsContent>
                <TabsContent value="incidents" className="mt-4">
                  <p className="text-sm text-muted-foreground">Incident history is not wired yet. This tab will connect once the incidents backend is implemented.</p>
                </TabsContent>
              </Tabs>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
