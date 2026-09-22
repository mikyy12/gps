# Agent entrypoint

Antes de modificar este repositorio, lee en orden:

1. `README.md`
2. `BASELINE.md`
3. `docs/roadmap/CURRENT_WORK.md`
4. `AI_CONTEXT.md`
5. `AGENT_PROTOCOL.md`
6. `INDEX.md` y documentación del módulo afectado

Toda sesión automatizada que cambie código debe registrar Context Token según `templates/AGENT_SESSION_LOG.md`.

Regla Git: partir de `dev`, crear una rama propia y abrir PR hacia `dev`. No trabajar, pushear o mergear directamente sobre `dev` o `main`, ni abrir una rama feature/fix/docs directamente hacia `main`.
