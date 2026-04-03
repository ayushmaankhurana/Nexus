# Realtime Service

## Purpose

Pushes live updates (locations, alerts, incident changes) to connected clients.

## Responsibilities

- Manage WebSocket / real-time connections for:
  - Web dashboard (security/admin)
  - Potentially mobile app notifications
- Subscribe to domain events:
  - Presence updates
  - New alerts and incident changes
- Push:
  - Student presence changes
  - Hotspot alerts
  - Incident lifecycle updates

## Not Responsible For

- Business logic, scoring, or rule evaluation
- Persistent storage of domain data