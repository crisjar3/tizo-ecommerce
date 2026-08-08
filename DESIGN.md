# Tizo Design System

<!-- impeccable:design-schema 1 -->

## Authority

La identidad visual proviene de Stitch `TizoFlujo` (`projects/4501939678561782320`) y del asset
`assets/5131958129467329374`. Las referencias son evidencia de composición y comportamiento; el
HTML generado no se copia en Angular.

## Mode and Intent

Modo **Operate**. La prioridad es que clientes y operadores completen tareas con precisión. La marca
aparece en la calidez de las superficies, una jerarquía tipográfica firme y estados de dominio que
siempre incluyen texto.

## Tokens

| Token | Valor | Uso |
|---|---|---|
| Fondo | `#f7f7f4` | Superficie general cálida |
| Panel | `#ffffff` | Contenido principal |
| Superficie sutil | `#fafaf8` | Agrupaciones internas |
| Sidebar | `#fbfbf8` | Navegación operacional |
| Borde | `#e8e7e2` | Divisiones de 1 px |
| Texto | `#17171a` | Contenido principal |
| Texto secundario | `#75757d` | Metadatos |
| Acción primaria | `#242427` | Botones principales |
| Acento | `#6356d9` | Foco, icono activo, selección y total económico |
| Advertencia | `#a76714` | Riesgos operacionales |
| Éxito | `#247557` | Confirmaciones |
| Peligro | `#b24338` | Rechazo y errores destructivos |

Fuente: Manrope autohospedada. Radios: 17 px en panel exterior, 14 px en agrupaciones y 10 px en
controles. La elevación usa `0 12px 34px rgba(22,22,20,.035)`; la profundidad depende primero del
contraste de superficies y de bordes cálidos.

## Composition

- Backoffice: sidebar de 226 px y contenido con 24 px de padding.
- Listado y detalle forman un único panel continuo: 414 px para la lista y el resto para detalle,
  sin gap ni sombras independientes.
- Los grupos de métricas usan un contenedor con divisiones internas, no tarjetas repetidas.
- Los drawers miden 505 px y se convierten en página completa en móvil.
- Cliente: cabecera compacta, ancho de lectura controlado y catálogo con jerarquía comercial sin
  abandonar los mismos tokens.

## Components

- Botón primario casi negro, 40 px de alto, radio 10 px y texto blanco.
- Botón secundario blanco con borde cálido.
- Badge semántico en pill únicamente para estados; incluye punto y etiqueta textual.
- Filas de lista de al menos 101 px; la selección usa un lavado violeta sutil y barra inset de 2 px.
- Aviso operacional ámbar con título, explicación y acción concreta.
- Focus ring violeta de 3 px con separación suficiente.

## Responsive

- Desde 1200 px se conserva la composición Stitch.
- Entre 768 y 1199 px la navegación es colapsable y los paneles pueden apilarse.
- Bajo 768 px la navegación usa drawer, las tablas se transforman en listas, las acciones críticas
  quedan visibles y los side sheets ocupan la pantalla.
- Ancho mínimo validado: 360 px.

## Motion and Browser Surfaces

La animación se limita a cambios que explican estructura: apertura de drawer, progreso de pedido y
confirmación de estado. Respeta `prefers-reduced-motion`. Selección de texto, scrollbars, foco,
subrayados y números tabulares heredan los tokens de Tizo.

## Prohibitions

- No usar violeta como relleno de la acción primaria.
- No usar grises fríos, glassmorphism, sombras pesadas ni gradientes decorativos.
- No separar visualmente las dos mitades de un panel de lista/detalle.
- No comunicar estados únicamente con color.
- No usar emoji o caracteres Unicode como iconos de interfaz.
- No convertir cada bloque en una tarjeta independiente.

## Stitch Screen Manifest

| Referencia | Screen ID | Superficie |
|---|---|---|
| 01 · Selección de operador | `802fd47294674a629905ba9c8aec4c8e` | `/operator` |
| 02 · Órdenes — Listado y detalle | `7094d47ea969409893cf212dcb8073de` | `/orders` |
| 03 · Órdenes — Solicitar cancelación | `d151fc777a064e5d8c1e472aceac73e2` | `/orders/:id/cancel` |
| 04 · Solicitudes — Bandeja y resolución | `80a0a378bec74e55ac6168cbd3fed8db` | `/cancellations` |
| 05 · Solicitudes — Confirmar cancelación | `7bf1feff5eae40bf81007b74ea072dc4` | Confirmación de resolución |
| 06 · Cancelaciones — Historial | `c71ebdeb729748cb816d0248c579af12` | `/cancellations/history` |
| 07 · Operadores — Equipo | `c383568e0b204ffabbbe27baf969aba0` | `/operators` |
| 08 · Estado — Cargando | `34be48690d1f4f6eb9f93b804455dcfa` | Estado transversal |
| 09 · Estado — Sin resultados | `07de760d2350430da39bd2ebe4245078` | Estado transversal |
| 10 · Estado — Error de carga | `b34c34ce595545a3905201bdb55343cb` | Estado transversal |
| 11 · Estado — Sin conexión | `bd010dc83977470e81722c2e8638bf55` | Estado transversal |
| 12 · Estado — Resultado incierto | `0604bdc7c3834008a90b3e82f5123530` | Estado de comando |
| 13 · Estado — Orden no encontrada | `3f9c8722eb314c5bb88f18653b7b3834` | `/404` y entidad ausente |
| C1 · Cliente — Marketplace | `c6108bd79dde49d0aa3112ef7ee0046c` | `/shop` |
| C2 · Cliente — Producto | `5e12aea177e84ec29c42ab1cd7e892de` | `/shop/products/:id` |
| C3 · Cliente — Carrito | `05569bf7000d4ff98921af735dee87c6` | `/cart` |
| C4 · Cliente — Mis pedidos | `3d17e55bfde3466381c621d3330c8aac` | `/my/orders` |
| C5 · Cliente — Detalle del pedido | `3ea6750088b9447893f1f84e9945fbe8` | `/my/orders/:id` |
| C6 · Cliente — Solicitar cancelación | `4570f5ff494445b491c91e5cf4eb0f4d` | `/my/orders/:id/cancel` |
| C7 · Cliente — Pedido con cancelación | `f491b95d0ed642d7b3539ac2302e6881` | Estado del detalle cliente |
| Tizo Logo mark | `89d64c259363417a8ea4b904bd300b1a` | Marca |
