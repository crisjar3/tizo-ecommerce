# Refinamiento — Cancelación parcial de órdenes

Documentación de refinamiento previa a la implementación. Recoge el modelo operativo, las
máquinas de estado, el esquema de datos, las reglas de negocio y las decisiones de alcance.

## Resumen ejecutivo

Un marketplace multi-tienda donde el cliente realiza **una compra a varias tiendas** y recibe
**un único paquete**. Las tiendas envían sus productos a un centro de consolidación (hub), que
arma el envío final.

El caso a resolver: **Operaciones necesita cancelar parte de una orden ya pagada** —una o más
líneas, no necesariamente todas— de forma consistente, auditable y con recálculo correcto de
los montos afectados.

La decisión central del diseño es que la cancelación permanece disponible **hasta que el paquete
consolidado sale del hub**. Antes de ese punto, cancelar es logística interna que el cliente
nunca percibe. Después, ya no es una cancelación: es una devolución, y queda fuera de alcance.

## Índice

| Documento | Contenido |
|---|---|
| [01 — Operación y dominio](01-operacion-y-dominio.md) | Modelo operativo, actores, glosario, flujo end-to-end |
| [02 — Máquinas de estado](02-maquinas-de-estado.md) | Estados internos, proyección al cliente, transiciones |
| [03 — Modelo de datos](03-modelo-de-datos.md) | Esquema, entidades, tipos, índices |
| [04 — Reglas de negocio](04-reglas-de-negocio.md) | Reglas numeradas, invariantes, criterios de aceptación |
| [05 — Supuestos y exclusiones](05-supuestos-y-exclusiones.md) | Supuestos, preguntas a Producto, fuera de alcance, rollback |
| [06 — Flujos](06-flujos.md) | Pantallas, recorridos, efectos, eventos y qué entra en el slice |
| [07 — Plan de pantallas](07-plan-de-pantallas.md) | Rutas, contenido, estados, edge cases y orden de construcción |

## Decisiones de alcance en una tabla

| Decisión | Valor |
|---|---|
| Unidad de cancelación | Línea completa. No hay cancelación parcial de cantidad. |
| Cancelaciones por orden | **Una sola.** Puede abarcar varias líneas, pero no se repite. |
| Punto de no retorno | Despacho del paquete consolidado desde el hub. |
| Ejecución de reembolso | **Fuera de alcance.** Se calculan montos, no se mueve dinero. |
| Devoluciones (RMA) | **Fuera de alcance.** Proceso distinto, requiere logística inversa. |
| Modelo de cobro | Pago único al marketplace, liquidación diferida a las tiendas. |
| Aprobación | Un solo paso. El rol `OPS` ejecuta y queda auditado. |
| Vista del cliente | Un único estado por orden. El hub y los estados por ítem son invisibles. |

## Convención de idioma

La prosa de estos documentos está en español porque el enunciado y la evaluación lo están.
Los identificadores —tablas, columnas, enums, clases— están en inglés, como corresponde al
código.
