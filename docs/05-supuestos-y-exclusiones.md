# 05 — Supuestos, preguntas y exclusiones

## Supuestos asumidos

Decisiones tomadas ante ambigüedad del enunciado. Cada una es reversible, pero está tomada
de forma explícita.

| # | Supuesto | Fundamento |
|---|---|---|
| **S-01** | La orden entra al sistema **ya pagada**. Carrito, checkout y captura del pago quedan fuera. | El enunciado dice literalmente *"una orden ya pagada"*. |
| **S-02** | El cliente realiza **un único pago al marketplace**, que luego liquida a las tiendas. No hay split payment. | Decisión operativa. Colapsa el problema del dinero a un solo movimiento. |
| **S-03** | La liquidación a tiendas ocurre por fecha de corte y **solo alcanza líneas en estado terminal**. | Hace estructuralmente imposible liquidar algo que después se cancele. |
| **S-04** | Existe **un solo envío consolidado por orden**, desde el hub. | Modelo operativo definido: el hub arma un paquete único. |
| **S-05** | La cancelación opera sobre la **línea completa**. No hay cancelación parcial de cantidad. | El enunciado habla de *"selección de ítems"*, no de cantidades. |
| **S-06** | Solo el rol `OPS` origina cancelaciones **en el slice**. El endpoint de solicitud queda diseñado para que el cliente lo invoque a futuro sin cambiar la lógica. | El enunciado dice *"Operaciones necesita cancelar"*. El portal del cliente es superficie adicional, no lógica adicional. |
| **S-07** | El flujo tiene **dos pasos** —solicitar (F-03) y resolver (F-05)— ejecutados por `OPS` en el slice. | Separar pedir de resolver permite que mañana el cliente pida sin darle poder de escritura sobre el dominio. Ver doc 06. |
| **S-08** | Los precios se almacenan **con IVA incluido**, desglosado y congelado por línea al crear la orden. | Convención habitual en la región. El desglose permite reportar el impuesto afectado. |
| **S-09** | Una orden opera en **una sola moneda**. | Simplificación razonable; no hay caso de negocio multi-moneda planteado. |
| **S-10** | No existe ventana temporal de cancelación. El único límite es el despacho. | Se deriva del modelo de consolidación: antes del despacho, todo es logística interna. |
| **S-11** | La reposición de stock la ejecuta la tienda al recibir la instrucción. El sistema registra el efecto, no lo ejecuta. | El inventario de cada tienda es un sistema externo fuera de alcance. |
| **S-12** | El motivo de cancelación se toma de un catálogo acotado, no de texto libre. | Permite medir por qué se cancela. El texto libre no se agrega ni se grafica. |
| **S-13** | Una orden admite **una sola cancelación efectiva**, que puede abarcar varias líneas de varias tiendas. | Cada cancelación dispara trabajo físico en tiendas y hub. Encadenar varias sobre un pedido en preparación multiplica instrucciones superpuestas sobre el mismo paquete. |

---

## Preguntas para Producto

Ambigüedades reales que quedaron abiertas. Están resueltas por supuesto, pero deberían
confirmarse antes de ir a producción.

### Sobre quién puede cancelar

1. **¿El cliente podrá autogestionar cancelaciones**, o queda siempre mediado por Operaciones?
   Cambia por completo el modelo de permisos y agrega necesidad de validación antifraude.
2. **¿Existe un umbral de monto** por encima del cual la cancelación requiera aprobación de un
   supervisor? Es un control interno habitual y hoy no existe.
3. **¿La tienda tiene derecho a veto** cuando ya invirtió trabajo en preparar el pedido, o el
   marketplace decide unilateralmente?

### Sobre las reglas

4. **¿Hay categorías con reglas distintas?** Productos personalizados, perecederos o de
   fabricación bajo pedido difícilmente puedan cancelarse una vez iniciada la preparación.
5. **¿Se puede interceptar un envío ya despachado?** Algunos operadores logísticos lo permiten.
   Si se habilitara, el punto de no retorno se correría.
6. **¿Qué ocurre si la cancelación rompe una condición promocional?** Ejemplo: el cliente tenía
   envío gratis por superar un mínimo, y al cancelar una línea queda por debajo. Hoy se asume
   que **no se recalcula** (RN-09), pero es una decisión de negocio, no técnica.
7. **¿Una cancelación se puede revertir?** Operaciones se equivoca. Hoy no hay "deshacer": la
   salida es crear una orden nueva.
8. **⚠️ ¿Es aceptable admitir una sola cancelación por orden (S-13)?** Es la restricción más
   fuerte del alcance y tiene un escenario incómodo conocido: **las tiendas no coordinan entre
   sí sus problemas de inventario**. Si la tienda A avisa el lunes que no tiene stock y la
   tienda B avisa el martes, la segunda cancelación se rechaza y Operaciones queda sin
   herramienta.
   - **Salidas actuales:** cancelar la orden completa, o esperar a que el paquete se despache y
     tramitarlo como devolución (fuera de alcance).
   - **Alternativa si el negocio lo requiere:** permitir N cancelaciones pero con una ventana de
     consolidación —por ejemplo, agrupar todas las solicitudes de un mismo día en una sola
     instrucción operativa—. Conserva el beneficio (una sola orden de trabajo al hub) sin la
     restricción rígida.
   - **Riesgo asumido:** medio. Documentado a propósito, no descubierto tarde.

