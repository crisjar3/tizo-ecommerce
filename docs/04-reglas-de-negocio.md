# 04 — Reglas de negocio

Reglas numeradas y verificables. Cada una debe poder traducirse a un test.

> **Sobre la numeración.** Los identificadores `RN-` y `CA-` son **estables**: se asignan una vez
> y no se reordenan al incorporar reglas nuevas. Por eso RN-26 a RN-28 viven en la primera
> sección y CA-16 entre los rechazos. Renumerar rompería las referencias cruzadas de este
> documento y de los tests.

## Cancelabilidad

| ID | Regla |
|---|---|
| **RN-01** | Una línea es cancelable si y solo si: **(a)** `order.dispatched_at IS NULL`, **(b)** su estado no es `CANCELLED`, y **(c)** la orden no tiene una cancelación efectiva previa (RN-26). |
| **RN-02** | Si la orden ya fue despachada, la solicitud completa se rechaza con `ORDER_ALREADY_DISPATCHED`. **Ninguna línea se modifica**: el rechazo es total, no parcial. |
| **RN-03** | Si una solicitud referencia la misma línea más de una vez, se **deduplica** sin error. El monto se cuenta una sola vez. |
| **RN-04** | La cancelación opera sobre la **línea completa**. `quantity` es inmutable después del pago. |
| **RN-05** | Una solicitud debe afectar al menos una línea cancelable. Si ninguna lo es, se rechaza con `NO_CANCELLABLE_ITEMS`. |
| **RN-06** | El motivo (`reason_code`) es obligatorio. Si es `OTHER`, `reason_note` también. |
| **RN-26** | **Una orden admite una sola cancelación efectiva.** Puede abarcar varias líneas en una misma operación, pero una vez efectivizada no se acepta otra. Un segundo intento se rechaza con `ORDER_ALREADY_HAS_CANCELLATION`. |
| **RN-27** | Una solicitud `REJECTED` **no consume** la cancelación de la orden. Solo las efectivas (`APPROVED` / `COMPLETED`) la bloquean. |
| **RN-28** | Reenviar la **misma** solicitud (igual `idempotency_key`) devuelve el resultado original sin efectos nuevos, y **no** se trata como segundo intento. |

> **Sobre RN-01 — por qué el timestamp y no el estado.** La condición se evalúa contra
> `dispatched_at`, **nunca** contra `fulfillment_status`. Escrita como
> `fulfillment_status != DISPATCHED`, una orden `DELIVERED` la pasaría: el estado sigue avanzando
> después del despacho y deja de ser `DISPATCHED`. El timestamp es monótono —una vez seteado no
> vuelve a ser nulo— y cubre todo lo que ocurra después del punto de no retorno sin enumerar
> estados.
>
> **Principio general:** las condiciones de irreversibilidad se evalúan contra **hechos**
> (timestamps), no contra **estados** (enums). Un hecho registra que algo ocurrió y eso no se
> deshace; un estado registra dónde está ahora y sigue cambiando.

> **Sobre RN-02.** El rechazo es de la solicitud entera y no línea por línea porque el punto de
> no retorno es del paquete, no del producto: si el paquete salió, salió con todo adentro.

> **Sobre RN-26 — una sola cancelación por orden.** La restricción es operativa: cada
> cancelación dispara trabajo físico en tiendas y hub (liberar stock, interceptar en recepción,
> desarmar un consolidado). Permitir cancelaciones encadenadas sobre un pedido en preparación
> multiplica instrucciones superpuestas sobre el mismo paquete, y esa coordinación no la
> resuelve el software.
>
> El operador **sí puede cancelar varias líneas a la vez**, de tiendas distintas, en una sola
> operación. Lo que no puede es volver más tarde.

> **Contra qué se valida RN-26.** Contra la **existencia de una `cancellation_request` efectiva**
> para esa orden, no contra `cancellation_status`:
>
> ```sql
> NOT EXISTS (SELECT 1 FROM cancellation_request
>             WHERE order_id = ? AND status IN ('APPROVED', 'COMPLETED'))
> ```
>
> La diferencia no es cosmética. `cancellation_status` es un campo **derivado y materializado**;
> validar contra él implica decidir sobre una copia que podría estar desincronizada. La
> existencia de una fila es un **hecho**. Mismo principio que RN-01: las condiciones de
> irreversibilidad se evalúan contra hechos, nunca contra estados derivados.

