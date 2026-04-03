# Campus Operations Service

## Purpose

Models the physical and logical campus: zones, buildings, rooms, gates, parking, and points of interest.

## Owns

- Campus
- Zones (academic, residential, open, etc.)
- Buildings
- Classrooms
- Gates / entry checkpoints
- Parking areas
- Sports complex, lawns / open areas
- Cafeterias, food outlets

## Responsibilities

- Provide geofence definitions for zones/buildings
- Maintain mapping: classroom → building → zone
- Tag zones with policy metadata (e.g., expected usage, risk level)
- Support campus-level configuration:
  - Default class grace periods
  - Default allowed open zones during class hours (if any)

## Not Responsible For

- Individual student schedules
- Attendance status
- Detection of suspicious behavior (only provides spatial context)