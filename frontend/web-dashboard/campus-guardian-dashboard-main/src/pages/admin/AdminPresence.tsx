import { useEffect, useMemo, useState } from "react";
import { Circle, CircleMarker, MapContainer, Polyline, Popup, TileLayer } from "react-leaflet";
import { PageHeader, SectionCard } from "@/components/shared/PageComponents";
import { StatusBadge, getStatusVariant } from "@/components/shared/StatusBadge";
import { ErrorState, LoadingState } from "@/components/shared/StateComponents";
import { presenceApi, type PresenceOverview } from "@/services/dataApi";
import type { TracePoint } from "@/types";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Signal, Clock, AlertTriangle, Radio, Move } from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";

function formatMapPoint(lat: number | null | undefined, lng: number | null | undefined): string {
  if (lat === null || lat === undefined || lng === null || lng === undefined) {
    return "No coordinates";
  }

  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
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
  const [showAllStudents, setShowAllStudents] = useState(false);

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
  const traceSegments = useMemo(() => trace.filter((point) => point.lat !== undefined && point.lng !== undefined), [trace]);
  const studentsWithCoordinates = useMemo(() => records.filter((record) => record.lat !== null && record.lat !== undefined && record.lng !== null && record.lng !== undefined), [records]);
  const campusCenter = useMemo<[number, number] | null>(() => {
    const coordinatePool = [
      ...geofences.map((item) => ({ lat: item.lat, lng: item.lng })),
      ...studentsWithCoordinates.map((item) => ({ lat: item.lat as number, lng: item.lng as number })),
      ...traceSegments.map((item) => ({ lat: item.lat as number, lng: item.lng as number })),
    ];

    if (coordinatePool.length === 0) {
      return null;
    }

    const totals = coordinatePool.reduce(
      (acc, point) => ({ lat: acc.lat + point.lat, lng: acc.lng + point.lng }),
      { lat: 0, lng: 0 }
    );

    return [totals.lat / coordinatePool.length, totals.lng / coordinatePool.length];
  }, [geofences, studentsWithCoordinates, traceSegments]);
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

          <SectionCard title="Movement Map" description="Live geofence and last-known-position map based on seeded campus coordinates.">
            <div className="rounded-lg border bg-muted/30 relative overflow-hidden" style={{ height: "500px", width: "100%" }}>
              {!campusCenter ? (
                <div className="absolute inset-0 flex items-center justify-center text-center text-muted-foreground">
                  <div>
                    <MapPin className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm font-medium">No map coordinates available</p>
                  </div>
                </div>
              ) : (
                <MapContainer center={campusCenter} zoom={16} style={{ height: "500px", width: "100%" }} scrollWheelZoom>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />

                  {geofences.map((geofence) => (
                    <Circle
                      key={geofence.id}
                      center={[geofence.lat, geofence.lng]}
                      radius={geofence.radius ?? 20}
                      pathOptions={{ color: "#0284c7", fillColor: "#38bdf8", fillOpacity: 0.14, weight: 2 }}
                    >
                      <Popup>
                        <div className="space-y-1">
                          <p className="font-medium">{geofence.name}</p>
                          <p>{geofence.type}</p>
                          <p>Radius: {geofence.radius ?? 20}m</p>
                        </div>
                      </Popup>
                    </Circle>
                  ))}

                  {traceSegments.length > 1 && (
                    <Polyline
                      positions={traceSegments.map((point) => [point.lat as number, point.lng as number])}
                      pathOptions={{ color: "#2563eb", opacity: 0.65, weight: 3 }}
                    />
                  )}

                  {studentsWithCoordinates.map((record) => {
                    const isSelected = record.studentId === selectedStudentId;
                    const color = isSelected ? "#2563eb" : record.status === "active" ? "#22c55e" : record.status === "inactive" ? "#f59e0b" : "#94a3b8";

                    return (
                      <CircleMarker
                        key={record.studentId}
                        center={[record.lat as number, record.lng as number]}
                        radius={isSelected ? 8 : 6}
                        pathOptions={{ color, fillColor: color, fillOpacity: 0.9, weight: 2 }}
                        eventHandlers={{ click: () => setSelectedStudentId(record.studentId) }}
                      >
                        <Popup>
                          <div className="space-y-1">
                            <p className="font-medium">{record.studentName}</p>
                            <p>{record.rollNumber}</p>
                            <p>Checkpoint: {record.checkpoint}</p>
                            <p>Status: {record.status}</p>
                            <p>Coords: {formatMapPoint(record.lat, record.lng)}</p>
                          </div>
                        </Popup>
                      </CircleMarker>
                    );
                  })}
                </MapContainer>
              )}
            </div>
          </SectionCard>
        </>
      )}
    </div>
  );
}
