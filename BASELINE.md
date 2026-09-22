# BASELINE — Estado actual verificable

**Snapshot:** 2026-09-12  
**`dev`:** `0ec24edb65015e43efbe5886467a7306ccc71ff8`  
**Último hito integrado:** PR #10 — O2/C3.1 holds e idempotencia.  
**Clasificación de `main`:** **UNSTABLE / NO PRODUCCIÓN**

Este baseline distingue un `dev` técnicamente estabilizado de un producto listo para producción. S0, R1, R2, R3 y O2/C3.1 están integrados en `dev`.

## Resumen ejecutivo

| Gate / garantía | Evidencia actual |
|---|---|
| Documentation Quality | verde |
| Production Check | verde |
| `npm ci` | verde |
| `npm audit` | 0 vulnerabilidades en el último gate |
| ESLint / TypeScript / build | verde |
| Tests rápidos | 7/7 |
| Integración Supabase | **38/38** |
| Critical E2E | verde |

La integración reconstruye Supabase desde migraciones + seed y valida Auth, PostgREST, PostgreSQL, RLS y RPC reales.

## Hitos integrados

### S0 — estabilización

Build reproducible, lockfile coherente, auth por rol, redirect seguro, RLS mínimo, ownership de operador, seed reproducible y gates de producción.

### R1 — seguridad y funcionalidad

- usuarios nuevos sin rol operativo implícito;
- bloqueo de autoescalación de `role_id`;
- `assign_user_role(UUID,TEXT)` reservado a admin;
- aislamiento agency A/B y operator A/B;
- creación directa de reservas bloqueada;
- búsqueda server-side antes de `LIMIT 50`;
- comisión configurable por agencia;
- altas reales de agencias y tours;
- motor de reservas y cancelación validados en runtime.

### R2 — Critical E2E

Chromium valida login de agencia → búsqueda → reserva → voucher público → inventario actualizado. El fixture de referencia confirma reserva de 2 pasajeros, total USD 80, comisión USD 16 e inventario 10 → 8.

### R3 — Voucher operacional

- estados `issued/redeemed/revoked/expired`;
- QR visual basado en token opaco;
- `redeem_voucher(TEXT)` atómico;
- ownership de operador;
- bloqueo de doble uso y concurrencia;
- `voucher_redemptions` append-only + auditoría;
- UI `/operator/redeem`;
- E2E operator con segundo intento rechazado.

### O2/C3.1 — Holds e idempotencia

PR #10 quedó mergeado a `dev`. El backend dispone de:

- `create_reservation_hold(...)`;
- `confirm_reservation_hold(UUID)`;
- expiración con restitución de cupos;
- idempotencia por usuario/clave;
- rechazo de payload distinto para la misma clave;
- ownership para confirmar;
- protección contra oversell del último cupo;
- emisión única de voucher al confirmar.

La ejecución autoritativa terminó **38/38**. Los 6 casos específicos O2 cubren creación/repetición idempotente, conflicto de payload, ownership, confirmación única, expiración y concurrencia de último cupo.

## Funcionalidad operacional actual

### Auth

Login email/password, sesión SSR, guards por rol y RLS/RPC como autoridad final. `next` no permite saltos entre portales.

### Admin

Dashboard/listados reales y alta persistente de agencias, tours y embarcaciones. Pendiente edición/eliminación, rutas administrables, aprovisionamiento UI completo y settings persistentes.

### Agency

Búsqueda server-side, contexto explícito de agencia, comisión configurable, reserva confirmada legacy mediante RPC, historial/cancelación y voucher. El backend ya tiene holds; la UI todavía no adopta el lifecycle hold → payment → confirm.

### Operator

Ownership de flota/disponibilidad/reservas/vouchers validado, ajuste de cupos por RPC y redención online de vouchers propios. Pendiente operación completa de salidas, manifiesto/check-in y scanner de cámara.

### Voucher

QR, verificación pública online, estados y redención online autoritativa ya existen. Pendiente PDF/reemisión detallada y offline.

## Deuda vigente

- **payment ledger y conciliación separados de reservas**;
- integración UI del lifecycle `hold → pago → confirmación`;
- no existe proveedor de pago aprobado/documentado;
- job/sweeper operacional de expiración de holds antes de producción;
- pasajeros individuales/manifiesto y operación completa de salidas;
- edición/eliminación admin y gestión completa de rutas;
- signup/password/MFA productivos;
- operador multiempresa sigue modelado indirectamente por `vessels.owner_id`;
- E2E negativos adicionales, cancelación/reprogramación y fallos de conectividad;
- observabilidad, backup/restore y deploy/rollback probado;
- PWA/offline/sync/outbox y redención offline.

## Riesgo por área

| Área | Estado | Prioridad siguiente |
|---|---|---|
| Build reproducible | verde | mantenimiento |
| Auth/RLS/multitenancy | verde en integración | hardening productivo |
| Booking engine | reserva + hold + confirmación validados | payments lifecycle |
| Holds/idempotencia | integrado, 6 casos O2 verdes | UI + pagos + sweeper |
| Comisión | configurable por agencia | administración/edición |
| Voucher/redención | integrado y E2E verde | offline/reemisión |
| Operación | parcial | salidas/manifiesto/check-in |
| Offline | ausente | fase posterior |
| Deploy/rollback | no probado | production readiness |

## Próximo frente autoritativo

**C3.1 — Payments & Booking Lifecycle**.

La rama sugerida es `feature/c3-payment-ledger`, creada desde `dev` actualizado. El objetivo es separar dinero cobrado de importe reservado mediante un ledger de pagos server-side, estados de conciliación e idempotencia, y preparar la transición `hold → pago aprobado → confirmación → voucher` sin introducir un proveedor externo ficticio.

Alcance y Definition of Done: `docs/roadmap/CURRENT_WORK.md`.

## Criterio para cambiar a STABLE

CI completo verde, seguridad/multitenancy probados, flujo comercial y operacional críticos validados, cero vulnerabilidades critical/high sin excepción vigente, pagos/conciliación confiables, documentación sincronizada y despliegue/rollback probado. Hasta entonces `main` permanece **UNSTABLE / NO PRODUCCIÓN**.
