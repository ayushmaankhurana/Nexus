# Ingestion Service

## Purpose

High-volume intake of raw events (GPS, BLE, relay batches) from devices.

## Sources

- NEXUS mobile app:
  - GPS pings
  - BLE sightings (phone-to-phone)
  - Offline relay batches (DOLN)
- Future sensors (e.g., hardware beacons, IoT devices)

## Responsibilities

- Accept raw events securely
- Validate basic schema and authentication
- Buffer and batch events (if needed)
- Forward normalized events to:
  - Presence & Location service
  - Reliability & Risk (for tampering signals)
- Guarantee at-least-once delivery semantics to downstream services

## Not Responsible For

- Business interpretation of events (attendance, reliability, etc.)
- Direct responses to clients (only basic acks)