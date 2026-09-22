# Production Readiness Gate

Un release se considera **completo de producción** solo cuando todos los puntos están verificados.

## Calidad

- [x] `npm ci` reproducible.
- [x] lint verde sin warnings críticos.
- [x] typecheck verde.
- [x] build verde.
- [x] tests unit/integration/E2E críticos verdes.
- [ ] coverage no inferior a baseline acordado.

## Seguridad

- [x] cero vulnerabilidades critical/high sin excepción aprobada con fecha de vencimiento.
- [x] RLS probado en todas las tablas expuestas.
- [x] multitenancy por organización probado.
- [x] secrets fuera de cliente/repo.
- [ ] signup/roles productivos controlados.

## Producto

- [x] inventario/reserva transaccional e idempotente.
- [x] voucher emitible/verificable/redimible.
- [ ] pagos diferenciados de reservas.
- [ ] cancelación/reprogramación consistente.
- [ ] journeys de roles principales E2E.

## Operaciones

- [ ] logs/errores básicos configurados.
- [ ] backup/restore probado.
- [ ] deploy y rollback verificados.
- [ ] smoke test documentado.

## Documentación

- [x] salud documental 100% de cobertura.
- [x] API contracts sincronizados.
- [x] module map sincronizado.
- [x] README refleja stack/estado.
- [x] BASELINE actualizado al commit de release.
- [x] CHANGELOG actualizado.

## Cierre de fase

Cuando todos los issues de una fase están cerrados: PR `dev → main`, resumen ejecutivo, evidencia de gates, riesgos residuales, rollback y revisión explícita de `@LavenderEdit`. No mergear por “fecha objetivo” si falta un gate.
