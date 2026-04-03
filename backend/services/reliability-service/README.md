# Reliability & Risk Service

## Purpose

Computes and maintains a behavioral reliability score per student.

## Owns

- Reliability score per student
- Risk signals and rule evaluations
- Risk categories (e.g., normal, watch, high-risk)

## Input Signals

- Fake/suspicious attendance attempts:
  - Attendance requests rejected due to wrong zone/time
- Loitering:
  - Repeated presence in lawns/sports/cafeterias during scheduled classes without events
- Device switching:
  - Frequent device binding changes in short windows
- Connectivity/BLE tampering:
  - Disabling Wi-Fi / mobile data / BLE consistently around attendance or access events
- Skipping classes:
  - Chronic absence pattern from Schedule & Attendance

## Responsibilities

- Ingest risk signals from other services
- Apply rules and/or ML models to:
  - Update reliability score
  - Assign risk categories
- Emit:
  - `risk_signal_recorded`
  - `reliability_score_updated`
- Provide reliability and risk status to:
  - Security dashboard
  - Hotspot detection logic

## Not Responsible For

- Low-level sensor validation
- Final security decision-making (alerts/incidents)