# Protección de ramas

## Estado actual verificado

- `main`: protección activa en GitHub.
- `dev`: todavía aparece sin protección técnica activa.

Esto **no cambia la política del proyecto**: nadie debe hacer push/merge directo a `dev` o `main`. Hasta que se active el ruleset de `dev`, la disciplina de PR sigue siendo obligatoria por proceso y revisión.

## Política requerida para `dev`

- Require pull request before merging: ON.
- Required approvals: 1.
- Dismiss stale approvals: ON.
- Require conversation resolution: ON.
- Required checks: `Documentation Quality` y `Production Check`; añadir `Supabase Integration`/`Critical E2E` cuando el cambio los dispare.
- Require branch up to date: ON.
- Block force pushes/deletions: ON.
- Direct push: OFF salvo emergencia owner documentada.

## Política requerida para `main`

- Solo PR `dev → main` para promoción de fase/release.
- Require pull request: ON.
- Required approvals: mínimo 1.
- Require Code Owner review: ON.
- CODEOWNER global: `@LavenderEdit`.
- Required checks: documentación + producción y gates adicionales aplicables.
- Require conversation resolution/up-to-date: ON.
- Force push/deletion: prohibido.
- No `feature/*`, `fix/*`, `docs/*` o `chore/*` directo hacia `main`.

## Acción pendiente de gobierno

Activar el ruleset de `dev` desde Settings → Rules/Branches. Hasta entonces, cualquier programador o agente debe obedecer `docs/guides/GIT_WORKFLOW.md` aunque GitHub permita técnicamente el push.
