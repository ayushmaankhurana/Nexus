import { useEffect, useState } from "react";
import { PageHeader, SectionCard } from "@/components/shared/PageComponents";
import { StatCard } from "@/components/shared/StatCard";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { StatusBadge, getStatusVariant } from "@/components/shared/StatusBadge";
import { ErrorState, LoadingState } from "@/components/shared/StateComponents";
import { CalendarCheck, TrendingUp, Clock, AlertTriangle } from "lucide-react";
import { attendanceApi } from "@/services/dataApi";
import type { AttendanceRecord, AttendanceSummary } from "@/types";

const columns: DataTableColumn<AttendanceRecord>[] = [
  { key: "date", header: "Date" },
  { key: "course", header: "Course" },
  { key: "status", header: "Status", render: (r) => <StatusBadge variant={getStatusVariant(r.status)}>{r.status}</StatusBadge> },
  { key: "checkIn", header: "Check In", render: (r) => r.checkIn || "—" },
  { key: "checkOut", header: "Check Out", render: (r) => r.checkOut || "—" },
  { key: "location", header: "Location", className: "hidden lg:table-cell" },
];

export default function StudentAttendance() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAttendance() {
      try {
        setLoading(true);
        setError(null);
        const response = await attendanceApi.getMine();
        if (cancelled) return;
        setRecords(response.records);
        setSummary(response.summary);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load attendance history.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadAttendance();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="My Attendance" description="Track your attendance records and trends." />
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Attendance Rate" value={summary ? `${summary.percentage}%` : loading ? "..." : "0%"} icon={TrendingUp} />
        <StatCard title="Present" value={summary?.present ?? (loading ? "..." : 0)} icon={CalendarCheck} />
        <StatCard title="Absent" value={summary?.absent ?? (loading ? "..." : 0)} icon={AlertTriangle} />
        <StatCard title="Late" value={summary?.late ?? (loading ? "..." : 0)} icon={Clock} />
        <StatCard title="Excused" value={summary?.excused ?? (loading ? "..." : 0)} icon={CalendarCheck} />
      </div>
      <SectionCard title="Attendance History" noPadding>
        {error ? (
          <ErrorState message={error} />
        ) : loading ? (
          <LoadingState className="min-h-[220px]" />
        ) : (
          <div className="p-4">
            <DataTable columns={columns} data={records} searchable searchKeys={["course", "date", "status", "method"]} emptyTitle="No attendance records" emptyDescription="Attendance history will appear here once the backend records class sessions." />
          </div>
        )}
      </SectionCard>
    </div>
  );
}
