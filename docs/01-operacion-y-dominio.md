# 01 — Operación y dominio

## El modelo operativo

El cliente compra productos de varias tiendas en una sola operación. No recibe varios paquetes:
recibe **uno solo**. Para lograrlo, la entrega ocurre en dos tramos.

```
  Tienda A ──┐
             │
  Tienda B ──┼──►  HUB DE CONSOLIDACIÓN  ──────►  Cliente
             │      (recibe, verifica,
  Tienda C ──┘       arma el paquete)

     TRAMO 1                                      TRAMO 2
  (invisible al cliente)                      (visible al cliente)
```

Esta separación es la que gobierna todo el diseño:

- **Tramo 1 — Tienda → Hub.** Cada línea de la orden avanza por su cuenta. Una tienda puede
  entregar en el día y otra demorar tres. El estado de cada línea describe únicamente este tramo.
- **Tramo 2 — Hub → Cliente.** Existe un solo envío, que arranca cuando **todas** las líneas
  vivas llegaron al hub. Este tramo pertenece a la orden, no a la línea.

### Consecuencias

**El paquete avanza al ritmo de la línea más atrasada.** Si dos tiendas ya entregaron y una
sigue preparando, no hay nada que despachar. El estado de la orden lo determina el ítem vivo
más rezagado.

**La ventana de cancelación es amplia.** Mientras el paquete no salga del hub, cancelar una
línea es una operación interna: el producto vuelve a su tienda y el cliente jamás se entera de
que existió. Esto amplía considerablemente la ventana respecto de un modelo de envío directo.

**El cliente no percibe la estructura.** No sabe que hay un hub, ni cuántas tiendas participan,
ni cuál lo está demorando. Ve una orden y un estado.

## Actores

| Actor | Rol | Actúa en este alcance |
|---|---|---|
| **Cliente** | Compra y recibe. Consulta el estado de su orden. | No. Solo lectura. |
| **Operaciones (`OPS`)** | Back-office del marketplace. Inicia y ejecuta cancelaciones. | **Sí. Es el actor principal.** |
| **Tienda (`Store`)** | Prepara y despacha al hub. Recibe reversiones. | No en el sistema. Recibe la tarea. |
| **Hub** | Recibe, verifica, consolida y despacha al cliente. | No en el sistema. Recibe la tarea. |

Solo Operaciones opera sobre el sistema en este alcance. Tiendas y hub **reciben el efecto**
de una cancelación como tarea operativa, pero su ejecución física queda fuera del software.

## Glosario

| Término | Significado |
|---|---|
| **Orden** | La compra completa del cliente. Contiene líneas de varias tiendas. |
| **Línea / `OrderItem`** | Un producto de una tienda dentro de la orden, con su cantidad y montos congelados. |
| **Hub** | Centro de consolidación. Reúne los productos de todas las tiendas. |
| **Despacho** | Salida del paquete consolidado hacia el cliente. Punto de no retorno. |
| **Línea viva** | Línea no cancelada. |
| **Cancelación** | Anular una línea antes del despacho. Sin logística inversa hacia el cliente. |
| **Devolución** | El cliente ya recibió y devuelve. Proceso distinto, fuera de alcance. |
| **Efecto operativo** | Acción física que dispara una cancelación, según dónde esté la línea. |

## Flujo operativo end-to-end

```
1. El cliente paga.                          → Orden creada, ya pagada.
2. Cada tienda prepara sus líneas.           → Líneas avanzan de forma independiente.
3. Cada tienda envía al hub.                 → Línea: IN_TRANSIT_TO_HUB.
4. El hub recibe y verifica.                 → Línea: AT_HUB.
5. Cuando todas las líneas vivas están       → Orden: READY_TO_DISPATCH.
   en el hub, el paquete queda listo.
6. El hub despacha.                          → Orden: DISPATCHED. Punto de no retorno.
7. El cliente recibe.                        → Orden: DELIVERED.
```

## Flujo de cancelación parcial

```
1. Operaciones abre la orden y ve sus líneas con estado.
2. Selecciona una o más líneas y registra un motivo.
3. El sistema valida que la orden no esté despachada
   y que no tenga una cancelación efectiva previa.
4. Por cada línea, determina el efecto operativo según su estado.
5. Marca las líneas como CANCELLED y congela el monto afectado.
6. Recalcula los estados derivados de la orden.
7. Registra la operación completa en auditoría con un correlation id común.
```

> **Una orden admite una sola cancelación.** El operador debe seleccionar de una vez todas las
> líneas que quiera cancelar: no hay una segunda oportunidad. La restricción existe porque cada
> cancelación genera una orden de trabajo física para tiendas y hub, y encadenar varias sobre un
> mismo paquete en preparación vuelve la coordinación inmanejable.
>
> Esto tiene una implicancia directa en la interfaz: **la pantalla debe dejar claro que la
> selección es definitiva** antes de confirmar.

Todo el paso 3 al 7 ocurre dentro de **una única transacción**. No hay sistemas externos
involucrados, por lo que la atomicidad está garantizada por la base de datos.

## Qué pasa físicamente al cancelar

El estado de la línea no decide **si** se puede cancelar —antes del despacho siempre se puede—
sino **qué acción física** dispara la cancelación:

| Estado de la línea | ¿Salió de la tienda? | Efecto operativo | Costo |
|---|---|---|---|
| `PENDING` | No | Ninguno. La tienda simplemente no la prepara. | Nulo |
| `PREPARING` | No | La tienda detiene la preparación y repone stock. | Bajo |
| `READY_FOR_PICKUP` | No | La tienda repone stock y no la despacha al hub. | Bajo |
| `IN_TRANSIT_TO_HUB` | **Sí** | Se intercepta en la recepción del hub y se devuelve. | Medio |
| `AT_HUB` | **Sí** | Se extrae del consolidado y se reenvía a su tienda. | Alto |

Un solo motivo de rechazo (paquete ya despachado), pero cinco efectos operativos distintos.
Esta tabla se materializa en el campo `operational_effect`, que es lo que tienda y hub reciben
como instrucción concreta.

**El producto vuelve físicamente a la tienda solo en los dos últimos casos.** En los tres
primeros nunca salió: no hay logística inversa, solo stock que se libera y un despacho que no
ocurre. Esa distinción es la que separa una cancelación gratuita de una costosa, y es la razón
por la que el efecto se congela al momento de cancelar en lugar de derivarse después.
