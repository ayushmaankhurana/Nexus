import { useEffect, useMemo, useState } from "react";
import { PageHeader, SectionCard } from "@/components/shared/PageComponents";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { StatusBadge, getStatusVariant } from "@/components/shared/StatusBadge";
import { StatCard } from "@/components/shared/StatCard";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/StateComponents";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { accessApi } from "@/services/dataApi";
import type { AccessEvent } from "@/types";
import { DoorOpen, RefreshCcw, ShieldCheck, ShieldOff, Users } from "lucide-react";

const eventCols: DataTableColumn<AccessEvent>[] = [
  {
    key: "studentName",
    header: "Student",
    render: (row) => (
      <div>
        <p className="font-medium text-sm">{row.studentName || row.rollNumber || "Unknown Student"}</p>
        <p className="text-xs text-muted-foreground">{row.rollNumber || row.studentId}</p>
      </div>
    ),
  },
  { key: "checkpoint", header: "Checkpoint" },
  { key: "timestamp", header: "Time", render: (row) => new Date(row.timestamp).toLocaleString() },
  { key: "status", header: "Status", render: (row) => <StatusBadge variant={getStatusVariant(row.status)}>{row.status}</StatusBadge> },
  {
    key: "method",
    header: "Details",
    render: (row) => (
      <div>
        <p className="text-sm font-medium">{row.action || "ENTRY"}</p>
        <p className="text-xs text-muted-foreground">{row.method}</p>
      </div>
    ),
  },
];

type CheckAction = "ENTRY" | "EXIT";

type LiveAccessCheckResult = {
  decision: "ALLOW" | "DENY";
  event: AccessEvent;
  shouldEscalate: boolean;
  deniedCountWindow: number;
};

function buildScenarioDescription(event: AccessEvent): string {
  const identity = event.studentName || event.rollNumber || "Selected student";
  return `${identity} at ${event.checkpoint}`;
}

