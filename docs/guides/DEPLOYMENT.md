# Guía de despliegue

## Estado

Procedimiento objetivo; **no verificado para producción mientras BASELINE=UNSTABLE**.

## Pre-deploy

1. CI verde en `dev`.
2. `npm ci` reproducible.
3. migraciones probadas sobre entorno equivalente.
4. backup/rollback definido.
5. secrets presentes fuera del repo.
6. `PRODUCTION_READINESS.md` aprobado.

## Promoción

Crear PR `dev → main`, solicitar revisión CODEOWNER, adjuntar resumen, migraciones, riesgos, rollback y pruebas. Después del merge, desplegar artefacto asociado al commit exacto.

## Migraciones

Aplicar antes o de forma compatible con app según estrategia expand/contract. Cambios destructivos requieren migración en dos etapas.

## Smoke test post-deploy

- login admin/agency/operator;
- consulta disponibilidad;
- reserva de prueba controlada;
- verificación voucher;
- cancelación/restauración de cupos;
- auditoría visible.

## Rollback

El código puede volver a commit anterior solo si schema mantiene compatibilidad. No hacer rollback destructivo de datos sin plan/backup.
