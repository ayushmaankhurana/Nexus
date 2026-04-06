// routes.js - Route definitions for Presence & Location Service

const express = require('express');
const { presenceController } = require('./controller');

const router = express.Router();

// Middleware for logging requests (optional)
router.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

/**
 * POST /presence/update-location
 * Update user's location and add to history
 * Body: { userId: string, lat: number, lng: number, timestamp?: number }
 */
router.post('/update-location', (req, res) => presenceController.updateLocation(req, res));
router.get('/current/:userId', (req, res) => presenceController.getCurrentLocation(req, res));
router.get('/history/:userId', (req, res) => presenceController.getLocationHistory(req, res));
router.post('/batch-upload', (req, res) => presenceController.batchUploadLocations(req, res));
router.post('/ble-detection', (req, res) => presenceController.storeBLEDetection(req, res));
router.post('/check-geofence', (req, res) => presenceController.checkGeofence(req, res));

/**
 * GET /presence/current/:userId
 * Get current/latest location for a user
 */
router.get('/current/:userId', presenceController.getCurrentLocation);

/**
 * GET /presence/history/:userId
 * Get full location history for a user
 */
router.get('/history/:userId', presenceController.getLocationHistory);

/**
 * POST /presence/batch-upload
 * Batch upload locations (offline sync)
 * Body: [{ userId: string, locations: [{lat: number, lng: number, timestamp?: number}] }]
 */
router.post('/batch-upload', presenceController.batchUploadLocations);

/**
 * POST /presence/ble-detection
 * Store BLE proximity detection data
 * Body: { deviceId: string, seenBy: string, timestamp?: number }
 */
router.post('/ble-detection', presenceController.storeBLEDetection);

/**
 * POST /presence/check-geofence
 * Check if user is inside a geofence zone
 * Body: { userId: string, zoneName: string }
 * Response: { inside: boolean, zone: string }
 */
router.post('/check-geofence', presenceController.checkGeofence);

/**
 * GET /presence/ble-logs
 * Admin endpoint: Get all BLE detection logs
 */
router.get('/ble-logs', presenceController.getBLELogs);

/**
 * POST /presence/clear-data
 * Testing/Admin endpoint: Clear all stored data
 */
router.post('/clear-data', presenceController.clearAllData);

// Health check endpoint for the presence service
router.get('/health', (req, res) => {
  res.status(200).json({
    service: 'Presence & Location Service',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;