# Auth y seguridad

**Código:** `src/lib/auth`, `src/lib/supabase/proxy.ts`, layouts protegidos y RLS.

## Estado actual

Roles operativos: `admin`, `agency`, `operator`. Guards server-side controlan navegación y RLS/RPC son la autoridad final sobre datos.

S0/R1 dejaron integrados:

- login por rol y `next` restringido;
- perfiles nuevos con `role_id = NULL`;
- RLS explícito y ownership de operador;
- guard contra autoescalación de `role_id`;
- `assign_user_role(UUID,TEXT)` para aprovisionamiento admin;
- bloqueo de `INSERT` directo en reservas;
- aislamiento agency A/B y operator A/B probado en Supabase real.

R2/R3 añaden E2E de navegador para booking agency y redención operator. O2 amplía integración con holds, expiración e idempotencia. El baseline Supabase actual es **38/38**.

## Reglas no negociables

- autorización real vive en servidor/RLS/RPC;
- credenciales privilegiadas nunca llegan al cliente;
- signup B2B no asigna rol operativo automáticamente;
- cambios de permisos requieren pruebas positivas y negativas;
- RPCs con privilegios elevados validan identidad, rol y ownership dentro de la función;
- no ampliar un rol globalmente cuando existe scope por organización/recurso;
- reservas no se insertan directamente desde Data API.

## Deuda vigente

- organización multiusuario para operadores en vez de depender solo de `vessels.owner_id`;
- endurecer signup/password/MFA productivos;
- aprovisionamiento UI completo sobre `assign_user_role`;
- ampliar E2E negativos de guards/roles cuando se toquen esos flujos.
