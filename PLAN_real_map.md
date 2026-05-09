# Plan: Replace Mock Map with a Real Map in Presence Intelligence

## Context

The current Presence Intelligence page uses a custom SVG+CSS map — a bounding-box coordinate projection that auto-fits all points into a div. It has no map tiles, no street layout, and no real spatial awareness. The goal is to replace this with an actual interactive map that shows the university campus (buildings, roads, gates) as a real-world tile layer, with geofence circles and student position markers overlaid on top.

The good news: **no backend changes are needed.** The seed data already uses real lat/lng (Delhi area, ~28.40°N 77.31°E), geofences already carry a `radius` field, and student/trace records all have proper lat/lng. The only work is on the frontend map rendering and (separately) placing accurate real-world coordinates for the actual campus.

---

## Recommended Library: react-leaflet + OpenStreetMap

**Why Leaflet:**
- Free, no API key required
- OpenStreetMap tiles automatically show whatever buildings/roads exist at those real coordinates — including most universities
- `react-leaflet` has first-class React component integration
- Can later swap tile providers (campus satellite, Mapbox, Google) by changing one line

**Alternative considered:** Mapbox GL JS — better visual quality and custom map styles, but requires an API key and billing setup. Preferable once going to production if you want a branded map style.

---

## Steps

### 1. Install dependencies

```bash
cd frontend/web-dashboard/campus-guardian-dashboard-main
npm install leaflet react-leaflet
npm install -D @types/leaflet
```

### 2. Add Leaflet CSS

In `src/main.tsx` (or in `AdminPresence.tsx` as a side-effect import at the top):

```ts
import 'leaflet/dist/leaflet.css';
```

This is the most common Leaflet gotcha — without it, tiles and controls render broken.

### 3. Fix the default marker icon (Leaflet quirk with bundlers)

Leaflet's default PNG marker icons break with Vite/webpack because the asset paths are relative. Add this once, near the CSS import:

```ts
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: markerIcon, iconRetinaUrl: markerIcon2x, shadowUrl: markerShadow });
```

If using `CircleMarker` instead of `Marker` (recommended — fits the existing visual style), skip this entirely.

### 4. Replace the SVG map section in `AdminPresence.tsx`

**File:** `frontend/web-dashboard/campus-guardian-dashboard-main/src/pages/admin/AdminPresence.tsx`

Remove:
- `buildMapProjection()` function (lines 20–43)
- The entire zoom/pan/drag state and handlers (`zoom`, `pan`, `dragState`, `handlePointerDown/Move/Up`, `handleWheel`)
- The SVG+div map container inside the "Movement Map" `SectionCard` (lines 318–376)

Replace with a `<MapContainer>` from `react-leaflet`:

```tsx
import { MapContainer, TileLayer, Circle, CircleMarker, Polyline, Tooltip } from 'react-leaflet';

// Inside the "Movement Map" SectionCard:
<div className="h-80 rounded-lg overflow-hidden border">
  <MapContainer
    center={[28.4089, 77.3178]}  // replace with real campus center
    zoom={17}
    style={{ height: '100%', width: '100%' }}
    scrollWheelZoom={true}
  >
    <TileLayer
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      attribution='&copy; OpenStreetMap contributors'
    />

    {/* Geofence circles */}
    {geofences.map((g) =>
      g.radius ? (
        <Circle
          key={g.id}
          center={[g.lat, g.lng]}
          radius={g.radius}
          pathOptions={{ color: '#38bdf8', fillOpacity: 0.15 }}
        >
          <Tooltip permanent>{g.name}</Tooltip>
        </Circle>
      ) : null
    )}

    {/* Student dots */}
    {records.filter((r) => r.lat != null && r.lng != null).map((r) => {
      const color = r.studentId === selectedStudentId ? 'var(--primary)' : r.status === 'active' ? '#22c55e' : r.status === 'inactive' ? '#f59e0b' : '#94a3b8';
      return (
        <CircleMarker
          key={r.studentId}
          center={[r.lat!, r.lng!]}
          radius={r.studentId === selectedStudentId ? 8 : 6}
          pathOptions={{ color, fillColor: color, fillOpacity: 0.9 }}
          eventHandlers={{ click: () => setSelectedStudentId(r.studentId) }}
        >
          <Tooltip>{r.studentName}</Tooltip>
        </CircleMarker>
      );
    })}

    {/* Selected student trace */}
    {traceSegments.length > 1 && (
      <Polyline
        positions={traceSegments.map((p) => [p.lat!, p.lng!])}
        pathOptions={{ color: 'hsl(var(--primary))', opacity: 0.5, weight: 2 }}
      />
    )}
  </MapContainer>
</div>
```

Also remove the zoom/pan control buttons above the map — Leaflet has built-in zoom controls.

### 5. Replace seeded coordinates with real university coordinates

**File:** `backend/api-gateway/src/dev/demo-reset.ts`

The current seed coordinates are for a fictional campus at ~28.40°N, 77.31°E (Delhi area). To point at your real university:

1. Open Google Maps or OSM, navigate to your campus.
2. Click each real physical location (main gate, lecture halls, library, etc.) and record the lat/lng.
3. Replace the coordinate objects in `demo-reset.ts` with real values.
4. Re-run the demo reset endpoint (`POST /api/dev/reset`) to re-seed.

After this, the OSM tile layer will automatically show your campus's actual buildings, roads, and gates — no additional configuration needed.

---

## Files to Modify

| File | Change |
|---|---|
| `frontend/.../src/pages/admin/AdminPresence.tsx` | Replace SVG map with `<MapContainer>` |
| `frontend/.../src/main.tsx` | Add `import 'leaflet/dist/leaflet.css'` |
| `backend/.../src/dev/demo-reset.ts` | Replace fictional Delhi coords with real campus coords |
| `frontend/.../package.json` | Add `leaflet`, `react-leaflet`, `@types/leaflet` |

---

## Verification

1. Run `npm run dev` — the Presence Intelligence page should show OSM tiles centered on the campus coordinates.
2. Geofence circles should appear at each named location with visible radius rings.
3. Student dots should be colored by status and clickable; clicking one should load the trace.
4. The trace polyline should connect the selected student's movement history.
5. After replacing real campus coords and re-seeding, the map should show recognizable campus buildings.

---

## Optional Future Upgrades

- **Satellite tiles**: swap OpenStreetMap URL for `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}` — no API key needed.
- **Mapbox custom style**: swap TileLayer URL for a Mapbox tiles URL once you have an API key. Gives branded map colors.
- **Real-time updates**: add a `setInterval` to re-poll `presenceApi.getOverview()` and the map updates live — no structural changes needed since the map reads from React state.
