# Onboarding en 15 minutos

## Min 0–3: producto y estado

Lee `README.md` y `BASELINE.md`. Retén: `dev` tiene S0/R1/R2/R3/O2 integrados; `main` aún no es producción.

## Min 3–5: siguiente trabajo

Lee `docs/roadmap/CURRENT_WORK.md`. Ese archivo define el siguiente frente exacto. Hoy es **C3.1 — Payments & Booking Lifecycle**.

## Min 5–8: reglas

Lee `AI_CONTEXT.md`, especialmente seguridad, lógica crítica server-side, estados de negocio y anti-patrones.

## Min 8–11: arquitectura

Abre `docs/architecture/module-map.md` y el documento del módulo que vas a tocar. Si cambias schema/RPC/RLS, lee también `api-contracts.md` y `modules/data-layer.md`.

## Min 11–13: testing

Lee `docs/guides/TESTING.md`. Baseline actual: 7/7 tests rápidos, 38/38 integración Supabase y Critical E2E verde.

## Min 13–15: contribución

Lee `docs/guides/GIT_WORKFLOW.md`.

```bash
git switch dev
git pull origin dev
git switch -c feature/c3-payment-ledger
```

No trabajar directamente sobre `dev` ni `main`. Todo feature/fix/docs abre PR hacia `dev`. `main` solo recibe promoción `dev → main`.

## Cinco cosas que jamás debes hacer

1. push o merge directo a `dev`/`main`;
2. abrir `feature/*` o `fix/*` directamente hacia `main`;
3. desactivar RLS/strict/lint para desbloquearte;
4. decidir inventario/pago/redención crítica solo desde UI;
5. mergear comportamiento nuevo sin tests y documentación correspondiente.
