// controller.js - Request handlers for Presence & Location Service
const presenceService = require('./service');
const { PresenceService } = require('./service');

class PresenceController {
  constructor() {
    this.presenceService = new PresenceService();
  }

  /**
   * Handle POST /presence/update-location
   * Body: { userId, lat, lng, timestamp }
   */
  async updateLocation(req, res) {
    try {
      const { userId, lat, lng, timestamp } = req.body;

      const locationData = { lat, lng, timestamp };
      const result = await this.presenceService.updateLocation(userId, locationData);

      return res.status(200).json(result);
    } catch (error) {
      console.error('Error updating location:', error);
      return res.status(400).json({
        error: error.message
      });
    }
  }

  /**
   * Handle GET /presence/current/:userId
   */
  async getCurrentLocation(req, res) {
    try {
      const { userId } = req.params;

      const location = await this.presenceService.getCurrentLocation(userId);

      if (!location) {
        return res.status(404).json({
          error: 'No location data found for this user'
        });
      }

      return res.status(200).json({
        userId,
        location
      });
    } catch (error) {
      console.error('Error getting current location:', error);
      return res.status(400).json({
        error: error.message
      });
    }
  }

  /**
   * Handle GET /presence/history/:userId
   */
  async getLocationHistory(req, res) {
    try {
      const { userId } = req.params;

      const history = await this.presenceService.getLocationHistory(userId);

      return res.status(200).json({
        userId,
        history,
        count: history.length
      });
    } catch (error) {
      console.error('Error getting location history:', error);
      return res.status(400).json({
        error: error.message
      });
    }
  }

  /**
   * Handle POST /presence/batch-upload
   * Body: [{ userId, locations: [{lat, lng, timestamp}] }]
   */
  async batchUploadLocations(req, res) {
    try {
      const batchData = req.body;

      const result = await this.presenceService.batchUploadLocations(batchData);

      return res.status(200).json(result);
    } catch (error) {
      console.error('Error batch uploading locations:', error);
      return res.status(400).json({
        error: error.message
      });
    }
  }

  /**
   * Handle POST /presence/ble-detection
   * Body: { deviceId, seenBy, timestamp }
   */
  async storeBLEDetection(req, res) {
    try {
      const { deviceId, seenBy, timestamp } = req.body;

      const detectionData = { deviceId, seenBy, timestamp };
      const result = await this.presenceService.storeBLEDetection(detectionData);

      return res.status(200).json(result);
    } catch (error) {
      console.error('Error storing BLE detection:', error);
      return res.status(400).json({
        error: error.message
      });
    }
  }

  /**
   * Handle POST /presence/check-geofence
   * Body: { userId, zoneName }
   */
  async checkGeofence(req, res) {
    try {
      const { userId, zoneName } = req.body;

      const result = await this.presenceService.checkGeofence({ userId, zoneName });

      return res.status(200).json(result);
    } catch (error) {
      console.error('Error checking geofence:', error);
      return res.status(400).json({
        error: error.message
      });
    }
  }

  /**
   * Handle GET /presence/ble-logs (admin endpoint)
   */
  async getBLELogs(req, res) {
    try {
      const logs = await this.presenceService.getBLELogs();

      return res.status(200).json({
        logs,
        count: logs.length
      });
    } catch (error) {
      console.error('Error getting BLE logs:', error);
      return res.status(500).json({
        error: error.message
      });
    }
  }

  /**
   * Handle POST /presence/clear-data (admin/testing endpoint)
   */
  async clearAllData(req, res) {
    try {
      const result = await this.presenceService.clearAllData();

      return res.status(200).json(result);
    } catch (error) {
      console.error('Error clearing data:', error);
      return res.status(500).json({
        error: error.message
      });
    }
  }
}

// Export singleton instance
const presenceController = new PresenceController();

module.exports = {
  PresenceController,
  presenceController
};