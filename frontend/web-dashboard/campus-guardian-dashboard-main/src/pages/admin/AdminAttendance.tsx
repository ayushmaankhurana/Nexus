import { PageHeader, SectionCard } from "@/components/shared/PageComponents";
import { StatCard } from "@/components/shared/StatCard";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { StatusBadge, getStatusVariant } from "@/components/shared/StatusBadge";
import { CalendarCheck, AlertTriangle, Clock, Users } from "lucide-react";
import { mockAttendanceRecords } from "@/mocks/data";
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
  const present = mockAttendanceRecords.filter(r => r.status === "present").length;
  const absent = mockAttendanceRecords.filter(r => r.status === "absent").length;
  const late = mockAttendanceRecords.filter(r => r.status === "late").length;
  const flagged = mockAttendanceRecords.filter(r => r.flagged).length;

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
        <div className="space-y-2">
          {mockAttendanceRecords.filter(r => r.flagged).map(rec => (
            <div key={rec.id} className="flex items-center justify-between text-sm py-2 border-b last:border-0">
              <div>
                <p className="font-medium">{rec.studentName}</p>
                <p className="text-xs text-muted-foreground">{rec.anomalyType} • {rec.course}</p>
              </div>
              <StatusBadge variant={getStatusVariant(rec.status)}>{rec.status}</StatusBadge>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="All Records" noPadding>
        <div className="p-4">
          <DataTable columns={columns} data={mockAttendanceRecords} searchable searchKeys={["studentName", "course", "date", "status"]} />
        </div>
      </SectionCard>
    </div>
  );
}
