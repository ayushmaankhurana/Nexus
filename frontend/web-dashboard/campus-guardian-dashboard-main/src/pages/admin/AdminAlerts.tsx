import { PageHeader } from "@/components/shared/PageComponents";
import { EmptyState } from "@/components/shared/StateComponents";
import { Bell } from "lucide-react";

export default function AdminAlerts() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-400">
        <span className="text-lg leading-none">⚙️</span>
        <div>
          <p className="text-sm font-medium">Planned Feature</p>
          <p className="text-sm opacity-80">
            The alerts backend is not yet implemented — there is no alert model or storage in the
            database. Centralized alert management is planned for Phase 2.
          </p>
        </div>
      </div>

      <PageHeader
        title="Alerts"
        description="Centralized alert management and monitoring."
      />

      <EmptyState
        icon={<Bell className="h-10 w-10" />}
        title="No alerts stored"
        description="Alert persistence and delivery are planned for Phase 2. Student-facing alerts derived from attendance and access data are available on each student's Alerts page."
      />
    </div>
  );
}
