import { useEffect, useMemo, useState } from "react";
import { PageHeader, SectionCard } from "@/components/shared/PageComponents";
import { StatCard } from "@/components/shared/StatCard";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { StatusBadge, getStatusVariant } from "@/components/shared/StatusBadge";
import { ErrorState, LoadingState } from "@/components/shared/StateComponents";
import { CalendarCheck, AlertTriangle, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { attendanceApi } from "@/services/dataApi";
import { useToast } from "@/hooks/use-toast";
import type { AttendanceRecord } from "@/types";

const columns: DataTableColumn<AttendanceRecord>[] = [
  { key: "studentName", header: "Student" },
  { key: "date", header: "Date" },
  { key: "course", header: "Course", className: "hidden md:table-cell" },
  { key: "status", header: "Status", render: (r) => <StatusBadge variant={getStatusVariant(r.status)}>{r.status}</StatusBadge> },
  { key: "checkIn", header: "Check In", render: (r) => r.checkIn || "—" },
  { key: "flagged", header: "Flag", render: (r) => r.flagged ? <StatusBadge variant="warning">Flagged</StatusBadge> : <span className="text-muted-foreground">—</span> },
];

export default function AdminAttendance() {
  const { toast } = useToast();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function loadRecords() {
    try {
      setLoading(true);
      setError(null);
      const response = await attendanceApi.getAll({ page: "1", pageSize: "100" });
      setRecords(response.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load attendance records.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRecords();
  }, []);

  const present = records.filter((record) => record.status === "present").length;
  const absent = records.filter((record) => record.status === "absent").length;
  const late = records.filter((record) => record.status === "late").length;
  const flaggedRecords = useMemo(() => records.filter((record) => record.flagged), [records]);
  const flagged = flaggedRecords.length;

  async function handleMarkExcused(record: AttendanceRecord) {
    if (!record.classSessionTemplateId) {
      toast({ title: "Missing session context", description: "This record does not expose the session template needed for a manual override.", variant: "destructive" });
      return;
    }

    try {
      setUpdatingId(record.id);
      await attendanceApi.markManual({
        studentAccountId: record.studentId,
        classSessionTemplateId: record.classSessionTemplateId,
        scheduledDate: record.date,
        status: "EXCUSED",
      });
      toast({ title: "Attendance updated", description: `${record.studentName} is now marked excused for ${record.date}.` });
      await loadRecords();
    } catch (updateError) {
      toast({ title: "Update failed", description: updateError instanceof Error ? updateError.message : "Attendance override failed.", variant: "destructive" });
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Attendance Monitoring" description="Monitor campus-wide attendance records and anomalies." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Present Today" value={present} icon={CalendarCheck} />
        <StatCard title="Absent" value={absent} icon={Users} />
        <StatCard title="Late" value={late} icon={Clock} />
        <StatCard title="Flagged" value={flagged} icon={AlertTriangle} />
      </div>

      <SectionCard title="Anomalies" description="Records flagged for review">
        {error ? (
          <ErrorState message={error} onRetry={() => void loadRecords()} />
        ) : loading ? (
          <LoadingState className="min-h-[180px]" />
        ) : (
          <div className="space-y-2">
            {flaggedRecords.map(rec => (
              <div key={rec.id} className="flex items-center justify-between gap-3 text-sm py-2 border-b last:border-0">
                <div>
                  <p className="font-medium">{rec.studentName}</p>
                  <p className="text-xs text-muted-foreground">{rec.anomalyType || "Flagged attendance pattern"} • {rec.course}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge variant={getStatusVariant(rec.status)}>{rec.status}</StatusBadge>
                  {rec.status === "absent" && (
                    <Button variant="outline" size="sm" disabled={updatingId === rec.id} onClick={() => void handleMarkExcused(rec)}>
                      {updatingId === rec.id ? "Updating..." : "Mark Excused"}
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {flaggedRecords.length === 0 && <p className="text-sm text-muted-foreground">No anomalies detected in the seeded attendance records.</p>}
          </div>
        )}
      </SectionCard>

      <SectionCard title="All Records" noPadding>
        {error ? (
          <ErrorState message={error} onRetry={() => void loadRecords()} />
        ) : (
          <div className="p-4">
            <DataTable columns={columns} data={records} searchable searchKeys={["studentName", "rollNumber", "course", "date", "status", "method"]} isLoading={loading} emptyTitle="No attendance records" emptyDescription="Reset the demo data to repopulate seeded attendance history." />
          </div>
        )}
      </SectionCard>
    </div>
  );
}
