# Índice maestro de documentación

Punto de entrada del sistema documental. La ruta rápida debe dar contexto suficiente en 10–15 minutos.

## Ruta rápida

1. `README.md` — propósito y estado.
2. `BASELINE.md` — estado verificable y deuda.
3. `docs/roadmap/CURRENT_WORK.md` — siguiente frente exacto.
4. `AI_CONTEXT.md` — reglas técnicas.
5. `docs/guides/GIT_WORKFLOW.md` — cómo contribuir.
6. documento del módulo afectado.

## Fundacional

- [README.md](./README.md)
- [BASELINE.md](./BASELINE.md)
- [AI_CONTEXT.md](./AI_CONTEXT.md)
- [AGENT_PROTOCOL.md](./AGENT_PROTOCOL.md)
- [CHANGELOG.md](./CHANGELOG.md)

## Arquitectura

- [Visión general](./docs/architecture/system-overview.md)
- [Mapa de módulos](./docs/architecture/module-map.md)
- [Contratos RPC/API](./docs/architecture/api-contracts.md)
- [Offline-first](./docs/architecture/offline-first.md)
- [Admin](./docs/architecture/modules/admin.md)
- [Agency](./docs/architecture/modules/agency.md)
- [Operator](./docs/architecture/modules/operator.md)
- [Voucher](./docs/architecture/modules/voucher.md)
- [Auth y seguridad](./docs/architecture/modules/auth-security.md)
- [Capa de datos](./docs/architecture/modules/data-layer.md)
- [Entrada pública](./docs/architecture/modules/public-entry.md)

## Roadmap

- [Trabajo actual](./docs/roadmap/CURRENT_WORK.md) — fuente autoritativa del siguiente frente.
- [Roadmap](./docs/roadmap/ROADMAP.md)
- [Hitos](./docs/roadmap/MILESTONES.md)

## Guías

- [Onboarding 15 min](./docs/guides/ONBOARDING_15_MIN.md)
- [Desarrollo](./docs/guides/DEVELOPMENT.md)
- [Git y ramas](./docs/guides/GIT_WORKFLOW.md)
- [Testing](./docs/guides/TESTING.md)
- [Deploy](./docs/guides/DEPLOYMENT.md)
- [Estándares documentales](./docs/guides/DOCUMENTATION_STANDARDS.md)
- [Production readiness](./docs/guides/PRODUCTION_READINESS.md)

## CI y gobierno

- [Auto-evaluación](./docs/ci-config/AUTO_EVALUATION.md)
- [Salud documental](./docs/ci-config/DOCUMENT_HEALTH.md)
- [Protección de ramas](./docs/ci-config/BRANCH_PROTECTION.md)

## Plantillas y sesiones

- [Pull Request](./templates/PULL_REQUEST_TEMPLATE.md)
- [Registro de sesión](./templates/AGENT_SESSION_LOG.md)
- [Sesiones de agentes](./docs/agent-sessions/README.md)

## Orden de autoridad

1. Código + migraciones ejecutables en la rama objetivo.
2. `BASELINE.md` para estado actual.
3. `docs/roadmap/CURRENT_WORK.md` para el siguiente frente.
4. `AI_CONTEXT.md` para convenciones.
5. Documentos de arquitectura.
6. Roadmap general.
7. README/guías.

Una contradicción entre documentación y código es un defecto que debe corregirse en el mismo PR.
