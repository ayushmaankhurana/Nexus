# Presence & Location Service

## Purpose

Ingests, aggregates, and serves student/device location data.

## Owns

- Raw GPS location events
- BLE sightings (phone-to-phone)
- Offline relay batches (DOLN uploads)
- Last-known presence state per student/device
- Reconstructed movement trails

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