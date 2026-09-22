# Trabajo actual

Este documento define el siguiente frente de trabajo sobre `dev`.

**Base verificada:** `dev@0ec24edb65015e43efbe5886467a7306ccc71ff8`  
**Último hito integrado:** O2/C3.1 holds e idempotencia, PR #10.  
**Integración Supabase:** 38/38 pruebas verdes.  
**Siguiente frente:** **C3.1 — Payments & Booking Lifecycle**.

## Rama recomendada

Crear desde `dev` actualizado:

```bash
git switch dev
git pull origin dev
git switch -c feature/c3-payment-ledger
```

Nunca trabajar directamente sobre `dev` ni abrir una feature directamente hacia `main`.

## Objetivo

Separar de forma autoritativa **reserva** y **dinero cobrado**. El sistema ya tiene holds expirables e idempotentes y confirmación transaccional; todavía no tiene ledger de pagos ni conciliación.

El flujo objetivo es:

```text
disponibilidad
→ hold
→ pago aprobado/conciliado
→ confirmación
→ voucher
→ redención
```

## Alcance mínimo

1. Diseñar un ledger de pagos separado de `reservations.total_price`.
2. Definir estados de pago y conciliación sin inferirlos desde el estado de reserva.
3. Añadir idempotencia para registrar/reconciliar pagos y evitar cobros/eventos duplicados.
4. Mantener PostgreSQL como autoridad para confirmación y transición de estado.
5. Preparar/adoptar el flujo UI `hold → payment state → confirm` sin mostrar un pago ficticio como exitoso.
6. Registrar auditoría de transiciones sensibles.
7. Añadir tests positivos/negativos y de repetición/concurrencia cuando aplique.

## Restricción sobre proveedor de pago

No inventar ni simular una integración productiva. Si todavía no existe una decisión explícita de proveedor, el primer slice debe ser **provider-agnostic**: modelo, ledger, estados, idempotencia, reconciliación y contratos server-side. Una integración externa se hace después con credenciales y contrato aprobados.

## Definition of Done

- payment ledger persistente y documentado;
- dinero cobrado separado de total reservado;
- operaciones sensibles server-side y auditables;
- repetición de la misma operación no duplica el pago;
- un usuario/tenant no puede registrar o conciliar pagos ajenos;
- holds vencidos no pueden convertirse en confirmaciones inválidas;
- voucher solo se emite mediante una transición autoritativa permitida;
- integración Supabase verde;
- Production Check y Documentation Quality verdes;
- E2E actualizado cuando el flujo UI cambie;
- BASELINE, CHANGELOG, contratos y docs de módulos sincronizados.

## Fuera de este slice

- scanner de cámara;
- offline-first;
- manifiestos completos;
- reporting avanzado;
- refactor general no relacionado;
- proveedor externo de pagos sin decisión previa.

## Después

Tras cerrar Payments & Booking Lifecycle, priorizar operación de salidas/manifiestos, observabilidad + runbook de deploy/rollback y luego offline-first según el roadmap.