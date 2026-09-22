# Módulo Voucher

**Código:** `src/app/verify`, `src/app/operator/redeem`, `src/components/voucher` y tablas `vouchers`/`voucher_redemptions`.

Baseline: token aleatorio, QR visual con enlace de verificación, asociación con reserva y verificación pública online. La redención operacional autoritativa está disponible para `admin` y `operator`; PDF, reemisión, revocación detallada y offline siguen pendientes.

## Estado S0

La página pública continúa verificando mediante RPC `verify_voucher`. El cliente Supabase del componente ahora se memoiza para conservar una referencia estable entre renders y el efecto declara explícitamente `params.id` y `supabase` como dependencias, eliminando el warning de hooks sin cambiar el contrato público.

El hardening S0 restringe la lectura autenticada de vouchers por ownership cuando participa un operador. La verificación pública mediante token continúa siendo un flujo separado y no equivale a redención.

## Dirección

`ISSUED → REDEEMED`, con `REVOKED/EXPIRED`, tabla append-only de redenciones e idempotencia. QR offline debe ser firmado y contener datos mínimos.

La ruta `/operator/redeem` permite pegar un token o el contenido de un QR, verificar el voucher y confirmar la redención. La cámara todavía no está integrada; escanear el QR puede abrir directamente la verificación pública y el operador puede pegar su URL en la pantalla operacional.

## Invariantes

- verificar no consume un voucher hasta que exista el dominio explícito de redención;
- no exponer PII adicional en el payload público;
- el QR solo codifica la URL pública con el token opaco existente;
- la redención requiere `admin` u `operator`, y el operador debe ser propietario de la embarcación;
- una redención concurrente produce como máximo una fila en `voucher_redemptions`;
- el cliente Supabase usado por efectos debe mantener identidad estable;
- cambios de firma de `verify_voucher` deben actualizar `docs/architecture/api-contracts.md`.
