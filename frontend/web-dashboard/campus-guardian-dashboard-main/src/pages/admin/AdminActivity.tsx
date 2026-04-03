import { PageHeader } from "@/components/shared/PageComponents";
import { ActivityFeed } from "@/components/shared/ActivityFeed";
import { mockActivityEvents } from "@/mocks/data";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState } from "react";

export default function AdminActivity() {
  const [search, setSearch] = useState("");
  const filtered = search
    ? mockActivityEvents.filter(e => e.description.toLowerCase().includes(search.toLowerCase()) || e.type.toLowerCase().includes(search.toLowerCase()))
    : mockActivityEvents;

  return (
    <div className="space-y-6">
      <PageHeader title="Activity Log" description="Chronological audit trail of all system events." />
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search events..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="rounded-lg border bg-card p-4">
        <ActivityFeed items={filtered} />
      </div>
    </div>
  );
}