### Sobre la experiencia

9. **¿Se notifica al cliente al cancelar?** ¿Por qué canal y con qué inmediatez?
10. **¿Existe un SLA para el efecto operativo?** Cuánto tiene el hub para extraer un producto ya
    consolidado antes de que el retraso afecte al resto del paquete.
11. **¿Se necesitará cancelación parcial de cantidad a futuro?** Hoy está descartada. Si el
    negocio la requiere, el modelo de datos cambia de forma no trivial.

---

## Fuera de alcance

Excluido de forma deliberada. Cada exclusión lleva su motivo.

| Excluido | Motivo |
|---|---|
| **Devoluciones / RMA** | Proceso distinto: el cliente ya recibió el producto. Requiere logística inversa, inspección y ventana temporal. No es cancelación. |
| **Ejecución del reembolso** | El enunciado pide *"recalcular totales / montos afectados"*, no ejecutar el movimiento de dinero. Se calcula y se registra; no se llama a ningún PSP. |
| **Cancelación parcial de cantidad** | Rompe el estado único por línea: 3 unidades podrían estar `AT_HUB` y 2 `CANCELLED` simultáneamente. Duplica la complejidad del núcleo. **Salida manual:** cancelar la línea completa y generar una orden nueva por el remanente. |
| **Motor de liquidación a tiendas** | El cálculo del impacto está expresado vía `commission_cents`, pero construir el motor de payouts excede el alcance. Un ledger a medias es peor que ninguno. |
| **Clawback posterior al corte** | **Imposible por diseño**, no excluido por tiempo: solo se liquida lo terminal, y lo terminal no es cancelable. |
| **Carrito, checkout y captura de pago** | La orden entra pagada. |
| **Envíos parciales / entidad `Shipment`** | Hay un solo envío por orden. `order.dispatched_at` alcanza. Si el negocio incorpora envíos parciales, ahí nace la entidad — y no antes. |
| **Multi-moneda** | Una moneda por orden. Sin caso de negocio planteado. |
| **Aprobación multinivel** | Un solo paso. La máquina de estados deja el hueco (`REQUESTED` → `APPROVED`) para incorporarlo sin rediseño. |
| **Notificaciones al cliente** | Fuera del núcleo de reglas. |
| **Cancelaciones sucesivas sobre una orden** | Una orden admite una sola cancelación efectiva (S-13). Encadenar varias multiplica instrucciones operativas superpuestas sobre el mismo paquete. **Salida:** agrupar todas las líneas a cancelar en una única operación. Ver pregunta 8 para el riesgo asumido. |
| **Reversión de cancelación (undo)** | No hay caso de uso confirmado. La cancelación es terminal. |
| **Event sourcing** | Desproporcionado para este alcance. Estado actual en tablas + log de auditoría en paralelo. |

---

## Plan de rollback

### Qué pasa si falla a mitad de la operación

**Toda la operación ocurre dentro de una única transacción de base de datos.** Validación,
marcado de líneas, recálculo de montos, recálculo de estados y escritura de auditoría se
confirman juntos o no se confirma nada.

```
BEGIN
  1. Cargar orden + líneas con optimistic lock
  2. Validar RN-01 … RN-06        ── si falla → REJECTED, sin cambios
  3. Marcar líneas CANCELLED
  4. Congelar montos y operational_effect
  5. Recalcular montos de orden
  6. Recalcular estados derivados
  7. Escribir eventos de auditoría
COMMIT
```

Un fallo en cualquier paso revierte todo. **No existen estados intermedios persistidos**: no es
posible que una línea quede cancelada con la orden sin recalcular.

### Por qué es tan simple, y cuándo dejaría de serlo

Es simple **porque no hay side effects externos**. Al quedar la ejecución del reembolso fuera
de alcance, no interviene ningún sistema que no esté bajo la transacción.

Si se incorporara el reembolso real, este plan **no serviría**: no se puede hacer rollback de un
PSP. Habría que separar decisión de efecto:

1. Transacción local: cancelar líneas, crear `Refund` en `PENDING`. Commit.
2. Fuera de la transacción: llamar al PSP con *idempotency key*.
3. Actualizar el resultado.
4. Si falla → `MANUAL_REVIEW` y alerta. **No se revierte la cancelación**, porque el producto
   ya no se va a despachar. El dinero se reconcilia aparte.

Se documenta aquí para dejar constancia de que la simplicidad actual es consecuencia del
alcance elegido, no un descuido.

### Concurrencia

Dos operadores cancelando la misma orden simultáneamente:

- **Optimistic locking** sobre `customer_order.version`: la segunda transacción falla al hacer
  commit y se reintenta con estado fresco.
- **Índice único** sobre `cancellation_request_item(order_item_id)`: última línea de defensa
  a nivel base de datos si la validación de aplicación fuera insuficiente.

En ningún escenario una línea se cancela dos veces ni el monto se cuenta doble.

### Reintentos del cliente

La cancelación es **idempotente por línea** (RN-03). Si la UI reenvía la solicitud por timeout
o doble clic, las líneas ya canceladas se ignoran y los montos no se duplican.
