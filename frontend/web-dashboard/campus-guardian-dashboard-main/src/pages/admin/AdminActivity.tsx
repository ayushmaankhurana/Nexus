import { PageHeader } from "@/components/shared/PageComponents";
import { EmptyState } from "@/components/shared/StateComponents";
import { Activity } from "lucide-react";

export default function AdminActivity() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-400">
        <span className="text-lg leading-none">⚙️</span>
        <div>
          <p className="text-sm font-medium">Planned Feature</p>
          <p className="text-sm opacity-80">
            The activity log backend is not yet implemented — there is no activity model or storage
            in the database. A chronological audit trail of system events is planned for Phase 2.
          </p>
        </div>
      </div>

      <PageHeader
        title="Activity Log"
        description="Chronological audit trail of all system events."
      />

      <EmptyState
        icon={<Activity className="h-10 w-10" />}
        title="No activity log stored"
        description="System-wide activity logging is planned for Phase 2. Attendance and access history are available from their respective pages."
      />
    </div>
  );
}
