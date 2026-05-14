import { PageHeader } from "@/components/shared/PageComponents";
import { EmptyState } from "@/components/shared/StateComponents";
import { LifeBuoy } from "lucide-react";

export default function StudentSupport() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-400">
        <span className="text-lg leading-none">⚙️</span>
        <div>
          <p className="text-sm font-medium">Coming Soon</p>
          <p className="text-sm opacity-80">
            Student support requests are planned for Phase 2. No support issues are stored in the database yet.
            This page will show real requests once the backend is implemented.
          </p>
        </div>
      </div>

      <PageHeader title="Support" description="Submit requests and track support responses." />

      <EmptyState
        icon={<LifeBuoy className="h-10 w-10" />}
        title="Support requests coming soon"
        description="Issue reporting and support history will be available once the support backend is connected."
      />
    </div>
  );
}
