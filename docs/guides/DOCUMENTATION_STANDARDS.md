# Estándares de documentación

## Principio

Documentación describe comportamiento verificable, no intención futura, salvo documentos explícitamente marcados como roadmap/target.

## Reglas

- Toda doc inicia con propósito/alcance claro.
- Usar rutas y nombres exactos del repositorio.
- Baseline distingue `existente`, `parcial`, `faltante`.
- No afirmar integraciones productivas si solo existe UI.
- Contratos machine-readable (`MODULE`, `ARCH_DEP`, `API_CONTRACT`) no se cambian sin actualizar validadores.
- Docs de módulo cambian junto con comportamiento observable del módulo.
- Changelog cambia al cambiar versión y registra cambios relevantes.

## Freshness

`docs-health.mjs` compara última modificación de módulos y docs. Objetivo: 100% módulos documentados y sin documentación más antigua que el código correspondiente.

## Definition of Done documental

Un PR no está hecho si el código está correcto pero su documentación queda falsa.
