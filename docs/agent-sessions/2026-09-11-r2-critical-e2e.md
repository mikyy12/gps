# R2 — Critical browser E2E

```yaml
context_token: CTX-20260911-R2-CRITICAL-E2E
base_ref: ffe7dc3797ef464489b686cb6cdc5a7b8dd2555c
merged_into_dev: 89b638bf71ba7ef855221b8dbdba73f0725db05d
docs_read:
  - README.md
  - BASELINE.md
  - AI_CONTEXT.md
  - INDEX.md
  - AGENT_PROTOCOL.md
  - docs/guides/TESTING.md
  - docs/architecture/modules/agency.md
  - docs/architecture/modules/voucher.md
code_inspected:
  - src/app/page.tsx
  - src/app/agency/page.tsx
  - src/components/agency/BookingModal.tsx
  - src/app/verify/[id]/page.tsx
  - supabase/migrations/20260911060000_r1_search_commission.sql
  - tests/integration/supabase-rls.test.mjs
assumptions:
  - "El gate E2E debe usar Supabase local efímero y no datos/credenciales remotos."
  - "El happy path agency era el siguiente P0 después de R1."
  - "Los cambios se agrupan antes de abrir el PR para reducir ejecuciones de GitHub Actions."
risks:
  - "Playwright añade costo de instalación de Chromium al gate."
  - "Un E2E happy-path no sustituye escenarios negativos, redención ni offline."
planned_invariants:
  - "no reduce RLS coverage"
  - "no usa service_role en navegador"
  - "inventario y comisión siguen autoritativos en PostgreSQL"
  - "no modifica package-lock.json para incorporar el runner E2E"
files_changed:
  - .github/workflows/e2e-critical.yml
  - .github/workflows/production-check.yml
  - .github/workflows/documentation-quality.yml
  - playwright.config.mjs
  - tests/e2e/setup-fixture.mjs
  - tests/e2e/critical-booking.spec.mjs
  - README.md
  - BASELINE.md
  - CHANGELOG.md
  - docs/guides/TESTING.md
  - docs/architecture/modules/agency.md
  - docs/agent-sessions/2026-09-11-r2-critical-e2e.md
commands_run:
  - "node --check playwright.config.mjs"
  - "node --check tests/e2e/setup-fixture.mjs"
  - "node --check tests/e2e/critical-booking.spec.mjs"
  - "PR gates: Documentation Quality, Production Check, Critical E2E"
validation_results:
  - "Documentation Quality: success"
  - "Production Check: success"
  - "Critical E2E: success"
  - "Happy path validado: login agency → búsqueda → reserva → voucher → inventario 10→8"
  - "Total validado: USD 80; comisión validada: USD 16 con tasa 20%"
  - "Primera corrida E2E detectó selector de texto demasiado estricto; no fue un bug productivo"
  - "Segunda corrida E2E pasó completa"
docs_updated:
  - README.md
  - BASELINE.md
  - CHANGELOG.md
  - docs/guides/TESTING.md
  - docs/architecture/modules/agency.md
remaining_risks:
  - "negative auth/role E2E"
  - "operator/guide redemption E2E"
  - "payments, holds and offline scenarios"
  - "deploy/rollback remains unproven"
status: "MERGED_TO_DEV"
```

## Decisiones resumidas

- El E2E usa la aplicación y Supabase reales; solo los datos de prueba son fixtures deterministas.
- Playwright queda fijado en el workflow y se instala con `--no-save --package-lock=false` para preservar el lockfile autoritativo.
- El fixture crea una agencia, operador, ruta, tour, embarcación y disponibilidad futura; la prueba confirma reserva, voucher y decremento de cupos.
- Los workflows rápidos reciben `concurrency` con `cancel-in-progress` para evitar ejecuciones obsoletas.
- El stack E2E excluye servicios Supabase que no participan en el journey crítico.
- El PR #6 se trabajó con dos commits agrupados: implementación completa y una corrección consolidada después del diagnóstico del primer E2E.

## Cierre

R2 quedó mergeado a `dev` en `89b638bf71ba7ef855221b8dbdba73f0725db05d`. El happy path comercial crítico ya no es deuda abierta. El siguiente frente recomendado es **R3 — Voucher operacional / redención**, manteniendo como invariantes RLS, booking transaccional, comisión autoritativa e integración E2E existente.
