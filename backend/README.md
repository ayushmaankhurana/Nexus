# Nexus Backend

The main Express.js backend server for the Nexus Campus Security System.

## Quick Start

```bash
# Install dependencies
npm install

# Start the server
npm start
```

The server will start on port 5000.

## Available Routes

### Health Check
- `GET /` - Root health check endpoint

### Presence & Location Service
- `GET /presence/health` - Presence service health check
- `POST /presence/update-location` - Update user location
- `GET /presence/current/:userId` - Get current location
- `GET /presence/history/:userId` - Get location history
- `POST /presence/batch-upload` - Batch upload locations
- `POST /presence/ble-detection` - Store BLE detection
- `POST /presence/check-geofence` - Check geofence status

## Development

For development with auto-restart on file changes:

```bash
npm run dev
```

## Server Structure

```
backend/
├── index.js                    # Main entry point
├── package.json
├── services/
│   └── presence-service/       # Presence & Location Service
│       ├── model.js
│       ├── service.js
│       ├── controller.js
│       ├── routes.js
│       ├── utils.js
│       └── package.json
└── README.md
```

## Testing

Test the server with curl:

```bash
# Health check
curl http://localhost:5000/

# Update location
curl -X POST http://localhost:5000/presence/update-location \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","lat":28.6139,"lng":77.2090}'

# Get current location
curl http://localhost:5000/presence/current/test
```

## Technologies

- **Express.js** - Web framework
- **Node.js** - Runtime
- **Presence Service** - Location tracking and geofencing
