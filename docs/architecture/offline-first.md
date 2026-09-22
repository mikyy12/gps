# Arquitectura offline-first objetivo

## Prioridad

Offline no reemplaza al servidor. PostgreSQL sigue siendo fuente de verdad. La prioridad offline del MVP es **ver vouchers, manifiestos y redimir/check-in** cuando la conectividad es intermitente; la venta de último cupo debe permanecer online salvo reserva de inventario preasignada.

## Cliente local

IndexedDB (preferentemente mediante Dexie o capa equivalente) almacenará solo datos necesarios por dispositivo:

- `services_cache`
- `departures_cache`
- `manifest_cache`
- `voucher_cache`
- `redemptions_local`
- `outbox`
- `sync_state`

## Outbox

Toda operación offline crítica incluye `client_action_id` UUID, `device_id`, `operation`, `entity_id`, `payload`, `base_version`, `created_at_local`.

Al recuperar conexión: push outbox → transacción/idempotencia server → ACK → pull de cambios desde cursor → limpieza local.

## Conflictos

| Dato | Estrategia |
|---|---|
| Inventario | servidor transaccional |
| Reserva | servidor autoritativo |
| Pago | append-only + idempotency key |
| Redención | primera redención válida; duplicados a revisión |
| Nota no crítica | merge/LWW controlado |
| Catálogo | versión servidor |

## Validación offline

El QR objetivo contiene payload mínimo firmado asimétricamente (Ed25519): voucher/departure, pasajeros, vigencia, nonce y `kid`. El dispositivo contiene clave pública, nunca privada. La PII no necesaria no entra en QR.

## Doble redención

El scanner registra localmente voucher redimido. Si dos dispositivos redimen offline, servidor conserva primera redención cronológicamente válida y marca el resto `DUPLICATE_REVIEW` para auditoría.

## UX obligatoria

Mostrar siempre `Última sincronización`. Definir umbral de antigüedad operacional con negocio. Un dispositivo offline no debe afirmar información “en tiempo real”.
