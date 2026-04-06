// backend/index.js - Main backend entry point

const express = require('express');
const presenceRoutes = require('./services/presence-service/routes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic health check route
app.get('/', (req, res) => {
  res.json({
    message: 'Server running',
    service: 'Nexus Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Mount presence service routes
app.use('/presence', presenceRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}`);
  console.log(`Presence service available at http://localhost:${PORT}/presence`);
});

module.exports = app;