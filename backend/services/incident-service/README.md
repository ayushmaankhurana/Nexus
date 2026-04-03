# Security Incidents & Alerts Service

## Purpose

Turns alerts and anomalies into managed incidents with lifecycle and audit trail.

## Owns

- Alerts
- Incidents (cases)
- Incident status (open, assigned, escalated, resolved)
- Incident assignments (officer → incident)
- Action log / audit trail

## Responsibilities

- Create alerts from:
  - Reliability & Risk signals
  - Presence & Location anomalies
  - Manual security input
- Allow security staff to:
  - View, acknowledge, and prioritize alerts
  - Create incidents from alerts
  - Assign incidents to officers
  - Escalate / resolve incidents
  - Add notes and actions
- Emit:
  - `alert_raised`
  - `alert_acknowledged`
  - `incident_created`
  - `incident_assigned`
  - `incident_escalated`
  - `incident_resolved`

## Not Responsible For

- Attendance rules
- Campus geofence modeling
- Computing reliability scores