> **Qué sigue sin ser una guarda.** No hace falta bloquear explícitamente cuando todas las
> líneas ya están canceladas: eso ya lo cubren RN-03 y RN-05 (`NO_CANCELLABLE_ITEMS`). Con
> RN-26 vigente ese camino además es inalcanzable en la práctica, porque la primera cancelación
> ya bloquea la orden.

### Orden de validación

Las guardas se evalúan en este orden, y **el primer fallo corta**:

```
1. idempotency_key ya vista        → devolver resultado original   (RN-28)
2. reason_code presente             → 400 de validación             (RN-06)
3. dispatched_at IS NULL            → ORDER_ALREADY_DISPATCHED      (RN-01a)
4. sin cancelación efectiva previa  → ORDER_ALREADY_HAS_CANCELLATION (RN-26)
5. al menos una línea cancelable    → NO_CANCELLABLE_ITEMS          (RN-05)
```

El orden no es arbitrario: va **de lo más específico y accionable a lo más genérico**. Un
operador que recibe `ORDER_ALREADY_HAS_CANCELLATION` sabe exactamente qué pasó; uno que recibe
`NO_CANCELLABLE_ITEMS` sobre la misma orden se queda sin saber por qué.

> **Consecuencia:** con RN-26 vigente, el paso 5 es prácticamente inalcanzable por el camino
> normal —una orden solo puede tener todas sus líneas canceladas si ya hubo una cancelación
> efectiva, que el paso 4 ya bloqueó—. Se conserva como guarda defensiva y para el caso de una
> solicitud que referencie líneas no cancelables por otros motivos.

## Efecto operativo

| ID | Regla |
|---|---|
| **RN-07** | El `operational_effect` se determina por el estado de la línea **al momento de cancelar**, y se congela. Nunca se recalcula. |

| Estado al cancelar | ¿El producto salió de la tienda? | `operational_effect` |
|---|---|---|
| `PENDING` | No | `NO_ACTION` |
| `PREPARING` | No | `STOP_PREPARATION` |
| `READY_FOR_PICKUP` | No | `RELEASE_STOCK` |
| `IN_TRANSIT_TO_HUB` | **Sí** | `INTERCEPT_AT_HUB` |
| `AT_HUB` | **Sí** | `RETURN_TO_STORE` |

> **La devolución física a la tienda ocurre solo en 2 de los 5 casos.** En `PENDING`,
> `PREPARING` y `READY_FOR_PICKUP` el producto nunca salió: no hay nada que devolver, solo se
> libera el stock y no se despacha. Por eso `operational_effect` no es un booleano
> "devolver sí/no", sino cinco instrucciones distintas con costos operativos distintos.

## Montos

| ID | Regla |
|---|---|
| **RN-08** | El monto afectado por cancelar una línea es su `line_total_cents` **congelado**. |
| **RN-09** | **Nunca** se recalculan promociones ni se consulta el catálogo de precios. Los descuentos prorrateados quedan fijados al crear la orden. |
| **RN-10** | El envío solo se considera afectado si la orden pasa a `cancellation_status = FULL`. En cancelación parcial el paquete sale igual, y el envío se incurre igual. |
| **RN-11** | `cancelled_amount_cents ≤ paid_amount_cents`. **Siempre.** Es la invariante dura del modelo. |
| **RN-12** | `active_amount_cents = paid_amount_cents − cancelled_amount_cents`, recalculado en la misma transacción. |
| **RN-13** | Toda aritmética se hace en enteros. El residuo de un prorrateo se asigna a la línea de mayor monto, de modo que la suma de las partes iguale al total. |

> **Sobre RN-09.** Si se recalcularan las promociones, un cliente que compró con "10 % en toda
> la orden" podría, al cancelarse una línea, perder el descuento sobre lo que conserva y quedar
> debiendo más de lo que ya pagó. El descuento se congela y se devuelve la porción proporcional.

