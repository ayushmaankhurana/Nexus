// index.js - Main entry point for Presence & Location Service

const express = require('express');
const presenceRoutes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware (simple version)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Mount presence routes
app.use('/presence', presenceRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Presence & Location Service',
    version: '1.0.0',
    endpoints: {
      'POST /presence/update-location': 'Update user location',
      'GET /presence/current/:userId': 'Get current location',
      'GET /presence/history/:userId': 'Get location history',
      'POST /presence/batch-upload': 'Batch upload locations',
      'POST /presence/ble-detection': 'Store BLE detection',
      'POST /presence/check-geofence': 'Check geofence status',
      'GET /presence/health': 'Service health check'
    }
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Presence & Location Service running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/presence/health`);
    console.log(`📋 API docs: http://localhost:${PORT}/`);
  });
}

module.exports = app;