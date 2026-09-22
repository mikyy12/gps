# R3 — Voucher operacional y redención

```yaml
context_token: CTX-20260911-R3-VOUCHER-REDEMPTION
base_ref: 17125cd2ecfaf9038f2bf7a2b72846d44e951156
docs_read:
  - README.md
  - BASELINE.md
  - AI_CONTEXT.md
  - INDEX.md
  - AGENT_PROTOCOL.md
  - CHANGELOG.md
  - docs/architecture/modules/voucher.md
  - docs/architecture/modules/operator.md
  - docs/architecture/modules/data-layer.md
  - docs/architecture/api-contracts.md
  - docs/guides/TESTING.md
  - docs/roadmap/ROADMAP.md
code_inspected:
  - src/app/verify/[id]/page.tsx
  - src/app/operator/page.tsx
  - src/components/operator/OperatorShell.tsx
  - supabase/migrations/20260626030524_init_schema.sql
  - supabase/migrations/20260910173000_security_hardening.sql
  - supabase/migrations/20260911090000_r3_voucher_redemption.sql
  - tests/integration/voucher-redemption.test.mjs
assumptions:
  - "Los roles existentes admin y operator son los únicos autorizados para la redención operacional."
  - "El token opaco existente es el identificador seguro del QR; no se añade PII al payload."
  - "La migración R3 encontrada sin seguimiento forma parte del trabajo de esta feature y debe validarse antes de consolidarla."
risks:
  - "Supabase CLI no está instalado en el entorno local, por lo que la integración real requiere CI o instalación de la CLI."
  - "El scanner de cámara y el modo offline quedan fuera del primer slice funcional."
planned_invariants:
  - "no reduce RLS coverage"
  - "no usa service_role en navegador"
  - "la redención permanece autoritativa y atómica en PostgreSQL"
  - "el QR contiene únicamente una URL con token opaco"
  - "operator solo redime vouchers de su propia embarcación"
files_changed:
  - supabase/migrations/20260911090000_r3_voucher_redemption.sql
  - tests/integration/voucher-redemption.test.mjs
  - src/app/operator/redeem/page.tsx
  - src/app/verify/[id]/page.tsx
  - src/components/operator/OperatorShell.tsx
  - src/components/voucher/VoucherQr.tsx
  - package.json
  - package-lock.json
  - README.md
  - BASELINE.md
  - CHANGELOG.md
  - docs/architecture/api-contracts.md
  - docs/architecture/module-map.md
  - docs/architecture/modules/data-layer.md
  - docs/architecture/modules/operator.md
  - docs/architecture/modules/voucher.md
  - docs/guides/TESTING.md
  - docs/agent-sessions/2026-09-11-r3-voucher-redemption.md
commands_run:
  - "git status --short --branch"
  - "git fetch origin dev"
  - "npm run docs:validate"
  - "npm run lint"
  - "npm install qrcode.react"
  - "npm run typecheck"
  - "npm test"
  - "npm run build con variables Supabase locales de prueba"
  - "npm audit --audit-level=high"
  - "npm run test:integration"
  - "npx --yes supabase@2.117.0 --version"
  - "node --check tests/e2e/setup-fixture.mjs"
  - "node --check tests/e2e/critical-booking.spec.mjs"
validation_results:
  - "docs:validate, docs:health, changelog:validate: passed; docs health 98/100 with only git freshness for uncommitted migration"
  - "lint: passed"
  - "typecheck: passed"
  - "npm test: 7/7 passed"
  - "build: passed with local test environment variables; without variables it fails at existing login-page Supabase client initialization"
  - "npm audit: 0 vulnerabilities"
  - "integration: blocked because Docker is unavailable locally; Supabase CLI 2.117.0 is available through npx"
  - "E2E fixture/spec syntax: passed; browser execution awaits CI Docker stack"
docs_updated:
  - README.md
  - BASELINE.md
  - CHANGELOG.md
  - docs/architecture/api-contracts.md
  - docs/architecture/module-map.md
  - docs/architecture/modules/data-layer.md
  - docs/architecture/modules/operator.md
  - docs/architecture/modules/voucher.md
  - docs/guides/TESTING.md
remaining_risks:
  - "Debe ejecutarse supabase db reset y tests/integration contra el stack local/CI para validar la migración SQL R3 y la concurrencia real."
  - "Falta E2E de operador y scanner de cámara; el primer slice acepta token o URL pegada."
  - "Los commits e6d50f3 y 09dde88 consolidan implementación y E2E; requieren CI Docker antes del PR."
```

## Decisiones resumidas

- La migración usa `FOR UPDATE` sobre el voucher y una restricción `UNIQUE(voucher_id)` como defensa doble contra redenciones concurrentes.
- La UI operacional se restringe al layout existente de `operator`; el RPC mantiene la autorización y ownership como autoridad final.
- La verificación pública sigue siendo lectura y muestra el estado redimido sin consumir el voucher.