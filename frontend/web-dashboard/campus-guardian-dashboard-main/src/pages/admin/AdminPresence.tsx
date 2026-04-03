import { PageHeader, SectionCard } from "@/components/shared/PageComponents";
import { StatusBadge, getStatusVariant } from "@/components/shared/StatusBadge";
import { mockPresenceRecords, mockTracePoints } from "@/mocks/data";
import { MapPin, Signal, Clock, AlertTriangle, Radio } from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";

export default function AdminPresence() {
  const active = mockPresenceRecords.filter(p => p.status === "active").length;
  const missing = mockPresenceRecords.filter(p => p.status === "missing").length;

  return (
    <div className="space-y-6">
      <PageHeader title="Presence Intelligence" description="Real-time location and movement tracking across campus." />

      <div className="rounded-lg border border-dashed border-warning/50 bg-warning/5 p-4 flex items-center gap-3">
        <Radio className="h-5 w-5 text-warning flex-shrink-0" />
        <div>
          <p className="text-sm font-medium">Beta Module</p>
          <p className="text-xs text-muted-foreground">Presence intelligence is currently in preview. Some data points are simulated.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Signals" value={active} icon={Signal} />
        <StatCard title="Missing / No Signal" value={missing} icon={AlertTriangle} />
        <StatCard title="Checkpoints" value="12" subtitle="Active sensors" icon={MapPin} />
        <StatCard title="Avg. Dwell Time" value="42m" subtitle="Per checkpoint today" icon={Clock} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="Last Known Positions">
          <div className="space-y-3">
            {mockPresenceRecords.map(pr => (
              <div key={pr.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                    {pr.studentName?.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{pr.studentName}</p>
                    <p className="text-xs text-muted-foreground">{pr.checkpoint} • {new Date(pr.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {pr.signalStrength !== undefined && pr.signalStrength > 0 && (
                    <span className="text-xs text-muted-foreground">{pr.signalStrength}%</span>
                  )}
                  <StatusBadge variant={getStatusVariant(pr.status)}>{pr.status}</StatusBadge>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Sample Trace — Amara Okonkwo" description="Today's movement reconstruction">
          <div className="relative">
            {mockTracePoints.map((tp, i) => (
              <div key={i} className="flex gap-3 pb-4 last:pb-0">
                <div className="flex flex-col items-center">
                  <div className="h-3 w-3 rounded-full bg-primary border-2 border-background" />
                  {i < mockTracePoints.length - 1 && <div className="flex-1 w-px bg-border" />}
                </div>
                <div className="flex-1 min-w-0 pb-2">
                  <p className="text-sm font-medium">{tp.checkpoint}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{new Date(tp.timestamp).toLocaleTimeString()}</span>
                    {tp.duration && <span>• {tp.duration} min</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Movement Map" description="Campus checkpoint visualization">
        <div className="h-64 rounded-lg bg-muted/50 border border-dashed flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <MapPin className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm font-medium">Map Visualization</p>
            <p className="text-xs">Campus map integration coming soon</p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
