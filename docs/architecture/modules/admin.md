# Módulo Admin

**Código:** `src/app/admin`, `src/components/admin`.

Responsabilidad: visión global, catálogo, agencias, embarcaciones, auditoría y configuración. Dashboard y listados consumen datos reales; altas de embarcaciones, agencias y tours ya persisten en Supabase. Settings y operaciones de edición/eliminación continúan incompletos.

## Estado después de S0

- El historial de auditoría mantiene un cliente Supabase memoizado y consultas de solo lectura limitadas a los últimos 100 eventos.
- El hardening RLS sigue siendo la autoridad real: el navegador admin no recibe `service_role` ni bypass implícito.

## R1 — altas reales

- `AgencyFormModal` crea registros reales en `agencies` bajo la policy `agencies_admin_write`, incluyendo RUC, contacto, dirección y `commission_rate`.
- El campo que antes sugería un “correo de login” ahora se define correctamente como correo de contacto; crear una agencia no crea implícitamente un usuario Auth.
- El formulario de agencia eliminó el supuesto de estado de cuenta porque esa propiedad todavía no existe en el modelo de dominio.
- `TourFormModal` crea registros reales en `tours` bajo `tours_admin_write` con nombre, descripción y precio base.
- Se retiraron duración e imagen del formulario de tour porque actualmente no tienen columnas asociadas y antes se descartaban silenciosamente.
- Las páginas actualizan sus colecciones locales con el registro devuelto por PostgreSQL; no presentan éxito antes de recibir persistencia confirmada.

## Deuda restante

- edición y eliminación de agencias/tours;
- gestión explícita de rutas como entidad separada;
- aprovisionamiento UI de usuarios/membresías sobre `assign_user_role`;
- settings persistentes e integraciones;
- auditoría específica para altas administrativas si se decide exigir audit log para toda mutación, no solo acciones sensibles/destructivas.

## Invariantes

- admin no debe saltarse RLS desde navegador;
- una UI no debe mostrar controles persistentes para campos que el modelo no guarda;
- toda acción destructiva requiere confirmación/auditoría;
- métricas de ventas deben distinguir reservado de cobrado;
- cambios que afecten seguridad o scopes deben quedar registrados en `audit_logs` y en documentación.

Cambios que requieren actualizar este doc: nuevas rutas admin, cambio de permisos, CRUD productivo, nuevas métricas o dependencias cross-module.
