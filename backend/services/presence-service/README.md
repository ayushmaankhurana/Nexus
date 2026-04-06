# Presence & Location Service

## Overview

A standalone Node.js/Express service for managing student/device location data in a campus security system. Features GPS tracking, BLE proximity detection, and geofencing capabilities.

## Features

- 📍 **GPS Location Tracking**: Store and retrieve user locations
- 📊 **Location History**: Maintain complete movement trails
- 🔄 **Offline Sync**: Batch upload locations from mobile devices
- 📡 **BLE Detection**: Track device proximity using Bluetooth
- 🗺️ **Geofencing**: Check if users are within defined zones
- 🧪 **In-Memory Storage**: Fast, simple storage (easily replaceable with database)

## Quick Start

```bash
# Install dependencies
npm install

# Start the service
npm start

# Development mode with auto-restart
npm run dev
```

The service will start on `http://localhost:3001`

## API Endpoints

### Location Management

#### `POST /presence/update-location`
Update a user's current location.

**Request Body:**
```json
{
  "userId": "student123",
  "lat": 28.6139,
  "lng": 77.2090,
  "timestamp": 1640995200000
}
```

**Response:**
```json
{
  "success": true,
  "message": "Location updated successfully"
}
```

#### `GET /presence/current/:userId`
Get the current location of a user.

**Response:**
```json
{
  "userId": "student123",
  "location": {
    "lat": 28.6139,
    "lng": 77.2090,
    "timestamp": 1640995200000
  }
}
```

#### `GET /presence/history/:userId`
Get the complete location history for a user.

**Response:**
```json
{
  "userId": "student123",
  "history": [
    {
      "lat": 28.6139,
      "lng": 77.2090,
      "timestamp": 1640995200000
    }
  ],
  "count": 1
}
```

### Batch Operations

#### `POST /presence/batch-upload`
Upload multiple locations for offline sync.

**Request Body:**
```json
[
  {
    "userId": "student123",
    "locations": [
      {
        "lat": 28.6139,
        "lng": 77.2090,
        "timestamp": 1640995200000
      }
    ]
  }
]
```

### BLE Detection

#### `POST /presence/ble-detection`
Store BLE proximity detection data.

**Request Body:**
```json
{
  "deviceId": "device123",
  "seenBy": "device456",
  "timestamp": 1640995200000
}
```

### Geofencing

#### `POST /presence/check-geofence`
Check if a user is inside a geofence zone.

**Request Body:**
```json
{
  "userId": "student123",
  "zoneName": "Classroom A"
}
```

**Response:**
```json
{
  "inside": true,
  "zone": "Classroom A"
}
```

### Admin Endpoints

#### `GET /presence/ble-logs`
Get all BLE detection logs (admin use).

#### `POST /presence/clear-data`
Clear all stored data (testing/admin use).

#### `GET /presence/health`
Service health check.

## Geofence Zones

Pre-configured zones:
- **Classroom A**: 50m radius around (28.6139, 77.2090)
- **Gate 1**: 30m radius around (28.6140, 77.2091)
- **Parking Zone**: 100m radius around (28.6141, 77.2092)

## Architecture

```
routes.js     ← HTTP endpoints
    ↓
controller.js ← Request/response handling
    ↓
service.js    ← Business logic
    ↓
model.js      ← Data storage (in-memory)
    ↓
utils.js      ← Utilities (geofencing, validation)
```

## Testing

```bash
# Test location update
curl -X POST http://localhost:3001/presence/update-location \
  -H "Content-Type: application/json" \
  -d '{"userId":"test123","lat":28.6139,"lng":77.2090}'

# Test current location
curl http://localhost:3001/presence/current/test123

# Test geofence check
curl -X POST http://localhost:3001/presence/check-geofence \
  -H "Content-Type: application/json" \
  -d '{"userId":"test123","zoneName":"Classroom A"}'
```

## Integration

This service can be integrated into larger systems via:
- HTTP API calls
- Docker containerization
- Load balancer proxy
- Database replacement (MongoDB, PostgreSQL, etc.)

## License

MIT

## Responsibilities

- Process input from `backend/ingestion`:
  - GPS events from mobile app
  - BLE relay events / batches
- Build and update:
  - Last-known location per student
  - Movement trails (within time windows)
- Provide APIs for:
  - "Where is this student now?"
  - "Where has this student been in the last N hours?"
- Emit events:
  - `presence_state_updated`
  - `movement_trail_reconstructed`

## Not Responsible For

- Attendance decisions
- Access control decisions
- Reliability scoring (only provides signals)