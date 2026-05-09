import { useEffect, useMemo, useRef, useState } from "react";
import { PageHeader, SectionCard } from "@/components/shared/PageComponents";
import { StatusBadge, getStatusVariant } from "@/components/shared/StatusBadge";
import { ErrorState, LoadingState } from "@/components/shared/StateComponents";
import { presenceApi, type PresenceOverview } from "@/services/dataApi";
import type { PresenceRecord, TracePoint } from "@/types";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Signal, Clock, AlertTriangle, Radio, ZoomIn, ZoomOut, RefreshCcw, Move } from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";

function formatMapPoint(lat: number | null | undefined, lng: number | null | undefined): string {
  if (lat === null || lat === undefined || lng === null || lng === undefined) {
    return "No coordinates";
  }

  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

function buildMapProjection(records: PresenceRecord[], geofences: PresenceOverview["geofences"], trace: TracePoint[]) {
  const coordinatePool = [
    ...geofences.map((item) => ({ lat: item.lat, lng: item.lng })),
    ...records.filter((item) => item.lat !== null && item.lat !== undefined && item.lng !== null && item.lng !== undefined).map((item) => ({ lat: item.lat as number, lng: item.lng as number })),
    ...trace.filter((item) => item.lat !== undefined && item.lng !== undefined).map((item) => ({ lat: item.lat as number, lng: item.lng as number })),
  ];

  if (coordinatePool.length === 0) {
    return null;
  }

  const lats = coordinatePool.map((point) => point.lat);
  const lngs = coordinatePool.map((point) => point.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  return (lat: number, lng: number) => {
    const x = maxLng === minLng ? 50 : ((lng - minLng) / (maxLng - minLng)) * 100;
    const y = maxLat === minLat ? 50 : 100 - ((lat - minLat) / (maxLat - minLat)) * 100;
    return { x, y };
  };
}

export default function AdminPresence() {
  const { toast } = useToast();
  const [overview, setOverview] = useState<PresenceOverview | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [trace, setTrace] = useState<TracePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [traceLoading, setTraceLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showAllStudents, setShowAllStudents] = useState(false);
  const dragState = useRef<{ pointerId: number; startX: number; startY: number; originX: number; originY: number } | null>(null);

  async function loadOverview() {
    try {
      setLoading(true);
      setError(null);
      const response = await presenceApi.getOverview();
      setOverview(response);

      if (!selectedStudentId && response.records[0]) {
        setSelectedStudentId(response.records[0].studentId);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load presence overview.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadOverview();
  }, []);

  useEffect(() => {
    if (!selectedStudentId) {
      setTrace([]);
      return;
    }

    let cancelled = false;

    async function loadTrace() {
      try {
        setTraceLoading(true);
        const response = await presenceApi.getTrace(selectedStudentId);
        if (!cancelled) {
          setTrace(response);
        }
      } catch {
        if (!cancelled) {
          setTrace([]);
        }
      } finally {
        if (!cancelled) {
          setTraceLoading(false);
        }
      }
    }

    void loadTrace();

    return () => {
      cancelled = true;
    };
  }, [selectedStudentId]);

  const records = overview?.records ?? [];
  const geofences = overview?.geofences ?? [];
  const active = records.filter((record) => record.status === "active").length;
  const missing = records.filter((record) => record.status === "missing").length;
  const uniqueCheckpoints = new Set(records.filter((record) => record.checkpoint !== "No recent signal").map((record) => record.checkpoint)).size;
  const selectedRecord = records.find((record) => record.studentId === selectedStudentId) ?? records[0] ?? null;
  const projection = useMemo(() => buildMapProjection(records, geofences, trace), [records, geofences, trace]);
  const traceSegments = useMemo(() => trace.filter((point) => point.lat !== undefined && point.lng !== undefined), [trace]);
  const simulationTargets = useMemo(() => {
    return geofences.filter((geofence) => ["Main Campus Gate", "Back Campus Gate", "CS-101 Lecture Hall", "CS-102 Lecture Hall", "CS-103 Lab", "Parking Zone A"].includes(geofence.name));
  }, [geofences]);

  async function refreshSelectedTrace(studentId: string | null) {
    if (!studentId) {
      setTrace([]);
      return;
    }

    setTraceLoading(true);
    try {
      const response = await presenceApi.getTrace(studentId);
      setTrace(response);
    } finally {
      setTraceLoading(false);
    }
  }

  async function handleSimulateMove(target: PresenceOverview["geofences"][number]) {
    if (!selectedRecord) {
      return;
    }

    try {
      setSimulating(true);
      const scatterLat = target.lat + (selectedRecord.rollNumber.charCodeAt(selectedRecord.rollNumber.length - 1) % 3 - 1) * 0.00005;
      const scatterLng = target.lng + (selectedRecord.rollNumber.charCodeAt(0) % 3 - 1) * 0.00005;

      await presenceApi.updateLocation(selectedRecord.studentId, {
        lat: scatterLat,
        lng: scatterLng,
      });

      const refreshedOverview = await presenceApi.getOverview();
      setOverview(refreshedOverview);
      await refreshSelectedTrace(selectedRecord.studentId);
      toast({
        title: "Location simulated",
        description: `${selectedRecord.studentName} was moved to ${target.name}.`,
      });
    } catch (simulateError) {
      toast({
        title: "Simulation failed",
        description: simulateError instanceof Error ? simulateError.message : "Location update could not be simulated.",
        variant: "destructive",
      });
    } finally {
      setSimulating(false);
    }
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    dragState.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: pan.x,
      originY: pan.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragState.current || dragState.current.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - dragState.current.startX;
    const deltaY = event.clientY - dragState.current.startY;
    setPan({
      x: dragState.current.originX + deltaX,
      y: dragState.current.originY + deltaY,
    });
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (dragState.current?.pointerId === event.pointerId) {
      event.currentTarget.releasePointerCapture(event.pointerId);
      dragState.current = null;
    }
  }

  function handleWheel(event: React.WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    setZoom((currentZoom) => {
      const nextZoom = event.deltaY < 0 ? currentZoom + 0.12 : currentZoom - 0.12;
      return Math.min(2.4, Math.max(0.75, Number(nextZoom.toFixed(2))));
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Presence Intelligence" description="Real-time location and movement tracking across campus." />

      <div className="rounded-lg border border-dashed border-warning/50 bg-warning/5 p-4 flex items-center gap-3">
        <Radio className="h-5 w-5 text-warning flex-shrink-0" />
        <div>
          <p className="text-sm font-medium">Preview Module</p>
          <p className="text-xs text-muted-foreground">This slice now uses real seeded location history and live backend trace reconstruction, with a lightweight coordinate map instead of a third-party map SDK.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Signals" value={active} icon={Signal} />
        <StatCard title="Missing / No Signal" value={missing} icon={AlertTriangle} />
        <StatCard title="Checkpoints Seen" value={uniqueCheckpoints} subtitle="Named locations in latest snapshots" icon={MapPin} />
        <StatCard title="Trace Points" value={trace.length} subtitle={selectedRecord ? `For ${selectedRecord.studentName}` : "Select a student"} icon={Clock} />
      </div>

      {error ? (
        <ErrorState message={error} onRetry={() => void loadOverview()} />
      ) : loading ? (
        <LoadingState className="min-h-[320px]" />
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SectionCard title="Last Known Positions">
              <div className="space-y-3">
                {(showAllStudents ? records : records.slice(0, 10)).map((record) => (
                  <button
                    key={record.id}
                    type="button"
                    className="w-full text-left flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors"
                    onClick={() => setSelectedStudentId(record.studentId)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                        {record.studentName?.split(" ").map((name) => name[0]).join("")}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{record.studentName}</p>
                        <p className="text-xs text-muted-foreground">{record.rollNumber} • {record.checkpoint}</p>
                        <p className="text-xs text-muted-foreground">{record.timestamp ? new Date(record.timestamp).toLocaleString() : "No recent signal"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge variant={getStatusVariant(record.status)}>{record.status}</StatusBadge>
                    </div>
                  </button>
                ))}
                {records.length > 10 && (
                  <button
                    type="button"
                    className="w-full text-center text-sm text-muted-foreground hover:text-foreground py-2 transition-colors"
                    onClick={() => setShowAllStudents((prev) => !prev)}
                  >
                    {showAllStudents ? `Show less` : `Show ${records.length - 10} more students`}
                  </button>
                )}
              </div>
            </SectionCard>

            <SectionCard title={selectedRecord ? `Trace — ${selectedRecord.studentName}` : "Trace"} description={selectedRecord ? `${selectedRecord.rollNumber} movement reconstruction` : "Select a student to inspect movement history"}>
              {traceLoading ? (
                <LoadingState className="min-h-[220px]" />
              ) : (
                <div className="relative">
                  {trace.map((point, index) => (
                    <div key={`${point.checkpoint}-${point.timestamp}-${index}`} className="flex gap-3 pb-4 last:pb-0">
                      <div className="flex flex-col items-center">
                        <div className="h-3 w-3 rounded-full bg-primary border-2 border-background" />
                        {index < trace.length - 1 && <div className="flex-1 w-px bg-border" />}
                      </div>
                      <div className="flex-1 min-w-0 pb-2">
                        <p className="text-sm font-medium">{point.checkpoint}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{new Date(point.timestamp).toLocaleTimeString()}</span>
                          {(point.lat !== undefined && point.lng !== undefined) && <span>• {formatMapPoint(point.lat, point.lng)}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                  {trace.length === 0 && <p className="text-sm text-muted-foreground">No trail data is available for the selected student.</p>}
                </div>
              )}
            </SectionCard>
          </div>

          <SectionCard title="Simulate Location Update" description="Move the selected student to a known checkpoint so the map and trace change live during the demo.">
            {!selectedRecord ? (
              <p className="text-sm text-muted-foreground">Select a student first.</p>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Selected: <span className="font-medium text-foreground">{selectedRecord.studentName}</span> ({selectedRecord.rollNumber})</p>
                <div className="flex flex-wrap gap-2">
                  {simulationTargets.map((target) => (
                    <Button key={target.id} type="button" variant="outline" size="sm" disabled={simulating} onClick={() => void handleSimulateMove(target)}>
                      <Move className="h-3.5 w-3.5 mr-1.5" />
                      {target.name}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Each simulation writes a real location record through the backend, then refreshes the overview and trail.</p>
              </div>
            )}
          </SectionCard>

          <SectionCard title="Movement Map" description="Live geofence and last-known-position projection based on seeded campus coordinates.">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="text-xs text-muted-foreground">Drag to pan. Scroll or use controls to zoom.</div>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setZoom((value) => Math.max(0.75, Number((value - 0.12).toFixed(2))))}><ZoomOut className="h-4 w-4" /></Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setZoom((value) => Math.min(2.4, Number((value + 0.12).toFixed(2))))}><ZoomIn className="h-4 w-4" /></Button>
                <Button type="button" variant="outline" size="sm" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}><RefreshCcw className="h-4 w-4 mr-1.5" />Reset View</Button>
              </div>
            </div>
            <div className="h-80 rounded-lg border bg-muted/30 relative overflow-hidden cursor-grab active:cursor-grabbing" onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp} onWheel={handleWheel}>
              {!projection ? (
                <div className="absolute inset-0 flex items-center justify-center text-center text-muted-foreground">
                  <div>
                    <MapPin className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm font-medium">No map coordinates available</p>
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 origin-center" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}>
                  <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    {traceSegments.map((point, index) => {
                      if (index === traceSegments.length - 1) return null;
                      const current = projection(point.lat as number, point.lng as number);
                      const next = projection(traceSegments[index + 1].lat as number, traceSegments[index + 1].lng as number);
                      return <line key={`${point.timestamp}-${index}`} x1={current.x} y1={current.y} x2={next.x} y2={next.y} stroke="currentColor" strokeOpacity="0.35" strokeWidth="0.7" className="text-primary" />;
                    })}
                  </svg>

                  {geofences.map((geofence) => {
                    const point = projection(geofence.lat, geofence.lng);
                    return (
                      <div key={geofence.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${point.x}%`, top: `${point.y}%` }}>
                        <div className="h-3 w-3 rounded-full border-2 border-background bg-sky-500 shadow" />
                        <div className="mt-1 rounded bg-background/90 px-2 py-1 text-[10px] text-foreground shadow">
                          {geofence.name}
                        </div>
                      </div>
                    );
                  })}

                  {records.filter((record) => record.lat !== null && record.lng !== null).map((record) => {
                    const point = projection(record.lat as number, record.lng as number);
                    const isSelected = record.studentId === selectedStudentId;
                    return (
                      <button
                        key={record.studentId}
                        type="button"
                        className="absolute -translate-x-1/2 -translate-y-1/2 text-left"
                        style={{ left: `${point.x}%`, top: `${point.y}%` }}
                        onClick={() => setSelectedStudentId(record.studentId)}
                      >
                        <div className={`h-4 w-4 rounded-full border-2 border-background shadow ${isSelected ? "bg-primary scale-110" : record.status === "active" ? "bg-emerald-500" : record.status === "inactive" ? "bg-amber-500" : "bg-slate-400"}`} />
                      </button>
                    );
                  })}

                  {selectedRecord && (
                    <div className="absolute bottom-3 right-3 rounded-lg bg-background/95 p-3 text-xs shadow border max-w-[240px]">
                      <p className="font-medium text-sm">{selectedRecord.studentName}</p>
                      <p className="text-muted-foreground">{selectedRecord.rollNumber}</p>
                      <p className="mt-2">Checkpoint: {selectedRecord.checkpoint}</p>
                      <p>Status: <span className="capitalize">{selectedRecord.status}</span></p>
                      <p>Coords: {formatMapPoint(selectedRecord.lat, selectedRecord.lng)}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </SectionCard>
        </>
      )}
    </div>
  );
}
