# ML Services

## Purpose

Optional ML layer that consumes domain events and produces insights (scores, predictions).

## Potential Use Cases

- Advanced anomaly detection for movement patterns
- Improved hotspot detection and ranking
- Predictive risk modeling for reliability scores

## Responsibilities (vNext, not mandatory for v1)

- Subscribe to relevant events (presence, attendance, access, incidents)
- Train and serve models that output:
  - Anomaly scores
  - Predictions fed back to Reliability & Risk or Incidents
- Expose a simple interface (HTTP/gRPC/queue) for domain services

## Not Responsible For

- Owning canonical domain state
- Direct interactions with mobile/web clients