## Estados derivados

| ID | Regla |
|---|---|
| **RN-14** | `cancellation_status` se **deriva** del conjunto de líneas. No existe setter público. |
| **RN-15** | `fulfillment_status` se deriva de la línea **viva** más atrasada. Las canceladas se excluyen del cálculo. |
| **RN-16** | No pueden coexistir `cancellation_status = FULL` con `fulfillment_status` en `READY_TO_DISPATCH` o `DISPATCHED`. Una orden sin líneas vivas no se despacha. |
| **RN-17** | Recalcular estados y montos ocurre siempre al cierre de la misma transacción que modificó las líneas. |

> **Consecuencia deliberada de RN-15.** Cancelar precisamente la línea que retrasaba al resto
> puede hacer **avanzar** la orden a `READY_TO_DISPATCH`. No es un efecto secundario: es el
> comportamiento correcto, y tiene su propio caso de aceptación.

## Concurrencia, transacción y auditoría

| ID | Regla |
|---|---|
| **RN-18** | La operación completa —validar, cancelar líneas, recalcular, auditar— ocurre en **una única transacción**. |
| **RN-19** | Se usa optimistic locking (`version`) sobre la orden. Dos cancelaciones concurrentes: una gana, la otra falla y se reintenta con estado fresco. |
| **RN-20** | El índice único sobre `cancellation_request_item(order_item_id)` garantiza a nivel base de datos que una línea no se cancele dos veces. |
| **RN-21** | Toda transición escribe en `audit_log` con `payload_before`, `payload_after` y el `correlation_id` compartido por la operación. |
| **RN-22** | `audit_log` es append-only. Sin `UPDATE`, sin `DELETE`. |

## Visibilidad

| ID | Regla |
|---|---|
| **RN-23** | El cliente ve **un solo estado por orden**. Los estados por línea, el hub y las tiendas no se exponen. |
| **RN-24** | El hecho de que una línea fue cancelada **sí** es visible para el cliente, junto con su monto. |
| **RN-25** | El endpoint de cliente no devuelve estados internos en ningún campo del payload. |

---

# Criterios de aceptación

Escritos como escenarios. Son la base directa de los tests del núcleo.

## Caminos felices

**CA-01 — Cancelación parcial simple**
> **Dado** una orden pagada con 3 líneas, todas en `PENDING`, y `dispatched_at` nulo
> **Cuando** Operaciones cancela 1 línea con motivo `OUT_OF_STOCK`
> **Entonces** esa línea queda `CANCELLED`, la orden queda `cancellation_status = PARTIAL`,
> `cancelled_amount_cents` iguala el `line_total_cents` de esa línea, y las otras 2 no se tocan.

**CA-02 — Cancelación de líneas de tiendas distintas**
> **Dado** una orden con líneas de las tiendas A, B y C
> **Cuando** se cancelan la línea de A y la de C en una sola solicitud
> **Entonces** ambas quedan `CANCELLED`, la de B permanece intacta, y `cancelled_amount_cents`
> es la suma de las dos.

**CA-03 — Cancelación total**
> **Dado** una orden con 2 líneas
> **Cuando** se cancelan ambas
> **Entonces** `cancellation_status = FULL`, `active_amount_cents = 0`, y el envío se suma al
> monto afectado (RN-10).

**CA-04 — Cancelar la línea rezagada hace avanzar la orden**
> **Dado** una orden con 3 líneas: dos en `AT_HUB` y una en `PREPARING`
> **Y** la orden en `AWAITING_STORES`
> **Cuando** se cancela la línea en `PREPARING`
> **Entonces** la orden pasa a `READY_TO_DISPATCH` (RN-15).

**CA-05 — Reintento de la misma solicitud (idempotencia de transporte)**
> **Dado** una cancelación ya efectivizada con `idempotency_key = K`
> **Cuando** llega otra solicitud con la **misma** `K` —doble clic, retry por timeout—
> **Entonces** se devuelve el resultado original, no se producen efectos nuevos,
> `cancelled_amount_cents` no cambia, y **no** se responde `ORDER_ALREADY_HAS_CANCELLATION`
> (RN-28).

