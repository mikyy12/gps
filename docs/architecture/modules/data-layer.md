# Capa de datos

**Código:** `src/lib/supabase`, `supabase/migrations`.

PostgreSQL/Supabase es la fuente de verdad. Las migraciones son append-only: no editar historia ya aplicada.

## Garantías integradas

### S0/R1

- lockfile reproducible y `npm ci`;
- RLS explícito y ownership;
- guard de cambios de rol;
- `assign_user_role(UUID,TEXT)`;
- reserva directa por Data API bloqueada;
- búsqueda server-side y comisión por agencia.

### R3 — voucher operacional

`redeem_voucher(TEXT)` valida rol/ownership, bloquea el voucher, persiste una única redención y auditoría. Escritura directa del voucher no reemplaza el RPC.

### O2/C3.1 — holds e idempotencia

PR #10 está integrado en `dev`. La migración añade:

- `reservations.idempotency_key` y `request_fingerprint`;
- `create_reservation_hold(...)`;
- `confirm_reservation_hold(UUID)`;
- expiración y restitución de cupos;
- conflicto para reutilización de clave con payload diferente;
- protección contra oversell concurrente.

La suite Supabase posterior al merge de O2 validó **38/38**, incluyendo 6 casos específicos de holds.

Este slice no representa pagos. El siguiente frente debe introducir payment ledger/conciliación y conectar de forma autoritativa `hold → payment state → confirm`.

## CI de datos

`.github/workflows/supabase-integration.yml` levanta Supabase local, aplica migraciones + seed y ejecuta `tests/integration/*.test.mjs` con credenciales locales efímeras. No depende del proyecto remoto.

## Invariantes

Todo objeto público nuevo debe definir:

- RLS/GRANT explícitos;
- índices relevantes;
- estrategia de auditoría;
- ownership/tenant scope;
- test positivo/negativo cuando afecte permisos;
- contrato RPC documentado cuando se otorgue `EXECUTE`.

Un RPC con privilegios elevados valida identidad, rol y scope dentro de la función. Usar `SECURITY INVOKER` para lecturas que deban conservar RLS del caller.
