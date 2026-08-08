# Data Model: Tizo Ecommerce

## Money

- `amountMinor`: entero mayor o igual que cero.
- `currency`: `ARS` en seeds; el contrato acepta ISO-4217.
- Todos los totales se calculan sumando unidades menores.

## Product and Cart

`Product` contiene identidad, nombre, descripción, tienda, SKU, categoría, precio, stock e imagen.
`CartItem` referencia producto y cantidad positiva. `Cart` deriva subtotal, cantidad y total.

## Order

`Order` contiene cliente, fecha de pago, moneda, líneas, total pagado, monto cancelado, monto activo,
`fulfillmentStatus`, `cancellationStatus` y versión de concurrencia.

`OrderItem` congela nombre, SKU, tienda, precio, cantidad y total de línea. Su estado interno sigue:

```text
PENDING -> CONFIRMED -> PREPARING -> AT_HUB -> DISPATCHED -> DELIVERED
    |          |            |          |
    `----------`------------`----------+-> CANCELLED
```

Solo líneas no despachadas pueden cancelarse. La proyección cliente ignora líneas canceladas para
calcular el progreso y toma la línea activa más atrasada.

## CancellationRequest

- Identidad, orden, solicitante y rol.
- Motivo, nota y clave idempotente.
- Items congelados con `itemStatusBefore`, monto y efecto operacional.
- Estado: `REQUESTED`, `APPROVED`, `COMPLETED` o `REJECTED`.
- Resolución: operador, fecha, rejectionCode/note y effectiveOrderId.
- `version` para conflicto optimista.

Transiciones:

```text
REQUESTED -> APPROVED -> COMPLETED
     |
     `----------------> REJECTED
```

El mock aplica `APPROVED` y `COMPLETED` dentro de la misma transacción observable. Notificación y
reembolso conservan estados propios.

## Operator and AuditEvent

`Operator` contiene nombre, iniciales, equipo y presencia. `AuditEvent` registra actor, acción,
entidad, timestamp, correlationId y snapshot mínimo de la transición.

## IdempotencyRecord

Compuesto por alcance, clave, fingerprint del payload, estado HTTP y respuesta original. La misma
clave/fingerprint devuelve la respuesta; una huella diferente produce conflicto.

## MockDatabase

Raíz versionada que contiene productos, carrito, pedidos, solicitudes, operadores, auditoría,
reembolsos e idempotencia. Las mutaciones clonan, validan, aplican y persisten una sola vez.