**CA-06 — Efecto operativo según estado**
> **Dado** líneas en `PENDING`, `IN_TRANSIT_TO_HUB` y `AT_HUB`
> **Cuando** se cancelan las tres
> **Entonces** cada `cancellation_request_item` registra `NO_ACTION`, `INTERCEPT_AT_HUB` y
> `RETURN_TO_STORE` respectivamente.

## Rechazos

**CA-07 — Orden ya despachada**
> **Dado** una orden con `dispatched_at` no nulo y `fulfillment_status = DISPATCHED`
> **Cuando** se intenta cancelar cualquier línea
> **Entonces** se rechaza con `ORDER_ALREADY_DISPATCHED`, la solicitud queda `REJECTED`
> y **ninguna línea cambia de estado**.

**CA-08 — Orden ya entregada (test de regresión de RN-01)**
> **Dado** una orden con `dispatched_at` no nulo y `fulfillment_status = DELIVERED`
> **Cuando** se intenta cancelar cualquier línea
> **Entonces** se rechaza con `ORDER_ALREADY_DISPATCHED`.
>
> Este caso existe específicamente para atrapar la regla mal escrita. Una validación contra
> `fulfillment_status != DISPATCHED` **pasaría** este escenario y dejaría cancelar un pedido
> que el cliente ya tiene en la mano. Si este test se pone verde por accidente, la regla se
> escribió contra el enum.

**CA-09 — Línea duplicada en la misma solicitud**
> **Dado** una solicitud cuyo payload referencia la línea A dos veces y la línea B una vez
> **Cuando** se procesa
> **Entonces** se cancelan 2 líneas —no 3—, y `cancelled_amount_cents` cuenta el monto de A una
> sola vez (RN-03).

**CA-10 — Precedencia de validaciones**
> **Dado** una orden que ya tiene una cancelación efectiva **y** todas sus líneas en `CANCELLED`
> **Cuando** se intenta una nueva cancelación con clave nueva
> **Entonces** el rechazo es `ORDER_ALREADY_HAS_CANCELLATION`, **no** `NO_CANCELLABLE_ITEMS`.
>
> Ambas condiciones se cumplen a la vez; el orden de validación decide cuál se informa. Gana la
> más específica, porque es la que le dice al operador qué ocurrió realmente.

**CA-11 — Motivo ausente**
> **Cuando** se envía una solicitud sin `reason_code`
> **Entonces** se rechaza con error de validación y no se crea la solicitud.

**CA-16 — Segunda cancelación sobre la misma orden**
> **Dado** una orden con una cancelación efectiva previa y líneas todavía vivas
> **Cuando** Operaciones intenta cancelar otra línea con una `idempotency_key` **nueva**
> **Entonces** se rechaza con `ORDER_ALREADY_HAS_CANCELLATION`, ninguna línea cambia de estado
> y la solicitud queda `REJECTED` (RN-26).
>
> Contrastar con CA-05: misma clave es un reintento, clave nueva es un segundo intento. La
> distinción es lo único que separa un doble clic de una violación de regla.

## Invariantes

**CA-12 — Nunca se supera lo cobrado**
> **Para cualquier** secuencia de cancelaciones sobre una orden
> **Entonces** `cancelled_amount_cents ≤ paid_amount_cents` se mantiene en todo momento (RN-11).

**CA-13 — Estado imposible**
> **Cuando** `cancellation_status = FULL`
> **Entonces** `fulfillment_status` nunca es `READY_TO_DISPATCH` ni `DISPATCHED` (RN-16).

**CA-14 — Trazabilidad completa**
> **Dado** una cancelación de 2 líneas
> **Entonces** existen eventos de auditoría para la solicitud, para cada línea, para el recálculo
> de montos y para el de estados, **todos con el mismo `correlation_id`**, y cada uno con
> `payload_before` y `payload_after`.

**CA-15 — Concurrencia**
> **Dado** dos solicitudes simultáneas sobre la misma orden tocando la misma línea
> **Entonces** exactamente una tiene éxito. La otra falla por optimistic locking o por violación
> del índice único, sin dejar estado inconsistente.
