# Módulo Agency

**Código:** `src/app/agency`, `src/components/agency`.

Responsabilidad: consultar disponibilidad, operar bajo una agencia explícita, reservar, consultar/cancelar reservas y acceder al voucher.

## Estado actual

- `search_availability(DATE,TEXT,INT)` filtra en PostgreSQL antes del `LIMIT 50`;
- la agencia activa es explícita cuando existen múltiples membresías;
- `agencies.commission_rate` es la fuente de verdad comercial;
- `create_reservation` mantiene el flujo confirmado existente usado por la UI;
- O2 añadió `create_reservation_hold(...)` y `confirm_reservation_hold(UUID)` para holds expirables e idempotentes;
- cancelación y ownership se validan server-side.

## Cobertura

R2 valida en Chromium login agency → búsqueda → reserva → voucher → inventario. La integración Supabase posterior a O2 terminó **38/38**, incluyendo expiración, idempotencia, ownership y último cupo concurrente.

## Voucher

R3 ya está integrado: QR, verificación pública y redención operacional online existen. La agencia no redime vouchers; operator/admin lo hacen mediante RPC autoritativo.

## Próximo cambio esperado

El siguiente frente es **Payments & Booking Lifecycle**:

- payment ledger separado de la reserva;
- estados de pago/conciliación;
- adopción progresiva de UI `hold → payment state → confirm`;
- no presentar un hold como pago;
- no emitir voucher desde una transición solo cliente.

## Deuda restante

- payment ledger y conciliación;
- adopción UI del hold lifecycle;
- pasajeros individuales/manifiesto;
- cancelación/reprogramación E2E adicional;
- operación/offline posteriores.

## Invariantes

- una agencia solo accede a organizaciones a las que pertenece;
- el contexto de agencia es explícito con múltiples membresías;
- inventario, comisión y transiciones financieras finales se deciden server-side;
- el filtrado ocurre antes de limitar resultados;
- holds no son pagos;
- voucher solo se emite por una transición autoritativa permitida.
