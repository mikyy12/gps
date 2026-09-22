# Changelog

Todos los cambios relevantes del proyecto se registran aquí. Formato inspirado en Keep a Changelog; el versionado actual sigue `package.json` hasta adoptar una política SemVer formal de releases.

## [Unreleased]

### Added
- Sistema fundacional de documentación y gobierno técnico.
- Estrategia `feature/fix/docs → dev → main`, CODEOWNERS y plantillas de PR.
- Protocolo auditable para agentes mediante Context Tokens.
- Tests S0 con `node:test`.
- Gate `Supabase Integration` con stack local efímero y migraciones + seed.
- RPC `assign_user_role(UUID,TEXT)` para aprovisionamiento administrativo auditable.
- RPC `search_availability(DATE,TEXT,INT)` con filtrado server-side antes de `LIMIT 50`.
- `agencies.commission_rate` como fuente de verdad de comisión.
- Altas persistentes de agencias y tours desde admin.
- Gate `Critical E2E` con Chromium para booking agency y redención operator.
- R3 voucher operacional: estados, QR, redención atómica, anti doble uso, auditoría y `/operator/redeem`.
- O2/C3.1: `create_reservation_hold(...)`, `confirm_reservation_hold(UUID)`, expiración, restitución de cupos e idempotencia por usuario.
- Cobertura de integración ampliada a **38/38** casos verdes después de O2.

### Fixed
- Lockfile reproducible con `npm ci`.
- Nullability del modal de reservas y manejo seguro de sesión.
- Redirect post-login por rol y `next` restringido.
- Usuarios nuevos sin rol operativo automático.
- RLS explícito y ownership de operador.
- Escalación de `profiles.role_id` bloqueada.
- `INSERT` directo en reservas eliminado para impedir bypass del motor transaccional.
- Ambigüedades PL/pgSQL detectadas por integración real.
- Generación de token compatible con `search_path` endurecido.
- Filtro textual de disponibilidad movido a PostgreSQL.
- Comisión fija eliminada del motor/UI.
- Selección arbitraria de la primera membresía eliminada.
- Formularios admin dejan de simular persistencia.
- Test de búsqueda/commission aislado de fixtures paralelos mediante identificador único.

### Changed
- CI usa `npm ci`, audit, lint, typecheck, tests, build y validación documental.
- Playwright del E2E se instala de forma transitoria con versión fijada.
- Workflows aplicables cancelan ejecuciones obsoletas por PR/ref.
- S0, R1, R2, R3 y O2/C3.1 quedaron integrados en `dev`.
- Las mutaciones de voucher/redención deben pasar por RPC autoritativo.
- Los holds no emiten voucher ni representan pago hasta confirmación.

### Known issues
- `main` continúa **UNSTABLE / NO PRODUCCIÓN**.
- El siguiente frente es **C3.1 — Payments & Booking Lifecycle**: payment ledger, conciliación e integración progresiva de hold → pago → confirmación.
- No existe todavía un proveedor de pago aprobado/documentado; no debe simularse integración productiva.
- Permanecen pendientes operación completa de salidas/manifiestos, scanner de cámara, observabilidad, backup/restore, deploy/rollback probado y offline-first.
- `dev` todavía requiere protección técnica en GitHub; la política del proyecto ya prohíbe push/merge directo aunque el enforcement no esté activo.

## [0.1.0] - 2026-09-10

### Existing baseline
- UI inicial para admin, agencias y operadores.
- Supabase Auth/SSR, RLS parcial y motor RPC de reservas.
- Verificación pública de vouchers mediante token.
