# NEXUS Mobile App

## Primary User

Students.

## Identity model

- Student accounts are admin-provisioned; public self-signup is not supported.
- Students activate accounts via campus email invite and set their password.

## Day-1 Capabilities

- **Login & Device Binding**
  - Authenticate as a student
  - Register the current phone as the active device
  - Handle cases where another device is already active

- **Campus Entry Verification**
  - Scan QR / tap NFC / use credential to enter campus
  - Show clear success/failure feedback
  - Send access events to backend

- **Class Attendance**
  - Show today’s classes + schedule
  - Mark attendance for the current class using:
    - GPS building-level check
    - BLE mesh signals (phone-to-phone) as available
  - Respect grace windows (5 min entry, 5 min exit)
  - Show attendance status (e.g., “Marked”, “Rejected – not in classroom”)

- **Parking Access**
  - Verify parking access in a similar way to campus entry

## v1 Notes

- BLE beacons in classrooms are **not required** for v1.
  - BLE is used between phones for DOLN-style presence.
  - Beacons are a future enhancement.

## Non-Goals for v1

- Faculty/staff views
- Complex settings / analytics for students