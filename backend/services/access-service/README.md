# Access Verification Service

## Purpose

Validates campus entry, parking access, and other checkpoint actions.

## Owns

- Access points (gates, campus entries, parking entries)
- Access control rules
- Access events (attempted, granted, denied)

## Responsibilities

- Validate gate entry:
  - Student identity + active device
  - Campus and zone rules
- Validate parking entry:
  - Parking entitlement
  - Student/device verification
- Record:
  - `access_attempted`
  - `access_granted`
  - `access_denied`
- Provide access history per student to other services

## Not Responsible For

- Timetable and attendance logic
- Reliability scoring (though its events are inputs)
- Detailed campus geometry (delegated to Campus Operations)