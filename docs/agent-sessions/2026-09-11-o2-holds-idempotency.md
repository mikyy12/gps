# O2/C3.1 — Holds e idempotencia

```yaml
context_token: CTX-20260911-O2-HOLDS-IDEMPOTENCY
status: MERGED_TO_DEV
base_ref: 171f6cf791637c859d9439b49759ff2e22569594
pull_request: 10
merge_commit: 0ec24edb65015e43efbe5886467a7306ccc71ff8
validation_results:
  - "Documentation Quality: success"
  - "Production Check: success"
  - "Supabase Integration: 38/38 passed"
  - "Critical E2E: success"
  - "O2 hold cases: 6/6 passed"
remaining_risks:
  - "No existe payment ledger ni conciliación."
  - "La UI todavía usa el flujo confirmado existente y no adopta completamente hold → payment → confirm."
  - "El sweeper operacional de expiración debe definirse antes de producción."
  - "Observabilidad, backup/restore y deploy/rollback siguen pendientes."
docs_updated:
  - BASELINE.md
  - CHANGELOG.md
  - docs/architecture/api-contracts.md
  - docs/architecture/modules/data-layer.md
  - docs/architecture/modules/agency.md
  - docs/guides/TESTING.md
  - docs/roadmap/ROADMAP.md
```

## Resultado

O2 añadió holds expirables e idempotentes sin degradar R3. La suite real confirmó repetición idempotente, conflicto de payload, ownership, confirmación única/voucher, liberación de expirados y concurrencia del último cupo.

## Siguiente paso

No volver a implementar holds. El siguiente frente es **C3.1 Payments & Booking Lifecycle**: ledger de pagos separado, conciliación e integración progresiva del flujo hold → pago aprobado → confirmación.
