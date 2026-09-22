# Guía de desarrollo

## Requisitos

Node 22, npm compatible con el lockfile, Supabase CLI y Docker para entorno local.

## Setup

```bash
git switch dev
git pull origin dev
git switch -c feature/descripcion-corta
npm ci
cp .env.example .env.local
supabase start
supabase db reset
npm run dev
```

`npm ci` debe pasar sobre `dev`. Si falla, tratarlo como un bloqueo real y no sustituirlo permanentemente por `npm install`.

## Antes de commit

```bash
npm run docs:validate
npm run docs:health
npm run changelog:validate
npm run lint
npm run typecheck
npm test
npm run build
```

Si el cambio toca RLS, RPC, schema, pagos, inventario o seguridad, ejecutar también `npm run test:integration`. Si cambia un journey crítico de UI, actualizar/ejecutar el E2E correspondiente.

## Git

- `dev` es la base de nuevas ramas, no una rama de trabajo directo.
- usar `feature/*`, `fix/*` o `docs/*` según el cambio;
- abrir PR hacia `dev`;
- solo una promoción de fase/hito usa PR `dev → main`;
- nunca push/merge directo a `dev` o `main`.

## Migraciones

- Crear nueva migración; no reescribir historia aplicada.
- Añadir RLS/GRANT explícito.
- Añadir índice si la query crítica lo requiere.
- Añadir/actualizar contrato RPC y test.

## Variables de entorno

Solo valores explícitamente públicos usan `NEXT_PUBLIC_`. Secretos de pagos, mensajería, firma QR o credenciales privilegiadas son server-only.
