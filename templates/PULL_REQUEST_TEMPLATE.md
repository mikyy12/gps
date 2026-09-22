# Pull Request

## Descripción
<!-- Qué cambia, en términos verificables. -->

## Motivación
<!-- Problema/issue que resuelve y por qué ahora. -->

## Tipo de cambio
- [ ] fix
- [ ] refactor
- [ ] feature
- [ ] docs
- [ ] security
- [ ] chore/ci

## Context Token (si intervino IA)
`CTX-...` / No aplica

## Riesgo
- [ ] Bajo
- [ ] Medio
- [ ] Alto
- [ ] Crítico

## Validación ejecutada
- [ ] `npm run docs:validate`
- [ ] `npm run docs:health`
- [ ] `npm run changelog:validate`
- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] tests relevantes
- [ ] `npm run build`

## Documentación
- [ ] Actualicé docs del módulo afectado.
- [ ] Actualicé contratos API/RPC si aplica.
- [ ] Actualicé mapa de arquitectura si cambió una dependencia.
- [ ] Actualicé BASELINE si cambió estado de salud/capacidad.
- [ ] Actualicé CHANGELOG si aplica.
- [ ] No requiere docs; justifico abajo.

## Seguridad y datos
- [ ] Revisé RLS/ownership si cambia acceso a datos.
- [ ] No expongo secretos/PII nueva.
- [ ] Mutaciones críticas siguen siendo server-side/atómicas.

## Evidencia / notas
<!-- Resultados, screenshots si corresponde, riesgos residuales y rollback. -->

## Para PR `dev → main`
- [ ] Todos los issues de la fase están cerrados o excepcionados explícitamente.
- [ ] Resumen ejecutivo incluido.
- [ ] Production Readiness revisado.
- [ ] Rollback documentado.
- [ ] Revisión explícita del CODEOWNER requerida.
