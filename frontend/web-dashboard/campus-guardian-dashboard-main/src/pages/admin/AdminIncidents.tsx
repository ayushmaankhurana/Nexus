import { PageHeader } from "@/components/shared/PageComponents";
import { EmptyState } from "@/components/shared/StateComponents";
import { ShieldAlert } from "lucide-react";

export default function AdminIncidents() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-400">
        <span className="text-lg leading-none">⚙️</span>
        <div>
          <p className="text-sm font-medium">Planned Feature</p>
          <p className="text-sm opacity-80">
            Incident management is planned for Phase 2. No incidents are stored in the database yet —
            the backend endpoint is a stub. This page will show real incidents once the backend is implemented.
          </p>
        </div>
      </div>

      <PageHeader
        title="Incidents"
        description="Track and manage campus security incidents."
      />

      <EmptyState
        icon={<ShieldAlert className="h-10 w-10" />}
        title="No incidents stored"
        description="Incident creation and management will be available in Phase 2 once the backend is implemented."
      />
    </div>
  );
}
