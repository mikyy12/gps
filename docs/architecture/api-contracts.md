# Contratos RPC / API de base de datos

Los marcadores `API_CONTRACT` se comparan automáticamente contra funciones con `GRANT EXECUTE` presentes en `supabase/migrations/*.sql`.

<!-- API_CONTRACT current_user_role() -->
<!-- API_CONTRACT verify_voucher(TEXT) -->
<!-- API_CONTRACT search_availability(DATE,TEXT,INT) -->
<!-- API_CONTRACT create_reservation(UUID,UUID,INT,TEXT,TEXT) -->
<!-- API_CONTRACT cancel_reservation(UUID) -->
<!-- API_CONTRACT update_availability_seats(UUID,INT) -->
<!-- API_CONTRACT assign_user_role(UUID,TEXT) -->
<!-- API_CONTRACT redeem_voucher(TEXT) -->
<!-- API_CONTRACT create_reservation_hold(UUID,UUID,INT,TEXT,TEXT,TEXT,INT) -->
<!-- API_CONTRACT confirm_reservation_hold(UUID) -->

## `current_user_role()`

Helper de autorización. Devuelve el nombre del rol autenticado; no reemplaza aislamiento por organización/recurso.

## `verify_voucher(TEXT)`

Valida un token y devuelve información pública operacional. Es lectura/verificación, no redención.

## `search_availability(DATE, TEXT, INT)`

Filtra fecha, ruta/origen/destino y capacidad mínima antes de `LIMIT 50`. Es `SECURITY INVOKER`, por lo que conserva RLS del caller.

## `create_reservation(UUID, UUID, INT, TEXT, TEXT)`

Flujo confirmado existente usado por la UI agency. Bloquea disponibilidad, valida cupos/agencia, calcula importe/comisión, reduce inventario y crea voucher/auditoría de forma atómica.

O2 no elimina este RPC: añade un lifecycle separado de hold/confirmación. El siguiente frente debe migrar progresivamente el journey hacia `hold → payment state → confirm` sin inferir dinero cobrado desde la reserva.

## `create_reservation_hold(UUID, UUID, INT, TEXT, TEXT, TEXT, INT)`

Crea un hold `held` con expiración y clave idempotente por usuario. Bloquea disponibilidad, libera holds vencidos de la salida y rechaza la misma clave con payload distinto. No emite voucher ni representa pago.

## `confirm_reservation_hold(UUID)`

Confirma un hold vigente y autorizado y emite un único voucher en la misma transacción. Un hold vencido no puede confirmarse. El frente de pagos debe endurecer la transición financiera alrededor de este contrato sin mover autoridad al cliente.

## `cancel_reservation(UUID)`

Cancela y devuelve cupos validando ownership dentro del RPC.

## `update_availability_seats(UUID, INT)`

Ajusta cupos; operadores solo modifican disponibilidad de su propia flota y admin conserva alcance global.

## `assign_user_role(UUID, TEXT)`

Aprovisiona roles operativos para un perfil existente. Solo admin; el cambio se audita.

## `redeem_voucher(TEXT)`

Redime de forma atómica para admin/operator autorizado, valida ownership, bloquea la fila, rechaza estados inválidos o doble uso y persiste redención + auditoría.

## Cambio de contrato

Cualquier cambio de firma debe modificar este archivo en el mismo PR. CI falla si los `GRANT EXECUTE` y estos marcadores divergen.
