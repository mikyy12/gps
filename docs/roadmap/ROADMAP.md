# Roadmap estratificado

Estimaciones en días de ingeniería efectiva para 1 desarrollador familiarizado con el stack; no son compromisos de calendario.

## Estado de avance — 2026-09-12

| Bloque | Estado | Resultado principal |
|---|---|---|
| S0 — Estabilización | **Integrado en `dev`** | build reproducible, auth/RLS endurecidos, CI base verde |
| R1 — Seguridad/funcionalidad | **Integrado en `dev`** | búsqueda server-side, comisión, CRUD admin básico e integración real |
| R2 — Critical E2E | **Integrado en `dev`** | happy path agency validado en Chromium |
| R3 — Voucher operacional | **Integrado en `dev`** | QR, redención atómica, anti doble uso, auditoría y E2E operator |
| O2/C3.1 — Holds | **Integrado en `dev`** | expiración, restitución, idempotencia y último cupo concurrente |
| C3.1 — Payments & Booking Lifecycle | **Siguiente frente** | payment ledger, conciliación y hold → pago → confirmación |
| C3.3 — Offline-first | Pendiente | PWA, outbox, sync y redención offline |
| C3.4 — Operación/reporting | Pendiente | manifiestos, reportes y notificaciones |

## Próximo frente operativo

La única fuente de alcance inmediato es `docs/roadmap/CURRENT_WORK.md`.

**C3.1 — Payments & Booking Lifecycle** debe:

- separar dinero cobrado de `reservations.total_price`;
- introducir payment ledger y estados de conciliación;
- aplicar idempotencia server-side;
- preparar la transición autoritativa `hold → pago aprobado → confirmación → voucher`;
- mantener RLS/ownership y auditoría;
- no inventar un proveedor externo de pagos sin decisión explícita.

## Fase S0 — Estabilización

**Estado:** completada e integrada en `dev`.  
**Estimación original:** 3–5 días.

Resultado: `npm ci`, audit, lint, typecheck, tests y build verdes; lockfile, auth, RLS y ownership estabilizados.

## Fase R1 — Seguridad y funcionalidad

**Estado:** completada e integrada en `dev`.  
**Estimación original:** 5–8 días.

Resultado: integración Supabase viva, aislamiento multi-tenant, búsqueda server-side, comisión por agencia y eliminación de mocks administrativos críticos.

## Checkpoint R2 — E2E crítico

**Estado:** completado e integrado en `dev`.

Valida `login agency → búsqueda → reserva → voucher público → inventario actualizado` contra la app Next.js real y Supabase efímero.

## R3 — Voucher operacional

**Estado:** completado e integrado en `dev`.

Incluye QR, `redeem_voucher(TEXT)`, ownership de operador, anti doble uso/concurrencia, auditoría y E2E de redención.

## O2/C3.1 — Holds e idempotencia

**Estado:** completado e integrado en `dev` mediante PR #10.

Incluye `create_reservation_hold(...)`, `confirm_reservation_hold(UUID)`, expiración con restitución de cupos, idempotencia por usuario/clave y protección del último cupo. El gate Supabase final terminó **38/38**.

## C3.1 — Payments & Booking Lifecycle

**Estado:** siguiente frente.  
**Dependencia:** holds O2 integrados.

Objetivos:

- payment ledger separado de reserva;
- estados de pago/conciliación;
- idempotencia y auditoría;
- transición server-side segura entre hold, pago, confirmación y voucher;
- tests de tenant scope, repetición y estados inválidos;
- E2E actualizado cuando cambie el flujo UI.

No usar copy/UI de “pagado” mientras no exista evidencia persistida y autoritativa.

## O2 restante — Optimización y operaciones

Después del slice de pagos: observabilidad, índices/performance medidos, sweeper operacional de holds, backup/restore y runbook de deploy/rollback.

## C3.2 — Voucher operacional

El núcleo online ya está integrado en R3. Pendientes: PDF/reemisión detallada y scanner de cámara.

## C3.3 — Offline-first

- PWA;
- IndexedDB;
- outbox/idempotencia;
- manifiesto/voucher cache;
- QR firmado y reconciliación offline.

## C3.4 — Operación y reporting

- creación completa de salidas;
- manifiestos/check-in;
- export CSV/PDF;
- liquidaciones/reportes;
- notificaciones mediante APIs autorizadas.

## Regla de priorización

Todo frente nuevo parte de `dev`, trabaja en rama propia, ejecuta pruebas y abre PR hacia `dev`. Nunca trabajar directamente sobre `dev` o `main`, ni abrir `feature/*`/`fix/*` hacia `main`. Una promoción a `main` solo ocurre mediante PR `dev → main` al cerrar un hito verificable.
