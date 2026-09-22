# Módulo Operator

**Código:** `src/app/operator`, `src/components/operator`.

Responsabilidad actual: operar cupos de embarcaciones propias y redimir vouchers online asociados a su flota.

## Estado integrado

- ownership de embarcaciones y recursos derivados está validado por RLS/RPC;
- disponibilidad se modifica mediante RPC autoritativo;
- un operador no puede leer/mutar reservas o vouchers de otra flota;
- `/operator/redeem` verifica y redime mediante `redeem_voucher(TEXT)`;
- doble uso y concurrencia de redención están cubiertos por integración;
- Critical E2E valida login operator → redención → segundo intento bloqueado.

## Deuda operativa

- creación completa de salidas;
- manifiesto de pasajeros;
- check-in operacional;
- scanner de cámara;
- modelo multiempresa de operador más allá de `vessels.owner_id`;
- offline y reconciliación posterior.

## Invariantes

- operador solo ve/modifica recursos asignados;
- inventario y redención se resuelven server-side;
- acciones sensibles se auditan;
- UI móvil/táctil es prioritaria;
- scanner/offline futuro no puede crear una segunda fuente de verdad.
