# Estrategia de testing

El proyecto tiene tres capas verificables: tests rápidos con `node:test`, integración real contra Supabase local y Critical E2E con Playwright/Chromium. Todavía no existe coverage instrumentada; el baseline sigue siendo **0% medido/no configurado**, no 0% lógico.

## Estado actual

- tests rápidos: **7/7**;
- integración Supabase: **38/38**;
- Critical E2E: verde para booking agency y redención operator.

El baseline autoritativo está en `BASELINE.md`.

## Unit / contract

```bash
npm test
```

Cubre routing seguro y contratos de seguridad que deben fallar rápido antes de levantar infraestructura.

## Integration / PostgreSQL

```bash
npm run test:integration
```

Requiere Supabase local. La suite actual valida Auth, PostgREST, RLS, ownership y RPCs reales, incluyendo:

- aislamiento agency A/B y operator A/B;
- aprovisionamiento de roles;
- booking atómico y cancelación;
- búsqueda antes de `LIMIT 50`;
- comisión por agencia;
- CRUD admin autorizado/denegado;
- voucher/redención, doble uso y concurrencia;
- holds expirables e idempotencia;
- protección del último cupo concurrente.

El gate final de O2 terminó **38 tests, 38 pass, 0 fail**.

## Critical E2E

El workflow reconstruye Supabase, crea fixtures deterministas y ejecuta Chromium contra la app real.

Flujo comercial integrado:

1. login agency;
2. carga de membresía/agencia;
3. búsqueda server-side;
4. reserva;
5. total/comisión autoritativos;
6. voucher público;
7. inventario actualizado.

Flujo operacional integrado:

1. login operator;
2. verificación del voucher;
3. redención;
4. estado `redeemed`;
5. segundo intento bloqueado.

No usa mocks del motor de negocio.

## Ejecución local

```bash
supabase start
supabase db reset
# exportar variables locales dev/test producidas por Supabase
npm run test:integration
```

Para el E2E, seguir el workflow `.github/workflows/critical-e2e.yml` y `playwright.config.mjs`; Playwright se instala de forma transitoria con versión fijada para no modificar el lockfile solo por el runner.

## Siguiente cobertura obligatoria — Payments & Booking Lifecycle

El próximo frente debe añadir, como mínimo:

- creación de payment ledger autorizada;
- aislamiento por tenant/ownership;
- idempotencia de registro/reconciliación;
- repetición del mismo evento sin duplicar dinero;
- rechazo de transición inválida;
- hold vencido no confirmable;
- confirmación/voucher solo cuando la transición server-side lo permita;
- E2E actualizado si cambia el journey agency.

No introducir un “pago exitoso” únicamente desde estado cliente.

## Pendientes posteriores

- cancelación/reprogramación E2E completa;
- manifiesto/check-in;
- fallos de conectividad/recuperación;
- offline E2E: modo avión, doble scan local, dos dispositivos, reconnect/outbox.

## Regla de cobertura

Cuando se instrumente coverage, registrar porcentaje exacto en `BASELINE.md`; desde ese punto ningún PR puede reducirlo sin excepción aprobada y justificada.
