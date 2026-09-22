# AI_CONTEXT — Contrato técnico del proyecto

Este documento es obligatorio para cualquier agente de IA y recomendado para toda persona que modifique el repositorio.

## 1. Objetivo del producto

Sistema B2B de vouchers digitales para turismo en Galápagos. Núcleo: **inventario → hold/reserva → pago/confirmación → voucher → redención**, con evolución offline-first.

## 2. Stack autorizado

- Next.js App Router + React + TypeScript estricto.
- Tailwind CSS.
- Supabase Auth/SSR, PostgreSQL y RLS.
- RPC PostgreSQL para operaciones transaccionales críticas.
- GitHub Actions para gates.

No introducir otro framework, ORM, base de datos o sistema de auth sin decisión explícita y plan de migración.

## 3. Capas y autoridad

```text
src/app/              rutas y composición
src/components/       UI por dominio
src/lib/auth/         autorización server-side
src/lib/supabase/     clientes y sesión
supabase/migrations/  schema, RLS y RPC
scripts/              validaciones
/docs                  documentación
```

La lógica que modifica cupos, reservas, pagos o redenciones debe ser atómica y autoritativa en servidor/PostgreSQL.

## 4. TypeScript

- mantener `strict: true`;
- no ocultar incompatibilidades con casts inseguros;
- preferir tipos generados cuando estén disponibles;
- modelar errores esperables;
- mover gradualmente acceso a datos fuera de JSX cuando se toque funcionalidad.

## 5. Nomenclatura

| Elemento | Convención |
|---|---|
| Componentes | PascalCase |
| Funciones/variables | camelCase |
| RPC/tablas | snake_case |
| Ramas feature | `feature/<descripcion>` |
| Ramas fix | `fix/<descripcion>` |
| Ramas docs | `docs/<descripcion>` |

## 6. Estados de negocio objetivo

```text
booking: DRAFT → HELD → PENDING_PAYMENT → CONFIRMED → COMPLETED
                                      ↘ CANCELLED
voucher: ISSUED → REDEEMED
            ↘ REVOKED / EXPIRED
payment: estado propio; no inferir desde reservation.status
```

## 7. Seguridad

- toda tabla expuesta debe tener RLS o grant justificado;
- scope de operator/agency se valida por organización/recurso;
- signup B2B público no asigna rol operativo;
- cambios de seguridad/dinero requieren integración real;
- offline futuro contiene datos mínimos y evita una segunda fuente de verdad.

## 8. UI/UX

- preservar patrones actuales salvo decisión global;
- mobile-first para operator/scanner;
- loading/error/empty/disabled obligatorios;
- no presentar controles no implementados como funcionalidad real;
- accesibilidad básica obligatoria.

## 9. Documentación por cambio

- firma RPC/schema/RLS → `api-contracts.md`, `data-layer.md` y baseline cuando cambie estado;
- módulo/componente público → doc del módulo;
- arquitectura/import cross-module → `module-map.md`;
- cambio relevante/versionado → `CHANGELOG.md`;
- flujo operativo/onboarding → README/guía correspondiente.

## 10. Anti-patrones prohibidos

1. ocultar lockfile roto con instalación no reproducible;
2. desactivar strict/lint;
3. credenciales privilegiadas en navegador;
4. desactivar RLS como solución temporal;
5. mutar cupos evitando RPC;
6. hardcodear comisión/precio/permisos cuando existe fuente de verdad;
7. confundir total reservado con dinero cobrado;
8. mocks presentados como funcionalidad productiva;
9. push o merge directo a `dev` o `main`;
10. abrir `feature/*`, `fix/*` o `docs/*` directamente hacia `main`;
11. reescribir stack sin decisión y migración;
12. romper tests existentes sin explicación/reemplazo.

## 11. Antes de editar

Leer: `README.md` → `BASELINE.md` → `docs/roadmap/CURRENT_WORK.md` → este archivo → doc del módulo → `AGENT_PROTOCOL.md` si eres agente. Después inspeccionar código/migraciones reales.
