# Flujo Git y control de cambios

## Ramas

- `main`: promoción de producción/release; nunca integración diaria.
- `dev`: rama de integración y base de nuevas ramas; no es rama de trabajo directo.
- `feature/<descripcion-corta>`: funcionalidad.
- `fix/<descripcion-corta>`: corrección.
- `docs/<descripcion-corta>`: cambios exclusivamente documentales.

## Flujo obligatorio

```text
dev actualizado
 └─ feature/x | fix/x | docs/x
       └─ PR → dev: CI + review
                    ↓
                  dev
                    └─ PR de fase → main
```

Prohibido:

- push/merge directo a `dev`;
- push/merge directo a `main`;
- PR `feature/*`, `fix/*`, `docs/*` o `chore/*` hacia `main`;
- usar `main` como rama de reparación o respaldo de trabajo inconcluso.

## Commits

Preferir Conventional Commits y agrupar cambios coherentes. Evitar un commit por ajuste mínimo cuando eso dispare CI innecesario. Desarrollar/probar primero y subir lotes lógicos.

## Pull Requests

Todo PR usa plantilla. Cambios de comportamiento requieren docs/tests. Agentes incluyen Context Token. CI rojo bloquea merge.

## Promoción `dev → main`

Solo al cerrar un hito. Debe incluir resumen, evidencia de gates, riesgos residuales, rollback y confirmación documental.

## Enforcement actual

La política anterior es obligatoria aunque GitHub todavía no tenga Branch Protection activa sobre `dev`. `main` sí está protegido; `dev` debe recibir su ruleset según `docs/ci-config/BRANCH_PROTECTION.md`.
