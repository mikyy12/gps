# Sistema de auto-evaluación documentación↔código

## Componentes

### `scripts/docs-health.mjs`
Descubre módulos reales, compara con marcadores `MODULE`, valida docs existentes y calcula cobertura/frescura/completitud.

### `scripts/validate-doc-sync.mjs`
Valida:
- versiones README vs `package.json`;
- `PROJECT_STATUS` del README vs clasificación `STABLE/UNSTABLE` de `BASELINE.md`;
- funciones con `GRANT EXECUTE` vs marcadores `API_CONTRACT`;
- imports cross-module vs `ARCH_DEP`;
- en PR, módulo de código modificado → doc asociada modificada;
- migraciones y cambios de dependencias requieren documentación relacionada.

### `scripts/validate-changelog.mjs`
Verifica que la versión actual exista en changelog y que un bump de versión en PR actualice changelog.

## CI

### `documentation-quality.yml`
Ejecuta contratos documentación↔código, salud documental y changelog sin depender de una instalación de paquetes.

### `production-check.yml`
Ejecuta:

1. contratos documentales;
2. `npm ci`;
3. `npm audit --audit-level=high`;
4. lint;
5. typecheck;
6. tests rápidos;
7. build Next.js de producción.

El build define placeholders **no secretos** para `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Solo permiten compilar/prerenderizar componentes que instancian el cliente browser; no sustituyen configuración runtime real.

### `supabase-integration.yml`
Gate R1 para cambios de base de datos/seguridad:

1. instala dependencias con `npm ci`;
2. instala Supabase CLI fijado a `2.117.0`;
3. levanta un stack Supabase local efímero en Docker;
4. ejecuta `supabase db reset` para reconstruir desde migraciones + seed;
5. exporta únicamente las credenciales locales generadas por el stack;
6. ejecuta `npm run test:integration` contra Auth/PostgREST/PostgreSQL reales;
7. destruye el stack sin backup incluso si el test falla.

No usa `SUPABASE_ACCESS_TOKEN`, claves del proyecto remoto ni secretos productivos. Los datos de prueba se crean en runtime y desaparecen con el stack.

## Baseline validado

S0 quedó integrado en `dev` con Documentation Quality y Production Check post-merge verdes. El gate productivo verifica instalación reproducible, audit sin vulnerabilidades, lint, typecheck, tests y build.

R1 añade evidencia runtime para permisos. Los tests de contrato permanecen porque son rápidos y detectan drift estático; la integración Supabase no los reemplaza, los complementa.

## Fallos intencionales

El sistema debe fallar cuando detecta divergencia. No suavizar reglas para poner CI verde; corregir el contrato, la policy, el RPC o el código. Nunca introducir secretos reales en workflows versionados.
