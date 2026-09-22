# AGENT_PROTOCOL — Protocolo obligatorio para agentes de IA

## Objetivo

Hacer que una sesión de agente sea reproducible, auditable y compatible con el estado real del proyecto.

## Antes de cualquier edición

1. Leer `README.md`.
2. Leer `BASELINE.md`.
3. Leer `docs/roadmap/CURRENT_WORK.md`.
4. Leer `AI_CONTEXT.md`.
5. Leer `INDEX.md` y la documentación específica del módulo.
6. Inspeccionar archivos reales y migraciones relevantes.
7. Registrar un Context Token siguiendo `templates/AGENT_SESSION_LOG.md`.
8. Declarar y verificar supuestos que afecten seguridad, datos o compatibilidad.

## Context Token

Cada sesión que modifique código registra en `docs/agent-sessions/`:

```yaml
context_token: CTX-YYYYMMDD-HHMM-<agent>
base_ref: <commit>
docs_read: []
code_inspected: []
assumptions: []
risks: []
planned_invariants: []
```

El token se incluye en la descripción del PR.

## Reglas durante la edición

- no romper tests existentes sin cambio de contrato explícito y reemplazo;
- mantener o mejorar coverage cuando exista baseline instrumentado;
- no introducir bypass RLS, credenciales privilegiadas cliente, schema destructivo o lógica crítica cliente;
- cambios de interfaz/RPC/schema/import cross-module actualizan documentación asociada;
- seguridad y dinero requieren tests de integración;
- preferir cambios mínimos, reversibles y compatibles con la arquitectura.

## Validación previa al PR

```bash
npm run docs:validate
npm run docs:health
npm run changelog:validate
npm run lint
npm run typecheck
npm test
npm run build
```

Añadir `npm run test:integration` cuando el cambio toque schema/RLS/RPC/seguridad/dinero y E2E cuando cambie un journey crítico.

## Git obligatorio

- base: `dev` actualizado;
- trabajo: rama `feature/*`, `fix/*` o `docs/*`;
- destino: PR hacia `dev`;
- promoción: solo PR `dev → main`.

Un agente no debe trabajar ni mergear directamente sobre `dev` o `main`, ni abrir una rama feature/fix/docs hacia `main`.

## Fin de sesión

Actualizar el Context Token con archivos, comandos, resultados, riesgos y docs. El objetivo es que otra persona reconstruya las decisiones sin depender del razonamiento privado del agente.
