# Schedule & Attendance Service

## Purpose

Owns student timetables, campus events, and attendance records.

## Owns

- Class schedules per student
- Class sessions (course, room, start/end time)
- Campus events (festivals, hackathons, talks, etc.)
- Attendance records (present/absent, timestamps, context)

## Responsibilities

- Determine **expected location** per student at any given time:
  - Class room during scheduled class
  - Event area during scheduled events
- Manage grace windows:
  - Default: 5-minute entry and 5-minute exit around class
  - Configurable per campus
- Validate attendance attempts based on:
  - Schedule
  - Allowed grace window
  - Location inputs (from Presence & Location)
- Emit:
  - `attendance_marked`
  - `attendance_mark_rejected`
- Provide summary views for student history / admin analytics

## Not Responsible For

- Low-level GPS/BLE processing
- Reliability scoring
- Security incident management