export default function AdminAccess() {
  const { toast } = useToast();
  const [events, setEvents] = useState<AccessEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedCheckpointId, setSelectedCheckpointId] = useState("");
  const [selectedAction, setSelectedAction] = useState<CheckAction>("ENTRY");
  const [checking, setChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState<LiveAccessCheckResult | null>(null);

  async function loadEvents() {
    try {
      setEventsLoading(true);
      setEventsError(null);
      const response = await accessApi.getAll({ page: "1", pageSize: "100" });
      setEvents(response.data);
    } catch (error) {
      setEventsError(error instanceof Error ? error.message : "Failed to load access events.");
    } finally {
      setEventsLoading(false);
    }
  }

  useEffect(() => {
    void loadEvents();
  }, []);

  const studentOptions = useMemo(() => {
    const map = new Map<string, { id: string; label: string }>();

    for (const event of events) {
      if (!map.has(event.studentId)) {
        const label = event.rollNumber
          ? `${event.studentName || event.rollNumber} (${event.rollNumber})`
          : event.studentName || event.studentId;
        map.set(event.studentId, { id: event.studentId, label });
      }
    }

    return Array.from(map.values()).sort((left, right) => left.label.localeCompare(right.label));
  }, [events]);

  const checkpointOptions = useMemo(() => {
    const map = new Map<string, { id: string; label: string }>();

    for (const event of events) {
      if (event.checkpointId && !map.has(event.checkpointId)) {
        map.set(event.checkpointId, { id: event.checkpointId, label: event.checkpoint });
      }
    }

    return Array.from(map.values()).sort((left, right) => left.label.localeCompare(right.label));
  }, [events]);

  useEffect(() => {
    if (!selectedStudentId && studentOptions[0]) {
      setSelectedStudentId(studentOptions[0].id);
    }
  }, [selectedStudentId, studentOptions]);

  useEffect(() => {
    if (!selectedCheckpointId && checkpointOptions[0]) {
      setSelectedCheckpointId(checkpointOptions[0].id);
    }
  }, [selectedCheckpointId, checkpointOptions]);

  const scenarios = useMemo(() => {
    const mainGate = checkpointOptions.find((option) => option.label === "Main Campus Gate");
    const parkingZone = checkpointOptions.find((option) => option.label === "Parking Zone A");
    const anjali = events.find((event) => event.rollNumber === "CS21002");
    const priya = events.find((event) => event.rollNumber === "CS21004");
    const rahul = events.find((event) => event.rollNumber === "CS21001");

    return [
      anjali && mainGate
        ? { label: "Allow entry", studentId: anjali.studentId, checkpointId: mainGate.id, action: "ENTRY" as const }
        : null,
      priya && parkingZone
        ? { label: "Deny parking", studentId: priya.studentId, checkpointId: parkingZone.id, action: "ENTRY" as const }
        : null,
      rahul && mainGate
        ? { label: "Deny inactive account", studentId: rahul.studentId, checkpointId: mainGate.id, action: "ENTRY" as const }
        : null,
    ].filter((scenario): scenario is { label: string; studentId: string; checkpointId: string; action: CheckAction } => Boolean(scenario));
  }, [checkpointOptions, events]);

  const allowed = events.filter((event) => event.status === "allowed").length;
  const denied = events.filter((event) => event.status === "denied").length;
  const uniqueStudents = new Set(events.map((event) => event.studentId)).size;

  async function handleRunCheck() {
    if (!selectedStudentId || !selectedCheckpointId) {
      toast({
        title: "Selection required",
        description: "Pick a student and checkpoint before running a live access check.",
      });
      return;
    }

    try {
      setChecking(true);
      const result = await accessApi.check({
        accountId: selectedStudentId,
        geofenceId: selectedCheckpointId,
        action: selectedAction,
        credentialType: "MANUAL",
      });

      setLastCheck(result);
      toast({
        title: result.decision === "ALLOW" ? "Access allowed" : "Access denied",
        description: result.shouldEscalate
          ? `${buildScenarioDescription(result.event)}. Repeated denials reached the escalation threshold.`
          : buildScenarioDescription(result.event),
      });
      await loadEvents();
    } catch (error) {
      toast({
        title: "Live check failed",
        description: error instanceof Error ? error.message : "The access decision could not be completed.",
        variant: "destructive",
      });
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Access Control"
        description="Monitor live campus access decisions and replay seeded demo scenarios against the real backend."
        actions={
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => void loadEvents()} disabled={eventsLoading}>
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Total Events" value={events.length} icon={DoorOpen} />
        <StatCard title="Allowed" value={allowed} icon={ShieldCheck} />
        <StatCard title="Denied" value={denied} icon={ShieldOff} />
        <StatCard title="Students Seen" value={uniqueStudents} icon={Users} />
      </div>

      <SectionCard title="Run Live Access Check" description="This writes a real access event, then refreshes the history below.">
        {eventsLoading && events.length === 0 ? (
          <LoadingState className="min-h-[180px]" />
        ) : eventsError ? (
          <ErrorState message={eventsError} onRetry={() => void loadEvents()} />
        ) : studentOptions.length === 0 || checkpointOptions.length === 0 ? (
          <EmptyState
            title="No access options available"
            description="Reset the demo data to repopulate seeded access history before running a live check."
          />
        ) : (
          <div className="space-y-5">
            <div className="grid gap-3 md:grid-cols-4">
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Student</p>
                <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {studentOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Checkpoint</p>
                <Select value={selectedCheckpointId} onValueChange={setSelectedCheckpointId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a checkpoint" />
                  </SelectTrigger>
                  <SelectContent>
                    {checkpointOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Action</p>
                <Select value={selectedAction} onValueChange={(value) => setSelectedAction(value as CheckAction)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ENTRY">ENTRY</SelectItem>
                    <SelectItem value="EXIT">EXIT</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button className="w-full" onClick={() => void handleRunCheck()} disabled={checking}>
                  {checking ? "Running..." : "Run Check"}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Quick Demo Scenarios</p>
              <div className="flex flex-wrap gap-2">
                {scenarios.map((scenario) => (
                  <Button
                    key={scenario.label}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedStudentId(scenario.studentId);
                      setSelectedCheckpointId(scenario.checkpointId);
                      setSelectedAction(scenario.action);
                    }}
                  >
                    {scenario.label}
                  </Button>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Use these to quickly load one allow case and two predictable deny cases from the seeded dataset.
              </p>
            </div>

            <div className="rounded-lg border bg-muted/20 p-4 text-sm">
              {lastCheck ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">Last Result</p>
                      <p className="text-xs text-muted-foreground">{buildScenarioDescription(lastCheck.event)}</p>
                    </div>
                    <StatusBadge variant={lastCheck.decision === "ALLOW" ? "allowed" : "denied"}>
                      {lastCheck.decision}
                    </StatusBadge>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Recorded Action</p>
                      <p>{lastCheck.event.action || "ENTRY"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Rule Outcome</p>
                      <p>{lastCheck.event.method}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Denied Window Count</p>
                      <p>{lastCheck.deniedCountWindow}</p>
                    </div>
                  </div>
                  {lastCheck.shouldEscalate && (
                    <p className="text-sm text-destructive">
                      Escalation suggested: this account has crossed the repeated-denial threshold.
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">No live check has been run yet in this session.</p>
              )}
            </div>
          </div>
        )}
      </SectionCard>

      <SectionCard title="Access Events" noPadding>
        {eventsError ? (
          <ErrorState message={eventsError} onRetry={() => void loadEvents()} />
        ) : (
          <div className="p-4">
            <DataTable
              columns={eventCols}
              data={events}
              searchable
              searchKeys={["studentName", "rollNumber", "checkpoint", "method", "status", "action"]}
              isLoading={eventsLoading}
              emptyTitle="No access events found"
              emptyDescription="Run a live check or reset the demo data to populate access history."
            />
          </div>
        )}
      </SectionCard>
    </div>
  );
}
