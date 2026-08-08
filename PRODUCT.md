# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Angular 16 standalone con TypeScript estricto, pnpm y una API REST simulada. El frontend debe poder
conectarse después a una API real sin cambiar sus páginas ni reglas de presentación.

## Users

- El cliente explora productos, prepara un carrito, crea un pedido, consulta su progreso y solicita
  la cancelación de líneas completas.
- El operador de ecommerce consulta el estado interno de los pedidos, crea y resuelve solicitudes
  de cancelación y entiende el efecto operacional antes de confirmar.
- El responsable operativo consulta el equipo y el historial para reconstruir quién tomó una
  decisión y qué cambió.

## Product Purpose

Tizo conecta la experiencia de compra con una operación de cancelaciones trazable. El cliente ve
una proyección comprensible de su pedido; Operaciones conserva el detalle necesario para decidir
sin exponer estados internos fuera del backoffice.

El producto tiene éxito cuando una compra simulada puede convertirse en un pedido, una línea puede
solicitarse y resolverse, y ambas superficies reflejan el mismo resultado sin duplicados ni estados
intermedios contradictorios.

## Positioning

La cancelación es una decisión de dominio separada de sus efectos externos. La solicitud, la
resolución, la notificación y el reembolso conservan estados independientes para que un fallo fuera
del dominio no reabra una cancelación ya efectiva.

## Operating Context

- El cliente usa una tienda web en español y una identidad demo fija.
- Operaciones trabaja en un backoffice de escritorio con información densa, filtros compartibles
  por URL y un operador activo seleccionado localmente.
- El sistema simula catálogo, carrito, pedidos, inventario, auditoría y reembolso en el navegador.
- La cancelación puede quedar con resultado incierto cuando la respuesta se pierde después de que
  el servidor ya aplicó el comando; el usuario debe verificar antes de reintentar.

## Capabilities and Constraints

- Marketplace, producto, carrito y checkout simulado funcionales.
- Pedidos cliente y pedidos internos con proyecciones diferentes.
- Solicitudes de cancelación creadas por cliente u operador y resueltas por Operaciones.
- Cancelación por línea completa; no se cancela una parte de la cantidad.
- Una sola cancelación efectiva por pedido.
- Mutaciones idempotentes y sin reintento automático.
- Sin autenticación, pagos, inventario, notificaciones ni reembolsos reales en esta entrega.
- Sin PWA ni cola de escrituras offline.
- Angular 16 y Node 18 son restricciones legadas explícitas.

## Brand Commitments

- Nombre: Tizo.
- Voz: español profesional, directa, clara y con voseo cuando corresponda.
- Referencia visual vinculante: proyecto Stitch `TizoFlujo` y su design system
  `Backoffice Ecommerce Tizo`.
- La interfaz usa luz, neutros cálidos, Manrope y acciones primarias casi negras. El violeta es un
  acento de foco/selección, no el color de los botones principales.

## Evidence on Hand

- `docs/01-operacion-y-dominio.md` a `docs/08-arquitectura-frontend-angular.md` describen dominio,
  estados, datos, reglas, flujos, pantallas y arquitectura.
- `docs/flujo-pantallas.html` contiene una representación navegable previa de los flujos.
- Stitch `projects/4501939678561782320` contiene 21 referencias canónicas de escritorio.
- No existen testimonios, métricas reales de producción ni integraciones externas; no deben
  fabricarse.

## Product Principles

1. El cliente entiende el resultado sin aprender la operación interna.
2. El operador ve la regla, el efecto y la recuperación antes de ejecutar una acción irreversible.
3. Un comando incierto se reconcilia; no se repite a ciegas.
4. La misma regla de cancelación sirve a cliente y Operaciones mediante contratos separados.
5. El mock reproduce el contrato futuro y no se filtra a los componentes.

## Accessibility & Inclusion

La aplicación debe cumplir WCAG 2.2 AA, ser operable por teclado, conservar foco visible, comunicar
estados con texto además de color y funcionar desde 360 px de ancho.
