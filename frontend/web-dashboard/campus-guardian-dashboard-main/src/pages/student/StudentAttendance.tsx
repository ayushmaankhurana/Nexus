import { PageHeader, SectionCard } from "@/components/shared/PageComponents";
import { StatCard } from "@/components/shared/StatCard";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { StatusBadge, getStatusVariant } from "@/components/shared/StatusBadge";
import { CalendarCheck, TrendingUp, Clock, AlertTriangle } from "lucide-react";
import { mockAttendanceSummary, mockAttendanceRecords } from "@/mocks/data";
import type { AttendanceRecord } from "@/types";

const columns: DataTableColumn<AttendanceRecord>[] = [
  { key: "date", header: "Date" },
  { key: "course", header: "Course" },
  { key: "status", header: "Status", render: (r) => <StatusBadge variant={getStatusVariant(r.status)}>{r.status}</StatusBadge> },
  { key: "checkIn", header: "Check In", render: (r) => r.checkIn || "—" },
  { key: "checkOut", header: "Check Out", render: (r) => r.checkOut || "—" },
  { key: "location", header: "Location", className: "hidden lg:table-cell" },
];

export default function StudentAttendance() {
  const myRecords = mockAttendanceRecords.filter(r => r.studentId === "stu-001");
  const s = mockAttendanceSummary;

  return (
    <div className="space-y-6">
      <PageHeader title="My Attendance" description="Track your attendance records and trends." />
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Attendance Rate" value={`${s.percentage}%`} icon={TrendingUp} />
        <StatCard title="Present" value={s.present} icon={CalendarCheck} />
        <StatCard title="Absent" value={s.absent} icon={AlertTriangle} />
        <StatCard title="Late" value={s.late} icon={Clock} />
        <StatCard title="Excused" value={s.excused} icon={CalendarCheck} />
      </div>
      <SectionCard title="Attendance History" noPadding>
        <div className="p-4">
          <DataTable columns={columns} data={myRecords} searchable searchKeys={["course", "date", "status"]} emptyTitle="No attendance records" />
        </div>
      </SectionCard>
    </div>
  );
}
