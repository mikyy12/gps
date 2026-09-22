# Hitos y estado

## Estado actual

| Gate | Estado | Evidencia / deuda |
|---|---|---|
| M0 — estabilización | **completado** | build, lockfile, auth/RLS y CI estabilizados |
| M1 — seguridad/funcionalidad | **completado** | R1 + R2, integración real y E2E comercial |
| M2 — idempotencia/optimización | **parcial** | holds/idempotencia/último cupo integrados; falta observabilidad/performance |
| M3 — MVP operacional online | **parcial** | voucher/redención online integrados; faltan pagos y manifiestos |
| M4 — offline-first | pendiente | modo avión, outbox, dos dispositivos |
| M5 — production readiness | pendiente | backup/restore, deploy/rollback, observabilidad y gates finales |

## Secuencia recomendada

1. **C3.1 Payments & Booking Lifecycle**.
2. Operación de salidas, pasajeros y manifiestos.
3. Observabilidad, rendimiento, backup/restore y deploy/rollback.
4. Offline-first.
5. Production readiness y PR `dev → main`.

Cada gate termina con evidencia medible. No se promociona a `main` porque una fase “ya se trabajó”.
