# Sesión S0 — estabilización

```yaml
context_token: CTX-20260911-S0-STABILIZATION
base_ref: feature/documentation-quality-system@e7bed4debc5885258e934df25d79f84fbf08ee7b
branch: fix/s0-stabilization
docs_read:
  - README.md
  - BASELINE.md
  - AI_CONTEXT.md
  - AGENT_PROTOCOL.md
  - docs/architecture/modules/agency.md
  - docs/architecture/modules/auth-security.md
  - docs/architecture/modules/data-layer.md
  - docs/architecture/modules/public-entry.md
code_inspected:
  - package.json
  - package-lock.json
  - src/app/page.tsx
  - src/components/agency/BookingModal.tsx
  - src/lib/auth/require-role.ts
  - src/lib/supabase/proxy.ts
  - supabase/config.toml
  - supabase/migrations/*
assumptions:
  - "vessels.owner_id es el scope operacional disponible actualmente para aislar operadores durante S0; el modelo multiempresa final puede reemplazarlo."
  - "No se declara main estable hasta promoción formal y CI verde."
changes:
  - "package-lock.json sincronizado mediante runner limpio y npm ci."
  - "BookingModal captura selectedTour no-null para el closure async."
  - "Proxy trata getClaims() de forma nullable/segura."
  - "Login resuelve portal por rol y restringe next."
  - "Nuevos perfiles se crean sin rol operativo implícito."
  - "RLS explícito para agencies_users, routes y tours."
  - "Operator scope por ownership para fleet/availability/reservations/vouchers."
  - "RPCs SECURITY DEFINER cancel_reservation/update_availability_seats validan ownership."
  - "supabase/seed.sql mínimo añadido."
  - "tests S0 para routing y contratos de seguridad."
validation_so_far:
  - "Lockfile regenerado por GitHub Actions y npm ci --ignore-scripts pasó en runner limpio."
  - "CI final de PR a dev pendiente al registrar este token."
remaining_risks:
  - "npm audit final puede revelar advisories high/critical todavía abiertos."
  - "Typecheck/build completo debe revalidarse tras todos los fixes."
  - "Tests actuales son contract tests; falta integración real de RLS con Supabase local."
  - "Número de pasajeros del buscador todavía no se propaga al modal."
  - "Filtro destino post-LIMIT y comisión hardcodeada permanecen fuera del cierre inmediato de build."
rollback:
  - "Revertir commits S0; no reescribir migraciones históricas ya aplicadas."
```

## Decisión

S0 prioriza reproducibilidad, compilación y autorización. No introduce QR, pagos, offline-first ni refactors de dominio no necesarios para recuperar una base confiable. La promoción solo procede con los gates de `Production Check` y `Documentation Quality` en verde o con una excepción explícita documentada.
